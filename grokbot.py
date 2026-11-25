"""Read-only, metadata-only view of the local Grok Bot persistence store."""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import math
import os
import re
import stat
import statistics
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote_to_bytes

_CACHE_LOCK = threading.Lock()
_MEM = {}
_MAX_SHARD = 64 * 1024 * 1024
_MAX_QUOTA = 256 * 1024
_MAX_VALUE = 512
_MAX_EVENTS = 100_000
_MAX_FILES = 4096
_NAME = re.compile(
    r"sand\.client\.slice\.account\.([A-Za-z0-9_:@+%\-]{1,160})\."
    r"(weekly-usage\.cache|transcript\.replicas\.([A-Za-z0-9_:.@+%\-]{0,320}))\Z"
)
_ACCOUNT_ID = re.compile(rb"[A-Za-z0-9_:@+|\-]+")
_REPLICA_ID = re.compile(rb"[A-Za-z0-9_:.@+|\-]*")
_ESC = re.compile(rb'["\\\\\x00-\x1f]')
_META = {b'"kind"': "kind", b'"role"': "role", b'"timestampMs"': "timestampMs", b'"requestId"': "requestId"}
# Content-like keys are never descended into, even if nested JSON contains
# objects that look exactly like message metadata.
_DROP = {b'"content"', b'"text"', b'"prompt"', b'"body"', b'"attachments"',
         b'"secret"', b'"secrets"', b'"cookie"', b'"cookies"', b'"credentials"', b'"token"'}


def _key(name):
    stem = name.removesuffix(".blob")
    if stem == name or not 1 <= len(stem) <= 800 or not re.fullmatch(r"[A-Za-z2-7]+", stem):
        return None
    try:
        decoded = base64.b32decode(stem.upper() + "=" * (-len(stem) % 8)).decode("ascii")
    except (ValueError, UnicodeError, binascii.Error):
        return None
    m = _NAME.fullmatch(decoded)
    if not m:
        return None
    encoded, suffix, replica = m.groups()
    # Decode one layer only for validation and the in-memory account join.
    # Files are still opened by their original, base32-only directory entry.
    # The post-decode allowlists reject malformed escapes, nested escapes,
    # encoded separators, controls, and traversal.
    account = unquote_to_bytes(encoded)
    if not _ACCOUNT_ID.fullmatch(account):
        return None
    if replica is not None:
        replica_id = unquote_to_bytes(replica)
        if not _REPLICA_ID.fullmatch(replica_id) or b".." in replica_id:
            return None
    return account.decode("ascii"), "quota" if suffix == "weekly-usage.cache" else "transcript"


def _dir():
    override = os.getenv("TOOTOO_GROKBOT_DIR")
    if override:
        return Path(override).expanduser()
    if sys.platform == "darwin":
        return Path.home() / "Library/Application Support/Grok Bot/sand-client-persistence"
    return None


def _open_dir(path):
    # Walk each component with no symlink traversal, including ancestor links.
    parts = Path(os.path.abspath(path)).parts
    fd = os.open(parts[0], os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for part in parts[1:]:
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = child
        if os.fstat(fd).st_uid != os.getuid():
            raise OSError("Grok Bot store belongs to a different user")
    except BaseException:
        os.close(fd)
        raise
    return fd


class _MetadataJSON:
    """Scan JSON structure in chunks, capture only allowlisted scalar values."""
    def __init__(self, file):
        self.file = file
        self.buf = b""
        self.at = 0
        self.events = []
        self.read = 0

    def _fill(self):
        if self.at == len(self.buf):
            self.buf = self.file.read(65536)
            self.at = 0
            self.read += len(self.buf)
            if self.read > _MAX_SHARD:
                raise ValueError("size")
        return self.at < len(self.buf)

    def peek(self):
        return self.buf[self.at] if self._fill() else -1

    def take(self):
        n = self.peek()
        if n < 0:
            raise ValueError("unexpected EOF")
        self.at += 1
        return n

    def ws(self):
        while self.peek() in (32, 9, 10, 13):
            self.at += 1

    def string(self, capture):
        # For ignored values, never copy the bytes of the string. Escapes
        # are walked to find its end, not decoded into transcript text.
        if self.take() != 34:
            raise ValueError("string")
        out = bytearray(b'"') if capture else None
        while self._fill():
            hit = _ESC.search(self.buf, self.at)
            end = hit.start() if hit else len(self.buf)
            if out is not None:
                if len(out) + end - self.at + 2 > _MAX_VALUE:
                    out = None
                else:
                    out.extend(self.buf[self.at:end])
            self.at = end
            if not hit:
                continue
            ch = self.take()
            if ch == 34:
                return bytes(out) + b'"' if out is not None else None
            if ch != 92:
                raise ValueError("JSON control")
            escaped = self.take()
            if out is not None:
                if len(out) + 4 > _MAX_VALUE:
                    out = None
                else:
                    out.extend((92, escaped))
        raise ValueError("unterminated string")

    def value(self, visit=True, capture=False, depth=0):
        if depth > 80:
            raise ValueError("depth")
        self.ws()
        ch = self.peek()
        if ch == 123:
            self.take()
            attrs = {}
            self.ws()
            if self.peek() != 125:
                while True:
                    self.ws()
                    key = self.string(visit)
                    # Decode only escaped key names, never any skipped values,
                    # so \u0063ontent cannot bypass the content stop-list.
                    if key is not None and b"\\" in key:
                        key = json.dumps(json.loads(key), ensure_ascii=True).encode()
                    self.ws()
                    if self.take() != 58:
                        raise ValueError("colon")
                    field = _META.get(key)
                    val = self.value(visit and key not in _DROP, visit and field is not None, depth + 1)
                    if visit and field is not None:
                        if field in attrs:
                            raise ValueError("duplicate metadata")
                        attrs[field] = val
                    self.ws()
                    sep = self.take()
                    if sep == 125:
                        break
                    if sep != 44:
                        raise ValueError("object delimiter")
            else:
                self.take()
            if visit:
                self.event(attrs)
            return None
        if ch == 91:
            self.take()
            self.ws()
            if self.peek() != 93:
                while True:
                    self.value(visit, False, depth + 1)
                    self.ws()
                    sep = self.take()
                    if sep == 93:
                        break
                    if sep != 44:
                        raise ValueError("array delimiter")
            else:
                self.take()
            return None
        if ch == 34:
            raw = self.string(capture)
        else:
            if ch < 0 or ch not in b"-0123456789tfn":
                raise ValueError("invalid scalar")
            raw = bytearray() if capture else None
            count = 0
            while self.peek() not in (-1, 32, 13, 10, 9, 44, 125, 93):
                val = self.take()
                count += 1
                if raw is not None and count <= _MAX_VALUE:
                    raw.append(val)
            if capture and count > _MAX_VALUE:
                raise ValueError("invalid scalar")
        return json.loads(raw) if capture and raw is not None else None

    def event(self, attrs):
        kind, role = attrs.get("kind"), attrs.get("role")
        if kind not in ("message", "send-message"):
            return
        ts = _ms(attrs.get("timestampMs"))
        if ts is None:
            return
        rid = attrs.get("requestId")
        rid = hashlib.sha256(rid.encode()).digest() if isinstance(rid, str) and rid else None
        if len(self.events) >= _MAX_EVENTS:
            raise ValueError("events")
        self.events.append((ts, kind, role == "user", rid))

    def collect(self):
        self.value()
        self.ws()
        if self.peek() != -1:
            raise ValueError("trailing data")
        return tuple(self.events)


def _ms(v):
    if type(v) in (int, float) and 0 < v < 253402300799000:
        return v / 1000
    return None


def _quota(file):
    data = json.load(file)
    value = data.get("value") if isinstance(data, dict) else None
    reading = value.get("reading") if isinstance(value, dict) and value.get("kind") == "present" else None
    usage = reading.get("usage") if isinstance(reading, dict) else None
    if not isinstance(usage, dict):
        return None
    percent = usage.get("percentUsed")
    if isinstance(percent, bool) or not isinstance(percent, (str, int, float)):
        return None
    percent = float(percent)
    ts, expires, reset = _ms(reading.get("readAtMs")), _ms(value.get("expiresAtMs")), _ms(usage.get("nextResetMs"))
    if not math.isfinite(percent) or ts is None or expires is None or reset is None or expires < ts:
        return None
    plan, tier = usage.get("grokPlanLabel"), usage.get("unifiedPlanName")
    return ts, {"source": "local_cache", "cached": True, "read_at": int(ts), "expires_at": int(expires),
            "plan": plan.strip()[:80] if isinstance(plan, str) and plan.strip() else "Grok Bot",
            "plan_tier": tier.strip()[:80] if isinstance(tier, str) and tier.strip() else None,
            "would_refuse_send": bool(usage.get("wouldRefuseSend")),
            "buckets": [{"key": "grokbot:weekly", "id": "weekly", "label": "Grok Bot 周",
                         "used_percent": min(100.0, max(0.0, percent)),
                         "window_minutes": 10080, "resets_at": int(reset)}]}


def _local_day(ts):
    return datetime.fromtimestamp(ts).date().isoformat()


def grokbot_activity(start_day, end_day, *, now=None):
    """Return only local activity/quota metadata; never token events."""
    path = _dir()
    if path is None:
        return None
    now = time.time() if now is None else now
    try:
        fd = _open_dir(path)
    except (OSError, ValueError):
        return None
    latest, shards, seen = None, [], set()
    try:
        root = os.fstat(fd)
        identity = (root.st_dev, root.st_ino)
        with _CACHE_LOCK:
            if len(_MEM) > _MAX_FILES and _MEM:
                _MEM.clear()
            matched = []
            with os.scandir(fd) as listing:
                for idx, entry in enumerate(listing):
                    if idx >= _MAX_FILES:
                        break
                    if match := _key(entry.name):
                        matched.append((entry, *match))
            # Read quota blobs first so another account's transcripts need not
            # even be opened when we know which account's snapshot wins.
            matched.sort(key=lambda row: row[2] != "quota")
            for entry, account, kind in matched:
                if kind == "transcript" and latest is not None and account != latest[2]:
                    continue
                limit = _MAX_QUOTA if kind == "quota" else _MAX_SHARD
                try:
                    info = entry.stat(follow_symlinks=False)
                    if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_nlink != 1 or info.st_size > limit:
                        continue
                    k = (*identity, entry.name)
                    seen.add(k)
                    sig = (info.st_ino, info.st_mtime_ns, info.st_size)
                    memo = _MEM.get(k)
                    if memo is None or memo[0] != sig:
                        raw = os.open(entry.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
                        with os.fdopen(raw, "rb") as file:
                            opened = os.fstat(file.fileno())
                            if (not stat.S_ISREG(opened.st_mode) or opened.st_uid != os.getuid() or opened.st_nlink != 1 or
                                    (opened.st_ino, opened.st_mtime_ns, opened.st_size) != sig):
                                continue
                            try:
                                value = _quota(file) if kind == "quota" else _MetadataJSON(file).collect()
                            except (ValueError, TypeError, OverflowError, RecursionError):
                                value = None
                        _MEM[k] = sig, value
                    else:
                        value = memo[1]
                    if kind == "quota" and value and value[0] <= now and (
                            latest is None or (value[0], account) > (latest[0], latest[2])):
                        latest = value[0], value[1], account
                    elif kind == "transcript" and value:
                        shards.append((account, value))
                except OSError:
                    continue
            for k in list(_MEM):
                if k[:2] == identity and k not in seen:
                    _MEM.pop(k)
    except OSError:
        return None
    finally:
        os.close(fd)

    if latest:
        _, quota, account = latest
        reset = quota["buckets"][0]["resets_at"]
        if now >= min(quota["expires_at"], reset):
            quota = {**quota, "buckets": [], "state": "expired", "resets_at": reset,
                     "reason": "window_reset" if now >= reset else "cache_expired"}
    else:
        quota = None
        # Without quota, use the account containing the latest real activity.
        # Never mix multiple local account histories.
        account = max(shards, key=lambda item: max(row[0] for row in item[1]))[0] if shards else None

    sessions = total = users = replies = 0
    last = None
    latencies = []
    for shard_account, rows in shards:
        if shard_account != account:
            continue
        total += 1
        active = False
        first_message, first_reply = {}, {}
        for ts, kind, user, rid in rows:
            in_range = start_day <= _local_day(ts) <= end_day
            if in_range:
                active = True
                last = ts if last is None else max(last, ts)
                users += kind == "message" and user
                replies += kind == "send-message"
            if rid is not None:
                first = first_message if kind == "message" else first_reply
                first[rid] = min(first.get(rid, ts), ts)
        sessions += active
        for rid, asked in first_message.items():
            reply = first_reply.get(rid)
            if reply is not None and 0 <= reply - asked <= 300 and start_day <= _local_day(asked) <= end_day:
                latencies.append(reply - asked)
    if not total and quota is None:
        return None
    return {"sessions": sessions, "total_sessions": total, "user_messages": users, "bot_replies": replies,
            "reply_latency_p50": round(statistics.median(latencies), 2) if latencies else None,
            "latency_samples": len(latencies), "last_active_ts": last, "quota": quota}
