#!/usr/bin/env python3
"""
tootoo Scanner — Zero-dependency local telemetry scanner for AI coding agents.
Reads local session logs & SQLite stores directly (no hooks, no proxy required):
  - Antigravity (agy / IDE / CLI / T3 ACP): SQLite + Protobuf (exact TTFT & stream duration)
  - Codex CLI: JSONL session rollouts (task_started, item_completed, token_count, rate_limits)
  - OpenCode: SQLite (session, message, part timing & tokens)
  - Claude Code: JSONL project logs (usage, parentUuid chain, thinkingDurationMs)
  - Gemini CLI: JSON / JSONL chat logs
"""

from __future__ import annotations

import atexit
import fcntl
import filecmp
import glob
import hashlib
import heapq
import http.client
import io
import json
import math
import os
import re
import shutil
import sqlite3
import sys
import ssl
import stat
import subprocess
import tempfile
import threading
import time
import zlib
from bisect import bisect_left, bisect_right
from collections import defaultdict
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from agy_cli_quota import fetch_agy_cli_quota
from codex_app_quota import codex_cli_home, fetch_codex_cli_quota, peek_codex_app_quota
from grokbot import grokbot_activity
from pricing import PricingEngine, calibrate_observed_rates, trigger_background_sync_if_stale
from quota_runtime import data_root, publish as publish_telemetry

HOME = os.path.expanduser("~")
CACHE_DIR = data_root()
CACHE_FILE = os.path.join(CACHE_DIR, "scan_cache_v6.json")
CONFIG_FILE = os.path.join(CACHE_DIR, "config.json")
EVO_STATE_FILE = os.path.join(CACHE_DIR, "evo_state.json")
# Separate from the scanner lock. Never hold this while scanning logs or
# consulting a remote source. flock also serializes CLI/native instances
# intentionally sharing the same TOOTOO_HOME.
_EVO_LOCK = threading.Lock()
_MEM_EVO_STATE: dict[str, Any] | None = None
_REAL_DAY_TOTAL: tuple[str, int, float] | None = None
_REAL_DAY_TTL = 15.0
_XP_BOOST_MAX = 2_000_000_000


def _local_day():
    return datetime.now().astimezone().date().isoformat()


@contextmanager
def _game_state_lock():
    with _EVO_LOCK:
        os.makedirs(CACHE_DIR, exist_ok=True)
        lock = os.open(os.path.join(CACHE_DIR, ".game-state.lock"),
                       os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
        try:
            fcntl.flock(lock, fcntl.LOCK_EX)
            yield
        finally:
            os.close(lock)


def _atomic_game_json(path: str, data: dict[str, Any]) -> None:
    # Unique temporary files avoid colliding with another app instance or a
    # leftover temporary file from a previous interrupted write.
    fd, tmp = tempfile.mkstemp(prefix=f".{Path(path).name}.", dir=Path(path).parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
            file.flush()
            os.fsync(file.fileno())
        os.replace(tmp, path)
        # Replacement is the commit point. A directory-sync error must
        # not turn an already-visible state change into an HTTP rejection.
        try:
            parent_fd = os.open(Path(path).parent, os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(parent_fd)
            finally:
                os.close(parent_fd)
        except OSError:
            pass
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def _validated_xp_boost(value, today_iso: str) -> int:
    if not isinstance(value, dict) or value.get("day") != today_iso:
        return 0
    amount = value.get("tokens")
    return min(_XP_BOOST_MAX, amount) if type(amount) is int and amount > 0 else 0


def _update_evo_peak_locked(today_iso: str, effective_today: int) -> int:
    """Observe today's XP only; historical logs cannot unlock earlier days."""
    global _MEM_EVO_STATE
    try:
        with open(EVO_STATE_FILE, "r", encoding="utf-8") as file:
            raw = json.load(file)
        if not isinstance(raw, dict) or type(raw.get("peak_daily_tokens")) not in (int, float):
            raise ValueError("invalid state")
        prior = max(0, int(raw["peak_daily_tokens"]))
        state = {"since": str(raw.get("since") or today_iso), "peak_daily_tokens": prior,
                 "peak_day": str(raw.get("peak_day") or today_iso)}
        store = False
    except (FileNotFoundError, ValueError, TypeError, OverflowError):
        prior = 0
        state = {"since": today_iso, "peak_daily_tokens": prior, "peak_day": today_iso}
        store = True
    if effective_today > prior:
        state.update(peak_daily_tokens=effective_today, peak_day=today_iso)
        store = True
    if store:
        _atomic_game_json(EVO_STATE_FILE, state)
    _MEM_EVO_STATE = state
    return state["peak_daily_tokens"]


def _record_evo_telemetry(today_iso: str, today_tokens: int, observed: float) -> int:
    return _observe_evo_telemetry(today_iso, today_tokens, observed)[0]


def _observe_evo_telemetry(today_iso: str, today_tokens: int, observed: float) -> tuple[int, int]:
    global _REAL_DAY_TOTAL
    effective = today_tokens
    try:
        with _game_state_lock():
            local_day = _local_day()
            if local_day != today_iso:
                return _update_evo_peak_locked(local_day, 0), effective
            if _REAL_DAY_TOTAL is None or observed >= _REAL_DAY_TOTAL[2]:
                _REAL_DAY_TOTAL = (today_iso, today_tokens, observed)
            effective += _validated_xp_boost(load_carrot_state()["home"].get("xp_boost"), today_iso)
            return _update_evo_peak_locked(today_iso, effective), effective
    except OSError:
        # A read-only/missing data directory should not break raw telemetry.
        return max(today_tokens, int((_MEM_EVO_STATE or {}).get("peak_daily_tokens", 0))), effective


def _real_tokens_for_xp_post(today_iso: str) -> int:
    global _REAL_DAY_TOTAL
    with _EVO_LOCK:
        cached = _REAL_DAY_TOTAL
        if cached and cached[0] == today_iso and 0 <= time.monotonic() - cached[2] <= _REAL_DAY_TTL:
            return cached[1]
    # Local event scan only: don't run build_telemetry or trigger downloads.
    events, _, _ = scan_all_events()
    observed = time.monotonic()
    real = sum(ev["in"] + ev["out"] + ev["cr"] + ev["cw"] + ev.get("reason", 0)
               for ev in _iter_window(events, today_iso, today_iso)
               if not (isinstance(events, _RangedEvents) and events.history_pending
                       and ev.get("codex_compaction_id") is not None))
    with _EVO_LOCK:
        if _local_day() != today_iso:
            return 0
        if _REAL_DAY_TOTAL is None or observed >= _REAL_DAY_TOTAL[2]:
            _REAL_DAY_TOTAL = (today_iso, real, observed)
            return real
        return _REAL_DAY_TOTAL[1] if _REAL_DAY_TOTAL[0] == today_iso else real


CARROT_STATE_FILE = os.path.join(CACHE_DIR, "carrot_state.json")


DEFAULT_HOME_STATE: dict[str, Any] = {
    "house": "street",
    "owned_houses": ["street"],
    "decor": {"bed": None, "light": None, "floor": None, "garden": None, "pool": None},
    "owned_decor": [],
    "wear": {"hat": None, "outfit": None, "acc": None},
    "owned_wear": [],
    "hidden_tier_acc": [],
    "show_on_avatar": True,
    "coupons": [],
    "friday_claim_week": "",
    "claimed_house_gifts": [],
}


def _sanitize_home_state(raw: Any) -> dict[str, Any]:
    h = dict(DEFAULT_HOME_STATE)
    h["decor"] = dict(DEFAULT_HOME_STATE["decor"])
    h["wear"] = dict(DEFAULT_HOME_STATE["wear"])
    h["owned_houses"] = list(DEFAULT_HOME_STATE["owned_houses"])
    h["owned_decor"] = []
    h["owned_wear"] = []
    h["hidden_tier_acc"] = []
    h["leases"] = {}
    h["rent_equity"] = {}
    h["coupons"] = []
    h["friday_claim_week"] = ""
    h["claimed_house_gifts"] = []
    h["weather_cards"] = {"h2": 0, "d1": 0}
    h["weather_override"] = None
    h["xp_boost"] = {"day": "", "tokens": 0}
    h["arcade_items"] = {
        "ammo_box": 0,
        "rain_magnet": 0,
        "slow_mo": 0,
        "energy_shield": 0,
        "overclock_core": 0,
        "orbital_nuke": 0,
        "homing_drones": 0,
        "laser_beam": 0,
        "time_freeze": 0,
    }
    h["owned_backdrops"] = ["paper"]
    h["active_backdrop"] = "paper"
    h["adventure_reward_day"] = ""
    h["adventure_coins_day"] = ""
    h["adventure_coins_earned"] = 0
    if not isinstance(raw, dict):
        return h
    if isinstance(raw.get("house"), str) and raw["house"].strip():
        h["house"] = raw["house"].strip()
    if isinstance(raw.get("owned_houses"), list):
        oh = [str(x).strip() for x in raw["owned_houses"] if isinstance(x, str) and x.strip()]
        if "street" not in oh:
            oh.insert(0, "street")
        h["owned_houses"] = list(dict.fromkeys(oh))
    if isinstance(raw.get("leases"), dict):
        leases: dict[str, int] = {}
        for k, v in raw["leases"].items():
            if isinstance(k, str) and k.strip() and isinstance(v, (int, float)) and v > 0:
                leases[k.strip()] = int(v)
        h["leases"] = leases
    if isinstance(raw.get("rent_equity"), dict):
        eq: dict[str, int] = {}
        for k, v in raw["rent_equity"].items():
            if isinstance(k, str) and k.strip() and isinstance(v, (int, float)) and v > 0:
                eq[k.strip()] = int(v)
        h["rent_equity"] = eq
    if h["house"] not in h["owned_houses"] and h["house"] not in h["leases"]:
        h["owned_houses"].append(h["house"])
    if isinstance(raw.get("decor"), dict):
        for slot in ("bed", "light", "floor", "garden", "pool"):
            v = raw["decor"].get(slot)
            h["decor"][slot] = str(v).strip() if isinstance(v, str) and v.strip() else None
    if isinstance(raw.get("owned_decor"), list):
        h["owned_decor"] = list(dict.fromkeys(str(x).strip() for x in raw["owned_decor"] if isinstance(x, str) and x.strip()))
    if isinstance(raw.get("wear"), dict):
        for slot in ("hat", "outfit", "acc"):
            v = raw["wear"].get(slot)
            h["wear"][slot] = str(v).strip() if isinstance(v, str) and v.strip() else None
    if isinstance(raw.get("owned_wear"), list):
        h["owned_wear"] = list(dict.fromkeys(str(x).strip() for x in raw["owned_wear"] if isinstance(x, str) and x.strip()))
    if isinstance(raw.get("hidden_tier_acc"), list):
        h["hidden_tier_acc"] = sorted({int(x) for x in raw["hidden_tier_acc"] if isinstance(x, (int, float)) and 4 <= int(x) <= 10})
    if isinstance(raw.get("show_on_avatar"), bool):
        h["show_on_avatar"] = raw["show_on_avatar"]
    if isinstance(raw.get("coupons"), list):
        clean_coupons: list[dict[str, Any]] = []
        seen_cids: set[str] = set()
        for c in raw["coupons"][:20]:
            if not isinstance(c, dict):
                continue
            cid = str(c.get("id") or "").strip()
            disc = c.get("discount")
            exp = c.get("expires_at")
            if not cid or cid in seen_cids or not isinstance(disc, (int, float)) or not (0.1 <= float(disc) < 1.0):
                continue
            if not isinstance(exp, (int, float)) or exp <= 0:
                continue
            seen_cids.add(cid)
            ckind = "wear" if str(c.get("kind") or "") == "wear" else "rent"
            clean_coupons.append({
                "id": cid,
                "kind": ckind,
                "discount": round(float(disc), 2),
                "label": str(c.get("label") or f"{int(round(float(disc) * 10))}折{'饰品' if ckind == 'wear' else '租房'}券")[:32],
                "rarity": "epic" if str(c.get("rarity") or "") == "epic" else "normal",
                "expires_at": int(exp),
                "source": str(c.get("source") or "friday")[:24],
            })
        h["coupons"] = clean_coupons
    if isinstance(raw.get("friday_claim_week"), str):
        h["friday_claim_week"] = raw["friday_claim_week"].strip()[:16]
    if isinstance(raw.get("claimed_house_gifts"), list):
        h["claimed_house_gifts"] = list(dict.fromkeys(str(x).strip() for x in raw["claimed_house_gifts"] if isinstance(x, str) and x.strip()))
    if isinstance(raw.get("weather_cards"), dict):
        wc = raw["weather_cards"]
        for k in ("h2", "d1"):
            v = wc.get(k)
            if isinstance(v, (int, float)) and v >= 0:
                h["weather_cards"][k] = min(999, int(v))
    if isinstance(raw.get("weather_override"), dict):
        wo = raw["weather_override"]
        wkind = str(wo.get("kind") or "").strip()
        wexp = wo.get("expires_at")
        if wkind in ("sunny", "cloudy", "overcast", "windy", "rain", "snow") and isinstance(wexp, (int, float)) and wexp > 0:
            h["weather_override"] = {"kind": wkind, "expires_at": int(wexp)}
    today = _local_day()
    boost = _validated_xp_boost(raw.get("xp_boost"), today)
    if boost:
        h["xp_boost"] = {"day": today, "tokens": boost}
    if isinstance(raw.get("arcade_items"), dict):
        ai = raw["arcade_items"]
        for k in (
            "ammo_box", "rain_magnet", "slow_mo", "energy_shield",
            "overclock_core", "orbital_nuke", "homing_drones", "laser_beam", "time_freeze",
        ):
            v = ai.get(k)
            if isinstance(v, (int, float)) and v >= 0:
                h["arcade_items"][k] = min(999, int(v))
    valid_bgs = (
        "paper", "cyber_neon", "starry_nebula", "sakura_zen", "matrix_core", "golden_citadel",
        "moon_tide_observatory", "aurora_crown", "dragon_ink_seal", "prism_clockwork", "lantern_skyline",
    )
    if isinstance(raw.get("owned_backdrops"), list):
        ob = [str(x).strip() for x in raw["owned_backdrops"] if isinstance(x, str) and x.strip() in valid_bgs]
        if "paper" not in ob:
            ob.insert(0, "paper")
        h["owned_backdrops"] = list(dict.fromkeys(ob))
    if isinstance(raw.get("active_backdrop"), str) and raw["active_backdrop"].strip() in h["owned_backdrops"]:
        h["active_backdrop"] = raw["active_backdrop"].strip()
    if isinstance(raw.get("adventure_reward_day"), str):
        h["adventure_reward_day"] = raw["adventure_reward_day"].strip()[:10]
    if isinstance(raw.get("adventure_coins_day"), str):
        h["adventure_coins_day"] = raw["adventure_coins_day"].strip()[:10]
    if isinstance(raw.get("adventure_coins_earned"), (int, float)) and raw["adventure_coins_earned"] >= 0:
        h["adventure_coins_earned"] = min(20, int(raw["adventure_coins_earned"]))
    return h


_ADVENTURE_TICKET_PRICE = 5
_ADVENTURE_TICKET_DAILY_FREE = 3
_ADVENTURE_TICKET_BUY_LIMIT = 5
_ADVENTURE_TICKET_TTL_DAYS = 7
_ADVENTURE_TICKET_TTL = _ADVENTURE_TICKET_TTL_DAYS * 24 * 60 * 60
_ADVENTURE_OPERATION_ID = re.compile(r"[A-Za-z0-9_-]{16,64}")


def _empty_adventure_ticket_state() -> dict[str, Any]:
    return {"expiries": [], "free_day": "", "buy_day": "", "bought": 0,
            "paid": False, "operations": {}}


def _sanitize_adventure_ticket_state(raw) -> dict[str, Any]:
    out = _empty_adventure_ticket_state()
    if not isinstance(raw, dict):
        return out
    for key in ("free_day", "buy_day"):
        value = raw.get(key)
        if isinstance(value, str):
            try:
                if date.fromisoformat(value).isoformat() == value:
                    out[key] = value
            except ValueError:
                pass
    expiries = raw.get("expiries")
    if isinstance(expiries, list):
        out["expiries"] = sorted(n for n in expiries if type(n) is int and n > 0)
    if type(raw.get("bought")) is int:
        out["bought"] = min(_ADVENTURE_TICKET_BUY_LIMIT, max(0, raw["bought"]))
    out["paid"] = raw.get("paid") is True
    operations = raw.get("operations")
    if isinstance(operations, dict):
        for op_id, op in operations.items():
            if (isinstance(op_id, str) and _ADVENTURE_OPERATION_ID.fullmatch(op_id)
                    and isinstance(op, dict) and op.get("action") in ("buy", "blaster", "rain")
                    and type(op.get("at")) is int and op["at"] > 0):
                out["operations"][op_id] = {"action": op["action"], "at": op["at"]}
    return out


def load_carrot_state(*, include_private: bool = False, strict: bool = False) -> dict[str, Any]:
    default: dict[str, Any] = {
        "balance": None,
        "starter_day": "",
        "checkin_day": "",
        "checkin_streak": 0,
        "secret_skin": "prism",
        "days": {},
        "collection": [],
        "home": _sanitize_home_state(None),
    }
    if include_private:
        default["adventure_tickets"] = _empty_adventure_ticket_state()
    try:
        with open(CARROT_STATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError("invalid carrot state")
        days = data.get("days") if isinstance(data.get("days"), dict) else {}
        coll = data.get("collection") if isinstance(data.get("collection"), list) else []
        clean_coll = sorted({int(x) for x in coll if isinstance(x, (int, float))})
        bal = data.get("balance")
        clean_bal = max(0, int(bal)) if isinstance(bal, (int, float)) else None
        try:
            checkin_streak = max(0, int(data.get("checkin_streak") or 0))
        except (TypeError, ValueError):
            checkin_streak = 0
        skin = str(data.get("secret_skin") or "prism")
        if skin not in ("prism", "void", "cyber"):
            skin = "prism"
        clean = {
            "balance": clean_bal,
            "starter_day": str(data.get("starter_day") or ""),
            "checkin_day": str(data.get("checkin_day") or ""),
            "checkin_streak": checkin_streak,
            "secret_skin": skin,
            "days": days,
            "collection": clean_coll,
            "home": _sanitize_home_state(data.get("home")),
        }
        if include_private:
            clean["adventure_tickets"] = _sanitize_adventure_ticket_state(data.get("adventure_tickets"))
        return clean
    except FileNotFoundError:
        pass
    except Exception:
        if strict:
            raise
    return default


def save_carrot_state(patch: dict[str, Any]) -> dict[str, Any]:
    today = _local_day()
    home = patch.get("home")
    valid_xp = _validated_xp_boost(home.get("xp_boost"), today) if isinstance(home, dict) else 0
    real = _real_tokens_for_xp_post(today) if valid_xp else 0
    with _game_state_lock():
        return _save_carrot_state_locked(patch, today, real)


def _save_carrot_state_locked(patch: dict[str, Any], request_day: str, real: int) -> dict[str, Any]:
    cur = load_carrot_state(include_private=True, strict=True)
    # Rollback must include the server-owned ticket ledger.
    previous = load_carrot_state(include_private=True, strict=True) if isinstance(patch.get("home"), dict) else None
    today = _local_day()
    existing_xp = _validated_xp_boost(cur["home"].get("xp_boost"), today)
    accepted_xp = 0
    if type(patch.get("balance_delta")) is int:
        cur["balance"] = max(0, (cur["balance"] or 0) + patch["balance_delta"])
    elif patch.get("balance") is not None and not cur["adventure_tickets"]["paid"]:
        # Legacy initialization before any ticket purchase. Afterwards, an
        # absolute balance from an earlier page must not undo a paid debit.
        try:
            cur["balance"] = max(0, int(patch["balance"]))
        except (TypeError, ValueError, OverflowError):
            pass
    if "starter_day" in patch and isinstance(patch["starter_day"], str) and len(patch["starter_day"]) == 10:
        cur["starter_day"] = patch["starter_day"]
    if "checkin_day" in patch and isinstance(patch["checkin_day"], str) and len(patch["checkin_day"]) == 10:
        cur["checkin_day"] = patch["checkin_day"]
    if "checkin_streak" in patch and patch["checkin_streak"] is not None:
        try:
            cur["checkin_streak"] = max(0, int(patch["checkin_streak"]))
        except (TypeError, ValueError):
            pass
    if "secret_skin" in patch and patch["secret_skin"] in ("prism", "void", "cyber"):
        cur["secret_skin"] = patch["secret_skin"]
    if "home" in patch and isinstance(patch["home"], dict):
        cur["home"] = _sanitize_home_state(patch["home"])
        accepted_xp = _validated_xp_boost(cur["home"].get("xp_boost"), today) if request_day == today else 0
        merged_xp = max(existing_xp, accepted_xp)
        cur["home"]["xp_boost"] = {"day": today if merged_xp else "", "tokens": merged_xp}
    day = str(patch.get("day") or "").strip()
    if len(day) == 10 and day[4] == "-" and day[7] == "-":
        d_ent = cur["days"].get(day)
        if not isinstance(d_ent, dict):
            d_ent = {"claimed": 0, "spent": 0, "bonus": 0}
        for fld in ("claimed", "spent", "bonus"):
            if fld in patch and patch[fld] is not None:
                try:
                    d_ent[fld] = max(0, int(patch[fld]))
                except (TypeError, ValueError):
                    pass
        cur["days"][day] = d_ent
        if len(cur["days"]) > 90:
            for old_k in sorted(cur["days"].keys())[:-90]:
                cur["days"].pop(old_k, None)
    if isinstance(patch.get("collection"), list):
        merged = set(cur["collection"])
        for x in patch["collection"]:
            if isinstance(x, (int, float)):
                merged.add(int(x))
        cur["collection"] = sorted(merged)
    _atomic_game_json(CARROT_STATE_FILE, cur)
    if accepted_xp:
        # Do not acknowledge the accepted reward until the peak is durable.
        # Concurrent telemetry may have observed a fresher local total.
        latest = _REAL_DAY_TOTAL
        if latest is not None and latest[0] == today:
            real = latest[1]
        try:
            _update_evo_peak_locked(today, real + merged_xp)
        except OSError:
            # A failed peak write must not leave an unacknowledged boost
            # available for the next telemetry tick to award.
            assert previous is not None
            _atomic_game_json(CARROT_STATE_FILE, previous)
            raise
    return {key: value for key, value in cur.items() if key != "adventure_tickets"}


def _prepare_adventure_tickets(ledger: dict[str, Any], today: str, now: int) -> bool:
    changed = False
    expiries = [n for n in ledger["expiries"] if n > now]
    if expiries != ledger["expiries"]:
        ledger["expiries"] = expiries
        changed = True
    operations = {op_id: op for op_id, op in ledger["operations"].items()
                  if op["at"] > now - _ADVENTURE_TICKET_TTL}
    if operations != ledger["operations"]:
        ledger["operations"] = operations
        changed = True
    if today > ledger["free_day"]:
        ledger["free_day"] = today
        ledger["expiries"].extend([now + _ADVENTURE_TICKET_TTL] * _ADVENTURE_TICKET_DAILY_FREE)
        ledger["expiries"].sort()
        changed = True
    return changed


def _adventure_tickets_bought_today(ledger: dict[str, Any], today: str) -> int:
    if today == ledger["buy_day"]:
        return ledger["bought"]
    # Rolling the clock back cannot reset the cap and create a second buying day.
    return _ADVENTURE_TICKET_BUY_LIMIT if today < ledger["buy_day"] else 0


def _adventure_ticket_snapshot(cur: dict[str, Any], today: str) -> dict[str, Any]:
    ledger = cur["adventure_tickets"]
    expiries = ledger["expiries"]
    bought = _adventure_tickets_bought_today(ledger, today)
    return {"ok": True, "balance": cur["balance"] or 0,
            "tickets": {"available": len(expiries), "expires_next_at": expiries[0] if expiries else None,
                        "bought_today": bought, "buy_remaining": _ADVENTURE_TICKET_BUY_LIMIT - bought,
                        "price": _ADVENTURE_TICKET_PRICE, "daily_free": _ADVENTURE_TICKET_DAILY_FREE,
                        "ttl_days": _ADVENTURE_TICKET_TTL_DAYS}}


def adventure_tickets(action: str | None = None, operation_id: str | None = None,
                      game: str | None = None) -> dict[str, Any]:
    """One locked transaction for daily credit, purchase, or admission."""
    if action is not None and (action not in ("buy", "consume")
                               or not isinstance(operation_id, str)
                               or not _ADVENTURE_OPERATION_ID.fullmatch(operation_id)
                               or (action == "consume" and game not in ("blaster", "rain"))):
        raise ValueError("invalid_request")
    with _game_state_lock():
        today = _local_day()
        now = int(time.time())
        cur = load_carrot_state(include_private=True, strict=True)
        ledger = cur["adventure_tickets"]
        changed = _prepare_adventure_tickets(ledger, today, now)
        error = None
        replayed = False
        if action is not None:
            assert operation_id is not None
            kind = "buy" if action == "buy" else game
            already = ledger["operations"].get(operation_id)
            if already is not None:
                replayed = already["action"] == kind
                if not replayed:
                    error = "operation_conflict"
            elif action == "buy":
                if _adventure_tickets_bought_today(ledger, today) >= _ADVENTURE_TICKET_BUY_LIMIT:
                    error = "daily_limit"
                elif (cur["balance"] or 0) < _ADVENTURE_TICKET_PRICE:
                    error = "insufficient_coins"
                else:
                    cur["balance"] -= _ADVENTURE_TICKET_PRICE
                    ledger["paid"] = True
                    if ledger["buy_day"] != today:
                        ledger["buy_day"], ledger["bought"] = today, 0
                    ledger["bought"] += 1
                    ledger["expiries"].append(now + _ADVENTURE_TICKET_TTL)
                    ledger["expiries"].sort()
            elif not ledger["expiries"]:
                error = "no_tickets"
            else:
                ledger["expiries"].pop(0)
            if error is None and not replayed:
                ledger["operations"][operation_id] = {"action": kind, "at": now}
                changed = True
        if changed:
            _atomic_game_json(CARROT_STATE_FILE, cur)
        result = _adventure_ticket_snapshot(cur, today)
        if action is not None:
            result["replayed"] = replayed
        if error is not None:
            result.update(ok=False, error=error)
        return result


# Performance outlier guards & TTFT log-histogram parameters
PERF_MIN_OUTPUT = 20
PERF_MAX_SECONDS = 1800.0
PERF_MIN_SECONDS = 0.2
PERF_MAX_TPS = 3000.0
PERF_MAX_TTFT = 120.0
TTFT_BASE = 0.05
TTFT_RATIO = 1.05

# Approximate USD per 1M tokens: (input, output, cache_read, cache_write)
MODEL_PRICING: list[tuple[str, tuple[float, float, float, float]]] = [
    ("claude-opus-5", (15.0, 75.0, 1.5, 18.75)),
    ("claude-sonnet-5", (3.0, 15.0, 0.3, 3.75)),
    ("claude-opus-4", (15.0, 75.0, 1.5, 18.75)),
    ("claude-sonnet-4", (3.0, 15.0, 0.3, 3.75)),
    ("claude-haiku-4", (0.8, 4.0, 0.08, 1.0)),
    ("claude-3-7-sonnet", (3.0, 15.0, 0.3, 3.75)),
    ("claude-3-5-sonnet", (3.0, 15.0, 0.3, 3.75)),
    ("claude-3-5-haiku", (0.8, 4.0, 0.08, 1.0)),
    ("gemini-4", (2.5, 15.0, 0.25, 0.0)),
    ("gemini-3.5-pro", (2.5, 15.0, 0.25, 0.0)),
    ("gemini-3-pro", (2.0, 12.0, 0.2, 0.0)),
    ("gemini-2.5-pro", (1.25, 10.0, 0.125, 0.0)),
    ("gemini-2.5-flash-lite", (0.1, 0.4, 0.01, 0.0)),
    ("gemini-2.5-flash", (0.3, 2.5, 0.03, 0.0)),
    ("gemini-3", (0.5, 3.0, 0.05, 0.0)),
    ("gemini-2.0-flash", (0.1, 0.4, 0.01, 0.0)),
    ("gpt-6", (2.5, 15.0, 0.25, 0.0)),
    ("gpt-5-mini", (0.25, 2.0, 0.025, 0.0)),
    ("gpt-5-nano", (0.05, 0.4, 0.005, 0.0)),
    ("gpt-5", (1.25, 10.0, 0.125, 0.0)),
    ("codex", (1.5, 10.0, 0.15, 0.0)),
    ("o4-mini", (1.1, 4.4, 0.275, 0.0)),
    ("o3-mini", (1.1, 4.4, 0.275, 0.0)),
    ("o3", (2.0, 8.0, 0.5, 0.0)),
    ("gpt-4.1-mini", (0.4, 1.6, 0.1, 0.0)),
    ("gpt-4.1", (2.0, 8.0, 0.5, 0.0)),
    ("gpt-4o-mini", (0.15, 0.6, 0.075, 0.0)),
    ("gpt-4o", (2.5, 10.0, 1.25, 0.0)),
    ("deepseek-r1", (0.55, 2.19, 0.14, 0.0)),
    ("deepseek", (0.27, 1.1, 0.07, 0.0)),
    ("qwen", (0.4, 1.2, 0.1, 0.0)),
    ("kimi", (0.6, 2.5, 0.15, 0.0)),
    ("minimax", (0.3, 1.2, 0.05, 0.0)),
    ("glm", (0.5, 2.0, 0.1, 0.0)),
]

TOOL_META = {
    "antigravity": {"label": "Antigravity (agy)", "short": "AGY", "accent": "#E54826"},
    "codex": {"label": "Codex CLI", "short": "CODEX", "accent": "#3B6CF6"},
    "omp": {"label": "Oh My Pi", "short": "OMP", "accent": "#DB2777"},
    "pi": {"label": "Pi", "short": "PI", "accent": "#047857"},
    "devin": {"label": "Devin CLI", "short": "DEVIN", "accent": "#0284C7"},
    "qoder": {"label": "Qoder CLI", "short": "QODER", "accent": "#059669"},
    "copilot": {"label": "Copilot CLI", "short": "COPILOT", "accent": "#4F46E5"},
    "droid": {"label": "Factory Droid", "short": "DROID", "accent": "#EA580C"},
    "opencode": {"label": "OpenCode", "short": "OPENCODE", "accent": "#D97706"},
    "grok": {"label": "Grok CLI", "short": "GROK", "accent": "#52525B"},
    "claude": {"label": "Claude Code", "short": "CLAUDE", "accent": "#D97757"},
    "gemini": {"label": "Gemini CLI", "short": "GEMINI", "accent": "#7C3AED"},
    "hermes": {"label": "Hermes", "short": "HERMES", "accent": "#0891B2"},
    "qwencode": {"label": "Qwen Code", "short": "QWEN", "accent": "#6D28D9"},
    "kimicode": {"label": "Kimi Code", "short": "KIMI", "accent": "#0F766E"},
    "mimocode": {"label": "MiMoCode", "short": "MIMO", "accent": "#B45309"},
    "cline": {"label": "Cline / Roo", "short": "CLINE", "accent": "#BE123C"},
}


def estimate_cost(
    model: str,
    inp: int = 0,
    out: int = 0,
    cache_read: int = 0,
    cache_write: int = 0,
    reasoning: int = 0,
) -> float:
    m = (model or "").lower().strip()
    if "/" in m:
        m = m.split("/")[-1]
    rates = (1.5, 8.0, 0.15, 0.0)
    for prefix, r in MODEL_PRICING:
        if prefix in m:
            rates = r
            break
    pin, pout, pcr, pcw = rates
    bill_out = max(out, 0) + max(reasoning, 0)
    return (
        max(inp, 0) * pin
        + bill_out * pout
        + max(cache_read, 0) * pcr
        + max(cache_write, 0) * pcw
    ) / 1_000_000.0


def nice_model(model: str | None) -> str:
    if not model or not isinstance(model, str):
        return "unknown"
    m = model.strip()
    if "/" in m:
        m = m.split("/")[-1]
    # Strip trailing date stamps like -20251001 if overly verbose
    m = re.sub(r"-20\d{6}$", "", m)
    return m or "unknown"


def parse_iso_ts(ts_str: str | None) -> float | None:
    if not ts_str or not isinstance(ts_str, str):
        return None
    s = ts_str.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(s).timestamp()
    except ValueError:
        return None


def local_day_hour(epoch_sec: float) -> tuple[str, int]:
    dt = datetime.fromtimestamp(epoch_sec).astimezone()
    return dt.date().isoformat(), dt.hour


# ---------- TTFT Log-Histogram & Performance Helpers ----------

def ttft_to_bucket(sec: float) -> int:
    if sec < TTFT_BASE:
        return 0
    return int(math.floor(math.log(sec / TTFT_BASE) / math.log(TTFT_RATIO))) + 1


def bucket_to_bounds(bucket: int) -> tuple[float, float]:
    if bucket <= 0:
        return 0.0, TTFT_BASE
    return (
        TTFT_BASE * (TTFT_RATIO ** (bucket - 1)),
        TTFT_BASE * (TTFT_RATIO ** bucket),
    )


def histogram_percentile(hist: dict[str, int], p: float) -> float | None:
    buckets = sorted((int(k), int(v)) for k, v in hist.items() if int(v) > 0)
    total = sum(v for _, v in buckets)
    if total == 0:
        return None
    target = max(1.0, min(float(total), p * total))
    seen = 0
    for b, cnt in buckets:
        if seen + cnt >= target:
            lo, hi = bucket_to_bounds(b)
            frac = (target - seen - 0.5) / cnt
            frac = max(0.0, min(1.0, frac))
            return round(lo + (hi - lo) * frac, 2)
        seen += cnt
    lo, hi = bucket_to_bounds(buckets[-1][0])
    return round(hi, 2)


def empty_perf() -> dict[str, Any]:
    return {"o": 0, "g": 0.0, "n": 0, "th": {}}


def perf_add(
    perf_map: dict[str, dict[str, Any]],
    model: str,
    out_tokens: int,
    gen_seconds: float | None,
    ttft_seconds: float | None = None,
) -> bool:
    if gen_seconds is None:
        return False
    try:
        out = int(out_tokens or 0)
        gen = float(gen_seconds)
    except (TypeError, ValueError, OverflowError):
        return False
    if out < PERF_MIN_OUTPUT or not (PERF_MIN_SECONDS < gen <= PERF_MAX_SECONDS):
        return False
    if out / gen > PERF_MAX_TPS:
        return False
    st = perf_map.setdefault(model or "unknown", empty_perf())
    st["o"] += out
    st["g"] = round(st["g"] + gen, 3)
    st["n"] += 1
    if ttft_seconds is not None:
        try:
            ttft = float(ttft_seconds)
            if 0.0 <= ttft <= PERF_MAX_TTFT:
                b = str(ttft_to_bucket(ttft))
                st["th"][b] = st["th"].get(b, 0) + 1
        except (TypeError, ValueError):
            pass
    return True


def perf_merge(dst: dict[str, Any], src: dict[str, Any]) -> None:
    dst["o"] += int(src.get("o", 0) or 0)
    dst["g"] = round(dst["g"] + float(src.get("g", 0.0) or 0.0), 3)
    dst["n"] += int(src.get("n", 0) or 0)
    for b, c in (src.get("th") or {}).items():
        dst["th"][b] = dst["th"].get(b, 0) + int(c)


# ---------- Read-Only SQLite Helper ----------

def sqlite_open_ro(path: str) -> sqlite3.Connection:
    uri = Path(path).resolve().as_uri() + "?mode=ro"
    try:
        conn = sqlite3.connect(uri, uri=True, timeout=1.0)
        conn.execute("SELECT 1")
        return conn
    except sqlite3.OperationalError:
        wal = path + "-wal"
        if os.path.exists(wal) and os.path.getsize(wal) > 0:
            raise
        conn = sqlite3.connect(uri + "&immutable=1", uri=True, timeout=1.0)
        conn.execute("SELECT 1")
        return conn


# ---------- Lightweight Protobuf Wire Decoder (for Antigravity) ----------

def _decode_varint(buf: bytes, pos: int) -> tuple[int, int]:
    result = 0
    shift = 0
    n = len(buf)
    while pos < n:
        b = buf[pos]
        pos += 1
        result |= (b & 0x7F) << shift
        if not (b & 0x80):
            return result, pos
        shift += 7
        if shift > 70:
            break
    return result, pos


def _parse_proto(buf: bytes):
    pos = 0
    n = len(buf)
    while pos < n:
        tag, pos = _decode_varint(buf, pos)
        field_num = tag >> 3
        wire_type = tag & 0x07
        if field_num == 0:
            break
        if wire_type == 0:
            val, pos = _decode_varint(buf, pos)
            yield field_num, 0, val
        elif wire_type == 1:
            if pos + 8 > n:
                break
            yield field_num, 1, buf[pos : pos + 8]
            pos += 8
        elif wire_type == 2:
            length, pos = _decode_varint(buf, pos)
            if length < 0 or pos + length > n:
                break
            yield field_num, 2, buf[pos : pos + length]
            pos += length
        elif wire_type == 5:
            if pos + 4 > n:
                break
            yield field_num, 5, buf[pos : pos + 4]
            pos += 4
        else:
            break


def _proto_duration(buf: bytes) -> float | None:
    sec = 0
    nanos = 0
    for fn, wt, val in _parse_proto(buf):
        if wt != 0:
            continue
        if fn == 1:
            sec = val if val < (1 << 63) else val - (1 << 64)
        elif fn == 2:
            nanos = val if val < (1 << 63) else val - (1 << 64)
    total = sec + nanos / 1e9
    return total if 0.0 <= total <= 86400.0 else None


def _ag_parse_gen_record(blob: bytes, fallback_ts: float) -> dict[str, Any] | None:
    model = None
    inp = out = cached = thoughts = 0
    response = None
    ts_sec = None
    ttft = stream = None
    min_ts = 1_577_836_800  # 2020-01-01
    max_ts = 2_208_988_800  # 2040-01-01

    for fn, wt, val in _parse_proto(blob):
        if fn == 11 and wt == 2:
            ttft = _proto_duration(val)
        elif fn == 12 and wt == 2:
            stream = _proto_duration(val)
        elif fn == 19 and wt == 2:
            try:
                model = val.decode("utf-8")
            except UnicodeDecodeError:
                pass
        elif fn == 4 and wt == 2:
            for tfn, twt, tval in _parse_proto(val):
                if twt != 0:
                    continue
                if tfn == 2:
                    inp = tval
                elif tfn == 3:
                    out = tval
                elif tfn == 5:
                    cached = tval
                elif tfn == 9:
                    thoughts = tval
                elif tfn == 10:
                    response = tval
        elif fn == 9 and wt == 2:
            for tfn, twt, tval in _parse_proto(val):
                if tfn == 4 and twt == 2:
                    for sfn, swt, sval in _parse_proto(tval):
                        if sfn == 1 and swt == 0 and min_ts <= sval <= max_ts:
                            ts_sec = float(sval)

    if ts_sec is None:
        ts_sec = fallback_ts
    if not (min_ts <= ts_sec <= max_ts):
        return None
    if max(inp, out, cached, thoughts) > 50_000_000:
        return None
    if not model or len(model) > 120 or not model.isprintable():
        model = "unknown"
    final_out = response if response is not None else max(out - thoughts, 0)
    if inp == 0 and final_out == 0 and cached == 0 and thoughts == 0:
        return None
    return {
        "ts": ts_sec,
        "model": nice_model(model),
        "in": inp,
        "out": final_out,
        "cr": cached,
        "cw": 0,
        "reason": thoughts,
        "gen": round(stream, 3) if stream is not None else None,
        "ttft": round(ttft, 3) if ttft is not None else None,
    }


def _ag_step_ts(meta_blob: bytes | None) -> float | None:
    if not meta_blob:
        return None
    min_ts = 1_577_836_800
    max_ts = 2_208_988_800
    for fn, wt, val in _parse_proto(meta_blob):
        if fn == 1 and wt == 2:
            for sfn, swt, sval in _parse_proto(val):
                if sfn == 1 and swt == 0 and min_ts <= sval <= max_ts:
                    return float(sval)
    return None


def _decode_packed_varints(buf: bytes) -> list[int]:
    vals: list[int] = []
    pos = 0
    n = len(buf)
    while pos < n:
        v, pos = _decode_varint(buf, pos)
        vals.append(v)
    return vals


def parse_antigravity_db(path: str) -> dict[str, Any]:
    events = []
    mtime = os.path.getmtime(path)
    wal_path = path + "-wal"
    if os.path.exists(wal_path):
        try:
            mtime = max(mtime, os.path.getmtime(wal_path))
        except OSError:
            pass
    try:
        conn = sqlite_open_ro(path)
    except Exception:
        return {"events": [], "project": None}

    try:
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if "gen_metadata" not in tables:
            return {"events": [], "project": None}

        step_ts_map: dict[int, float] = {}
        if "steps" in tables:
            try:
                for idx, meta in conn.execute("SELECT idx, metadata FROM steps WHERE metadata IS NOT NULL"):
                    ts = _ag_step_ts(meta)
                    if ts:
                        step_ts_map[idx] = ts
            except sqlite3.Error:
                pass

        for idx, blob in conn.execute("SELECT idx, data FROM gen_metadata WHERE data IS NOT NULL ORDER BY idx"):
            if not isinstance(blob, (bytes, bytearray)):
                continue
            raw_bytes = bytes(blob)
            # gen_metadata top-level field 2 holds packed step indices referencing steps.idx;
            # top-level field 1 wraps the generation record(s)
            step_idxs: list[int] = []
            sub_records: list[bytes] = []
            for fn, wt, val in _parse_proto(raw_bytes):
                if fn == 1 and wt == 2:
                    sub_records.append(val)
                elif fn == 2 and wt == 2:
                    step_idxs.extend(_decode_packed_varints(val))
                elif fn == 2 and wt == 0:
                    step_idxs.append(val)

            step_times = [step_ts_map[s] for s in step_idxs if s in step_ts_map]
            fb = max(step_times) if step_times else step_ts_map.get(idx, mtime)
            if not sub_records:
                sub_records = [raw_bytes]
            for sub in sub_records:
                rec = _ag_parse_gen_record(sub, fb)
                if rec:
                    rec["cost"] = estimate_cost(
                        rec["model"], rec["in"], rec["out"], rec["cr"], 0, rec["reason"]
                    )
                    events.append(rec)
    except sqlite3.Error:
        pass
    finally:
        conn.close()

    return {"events": events, "project": None}


def discover_antigravity_dbs() -> list[str]:
    patterns = [
        os.path.join(HOME, ".gemini", "antigravity", "conversations", "*.db"),
        os.path.join(HOME, ".gemini", "antigravity-cli", "conversations", "*.db"),
        os.path.join(HOME, ".gemini", "antigravity-ide", "conversations", "*.db"),
        os.path.join(HOME, ".t3", "userdata", "providers", "antigravity", "*", "antigravity-acp", "conversations", "*.db"),
    ]
    by_stem: dict[str, tuple[float, int, str]] = {}
    for pat in patterns:
        for p in glob.glob(pat):
            try:
                st = os.stat(p)
            except OSError:
                continue
            stem = os.path.basename(p)
            prev = by_stem.get(stem)
            if prev is None or (st.st_size, st.st_mtime) > (prev[1], prev[0]):
                by_stem[stem] = (st.st_mtime, st.st_size, p)
    return [v[2] for v in by_stem.values()]


# ---------- Codex CLI Scanner ----------

_RE_ITEM_STARTED = re.compile(r'"started_at_ms"\s*:\s*(\d+)')


def _is_valid_quota_bucket(bucket: Any) -> bool:
    return isinstance(bucket, dict) and bucket.get("used_percent") is not None


def _has_valid_quota(quota: Any) -> bool:
    if not isinstance(quota, dict):
        return False
    if any(_is_valid_quota_bucket(quota.get(slot)) for slot in ("primary", "secondary")):
        return True
    buckets = quota.get("buckets")
    return isinstance(buckets, list) and any(_is_valid_quota_bucket(bucket) for bucket in buckets)


def _codex_quota_key(quota: dict[str, Any]) -> tuple[bool, float]:
    # Old cache entries don't record the limit ID; don't let them outrank
    # a snapshot known to represent the generic Codex allowance.
    generic = "limit_id" in quota and quota["limit_id"] in (None, "", "codex")
    return generic, quota.get("ts", 0)


_CODEX_PARSER_REV = 3
_CODEX_USAGE_FIELDS = ("input_tokens", "cached_input_tokens", "output_tokens",
                       "reasoning_output_tokens", "cache_write_input_tokens")


class _NoCodexZstdDecoder(OSError):
    pass


def _trusted_zstd():
    # Finder does not necessarily inherit a package manager's PATH. An
    # explicit path may win, but not a relative shim or writable parent chain.
    choices = (shutil.which("zstd"), "/usr/bin/zstd", "/opt/homebrew/bin/zstd", "/usr/local/bin/zstd")
    owners = (0, os.getuid())
    native_magic = {b"\x7fELF", b"\xcf\xfa\xed\xfe", b"\xfe\xed\xfa\xcf",
                    b"\xca\xfe\xba\xbe", b"\xca\xfe\xba\xbf"}
    for path in choices:
        if not path or not os.path.isabs(path):
            continue
        try:
            resolved = os.path.realpath(path)
            if any(not stat.S_ISDIR(st.st_mode) or st.st_uid not in owners or st.st_mode & 0o022
                   for parent in set(Path(path).parents) | set(Path(resolved).parents)
                   for st in (parent.stat(),)):
                continue
            st = os.stat(resolved)
            if (not stat.S_ISREG(st.st_mode) or st.st_uid not in owners
                    or st.st_mode & 0o022 or not os.access(resolved, os.X_OK)):
                continue
            with open(resolved, "rb") as binary:
                if binary.read(4) in native_magic:
                    return resolved
        except OSError:
            continue
    return None

@contextmanager
def _open_codex_rollout(path):
    if not path.endswith(".zst"):
        with open(path, encoding="utf-8", errors="ignore") as stream:
            yield stream
        return
    try:
        from compression import zstd as std_zstd
    except ImportError:
        std_zstd = None
    if std_zstd is not None:
        try:
            with std_zstd.open(path, "rt", encoding="utf-8", errors="ignore") as stream:
                yield stream
        except std_zstd.ZstdError as exc:
            raise OSError("Unreadable compressed Codex rollout") from exc
        return
    try:
        import zstandard
    except ImportError:
        zstandard = None
    if zstandard is not None:
        with open(path, "rb") as raw:
            with zstandard.ZstdDecompressor().stream_reader(raw, read_across_frames=True) as decoded:
                try:
                    with io.TextIOWrapper(decoded, encoding="utf-8", errors="ignore") as stream:
                        yield stream
                except zstandard.ZstdError as exc:
                    raise OSError("Unreadable compressed Codex rollout") from exc
        return
    binary = _trusted_zstd()
    if binary is None:
        raise _NoCodexZstdDecoder()
    proc = subprocess.Popen([binary, "-q", "-d", "-c", "--", path],
                            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                            env={"PATH": "/usr/bin:/bin", "LC_ALL": "C"})
    try:
        with io.TextIOWrapper(proc.stdout, encoding="utf-8", errors="ignore") as stream:
            yield stream
        if proc.wait(timeout=2) != 0:
            raise OSError("Unreadable compressed Codex rollout")
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait()


def _codex_usage(raw):
    if not isinstance(raw, dict):
        return None
    values = tuple(raw.get(key, 0) for key in _CODEX_USAGE_FIELDS)
    if any(type(value) is not int or value < 0 for value in values):
        return None
    return values


def _codex_event(usage, ts, model, gen=None, ttft=None):
    li, lc, total_out, reasoning, cw = usage
    lc = min(li, lc)
    # OpenAI's reasoning output is a subset of the provider's output total.
    # Persist disjoint visible/reasoning components for all token aggregates.
    reasoning = min(reasoning, total_out)
    inp = li - lc
    return {"ts": ts, "model": model, "in": inp, "out": total_out - reasoning,
            "cr": lc, "cw": cw, "reason": reasoning, "gen": gen, "ttft": ttft,
            "cost": estimate_cost(model, inp, total_out, lc, cw, 0)}


def _codex_response_id(raw):
    return raw if isinstance(raw, str) and 0 < len(raw) <= 256 else None


def parse_codex_file(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    project: str | None = None
    model = "gpt-5"
    perf_trigger: float | None = None
    perf_first: float | None = None
    prev_total_key: tuple[int, ...] | None = None
    usage_records: dict[str, dict[str, Any]] = {}
    ordinary_response_ids: set[str] = set()
    adjacent_usage_id = None
    pending_compactions: list[str] = []
    omitted_compactions: set[str] = set()
    zstd_retry = False
    latest_quota: dict[str, Any] | None = None

    try:
        with _open_codex_rollout(path) as f:
            for line in f:
                if not line.strip():
                    continue
                preceding_usage_id, adjacent_usage_id = adjacent_usage_id, None
                if line[0] != "{":
                    continue
                # Fast pre-filter before full JSON parse
                is_meta = '"session_meta"' in line or '"turn_context"' in line
                is_token = ('"token_count"' in line or '"token_usage_record"' in line
                            or '"compacted"' in line)
                is_task = '"task_started"' in line
                is_item = '"item_completed"' in line and ('"Reasoning"' in line or '"AgentMessage"' in line)
                if not (is_meta or is_token or is_task or is_item):
                    continue

                if is_item and not is_token:
                    m = _RE_ITEM_STARTED.search(line[-300:])
                    if m:
                        s_ms = int(m.group(1))
                        if perf_first is None or s_ms < perf_first:
                            perf_first = float(s_ms)
                    continue

                try:
                    obj = json.loads(line)
                except Exception:
                    continue

                if not isinstance(obj, dict):
                    continue
                typ = obj.get("type")
                payload = obj.get("payload")
                if typ == "compacted" and payload is None:
                    payload = {}  # Older top-level marker, with no compaction ID.
                if not isinstance(payload, dict):
                    continue
                ts = parse_iso_ts(obj.get("timestamp"))

                if typ == "turn_context":
                    if payload.get("model"):
                        model = nice_model(payload["model"])
                    if not project and isinstance(payload.get("cwd"), str):
                        project = payload["cwd"]
                elif typ == "session_meta":
                    if not project and isinstance(payload.get("cwd"), str):
                        project = payload["cwd"]
                elif typ == "token_usage_record":
                    rid = _codex_response_id(payload.get("response_id"))
                    usage = _codex_usage(payload.get("usage"))
                    if rid and ts is not None and usage and any(usage):
                        usage_records.setdefault(rid, _codex_event(usage, ts, model))
                        adjacent_usage_id = rid
                elif typ == "compacted":
                    explicit = payload.get("compaction_response_id")
                    rid = _codex_response_id(explicit) if explicit is not None else preceding_usage_id
                    if rid and prev_total_key is not None:
                        pending_compactions.append(rid)
                elif typ == "event_msg":
                    ptyp = payload.get("type")
                    if ptyp == "task_started" and ts is not None:
                        perf_trigger = ts * 1000.0
                        perf_first = None
                    elif ptyp == "token_count":
                        rl = payload.get("rate_limits")
                        if isinstance(rl, dict) and ts and any(
                            _is_valid_quota_bucket(rl.get(slot)) for slot in ("primary", "secondary")
                        ):
                            snapshot = {
                                "ts": ts,
                                "plan": rl.get("plan_type"),
                                "limit_id": rl.get("limit_id"),
                                "primary": rl.get("primary"),
                                "secondary": rl.get("secondary"),
                            }
                            if latest_quota is None or _codex_quota_key(snapshot) > _codex_quota_key(latest_quota):
                                latest_quota = snapshot
                        info = payload.get("info")
                        if not isinstance(info, dict) or ts is None:
                            continue
                        raw_total = info.get("total_token_usage")
                        tkey = (_codex_usage(raw_total)
                                if isinstance(raw_total, dict) and "input_tokens" in raw_total
                                and "output_tokens" in raw_total else None)
                        if tkey is not None:
                            if pending_compactions and tkey == prev_total_key:
                                omitted_compactions.update(pending_compactions)
                            pending_compactions.clear()
                            if prev_total_key is not None and tkey == prev_total_key and any(tkey):
                                continue
                            prev_total_key = tkey
                        last = _codex_usage(info.get("last_token_usage"))
                        if not last or not any(last):
                            continue
                        end_ms = ts * 1000.0
                        gen = ttft = None
                        if perf_first is not None and end_ms > perf_first:
                            gen = round((end_ms - perf_first) / 1000.0, 3)
                            if perf_trigger is not None and perf_first >= perf_trigger:
                                ttft = round((perf_first - perf_trigger) / 1000.0, 3)
                        elif perf_trigger is not None and end_ms > perf_trigger:
                            gen = round((end_ms - perf_trigger) / 1000.0, 3)

                        events.append(_codex_event(last, ts, model, gen, ttft))
                        rid = _codex_response_id(payload.get("response_id"))
                        if rid:
                            ordinary_response_ids.add(rid)
                        perf_trigger = None
                        perf_first = None
    except _NoCodexZstdDecoder:
        zstd_retry = True
    except (OSError, EOFError, subprocess.SubprocessError):
        # A corrupt compressed archive is not a trustworthy partial report.
        if path.endswith(".zst"):
            events.clear()
            ordinary_response_ids.clear()
            omitted_compactions.clear()
            latest_quota = None

    for rid, event in usage_records.items():
        if rid in omitted_compactions and rid not in ordinary_response_ids:
            events.append({**event, "codex_compaction_id": rid})
    return {"events": events, "project": project, "quota": latest_quota,
            "codex_ordinary_response_ids": sorted(ordinary_response_ids),
            "codex_parser_rev": _CODEX_PARSER_REV, "zstd_retry": zstd_retry}


# ---------- OpenCode SQLite Scanner ----------

def parse_opencode_db(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    session_projects: dict[str, str] = {}
    if not os.path.exists(path):
        return {"events": [], "projects_by_session": {}}
    try:
        conn = sqlite_open_ro(path)
    except Exception:
        return {"events": [], "projects_by_session": {}}

    try:
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        for tbl in ("session", "session_v2"):
            if tbl in tables:
                cols = {r[1] for r in conn.execute(f"PRAGMA table_info({tbl})")}
                if {"id", "directory"} <= cols:
                    for sid, d in conn.execute(f"SELECT id, directory FROM {tbl}"):
                        if isinstance(d, str) and d.startswith("/"):
                            session_projects.setdefault(sid, d)

        if "message" not in tables or "part" not in tables:
            return {"events": [], "projects_by_session": session_projects}

        msg_meta: dict[str, tuple[str, str, float, str | None]] = {}
        for mid, sid, t_created, raw in conn.execute(
            "SELECT id, session_id, time_created, data FROM message "
            "WHERE json_extract(data, '$.role') = 'assistant'"
        ):
            try:
                d = json.loads(raw)
            except Exception:
                continue
            model = nice_model(d.get("modelID") or (d.get("model") or {}).get("id"))
            created_ms = (d.get("time") or {}).get("created") or t_created or 0
            cwd = (d.get("path") or {}).get("cwd") or session_projects.get(sid)
            msg_meta[mid] = (sid, model, float(created_ms), cwd)

        # Stream parts ordered by message_id, time_created to compute step timing & usage
        rows = conn.execute(
            """
            SELECT message_id, time_created,
                   json_extract(data, '$.type'),
                   json_extract(data, '$.time.start'),
                   json_extract(data, '$.tokens.input'),
                   json_extract(data, '$.tokens.output'),
                   json_extract(data, '$.tokens.reasoning'),
                   json_extract(data, '$.tokens.cache.read'),
                   json_extract(data, '$.tokens.cache.write'),
                   json_extract(data, '$.cost')
            FROM part
            WHERE json_extract(data, '$.type') IN ('step-start', 'step-finish', 'reasoning', 'text')
            ORDER BY message_id, time_created
            """
        ).fetchall()

        cur_mid = None
        req_start: float | None = None
        first_tok: float | None = None

        for mid, written_ms, kind, start_ms, tin, tout, treas, tcr, tcw, cost in rows:
            meta = msg_meta.get(mid)
            if not meta:
                continue
            sid, model, created_ms, cwd = meta
            if mid != cur_mid:
                cur_mid = mid
                req_start = created_ms
                first_tok = None

            if kind == "step-start":
                first_tok = None
            elif kind in ("reasoning", "text"):
                t = start_ms if isinstance(start_ms, (int, float)) else written_ms
                if isinstance(t, (int, float)) and (first_tok is None or t < first_tok):
                    first_tok = float(t)
            elif kind == "step-finish" and isinstance(written_ms, (int, float)):
                inp = int(tin or 0)
                out = int(tout or 0)
                reas = int(treas or 0)
                cr = int(tcr or 0)
                cw = int(tcw or 0)
                gen = ttft = None
                if first_tok is not None and written_ms > first_tok:
                    gen = round((written_ms - first_tok) / 1000.0, 3)
                    if req_start is not None and first_tok >= req_start:
                        ttft = round((first_tok - req_start) / 1000.0, 3)
                elif req_start is not None and written_ms > req_start:
                    gen = round((written_ms - req_start) / 1000.0, 3)

                native_cost = float(cost) if isinstance(cost, (int, float)) and cost > 0 else None
                if inp or out or cr or cw or reas:
                    ev_oc = {
                        "ts": float(written_ms) / 1000.0,
                        "model": model,
                        "in": inp,
                        "out": out + reas,
                        "cr": cr,
                        "cw": cw,
                        "reason": reas,
                        "gen": gen,
                        "ttft": ttft,
                        "cost": native_cost or 0.0,
                        "project": cwd,
                        "session": sid,
                    }
                    if native_cost is not None:
                        ev_oc["native_cost"] = native_cost
                    events.append(ev_oc)
                req_start = float(written_ms)
                first_tok = None
    except sqlite3.Error:
        pass
    finally:
        conn.close()

    return {"events": events}


# ---------- Claude Code JSONL Scanner ----------

def parse_claude_file(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    when: dict[str, float] = {}
    via: dict[str, str] = {}
    raw_entries: list[dict[str, Any]] = []
    project: str | None = None

    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if not line or line[0] != "{":
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                uid = obj.get("uuid")
                ts = parse_iso_ts(obj.get("timestamp"))
                p_uid = obj.get("parentUuid")
                if not project and isinstance(obj.get("cwd"), str):
                    project = obj["cwd"]
                if obj.get("type") == "attachment" and uid and p_uid:
                    via[uid] = p_uid
                    continue
                if uid and ts is not None:
                    when[uid] = ts

                msg = obj.get("message")
                if not isinstance(msg, dict):
                    continue
                usage = msg.get("usage")
                if not isinstance(usage, dict) or ts is None:
                    continue
                model = nice_model(msg.get("model"))
                inp = int(usage.get("input_tokens", 0) or 0)
                out = int(usage.get("output_tokens", 0) or 0)
                cr = int(usage.get("cache_read_input_tokens", 0) or 0)
                cw = int(usage.get("cache_creation_input_tokens", 0) or 0)
                if not (inp or out or cr or cw):
                    continue
                think_ms = obj.get("thinkingDurationMs")
                req_key = obj.get("requestId") or msg.get("id") or uid
                raw_entries.append({
                    "req_key": req_key,
                    "ts": ts,
                    "parent": p_uid,
                    "think_ms": think_ms,
                    "model": model,
                    "in": inp,
                    "out": out,
                    "cr": cr,
                    "cw": cw,
                })
    except OSError:
        return {"events": [], "project": None}

    # Group by requestId to deduplicate streaming snapshots & compute timing
    by_req: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for e in raw_entries:
        by_req[str(e["req_key"])].append(e)

    def find_start(parent_id: str | None) -> float | None:
        cur = parent_id
        for _ in range(32):
            if not cur:
                return None
            if cur in when:
                return when[cur]
            cur = via.get(cur)
        return None

    for grp in by_req.values():
        last = grp[-1]
        end = max(x["ts"] for x in grp)
        first = None
        for x in grp:
            if x.get("think_ms"):
                first = x["ts"] - float(x["think_ms"]) / 1000.0
                break
        start = find_start(grp[0].get("parent"))
        gen = ttft = None
        if first is not None and end > first:
            gen = round(end - first, 3)
            if start is not None and first >= start:
                ttft = round(first - start, 3)
        elif start is not None and end > start:
            gen = round(end - start, 3)

        events.append({
            "ts": end,
            "model": last["model"],
            "in": last["in"],
            "out": last["out"],
            "cr": last["cr"],
            "cw": last["cw"],
            "reason": 0,
            "gen": gen,
            "ttft": ttft,
            "cost": estimate_cost(last["model"], last["in"], last["out"], last["cr"], last["cw"]),
        })

    return {"events": events, "project": project}


# ---------- OMP (Oh My Pi) and Pi session logs ----------

def parse_pi_session_file(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    project: str | None = None
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if not line or line[0] != "{":
                    continue
                if '"type":"session"' in line or '"type": "session"' in line:
                    try:
                        obj = json.loads(line)
                        if isinstance(obj.get("cwd"), str) and obj["cwd"].startswith("/"):
                            project = obj["cwd"]
                    except Exception:
                        pass
                    continue
                if '"usage"' not in line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                msg = obj.get("message")
                if not isinstance(msg, dict) or msg.get("role") != "assistant":
                    continue
                usage = msg.get("usage")
                if not isinstance(usage, dict):
                    continue
                inp = int(usage.get("input", 0) or 0)
                out = int(usage.get("output", 0) or 0)
                cr = int(usage.get("cacheRead", 0) or 0)
                cw = int(usage.get("cacheWrite", 0) or 0)
                reas = int(usage.get("reasoning", 0) or 0)
                if not (inp or out or cr or cw or reas):
                    continue

                ts = parse_iso_ts(obj.get("timestamp"))
                if ts is None:
                    raw_ts = msg.get("completedAt") or msg.get("timestamp")
                    if isinstance(raw_ts, (int, float)):
                        ts = raw_ts / 1000.0 if raw_ts > 1e11 else float(raw_ts)
                if ts is None:
                    continue

                model = nice_model(msg.get("model"))
                dur_ms = msg.get("duration") if msg.get("duration") is not None else msg.get("durationMs")
                ttft_ms = msg.get("ttft") if msg.get("ttft") is not None else msg.get("ttftMs")

                gen = ttft = None
                try:
                    d_val = float(dur_ms) if dur_ms is not None else None
                    t_val = float(ttft_ms) if ttft_ms is not None else None
                    if t_val is not None and t_val >= 0:
                        ttft = round(t_val / 1000.0, 3)
                    if d_val is not None and d_val > 0:
                        if t_val is not None and d_val > t_val:
                            gen = round((d_val - t_val) / 1000.0, 3)
                        else:
                            gen = round(d_val / 1000.0, 3)
                except (TypeError, ValueError):
                    pass

                cost_obj = usage.get("cost")
                native_cost = None
                native_parts = None
                if isinstance(cost_obj, dict) and isinstance(cost_obj.get("total"), (int, float)) and cost_obj["total"] > 0:
                    native_cost = float(cost_obj["total"])
                    native_parts = {
                        "in": float(cost_obj.get("input") or 0.0),
                        "out": float(cost_obj.get("output") or 0.0),
                        "cr": float(cost_obj.get("cacheRead") or 0.0),
                        "cw": float(cost_obj.get("cacheWrite") or 0.0),
                    }

                ev_dict = {
                    "ts": ts,
                    "model": model,
                    "in": inp,
                    "out": out + reas,
                    "cr": cr,
                    "cw": cw,
                    "reason": reas,
                    "gen": gen,
                    "ttft": ttft,
                    "cost": native_cost or 0.0,
                }
                if native_cost is not None:
                    ev_dict["native_cost"] = native_cost
                if native_parts is not None:
                    ev_dict["native_cost_parts"] = native_parts
                events.append(ev_dict)
    except OSError:
        pass

    return {"events": events, "project": project}


def discover_pi_sessions() -> list[tuple[str, str]]:
    # The two tools share a log reader, not a telemetry identity. Prefer
    # the upstream Pi root if an OMP installation mirrored a Pi session.
    roots = (
        ("pi", os.path.join(HOME, ".pi", "agent", "sessions")),
        ("omp", os.path.join(HOME, ".omp", "agent", "sessions")),
    )
    sources: dict[str, list[str]] = {"pi": [], "omp": []}
    pi_by_name: dict[tuple[str, int], list[str]] = defaultdict(list)
    seen: set[tuple[int, int]] = set()
    for tool, root in roots:
        for path in glob.glob(os.path.join(root, "**", "*.jsonl"), recursive=True):
            try:
                st = os.stat(path)
            except OSError:
                continue
            identity = (st.st_dev, st.st_ino)
            if identity in seen or not stat.S_ISREG(st.st_mode):
                continue
            seen.add(identity)
            key = (os.path.basename(path), st.st_size)
            if tool == "pi":
                pi_by_name[key].append(path)
            else:
                try:
                    if any(filecmp.cmp(path, pi_path, shallow=False) for pi_path in pi_by_name.get(key, ())):
                        continue
                except OSError:
                    pass  # No evidence of a copy; use the OMP path.
            sources[tool].append(path)
    return [(tool, path) for tool in ("omp", "pi") for path in sources[tool]]


# ---------- Devin CLI SQLite Scanner ----------

def parse_devin_db(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    if not os.path.exists(path):
        return {"events": []}
    try:
        conn = sqlite_open_ro(path)
    except Exception:
        return {"events": []}

    try:
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if "message_nodes" not in tables or "sessions" not in tables:
            return {"events": []}

        sess_info: dict[str, tuple[str, str | None]] = {}
        for sid, model, wd in conn.execute("SELECT id, model, working_directory FROM sessions"):
            sess_info[sid] = (nice_model(model), wd if isinstance(wd, str) and wd.startswith("/") else None)

        seen_keys: set[str] = set()
        rows = conn.execute(
            """
            SELECT session_id, created_at,
                   json_extract(chat_message, '$.message_id'),
                   json_extract(chat_message, '$.metadata.request_id'),
                   json_extract(chat_message, '$.metadata.model'),
                   json_extract(chat_message, '$.metadata.metrics')
            FROM message_nodes
            WHERE json_extract(chat_message, '$.role') = 'assistant'
              AND json_extract(chat_message, '$.metadata.metrics') IS NOT NULL
            ORDER BY row_id
            """
        )
        for sid, created_at, mid, req_id, msg_model, metrics_raw in rows:
            dedupe = f"{sid}:{req_id or mid}"
            if dedupe in seen_keys:
                continue
            seen_keys.add(dedupe)
            try:
                m = json.loads(metrics_raw) if isinstance(metrics_raw, str) else metrics_raw
            except Exception:
                continue
            if not isinstance(m, dict):
                continue
            inp = int(m.get("input_tokens") or 0)
            out = int(m.get("output_tokens") or 0)
            cr = int(m.get("cache_read_tokens") or 0)
            cw = int(m.get("cache_creation_tokens") or 0)
            if not (inp or out or cr or cw):
                continue
            s_model, wd = sess_info.get(sid, ("unknown", None))
            model = nice_model(msg_model) if msg_model else s_model
            ts = float(created_at) if isinstance(created_at, (int, float)) else 0.0
            if ts > 1e11:
                ts /= 1000.0
            if ts <= 0:
                continue

            ttft_ms = m.get("ttft_ms")
            tot_ms = m.get("total_time_ms")
            gen = ttft = None
            try:
                t_val = float(ttft_ms) if ttft_ms is not None else None
                d_val = float(tot_ms) if tot_ms is not None else None
                if t_val is not None and t_val >= 0:
                    ttft = round(t_val / 1000.0, 3)
                if d_val is not None and d_val > 0:
                    if t_val is not None and d_val > t_val:
                        gen = round((d_val - t_val) / 1000.0, 3)
                    else:
                        gen = round(d_val / 1000.0, 3)
            except (TypeError, ValueError):
                pass

            events.append({
                "ts": ts,
                "model": model,
                "in": inp,
                "out": out,
                "cr": cr,
                "cw": cw,
                "reason": 0,
                "gen": gen,
                "ttft": ttft,
                "cost": estimate_cost(model, inp, out, cr, cw),
                "project": wd,
                "session": sid,
            })
    except sqlite3.Error:
        pass
    finally:
        conn.close()

    return {"events": events}


# ---------- GitHub Copilot CLI Scanner ----------

def parse_copilot_file(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    project: str | None = None
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if not line or line[0] != "{":
                    continue
                if '"session.usage_record"' not in line and '"session.start"' not in line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                typ = obj.get("type")
                data = obj.get("data") or {}
                if not isinstance(data, dict):
                    continue
                if typ == "session.start":
                    cwd = (data.get("context") or {}).get("cwd") or data.get("cwd")
                    if isinstance(cwd, str) and cwd.startswith("/"):
                        project = cwd
                    continue
                if typ != "session.usage_record":
                    continue
                u = data.get("usage")
                if not isinstance(u, dict):
                    continue
                ts = parse_iso_ts(obj.get("timestamp"))
                if ts is None:
                    ts = os.path.getmtime(path)
                inp = int(u.get("inputTokens") or 0)
                out = int(u.get("outputTokens") or 0)
                cr = int(u.get("cacheReadTokens") or 0)
                cw = int(u.get("cacheWriteTokens") or 0)
                reas = int(u.get("reasoningTokens") or 0)
                if not (inp or out or cr or cw or reas):
                    continue
                model = nice_model(u.get("model") or u.get("modelDisplayName"))
                dur_ms = u.get("duration")
                ttft_ms = u.get("timeToFirstTokenMs")
                gen = ttft = None
                try:
                    t_val = float(ttft_ms) if ttft_ms is not None else None
                    d_val = float(dur_ms) if dur_ms is not None else None
                    if t_val is not None and t_val >= 0:
                        ttft = round(t_val / 1000.0, 3)
                    if d_val is not None and d_val > 0:
                        if t_val is not None and d_val > t_val:
                            gen = round((d_val - t_val) / 1000.0, 3)
                        else:
                            gen = round(d_val / 1000.0, 3)
                except (TypeError, ValueError):
                    pass

                events.append({
                    "ts": ts,
                    "model": model,
                    "in": inp,
                    "out": out + reas,
                    "cr": cr,
                    "cw": cw,
                    "reason": reas,
                    "gen": gen,
                    "ttft": ttft,
                    "cost": estimate_cost(model, inp, out, cr, cw, reas),
                })
    except OSError:
        pass
    return {"events": events, "project": project}


# ---------- Factory Droid Scanner ----------

_DROID_PARSER_REV = 2
DROID_CREDIT_WINDOWS = (5, 24, 168, 720)


def _nonnegative_number(value: Any) -> int | float:
    if type(value) is int:
        # Keep integer precision while rejecting values outside the finite
        # numeric range shared by the JSON UI and rolling budget calculations.
        return value if 0 <= value <= sys.float_info.max else 0
    if type(value) is float and math.isfinite(value) and value >= 0:
        return value
    return 0

def parse_droid_settings(path: str) -> dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            d = json.load(f)
    except Exception:
        return {"events": [], "project": None, "droid_parser_rev": _DROID_PARSER_REV}
    if not isinstance(d, dict):
        return {"events": [], "project": None, "droid_parser_rev": _DROID_PARSER_REV}
    tu = d.get("tokenUsage")
    if not isinstance(tu, dict):
        return {"events": [], "project": None, "droid_parser_rev": _DROID_PARSER_REV}
    inp = int(tu.get("inputTokens") or 0)
    out = int(tu.get("outputTokens") or 0)
    cr = int(tu.get("cacheReadTokens") or 0)
    cw = int(tu.get("cacheCreationTokens") or 0)
    reas = int(tu.get("thinkingTokens") or 0)
    credits = _nonnegative_number(tu.get("factoryCredits"))
    if not (inp or out or cr or cw or reas or credits):
        return {"events": [], "project": None, "droid_parser_rev": _DROID_PARSER_REV}
    model = nice_model(d.get("model") or d.get("toolExecutionModeModelId"))
    ts = os.path.getmtime(path)
    active_ms = d.get("assistantActiveTimeMs")
    gen = None
    if isinstance(active_ms, (int, float)) and active_ms > 200:
        gen = round(float(active_ms) / 1000.0, 3)
    # Try to recover project path from parent folder like -Users-username-...
    parent = os.path.basename(os.path.dirname(path))
    project = None
    if parent.startswith("-Users-"):
        cand = "/" + parent.lstrip("-").replace("-", "/")
        if os.path.isdir(cand):
            project = cand
    return {
        "events": [{
            "ts": ts,
            "model": model,
            "in": inp,
            "out": out + reas,
            "cr": cr,
            "cw": cw,
            "reason": reas,
            "gen": gen,
            "ttft": None,
            "credits": credits,
            "cost": estimate_cost(model, inp, out, cr, cw, reas),
        }],
        "project": project,
        "droid_parser_rev": _DROID_PARSER_REV,
    }


# ---------- Grok CLI Scanner ----------

def parse_grok_log(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "shell.turn.inference_done" not in line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                ctx = obj.get("ctx")
                if not isinstance(ctx, dict):
                    continue
                ts = parse_iso_ts(obj.get("ts"))
                if ts is None:
                    continue
                prompt = int(ctx.get("prompt_tokens") or 0)
                cr = int(ctx.get("cached_prompt_tokens") or 0)
                inp = max(prompt - cr, 0)
                comp = int(ctx.get("completion_tokens") or 0)
                reas = int(ctx.get("reasoning_tokens") or 0)
                if not (inp or comp or cr or reas):
                    continue
                model = nice_model(ctx.get("model") or "grok-code")
                elap_ms = ctx.get("model_elapsed_ms")
                ttft_ms = ctx.get("ttft_ms")
                gen = ttft = None
                try:
                    t_val = float(ttft_ms) if ttft_ms is not None else None
                    d_val = float(elap_ms) if elap_ms is not None else None
                    if t_val is not None and t_val >= 0:
                        ttft = round(t_val / 1000.0, 3)
                    if d_val is not None and d_val > 0:
                        if t_val is not None and d_val > t_val:
                            gen = round((d_val - t_val) / 1000.0, 3)
                        else:
                            gen = round(d_val / 1000.0, 3)
                except (TypeError, ValueError):
                    pass
                events.append({
                    "ts": ts,
                    "model": model,
                    "in": inp,
                    "out": comp,
                    "cr": cr,
                    "cw": 0,
                    "reason": reas,
                    "gen": gen,
                    "ttft": ttft,
                    "cost": estimate_cost(model, inp, comp, cr, 0, 0),
                    "session": obj.get("sid") or "grok",
                })
    except OSError:
        pass
    return {"events": events, "project": None}


# ---------- Hermes SQLite Scanner ----------

def parse_hermes_db(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    if not os.path.exists(path):
        return {"events": []}
    try:
        conn = sqlite_open_ro(path)
    except Exception:
        return {"events": []}
    try:
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if "sessions" not in tables:
            return {"events": []}
        cols = {r[1] for r in conn.execute("PRAGMA table_info(sessions)")}
        if not {"id", "input_tokens", "output_tokens"} <= cols:
            return {"events": []}
        for row in conn.execute(
            """
            SELECT id, model, started_at, last_activity_at,
                   input_tokens, output_tokens, cache_read_tokens,
                   cache_write_tokens, reasoning_tokens,
                   actual_cost_usd, estimated_cost_usd, cwd
            FROM sessions
            """
        ):
            sid, model, started, last_act, inp, out, cr, cw, reas, act_c, est_c, cwd = row
            inp = int(inp or 0); out = int(out or 0)
            cr = int(cr or 0); cw = int(cw or 0); reas = int(reas or 0)
            if not (inp or out or cr or cw or reas):
                continue
            ts = float(last_act or started or 0)
            if ts <= 0:
                continue
            m = nice_model(model)
            cost = float(act_c or est_c or 0.0) or estimate_cost(m, inp, out, cr, cw, reas)
            events.append({
                "ts": ts,
                "model": m,
                "in": inp,
                "out": out + reas,
                "cr": cr,
                "cw": cw,
                "reason": reas,
                "gen": None,
                "ttft": None,
                "cost": cost,
                "project": cwd if isinstance(cwd, str) and cwd.startswith("/") else None,
                "session": sid,
            })
    except sqlite3.Error:
        pass
    finally:
        conn.close()
    return {"events": events}


# ---------- Kimi Code Wire JSONL Scanner ----------

def parse_kimi_wire(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "token_usage" not in line and "TokenUsage" not in line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                payload = obj.get("payload") or obj.get("message") or obj
                if not isinstance(payload, dict):
                    continue
                tu = payload.get("token_usage") or payload.get("usage")
                if not isinstance(tu, dict):
                    continue
                inp = int(tu.get("input_other") or tu.get("input_tokens") or tu.get("input") or 0)
                out = int(tu.get("output") or tu.get("output_tokens") or 0)
                cr = int(tu.get("input_cache_read") or tu.get("cache_read_tokens") or 0)
                cw = int(tu.get("input_cache_creation") or tu.get("cache_write_tokens") or 0)
                if not (inp or out or cr or cw):
                    continue
                ts = obj.get("timestamp")
                if isinstance(ts, str):
                    ts = parse_iso_ts(ts)
                elif isinstance(ts, (int, float)):
                    ts = ts / 1000.0 if ts > 1e11 else float(ts)
                else:
                    ts = os.path.getmtime(path)
                model = nice_model(payload.get("model") or "kimi-k2")
                events.append({
                    "ts": ts,
                    "model": model,
                    "in": inp,
                    "out": out,
                    "cr": cr,
                    "cw": cw,
                    "reason": 0,
                    "gen": None,
                    "ttft": None,
                    "cost": estimate_cost(model, inp, out, cr, cw),
                })
    except OSError:
        pass
    return {"events": events, "project": None}


# ---------- Cline / Roo Code VS Code Storage Scanner ----------

def parse_cline_ui_messages(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            rows = json.load(f)
    except Exception:
        return {"events": [], "project": None}
    if not isinstance(rows, list):
        return {"events": [], "project": None}
    for row in rows:
        if not isinstance(row, dict) or row.get("say") != "api_req_started":
            continue
        txt = row.get("text")
        if not isinstance(txt, str):
            continue
        try:
            meta = json.loads(txt)
        except Exception:
            continue
        if not isinstance(meta, dict):
            continue
        inp = int(meta.get("tokensIn") or 0)
        out = int(meta.get("tokensOut") or 0)
        cr = int(meta.get("cacheReads") or 0)
        cw = int(meta.get("cacheWrites") or 0)
        if not (inp or out or cr or cw):
            continue
        ts_raw = row.get("ts")
        ts = float(ts_raw) / 1000.0 if isinstance(ts_raw, (int, float)) and ts_raw > 1e11 else os.path.getmtime(path)
        model = nice_model(meta.get("apiProtocol") or meta.get("model") or "cline")
        cost = float(meta.get("cost") or 0.0) or estimate_cost(model, inp, out, cr, cw)
        events.append({
            "ts": ts,
            "model": model,
            "in": inp,
            "out": out,
            "cr": cr,
            "cw": cw,
            "reason": 0,
            "gen": None,
            "ttft": None,
            "cost": cost,
        })
    return {"events": events, "project": None}


# ---------- Gemini CLI Scanner ----------

def parse_gemini_chat(path: str) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    messages: list[dict[str, Any]] = []
    try:
        if path.endswith(".json"):
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                data = json.load(f)
            if isinstance(data, dict) and isinstance(data.get("messages"), list):
                messages = data["messages"]
        else:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    try:
                        obj = json.loads(line)
                        if isinstance(obj, dict) and obj.get("type") == "gemini":
                            messages.append(obj)
                    except Exception:
                        continue
    except Exception:
        return {"events": [], "project": None}

    prev_user_ts: float | None = None
    for m in messages:
        if not isinstance(m, dict):
            continue
        ts = parse_iso_ts(m.get("timestamp"))
        if m.get("type") == "user" and ts is not None:
            prev_user_ts = ts
            continue
        if m.get("type") != "gemini" or not isinstance(m.get("tokens"), dict) or ts is None:
            continue
        tk = m["tokens"]
        inp = int(tk.get("input", 0) or 0)
        out = int(tk.get("output", 0) or 0)
        cr = int(tk.get("cached", 0) or 0)
        reas = int(tk.get("thoughts", 0) or 0)
        model = nice_model(m.get("model"))
        gen = round(ts - prev_user_ts, 3) if (prev_user_ts and ts > prev_user_ts) else None
        prev_user_ts = None
        if inp or out or cr or reas:
            events.append({
                "ts": ts,
                "model": model,
                "in": inp,
                "out": out,
                "cr": cr,
                "cw": 0,
                "reason": reas,
                "gen": gen,
                "ttft": None,
                "cost": estimate_cost(model, inp, out, cr, 0, reas),
            })
    return {"events": events, "project": None}


# ---------- Incremental Cache & Orchestrator ----------

def _cleanup_legacy_caches() -> None:
    for v in (1, 2, 3, 4):
        old = os.path.join(CACHE_DIR, f"scan_cache_v{v}.json")
        if os.path.exists(old):
            try:
                os.remove(old)
            except OSError:
                pass


def _load_cache() -> dict[str, Any]:
    _cleanup_legacy_caches()
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict) and data.get("version") == 1:
                return data
    except Exception:
        pass
    return {"version": 1, "files": {}}


def _save_cache(cache: dict[str, Any]) -> None:
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        tmp = CACHE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(cache, f, separators=(",", ":"))
        os.replace(tmp, CACHE_FILE)
        # v5 is derived data, not provider logs. Never load its huge JSON on
        # startup; remove it only after a v6 hot cache was safely published.
        if os.path.basename(CACHE_FILE) == "scan_cache_v6.json":
            try:
                os.unlink(os.path.join(CACHE_DIR, "scan_cache_v5.json"))
            except OSError:
                pass
    except OSError:
        pass


def _file_sig(path: str) -> list[int | float]:
    st = os.stat(path)
    # Also consider WAL mtime/size for SQLite DBs
    wal = path + "-wal"
    w_mtime = 0.0
    w_size = 0
    if os.path.exists(wal):
        try:
            wst = os.stat(wal)
            w_mtime = wst.st_mtime
            w_size = wst.st_size
        except OSError:
            pass
    return [round(st.st_mtime, 2), st.st_size, round(w_mtime, 2), w_size]


_SCAN_LOCK = threading.Lock()
_MEM_FILE_CACHE: dict[str, Any] | None = None
_MEM_SCAN_TS: float = 0.0
_MEM_SCAN_EVENTS: _RangedEvents | None = None
_MEM_SCAN_QUOTAS: dict[str, Any] = {}
_MEM_CODEX_ACTIVITY: float = 0.0
_MEM_OBSERVED_TS: float = -1.0
_MEM_OBSERVED_RATES: dict[str, dict[str, float]] = {}
_MEM_SCAN_TTL = 5.0
_DISK_SAVE_INTERVAL = 120.0
_LAST_DISK_SAVE_TS: float = 0.0
_CACHE_NEEDS_SAVE: bool = False


def _flush_cache_if_needed(force_disk: bool = False) -> None:
    global _LAST_DISK_SAVE_TS, _CACHE_NEEDS_SAVE
    if not _CACHE_NEEDS_SAVE or _MEM_FILE_CACHE is None:
        return
    now_m = time.monotonic()
    if not force_disk and _LAST_DISK_SAVE_TS > 0 and (now_m - _LAST_DISK_SAVE_TS) < _DISK_SAVE_INTERVAL:
        return
    _save_cache(_MEM_FILE_CACHE)
    _LAST_DISK_SAVE_TS = now_m
    _CACHE_NEEDS_SAVE = False


atexit.register(lambda: _flush_cache_if_needed(force_disk=True))


def _pick_workspace_uri(uris: Any) -> str | None:
    if not isinstance(uris, list):
        return None
    from urllib.parse import unquote, urlparse
    paths: list[str] = []
    for u in uris:
        if not isinstance(u, str):
            continue
        if u.startswith("file://"):
            p = unquote(urlparse(u).path).rstrip("/")
            if p:
                paths.append(p)
        elif u.startswith("/"):
            paths.append(u.rstrip("/"))
    # Prefer actual workspace over internal T3 Code attachment folder
    real = [p for p in paths if "/.t3/userdata/attachments" not in p]
    return real[0] if real else (paths[0] if paths else None)


def _load_antigravity_workspaces() -> dict[str, str]:
    wmap: dict[str, str] = {}
    summary_patterns = [
        os.path.join(HOME, ".gemini", "antigravity", "conversation_summaries.db"),
        os.path.join(HOME, ".gemini", "antigravity-cli", "conversation_summaries.db"),
        os.path.join(HOME, ".t3", "userdata", "providers", "antigravity", "*", "antigravity-acp", "conversation_summaries.db"),
    ]
    for pat in summary_patterns:
        for db_path in glob.glob(pat):
            try:
                conn = sqlite_open_ro(db_path)
            except Exception:
                continue
            try:
                for cid, uris_json in conn.execute("SELECT conversation_id, workspace_uris FROM conversation_summaries"):
                    if not cid or not uris_json:
                        continue
                    try:
                        uris = json.loads(uris_json)
                    except Exception:
                        continue
                    proj = _pick_workspace_uri(uris)
                    if proj:
                        wmap[str(cid)] = proj
            except sqlite3.Error:
                pass
            finally:
                conn.close()

    # Fallback: CLI conversation_metadata.json
    meta_json = os.path.join(HOME, ".gemini", "antigravity-cli", "cache", "conversation_metadata.json")
    if os.path.exists(meta_json):
        try:
            with open(meta_json, "r", encoding="utf-8") as f:
                md = json.load(f)
            convs = md.get("conversations") if isinstance(md, dict) else None
            if isinstance(convs, dict):
                for cid, item in convs.items():
                    if cid in wmap or not isinstance(item, dict):
                        continue
                    summ = item.get("summary") or {}
                    proj = _pick_workspace_uri(summ.get("WorkspaceURIs"))
                    if proj:
                        wmap[str(cid)] = proj
        except Exception:
            pass
    return wmap


def _hydrate_parsed(tool: str, path: str, parsed: dict[str, Any], fallback_proj: str | None = None) -> bool:
    """Hydrate event metadata in-place. Returns True if project was newly backfilled."""
    evs = parsed.get("events")
    if not evs:
        return False
    backfilled = False
    file_proj = parsed.get("project") or fallback_proj
    if file_proj and not parsed.get("project"):
        parsed["project"] = file_proj
        backfilled = True

    first = evs[0]
    already_hydrated = "day" in first and "tool" in first and "session" in first
    if already_hydrated and (not file_proj or first.get("project")):
        return backfilled

    session_id = hashlib.md5(path.encode("utf-8")).hexdigest()[:10]
    for ev in evs:
        if not already_hydrated:
            ev["tool"] = tool
            if "day" not in ev or "hour" not in ev:
                dk, hr = local_day_hour(ev["ts"])
                ev["day"] = dk
                ev["hour"] = hr
            if not ev.get("session"):
                ev["session"] = session_id
        if not ev.get("project") and file_proj:
            ev["project"] = file_proj
            backfilled = True
    return backfilled


# ---------- Compressed Codex history ----------
#
# Immutable per-file records retain exact tokens, durations, projects, session
# identities, quota, and compaction IDs. Only the target days are expanded into
# event dictionaries. Keeping row data (rather than rounded summaries) preserves
# historical prices under new pricing rules, histograms, and end-of-range tape.
_CODEX_ARCHIVE_DAYS = 7
_CODEX_SYNC_ZSTD_MAX_FILES = 8
_CODEX_SYNC_ZSTD_MAX_BYTES = 256 * 1024
_CODEX_ARCHIVE_BATCH = 128
_CODEX_ARCHIVE_INVENTORY_TTL = 60.0
_CODEX_ARCHIVE_RETRY = 60.0
_CODEX_ARCHIVE_SCHEMA = 1


class _ArchivedCodex:
    def __init__(self, path, payload):
        self.project, self.quota, self.ordinary_ids, rows = payload
        self.count = len(rows)
        self.session = hashlib.md5(path.encode("utf-8")).hexdigest()[:10]
        self.days = defaultdict(list)
        self.compactions = []
        self.latest = 0.0
        for offset, row in enumerate(rows):
            ts, day, *columns = row
            self.days[day].append((offset, ts, *columns))
            if columns[-1] is not None:
                self.compactions.append((offset, columns[-1]))
            self.latest = max(ts, self.latest)

    @classmethod
    def pack(cls, parsed):
        return (
            parsed.get("project"), parsed.get("quota"), parsed.get("codex_ordinary_response_ids", ()),
            [(e["ts"], e["day"], e["hour"], e["model"], e["in"], e["out"], e["cr"], e["cw"],
              e.get("reason", 0), e.get("gen"), e.get("ttft"), e.get("codex_compaction_id"))
             for e in parsed.get("events", ())],
        )

    def event(self, day, row):
        _offset, ts, hour, model, inp, out, cr, cw, reason, gen, ttft, _rid = row
        event = {"ts": ts, "day": day, "hour": hour, "model": model, "in": inp, "out": out,
                 "cr": cr, "cw": cw, "reason": reason, "gen": gen, "ttft": ttft,
                 "tool": "codex", "project": self.project, "session": self.session}
        if _rid is not None:
            event["codex_compaction_id"] = _rid
        return event


class _CodexArchive:
    def __init__(self, cache_file, roots):
        self.cache_file = cache_file
        self.roots = roots
        self.db_path = os.path.join(os.path.dirname(cache_file), "codex_archive_v1.sqlite3")
        self.lock = threading.Lock()
        self.entries = {}        # published copy-on-write: path -> (file signature, compact record)
        self.wanted = {}
        self.retry = {}
        self.thread = None
        self.epoch = 0
        self.cancelled = False
        self.bypass_disk = set()
        self.compressed = {}
        self.discovered_at = -math.inf

    def close(self):
        with self.lock:
            self.cancelled = True
            self.wanted = {}

    def snapshot(self):
        with self.lock:
            return self.entries

    def wait(self):
        # One-shot CLI only. HTTP and SSE must always return the active data
        # without waiting for the worker, even on force/manual rebuild.
        while True:
            with self.lock:
                thread = self.thread
            if thread is None:
                return
            thread.join()

    def inventory(self, now, force):
        # Called by the foreground scan; throttled archive metadata discovery,
        # never opens or decompresses a single old archive.
        if not force and now - self.discovered_at < _CODEX_ARCHIVE_INVENTORY_TTL:
            return self.compressed
        out = {}
        for root in self.roots:
            for folder in ("sessions", "archived_sessions"):
                d = os.path.join(root, folder)
                paths = {}
                for p in sorted(glob.glob(os.path.join(d, "**", "*.jsonl.zst"), recursive=True)):
                    try:
                        st = os.stat(p)
                        paths[p] = (st.st_mtime, st.st_size)
                    except OSError:
                        pass
                out[d] = paths
        self.compressed = out
        self.discovered_at = now
        return out

    def request(self, wanted, rebuild):
        with self.lock:
            if rebuild:
                self.epoch += 1
                self.bypass_disk = set(wanted)
                self.entries = {}
                self.retry = {}
            if self.wanted != wanted:
                self.wanted = wanted
                removed = {p for p, (sig, _) in self.entries.items() if wanted.get(p) != sig}
                if removed:
                    self.entries = {p: entry for p, entry in self.entries.items() if p not in removed}
                self.retry = {p: info for p, info in self.retry.items() if wanted.get(p) == info[0]}
            if self.thread is None and any(
                p not in self.entries and self.retry.get(p, (None, 0))[1] <= time.monotonic()
                for p in wanted
            ):
                self.thread = threading.Thread(target=self._run, name="codex-archive-scan", daemon=True)
                self.thread.start()
            failed = len(self.retry)
            return self.entries, len(self.entries) + failed < len(wanted), failed

    def _open_db(self):
        db = None
        try:
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            db = sqlite3.connect(self.db_path, timeout=2)
            db.execute("CREATE TABLE IF NOT EXISTS archives (path TEXT PRIMARY KEY, signature TEXT NOT NULL,"
                       " revision TEXT NOT NULL, payload BLOB NOT NULL)")
            return db
        except (OSError, sqlite3.Error):
            if db is not None:
                db.close()
            return None

    def _read_or_parse(self, db, path, sig, bypass_disk):
        key = json.dumps(sig, separators=(",", ":"))
        revision = f"{_CODEX_ARCHIVE_SCHEMA}:{_CODEX_PARSER_REV}"
        if db is not None and not bypass_disk:
            try:
                row = db.execute("SELECT payload FROM archives WHERE path=? AND signature=? AND revision=?",
                                 (path, key, revision)).fetchone()
                if row is not None:
                    return _ArchivedCodex(path, json.loads(zlib.decompress(row[0]))), None
            except (sqlite3.Error, ValueError, TypeError, IndexError, zlib.error):
                pass  # Derived cache only; recover from the original archive.
        parsed = parse_codex_file(path)
        if parsed.get("zstd_retry"):
            return None, None
        try:
            st = os.stat(path)
            if (st.st_mtime, st.st_size) != sig:
                return None, None  # A concurrent app move/edit is rechecked on inventory refresh.
        except OSError:
            return None, None
        _hydrate_parsed("codex", path, parsed)
        payload = _ArchivedCodex.pack(parsed)
        stored = ((path, key, revision, zlib.compress(json.dumps(payload, separators=(",", ":"),
                                                                  ensure_ascii=False).encode(), 3))
                  if db is not None else None)
        return _ArchivedCodex(path, payload), stored

    def _run(self):
        db = self._open_db()
        try:
            while True:
                with self.lock:
                    now = time.monotonic()
                    work = []
                    if not self.cancelled:
                        for path, sig in self.wanted.items():
                            if path not in self.entries and self.retry.get(path, (None, 0))[1] <= now:
                                work.append((path, sig, path in self.bypass_disk))
                                if len(work) == _CODEX_ARCHIVE_BATCH:
                                    break
                    if not work:
                        self.thread = None
                        return
                    epoch = self.epoch
                records, writes, retries = {}, [], {}
                for path, sig, bypass in work:
                    try:
                        record, stored = self._read_or_parse(db, path, sig, bypass)
                    except (OSError, ValueError, TypeError, OverflowError):
                        record = stored = None
                    if record is None:
                        retries[path] = (sig, time.monotonic() + _CODEX_ARCHIVE_RETRY)
                    else:
                        records[path] = (sig, record)
                        if stored is not None:
                            writes.append(stored)
                if db is not None and writes:
                    try:
                        with db:
                            db.executemany("INSERT OR REPLACE INTO archives VALUES (?, ?, ?, ?)", writes)
                    except sqlite3.Error:
                        pass  # Continue serving in-memory results even in a read-only state dir.
                with self.lock:
                    if epoch != self.epoch or self.cancelled:
                        continue
                    active_retries = {p: pair for p, pair in retries.items() if self.wanted.get(p) == pair[0]}
                    entries = {p: pair for p, pair in records.items() if self.wanted.get(p) == pair[0]}
                    changed = bool(entries) or any(p not in self.retry for p in active_retries)
                    self.retry.update(active_retries)
                    for p in entries:
                        self.retry.pop(p, None)
                    if changed:
                        # Invalidate the foreground view even when the result
                        # was newly unavailable (e.g. no installed decoder).
                        self.entries = {**self.entries, **entries}
                        self.bypass_disk.difference_update(entries)
                if changed:
                    publish_telemetry()
                # Give waiting foreground requests a chance to run between archive batches.
                time.sleep(.015)
        finally:
            if db is not None:
                db.close()
            with self.lock:
                if self.thread is threading.current_thread():
                    self.thread = None


class _RangedEvents:
    def __init__(self, history_pending=False, history_unavailable=0):
        self.history_pending = history_pending
        self.history_unavailable = history_unavailable
        self.total_rows = self.supplement_rows = 0
        self.days = defaultdict(dict)    # day -> stable source ID -> ordered event rows
        self.archives = {}
        self.ordinary_ids = set()
        self.compactions = {}
        self.calibration = []
        self.agy_events = []
        self.droid_events = []

    def add_hot(self, index, events):
        self.total_rows += len(events)
        for offset, ev in enumerate(events):
            self.days[ev["day"]].setdefault(index, []).append((offset, ev))
            rid = ev.get("codex_compaction_id")
            if rid is not None:
                self.supplement_rows += 1
                self.compactions.setdefault(rid, (index, offset))
            if ev.get("native_cost_parts"):
                self.calibration.append(ev)
            if ev["tool"] == "antigravity":
                self.agy_events.append(ev)
            elif ev['tool'] == 'droid':
                self.droid_events.append(ev)

    def add_archive(self, index, archive):
        self.total_rows += archive.count
        self.supplement_rows += len(archive.compactions)
        self.archives[index] = archive
        self.ordinary_ids.update(archive.ordinary_ids)
        for offset, rid in archive.compactions:
            self.compactions.setdefault(rid, (index, offset))
        for day, rows in archive.days.items():
            self.days[day][index] = rows

    @staticmethod
    def _dated_rows(day, rows):
        return ((row[0], day, row) for row in rows)

    def seal(self):
        self.day_keys = sorted(self.days)
        self.count = self.total_rows - self.supplement_rows + len(self.compactions.keys() - self.ordinary_ids)

    def iter_range(self, minimum="0000-01-01", maximum="9999-12-31"):
        first = bisect_left(self.day_keys, minimum)
        after = bisect_right(self.day_keys, maximum)
        by_source = defaultdict(list)
        for day in self.day_keys[first:after]:
            for source, rows in self.days[day].items():
                by_source[source].append(self._dated_rows(day, rows))
        # Match the original source and within-file order even for interleaved
        # local days. This preserves stable ties and numerical addition order.
        for source in sorted(by_source):
            generators = by_source[source]
            rows = generators[0] if len(generators) == 1 else heapq.merge(*generators)
            archive = self.archives.get(source)
            for offset, day, row in rows:
                rid = row[-1] if archive else row[1].get("codex_compaction_id")
                if rid is not None and (rid in self.ordinary_ids or self.compactions[rid] != (source, offset)):
                    continue
                yield archive.event(day, row) if archive else row[1]

    def __iter__(self):
        return self.iter_range()

    def __len__(self):
        return self.count


def _iter_window(events, minimum, maximum):
    if isinstance(events, _RangedEvents):
        return events.iter_range(minimum, maximum)
    return (ev for ev in events if minimum <= ev["day"] <= maximum)


_ARCHIVE_OWNER = None
_MEM_SCAN_ARCHIVES = None


def scan_all_events(force: bool = False, rebuild: bool = False) -> tuple[_RangedEvents, dict[str, Any], float]:
    global _MEM_FILE_CACHE, _MEM_SCAN_TS, _MEM_SCAN_EVENTS, _MEM_SCAN_QUOTAS, _MEM_CODEX_ACTIVITY
    global _ARCHIVE_OWNER, _MEM_SCAN_ARCHIVES
    t0 = time.perf_counter()
    with _SCAN_LOCK:
        now_mono = time.monotonic()
        codex_home = os.environ.get("CODEX_HOME")
        roots = [os.path.join(HOME, ".codex")]
        if codex_home:
            roots.append(os.path.abspath(os.path.expanduser(codex_home)))
        unique_roots = {}
        for root in roots:
            unique_roots.setdefault(os.path.realpath(root), root)
        roots = tuple(unique_roots.values())
        if (_ARCHIVE_OWNER is None or _ARCHIVE_OWNER.cache_file != CACHE_FILE
                or _ARCHIVE_OWNER.roots != roots):
            if _ARCHIVE_OWNER is not None:
                _ARCHIVE_OWNER.close()
            _ARCHIVE_OWNER = _CodexArchive(CACHE_FILE, roots)
        archive = _ARCHIVE_OWNER
        incoming = archive.snapshot()
        if (
            not force
            and not rebuild
            and _MEM_SCAN_EVENTS is not None
            and incoming is _MEM_SCAN_ARCHIVES
            and (now_mono - _MEM_SCAN_TS) < _MEM_SCAN_TTL
        ):
            elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)
            return _MEM_SCAN_EVENTS, _MEM_SCAN_QUOTAS, elapsed_ms

        if rebuild:
            cache: dict[str, Any] = {"version": 1, "files": {}}
        elif _MEM_FILE_CACHE is not None:
            cache = _MEM_FILE_CACHE
        else:
            cache = _load_cache()
        fcache: dict[str, Any] = cache.setdefault("files", {})
        dirty = rebuild or (_MEM_FILE_CACHE is None and not os.path.exists(CACHE_FILE))

        # Discover local AI coding agent sources
        sources: list[tuple[str, str]] = []
        for p in discover_antigravity_dbs():
            sources.append(("antigravity", p))
        # Preserve the old traversal order: root, folder, plain then compressed.
        # Recent metadata is rechecked during survey, never by decoding history.
        compressed = archive.inventory(now_mono, force or rebuild)
        cutoff = time.time() - _CODEX_ARCHIVE_DAYS * 86400
        # A directory restored/copied today can contain years of compressed
        # history. Bound the foreground archive work even if all mtimes look new.
        candidates = ((sig[0], p) for paths in compressed.values() for p, sig in paths.items()
                      if sig[0] >= cutoff and sig[1] <= _CODEX_SYNC_ZSTD_MAX_BYTES)
        sync_compressed = {p for _, p in heapq.nlargest(_CODEX_SYNC_ZSTD_MAX_FILES, candidates)}
        old = {}
        for root in roots:
            for folder in ("sessions", "archived_sessions"):
                cx_dir = os.path.join(root, folder)
                sources.extend(("codex", p) for p in sorted(
                    glob.glob(os.path.join(cx_dir, "**", "*.jsonl"), recursive=True)))
                for p, sig in compressed.get(cx_dir, {}).items():
                    if p not in sync_compressed:
                        old[p] = sig
                    sources.append(("codex", p))
        incoming, history_pending, history_unavailable = archive.request(old, rebuild)
        sources.extend(discover_pi_sessions())
        devin_db = os.path.join(HOME, ".local", "share", "devin", "cli", "sessions.db")
        if os.path.exists(devin_db):
            sources.append(("devin", devin_db))
        qoder_proj = os.path.join(HOME, ".qoder", "projects")
        if os.path.isdir(qoder_proj):
            for p in glob.glob(os.path.join(qoder_proj, "**", "*.jsonl"), recursive=True):
                sources.append(("qoder", p))
        cop_state = os.path.join(HOME, ".copilot", "session-state")
        if os.path.isdir(cop_state):
            for p in glob.glob(os.path.join(cop_state, "**", "events.jsonl"), recursive=True):
                sources.append(("copilot", p))
        fac_sess = os.path.join(HOME, ".factory", "sessions")
        if os.path.isdir(fac_sess):
            for p in glob.glob(os.path.join(fac_sess, "**", "*.settings.json"), recursive=True):
                sources.append(("droid", p))
        grok_logs = os.path.join(HOME, ".grok", "logs")
        if os.path.isdir(grok_logs):
            for p in glob.glob(os.path.join(grok_logs, "*.jsonl")):
                sources.append(("grok", p))
        oc_db = os.path.join(HOME, ".local", "share", "opencode", "opencode.db")
        if os.path.exists(oc_db):
            sources.append(("opencode", oc_db))
        hermes_db = os.path.join(HOME, ".hermes", "state.db")
        if os.path.exists(hermes_db):
            sources.append(("hermes", hermes_db))
        for root in (
            os.path.join(HOME, ".claude", "projects"),
            os.path.join(HOME, ".config", "claude", "projects"),
        ):
            if os.path.isdir(root):
                for p in glob.glob(os.path.join(root, "**", "*.jsonl"), recursive=True):
                    sources.append(("claude", p))
        gemini_tmp = os.path.join(HOME, ".gemini", "tmp")
        if os.path.isdir(gemini_tmp):
            for pat in ("**/chats/*.json", "**/chats/*.jsonl"):
                for p in glob.glob(os.path.join(gemini_tmp, pat), recursive=True):
                    sources.append(("gemini", p))
        qwen_tmp = os.path.join(HOME, ".qwen", "tmp")
        if os.path.isdir(qwen_tmp):
            for pat in ("**/chats/*.json", "**/chats/*.jsonl"):
                for p in glob.glob(os.path.join(qwen_tmp, pat), recursive=True):
                    sources.append(("qwencode", p))
        qwen_proj = os.path.join(HOME, ".qwen", "projects")
        if os.path.isdir(qwen_proj):
            for p in glob.glob(os.path.join(qwen_proj, "**", "*.jsonl"), recursive=True):
                sources.append(("qwencode", p))
        kimi_sess = os.path.join(HOME, ".kimi", "sessions")
        if os.path.isdir(kimi_sess):
            for p in glob.glob(os.path.join(kimi_sess, "**", "wire.jsonl"), recursive=True):
                sources.append(("kimicode", p))
        mimo_db = os.path.join(HOME, ".local", "share", "mimocode", "mimocode.db")
        if os.path.exists(mimo_db):
            sources.append(("mimocode", mimo_db))
        for ext_id in ("saoudrizwan.claude-dev", "rooveterinaryinc.roo-cline"):
            ext_tasks = os.path.join(HOME, "Library", "Application Support", "Code", "User", "globalStorage", ext_id, "tasks")
            if os.path.isdir(ext_tasks):
                for p in glob.glob(os.path.join(ext_tasks, "*", "ui_messages.json")):
                    sources.append(("cline", p))

        global _CACHE_NEEDS_SAVE
        seen_keys: set[str] = set()
        valid_sources: list[tuple[str, str, str]] = []

        for tool, path in sources:
            key = f"{tool}:{path}"
            if tool == "codex" and path in old:
                if path in incoming:
                    valid_sources.append((tool, path, key))
                continue  # Neither read nor persist cold rows in the hot JSON.
            seen_keys.add(key)
            try:
                sig = _file_sig(path)
            except OSError:
                continue
            valid_sources.append((tool, path, key))

            cached = fcache.get(key)
            if cached and cached.get("sig") == sig:
                cached_quota = cached["data"].get("quota")
                # Old parsers could persist an empty quota dict. Reparse it
                # once; the new parser uses None when no usable quota exists.
                stale_codex = tool == "codex" and (
                    cached["data"].get("codex_parser_rev") != _CODEX_PARSER_REV
                    or cached["data"].get("zstd_retry")
                    or (isinstance(cached_quota, dict) and not _has_valid_quota(cached_quota))
                )
                stale_droid = tool == "droid" and cached["data"].get("droid_parser_rev") != _DROID_PARSER_REV
                if not stale_codex and not stale_droid:
                    continue

            if tool == "antigravity":
                parsed = parse_antigravity_db(path)
            elif tool == "codex":
                parsed = parse_codex_file(path)
            elif tool in ("omp", "pi"):
                # A Pi session's new cache key forces a one-time reparse;
                # pruning below removes its stale omp-prefixed cache entry.
                parsed = parse_pi_session_file(path)
            elif tool == "devin":
                parsed = parse_devin_db(path)
            elif tool == "qoder":
                parsed = parse_claude_file(path)
            elif tool == "copilot":
                parsed = parse_copilot_file(path)
            elif tool == "droid":
                parsed = parse_droid_settings(path)
            elif tool == "grok":
                parsed = parse_grok_log(path)
            elif tool in ("opencode", "mimocode"):
                parsed = parse_opencode_db(path)
            elif tool == "hermes":
                parsed = parse_hermes_db(path)
            elif tool == "claude":
                parsed = parse_claude_file(path)
            elif tool == "qwencode":
                parsed = parse_claude_file(path) if "/projects/" in path else parse_gemini_chat(path)
            elif tool == "kimicode":
                parsed = parse_kimi_wire(path)
            elif tool == "cline":
                parsed = parse_cline_ui_messages(path)
            else:
                parsed = parse_gemini_chat(path)
            _hydrate_parsed(tool, path, parsed)
            fcache[key] = {"sig": sig, "data": parsed}
            dirty = True

        # Prune deleted files from cache
        stale = [k for k in fcache if k not in seen_keys]
        for k in stale:
            del fcache[k]
            dirty = True

        _MEM_FILE_CACHE = cache

        # Fast path: zero file signatures changed -> reuse in-memory event list directly!
        if (not dirty and _MEM_SCAN_EVENTS is not None and incoming is _MEM_SCAN_ARCHIVES
                and _MEM_SCAN_EVENTS.history_pending == history_pending
                and _MEM_SCAN_EVENTS.history_unavailable == history_unavailable):
            _MEM_SCAN_TS = time.monotonic()
            _flush_cache_if_needed(force_disk=False)
            elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)
            return _MEM_SCAN_EVENTS, _MEM_SCAN_QUOTAS, elapsed_ms

        all_events = _RangedEvents(history_pending, history_unavailable)
        quotas: dict[str, Any] = {}
        agy_ws: dict[str, str] | None = None
        active_codex = codex_cli_home() if os.environ.get("TOOTOO_CODEX_QUOTA_AUTO") == "auto" else None
        codex_activity = 0.0
        for index, (tool, path, key) in enumerate(valid_sources):
            cold = incoming.get(path) if tool == "codex" else None
            if cold is not None:
                historical = cold[1]
                all_events.add_archive(index, historical)
                q = historical.quota
                if _has_valid_quota(q) and (
                    "codex" not in quotas or _codex_quota_key(q) > _codex_quota_key(quotas["codex"])
                ):
                    quotas["codex"] = q
                if active_codex is not None and historical.latest > codex_activity:
                    try:
                        if Path(path).resolve().is_relative_to(active_codex):
                            codex_activity = historical.latest
                    except (OSError, RuntimeError):
                        pass
                continue
            entry = fcache.get(key)
            if not entry:
                continue
            parsed = entry["data"]
            if tool == "codex":
                all_events.ordinary_ids.update(parsed.get("codex_ordinary_response_ids", ()))
            fb_proj: str | None = None
            if tool == "antigravity" and not parsed.get("project"):
                if agy_ws is None:
                    agy_ws = _load_antigravity_workspaces()
                cid = os.path.splitext(os.path.basename(path))[0]
                fb_proj = agy_ws.get(cid)
            if _hydrate_parsed(tool, path, parsed, fallback_proj=fb_proj):
                dirty = True
            q = parsed.get("quota")
            if _has_valid_quota(q):
                prev_q = quotas.get(tool)
                if prev_q is None or (
                    _codex_quota_key(q) > _codex_quota_key(prev_q)
                    if tool == "codex"
                    else q.get("ts", 0) > prev_q.get("ts", 0)
                ):
                    quotas[tool] = q
            evs = parsed.get("events")
            if evs:
                all_events.add_hot(index, evs)
                # Only the matching CLI profile can trigger an automatic probe.
                # Other profiles still retain their normal log-based telemetry.
                if tool == "codex" and active_codex is not None:
                    try:
                        if Path(path).resolve().is_relative_to(active_codex):
                            codex_activity = max(codex_activity, max(ev["ts"] for ev in evs))
                    except (OSError, RuntimeError):
                        pass

        if dirty:
            _CACHE_NEEDS_SAVE = True
            _flush_cache_if_needed(force_disk=rebuild)

        all_events.seal()
        _MEM_SCAN_EVENTS = all_events
        _MEM_SCAN_ARCHIVES = incoming
        _MEM_SCAN_QUOTAS = quotas
        _MEM_CODEX_ACTIVITY = codex_activity
        _MEM_SCAN_TS = time.monotonic()

        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)
        return all_events, quotas, elapsed_ms


# ---------- Antigravity Loopback Quota ----------

_AG_QUOTA_LOCK = threading.Lock()
_AG_QUOTA_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_AG_LAST_QUOTA: dict[str, Any] | None = None
_AG_SCAN_EMPTY_UNTIL = 0.0
_AG_QUOTA_TTL = 300.0
_AG_RETRY_TTL = 12.0
_AG_PERSIST_MAX_AGE = 7 * 86400.0
AG_QUOTA_CACHE_FILE = os.path.join(CACHE_DIR, "ag_quota_cache.json")
_AG_MAX_RESPONSE_BYTES = 2 * 1024 * 1024
_AG_QUOTA_WINDOWS = (
    ("gemini-5h", "antigravity:gemini_5h", "Gemini 5h", 300),
    ("gemini-weekly", "antigravity:gemini_7d", "Gemini 周", 10080),
    ("cg-5h", "antigravity:cg_5h", "C/G 5h", 300),
    ("cg-weekly", "antigravity:cg_7d", "C/G 周", 10080),
)


def _antigravity_extract_flag(command: str, flag: str) -> str | None:
    match = re.search(
        re.escape(flag) + r'''(?:=|\s+)(?:"([^"]*)"|'([^']*)'|([^\s]+))''',
        command, re.I,
    )
    return next((v for v in match.groups() if v is not None), None) if match else None


def _antigravity_process_infos(output: str) -> list[dict[str, Any]]:
    processes = []
    for line in output.splitlines():
        match = re.match(r"^\s*(\d+)\s+(.+)$", line)
        if not match:
            continue
        command = match.group(2)
        lower = command.lower()
        language_server = re.search(
            r'(^|[/\\])language(?:_|-)server(?:[_-][a-z0-9]+)*(?:\.exe)?"?(?:\s|$)', lower,
        )
        app_match = ("--app_data_dir" in lower and "antigravity" in lower) or any(
            marker in lower for marker in ("antigravity.app/", "/gemini.app/", "antigravity ide.app/")
        )
        cli = re.search(
            r'(^|[/\\])(antigravity-cli|antigravity_cli|agy)(?:\.exe)?"?(?:\s|[/\\]|$)', lower,
        )
        if not (language_server and app_match) and not cli:
            continue
        csrf = _antigravity_extract_flag(command, "--csrf_token") or ""
        if language_server and not csrf:
            continue
        raw_port = _antigravity_extract_flag(command, "--extension_server_port") or ""
        port = int(raw_port) if raw_port.isdecimal() else 0
        processes.append({
            "pid": int(match.group(1)),
            "kind": "ide" if language_server else "cli",
            "csrf_token": csrf,
            "extension_port": port if 0 < port <= 65535 else None,
            "extension_csrf_token": _antigravity_extract_flag(command, "--extension_server_csrf_token"),
        })
    return processes


def _antigravity_running_processes(force: bool = False) -> list[dict[str, Any]]:
    global _AG_SCAN_EMPTY_UNTIL
    if not force and time.monotonic() < _AG_SCAN_EMPTY_UNTIL:
        return []
    try:
        output = subprocess.run(
            ["/bin/ps", "-u", str(os.getuid()), "-o", "pid=,command="],
            capture_output=True, text=True, timeout=2, check=False,
        ).stdout
    except (OSError, subprocess.SubprocessError):
        output = ""
    processes = _antigravity_process_infos(output)
    _AG_SCAN_EMPTY_UNTIL = 0.0 if processes else time.monotonic() + _AG_RETRY_TTL
    return processes


def _antigravity_endpoints(process: dict[str, Any]) -> list[tuple[str, int, str, bool]]:
    endpoints = []
    if process["extension_port"]:
        for token in (process["extension_csrf_token"], process["csrf_token"]):
            if token is not None:
                endpoints.append(("http", process["extension_port"], token, True))
    lsof = next((path for path in ("/usr/sbin/lsof", "/usr/bin/lsof") if os.access(path, os.X_OK)), None)
    if lsof:
        try:
            result = subprocess.run(
                [lsof, "-nP", "-iTCP", "-sTCP:LISTEN", "-a", "-p", str(process["pid"])],
                capture_output=True, text=True, timeout=2, check=False,
            )
            ports = sorted({int(p) for p in re.findall(r":(\d+)\s+\(LISTEN\)", result.stdout)})
            endpoints.extend(("https", port, process["csrf_token"], process["kind"] != "cli") for port in ports)
        except (OSError, subprocess.SubprocessError):
            pass
    return list(dict.fromkeys(endpoints))


def _antigravity_request(endpoint: tuple[str, int, str, bool]) -> Any:
    scheme, port, csrf, requires_csrf = endpoint
    headers = {
        "Connect-Protocol-Version": "1",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if requires_csrf:
        headers["X-Codeium-Csrf-Token"] = csrf
    if scheme == "https":
        # AGY's loopback server uses a self-signed certificate; never follow redirects or proxies.
        connection = http.client.HTTPSConnection(
            "127.0.0.1", port, timeout=2, context=ssl._create_unverified_context(),
        )
    else:
        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
    try:
        connection.request(
            "POST", "/exa.language_server_pb.LanguageServerService/RetrieveUserQuotaSummary",
            body=b'{"forceRefresh":true}', headers=headers,
        )
        response = connection.getresponse()
        if response.status != 200:
            raise ValueError("AGY quota request failed")
        body = response.read(_AG_MAX_RESPONSE_BYTES + 1)
        if len(body) > _AG_MAX_RESPONSE_BYTES:
            raise ValueError("AGY quota response too large")
        return json.loads(body)
    finally:
        connection.close()


def _antigravity_number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return None
    try:
        number = float(value)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def _antigravity_remaining(bucket: Any) -> float | None:
    if not isinstance(bucket, dict):
        return None
    raw = bucket.get("remainingFraction")
    if raw is None and bucket.get("case") == "remainingFraction":
        raw = bucket.get("value")
    number = _antigravity_number(raw)
    return max(0.0, min(1.0, number)) if number is not None else None


def _normalize_antigravity_quota_summary(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        return {}
    root = payload.get("response") if isinstance(payload.get("response"), dict) else payload
    groups = root.get("groups")
    if not isinstance(groups, list):
        return {}
    matched = {}
    for group in groups:
        if not isinstance(group, dict):
            continue
        display = str(group.get("displayName") or "").lower()
        if "gemini" in display:
            family = "gemini"
        elif any(name in display for name in ("claude", "gpt", "third")):
            family = "cg"
        else:
            continue
        buckets = group.get("buckets")
        if not isinstance(buckets, list):
            continue
        for bucket in buckets:
            if not isinstance(bucket, dict) or bucket.get("disabled") is True:
                continue
            cadence = " ".join(str(bucket.get(key) or "") for key in
                               ("window", "bucketId", "displayName")).lower().replace("_", "-")
            if any(marker in cadence for marker in ("weekly", "week", "7d")):
                window = "weekly"
            elif any(marker in cadence for marker in ("5h", "5-hour", "five hour", "five-hour", "session")):
                window = "5h"
            else:
                continue
            matched.setdefault(f"{family}-{window}", bucket)
    rows = []
    for bucket_id, key, label, minutes in _AG_QUOTA_WINDOWS:
        bucket = matched.get(bucket_id, {})
        remaining = _antigravity_remaining(bucket)
        if remaining is None:
            remaining = _antigravity_remaining(bucket.get("remaining"))
        # Unknown windows must not become the frontend's default 100% remaining.
        if remaining is None:
            continue
        reset = bucket.get("resetTime")
        reset_ts = _antigravity_number(reset)
        if reset_ts is None:
            reset_ts = parse_iso_ts(reset)
        elif reset_ts > 100_000_000_000:
            reset_ts /= 1000.0
        rows.append({
            "key": key, "label": label,
            "used_percent": round((1.0 - remaining) * 100.0, 6),
            "window_minutes": minutes,
            "resets_at": int(reset_ts) if reset_ts is not None and reset_ts > 0 else None,
        })
    return {"source": "provider", "buckets": rows} if rows else {}


def _save_persisted_ag_quota(quota: dict[str, Any]) -> None:
    global _AG_LAST_QUOTA
    payload = {
        "fetched_at": int(time.time()),
        "source": quota.get("source", "provider"),
        "buckets": quota.get("buckets", []),
    }
    _AG_LAST_QUOTA = payload
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        tmp = AG_QUOTA_CACHE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.replace(tmp, AG_QUOTA_CACHE_FILE)
    except OSError:
        pass


def _load_persisted_ag_quota() -> dict[str, Any]:
    global _AG_LAST_QUOTA
    raw = _AG_LAST_QUOTA
    if raw is None:
        try:
            if os.path.exists(AG_QUOTA_CACHE_FILE):
                with open(AG_QUOTA_CACHE_FILE, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                if isinstance(loaded, dict) and isinstance(loaded.get("buckets"), list):
                    raw = loaded
                    _AG_LAST_QUOTA = raw
        except Exception:
            raw = None
    if not isinstance(raw, dict):
        return {}
    now = time.time()
    fetched_at = float(raw.get("fetched_at") or 0)
    if fetched_at <= 0 or (now - fetched_at) > _AG_PERSIST_MAX_AGE:
        return {}
    buckets = []
    for b in raw.get("buckets", []):
        if not isinstance(b, dict):
            continue
        item = dict(b)
        rst = item.get("resets_at")
        if isinstance(rst, (int, float)) and rst > 0 and now >= rst:
            # Quota window has already reset since last snapshot
            item["used_percent"] = 0.0
            item["resets_at"] = None
        buckets.append(item)
    return {"source": "provider_cached", "cached": True, "fetched_at": int(fetched_at), "buckets": buckets} if buckets else {}


def fetch_antigravity_quota(force: bool = False) -> dict[str, Any]:
    with _AG_QUOTA_LOCK:
        for process in _antigravity_running_processes(force=force):
            endpoints = _antigravity_endpoints(process)
            if not endpoints:
                continue
            marker = hashlib.sha256(json.dumps(
                [process["pid"], endpoints], separators=(",", ":"),
            ).encode()).hexdigest()
            cached = _AG_QUOTA_CACHE.get(marker)
            if not force and cached and time.monotonic() < cached[0]:
                if cached[1]:
                    return cached[1]
                continue
            for endpoint in endpoints:
                try:
                    quota = _normalize_antigravity_quota_summary(_antigravity_request(endpoint))
                except (OSError, http.client.HTTPException, ValueError):
                    continue
                if quota:
                    _AG_QUOTA_CACHE[marker] = (time.monotonic() + _AG_QUOTA_TTL, quota)
                    _save_persisted_ag_quota(quota)
                    return quota
            _AG_QUOTA_CACHE[marker] = (time.monotonic() + _AG_RETRY_TTL, {})
        # No running AGY process right now: keep showing last-known quota snapshot instead of disappearing
        return _load_persisted_ag_quota()


def load_local_quota_configs() -> dict[str, dict[str, Any]]:
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            lq = cfg.get("local_quotas")
            if isinstance(lq, dict):
                return lq
    except Exception:
        pass
    return {}


def _droid_credit_config(entry: Any) -> tuple[int, int | float] | None:
    if not isinstance(entry, dict) or entry.get("unit") != "credits":
        return None
    hours = _nonnegative_number(entry.get("window_hours"))
    limit = _nonnegative_number(entry.get("limit"))
    return (int(hours), limit) if hours in DROID_CREDIT_WINDOWS and limit > 0 else None


def save_local_quota_config(tool: str, entry: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    if entry is not None and entry.get("unit") == "credits":
        if tool != "droid" or _droid_credit_config(entry) is None:
            raise ValueError("Factory 积分上限必须大于 0，周期仅支持 5、24、168 或 720 小时")
    cfg: dict[str, Any] = {}
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            loaded = json.load(f)
            if isinstance(loaded, dict):
                cfg = loaded
    except Exception:
        pass
    lq = cfg.get("local_quotas")
    if not isinstance(lq, dict):
        lq = {}
    if entry is None:
        lq.pop(tool, None)
    else:
        lq[tool] = entry
    cfg["local_quotas"] = lq
    os.makedirs(CACHE_DIR, exist_ok=True)
    tmp = CONFIG_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    os.replace(tmp, CONFIG_FILE)
    return lq


def _droid_credit_budget(events, now: datetime) -> dict[str, Any] | None:
    config = _droid_credit_config(load_local_quota_configs().get("droid"))
    if config is None:
        return None
    hours, limit = config
    now_ts = now.timestamp()
    seconds = hours * 3600
    cutoff = now_ts - seconds
    # Droid is a hot-file source. Do not materialize unrelated Codex archives
    # to calculate the budget, and never restrict it to the selected range.
    candidates = events.droid_events if isinstance(events, _RangedEvents) else events
    used = 0
    oldest = None
    for ev in candidates:
        if ev["tool"] == "droid" and cutoff < ev["ts"] <= now_ts:
            credits = _nonnegative_number(ev.get("credits"))
            if credits:
                used += credits
                oldest = ev["ts"] if oldest is None else min(oldest, ev["ts"])
    percent = (used / limit) * 100
    return {
        "source": "local_custom", "is_custom": True, "unit": "credits",
        "window_hours": hours, "window_minutes": hours * 60,
        "used_value": used, "limit_value": limit,
        "used_percent": round(percent, 2) if math.isfinite(percent) else sys.float_info.max,
        "resets_at": oldest + seconds if oldest is not None else None,
    }


def _agy_pool(model: str) -> str:
    m = (model or "").lower()
    if "gemini" in m:
        return "gemini"
    if any(k in m for k in ("claude", "gpt", "opus", "sonnet", "haiku", "o1", "o3", "o4", "codex")):
        return "cg"
    return "gemini"


def _calc_rolling_bucket(
    tevs: list[dict[str, Any]],
    tool: str,
    win_hours: float,
    unit: str,
    custom_limit: float | None,
    base_floor: int,
    pricing: PricingEngine,
    now_ts: float,
) -> dict[str, Any]:
    win_sec = win_hours * 3600.0
    cutoff = now_ts - win_sec
    used_tokens = 0
    used_cost = 0.0
    used_reqs = 0
    oldest_in_win: float | None = None
    for ev in tevs:
        if ev["ts"] >= cutoff:
            if oldest_in_win is None:
                oldest_in_win = ev["ts"]
            used_tokens += ev["in"] + ev["out"] + ev["cr"] + ev["cw"] + ev.get("reason", 0)
            used_reqs += 1
            if unit == "cost":
                c, _ = pricing.cost_for(
                    ev["model"],
                    inp=ev["in"],
                    out=ev["out"],
                    cache_read=ev["cr"],
                    cache_write=ev.get("cw", 0),
                    reasoning=ev.get("reason", 0),
                    native_cost=ev.get("native_cost"),
                    bill_reasoning=(tool in ("antigravity", "gemini", "codex")),
                )
                used_cost += c

    peak_tokens = 0
    j = 0
    cur_tok = 0
    for ev in tevs:
        cur_tok += ev["in"] + ev["out"] + ev["cr"] + ev["cw"] + ev.get("reason", 0)
        ts_i = ev["ts"]
        while j < len(tevs) and tevs[j]["ts"] < ts_i - win_sec:
            ej = tevs[j]
            cur_tok -= ej["in"] + ej["out"] + ej["cr"] + ej["cw"] + ej.get("reason", 0)
            j += 1
        if cur_tok > peak_tokens:
            peak_tokens = cur_tok

    if custom_limit is not None:
        limit_val = custom_limit
        is_custom = True
    else:
        unit = "tokens"
        raw_target = max(base_floor, peak_tokens * 1.15, used_tokens * 1.1)
        step = 50_000_000 if raw_target < 1_000_000_000 else 100_000_000
        limit_val = float(math.ceil(raw_target / step) * step)
        is_custom = False

    used_val = used_cost if unit == "cost" else float(used_tokens)
    used_pct = round((used_val / limit_val) * 100.0, 1) if limit_val > 0 else 0.0
    resets_at = (oldest_in_win + win_sec) if oldest_in_win is not None else None
    return {
        "is_custom": is_custom,
        "unit": unit,
        "used_percent": used_pct,
        "window_minutes": int(round(win_hours * 60)),
        "resets_at": resets_at,
        "used_value": round(used_val, 2),
        "limit_value": round(limit_val, 2),
        "used_requests": used_reqs,
        "hist_peak_tokens": peak_tokens,
    }


def _parse_user_limit(ucfg: dict[str, Any]) -> tuple[str, float | None]:
    unit = ucfg.get("unit") if ucfg.get("unit") in ("tokens", "cost") else "tokens"
    custom_limit = ucfg.get("limit")
    try:
        custom_limit = float(custom_limit) if custom_limit is not None else None
        if custom_limit is not None and custom_limit <= 0:
            custom_limit = None
    except (TypeError, ValueError):
        custom_limit = None
    return unit, custom_limit


def _compute_local_rolling_quotas(
    events: list[dict[str, Any]],
    official_quotas: dict[str, Any],
    pricing: PricingEngine,
) -> dict[str, Any]:
    """Compute local rolling-window quota stats for tools without official log quotas."""
    now_ts = time.time()
    user_cfgs = load_local_quota_configs()

    by_tool: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for ev in events:
        t = ev["tool"]
        if t in official_quotas and official_quotas[t]:
            continue
        by_tool[t].append(ev)

    out: dict[str, Any] = {}
    for tool, tevs in by_tool.items():
        if not tevs:
            continue
        tevs.sort(key=lambda x: x["ts"])

        # Antigravity has 4 quota pools: Gemini (5h + Weekly) & Claude/GPT C/G (5h + Weekly)
        if tool == "antigravity":
            gem_evs = [e for e in tevs if _agy_pool(e["model"]) == "gemini"]
            cg_evs = [e for e in tevs if _agy_pool(e["model"]) == "cg"]
            specs = [
                ("antigravity:gemini_5h", "Gemini 5h", gem_evs, 5.0, 200_000_000),
                ("antigravity:gemini_7d", "Gemini 周", gem_evs, 168.0, 1_500_000_000),
                ("antigravity:cg_5h",     "C/G 5h",    cg_evs,  5.0, 100_000_000),
                ("antigravity:cg_7d",     "C/G 周",    cg_evs,  168.0, 500_000_000),
            ]
            buckets = []
            for cfg_key, lbl, subset, default_h, floor in specs:
                ucfg = user_cfgs.get(cfg_key) if isinstance(user_cfgs.get(cfg_key), dict) else {}
                win_h = float(ucfg.get("window_hours") or default_h)
                if win_h <= 0:
                    win_h = default_h
                unit, custom_limit = _parse_user_limit(ucfg)
                b = _calc_rolling_bucket(subset, tool, win_h, unit, custom_limit, floor, pricing, now_ts)
                b["key"] = cfg_key
                b["label"] = lbl
                buckets.append(b)
            out[tool] = {
                "source": "local",
                "is_custom": any(b["is_custom"] for b in buckets),
                "unit": buckets[0]["unit"],
                "primary": buckets[0],
                "secondary": buckets[1],
                "buckets": buckets,
            }
            continue

        ucfg = user_cfgs.get(tool) if isinstance(user_cfgs.get(tool), dict) else {}
        win_hours = float(ucfg.get("window_hours") or 5.0)
        if win_hours <= 0:
            win_hours = 5.0
        unit, custom_limit = _parse_user_limit(ucfg)
        base_floor = 150_000_000 if win_hours <= 6 else (300_000_000 if win_hours <= 24 else 1_000_000_000)
        b = _calc_rolling_bucket(tevs, tool, win_hours, unit, custom_limit, base_floor, pricing, now_ts)
        b["key"] = tool
        out[tool] = {
            "source": "local",
            "is_custom": b["is_custom"],
            "unit": b["unit"],
            "primary": b,
            "secondary": None,
        }
    return out


def _usable_codex_log(quota, now):
    if not isinstance(quota, dict):
        return None
    slots = {}
    for slot in ("primary", "secondary"):
        bucket = quota.get(slot)
        used = bucket.get("used_percent") if isinstance(bucket, dict) else None
        reset = bucket.get("resets_at") if isinstance(bucket, dict) else None
        if (type(used) in (int, float) and 0 <= used <= 100
                and (reset is None or (type(reset) in (int, float) and now < reset < math.inf))):
            slots[slot] = bucket
        else:
            slots[slot] = None
    return {**quota, **slots, "source": "session_log", "account_scope": "unknown"} if any(slots.values()) else None


def _codex_recent_activity(now):
    return now - 7 * 86400 <= _MEM_CODEX_ACTIVITY <= now + 300 and _MEM_CODEX_ACTIVITY > 0


def refresh_native_codex_quota(closing, gate, *, force=False):
    """Only the owned native backend scheduler can call this launch function."""
    _events, quotas, _elapsed = scan_all_events()
    now = time.time()
    enabled = _codex_recent_activity(now) and _usable_codex_log(quotas.get("codex"), now) is None
    with gate:
        if not closing.is_set():
            fetch_codex_cli_quota(enabled=enabled, force=force)


def select_codex_quota(log):
    """Telemetry/SSE only view an already available sample; never launch Codex."""
    now = time.time()
    log = _usable_codex_log(log, now)
    if log is not None:
        return log, {"state": "log"}
    if os.environ.get("TOOTOO_CODEX_QUOTA_AUTO") != "auto":
        return None, {"state": "disabled"}
    if not _codex_recent_activity(now):
        return None, {"state": "inactive"}
    result = peek_codex_app_quota()
    status = result["status"]
    # The startup scheduler has not opened a scope yet; this isn't operator Off.
    if status.get("state") == "disabled":
        status = {**status, "state": "loading"}
    return result["quota"], status


def select_antigravity_quota(events: list[dict[str, Any]], *, force: bool = False):
    """Select exactly one source. Do not mask a CLI failure with another account."""
    def legacy():
        quota = fetch_antigravity_quota(force=force) or None
        state = ("cached" if quota.get("cached") else "live") if quota else "unavailable"
        return {"quota": quota, "status": {"state": state, "selected_source": "desktop"}}
    mode = os.environ.get("TOOTOO_AGY_CLI")
    if mode == "off":
        return {"quota": None, "status": {"state": "disabled", "selected_source": "off"}}, True
    now = time.time()
    recently_used = any(ev.get("tool") == "antigravity" and now - 7 * 86400 <= ev.get("ts", 0) <= now + 300
                        for ev in events)
    if mode != "auto" or not recently_used:
        return legacy(), False
    result = fetch_agy_cli_quota(enabled=True, force=force)
    status = result["status"]
    if result.get("quota") is None and status.get("reason") in {"cli_missing", "cli_version"}:
        old = legacy()
        if old.get("quota"):
            return old, True
    quota = result.get("quota")
    if quota is not None:
        quota = {**quota, "buckets": [{**bucket, "key": "antigravity:" + bucket["id"] }
                                     for bucket in quota["buckets"]]}
    return {"quota": quota, "status": {**status, "selected_source": "cli"}}, True


def build_telemetry(
    range_key: str = "7d",
    tool_filter: str = "all",
    force: bool = False,
    rebuild: bool = False,
    *,
    wait_for_history: bool = False,
) -> dict[str, Any]:
    global _MEM_OBSERVED_TS, _MEM_OBSERVED_RATES
    trigger_background_sync_if_stale()
    events, quotas, scan_ms = scan_all_events(force=force, rebuild=rebuild)
    if wait_for_history and isinstance(events, _RangedEvents) and events.history_pending:
        archive = _ARCHIVE_OWNER
        if archive is not None:
            start = time.perf_counter()
            archive.wait()
            events, quotas, elapsed = scan_all_events()
            scan_ms = round(scan_ms + elapsed + (time.perf_counter() - start) * 1000, 1)
    real_observed = time.monotonic()
    # Provider quotas refresh independently of unchanged local log signatures.
    agy_events = events.agy_events if isinstance(events, _RangedEvents) else events
    ag_result, hide_log_quota = select_antigravity_quota(agy_events, force=force or rebuild)
    if hide_log_quota and "antigravity" in quotas:
        quotas = {key: value for key, value in quotas.items() if key != "antigravity"}
    ag_quota = ag_result["quota"]
    if ag_quota:
        quotas = {**quotas, "antigravity": ag_quota}
    codex_quota, codex_status = select_codex_quota(quotas.get("codex"))
    if codex_quota:
        quotas = {**quotas, "codex": codex_quota}
    elif "codex" in quotas:
        quotas = {key: value for key, value in quotas.items() if key != "codex"}

    # Dynamic 4-layer pricing (overrides -> locally calibrated native logs -> remote OpenRouter/LiteLLM -> fallback)
    if _MEM_OBSERVED_TS != _MEM_SCAN_TS or force:
        calibration = events.calibration if isinstance(events, _RangedEvents) else events
        _MEM_OBSERVED_RATES = calibrate_observed_rates(calibration)
        _MEM_OBSERVED_TS = _MEM_SCAN_TS
    pricing = PricingEngine(observed_rates=_MEM_OBSERVED_RATES)

    now = datetime.now().astimezone()
    today = now.date()
    max_day = "9999-12-31"
    if range_key == "today":
        min_day = today.isoformat()
        max_day = min_day
    elif range_key == "yesterday":
        yday = (today - timedelta(days=1)).isoformat()
        min_day = yday
        max_day = yday
    elif range_key == "week":
        min_day = (today - timedelta(days=today.weekday())).isoformat()
        max_day = today.isoformat()
    elif range_key == "last_week":
        prev_mon = today - timedelta(days=today.weekday() + 7)
        min_day = prev_mon.isoformat()
        max_day = (prev_mon + timedelta(days=6)).isoformat()
    elif range_key == "month":
        min_day = today.replace(day=1).isoformat()
        max_day = today.isoformat()
    elif range_key == "7d":
        min_day = (today - timedelta(days=6)).isoformat()
    elif range_key == "30d":
        min_day = (today - timedelta(days=29)).isoformat()
    else:
        min_day = "0000-01-01"

    # Activity-only provider: no synthetic Token events or accounting entries.
    grokbot = grokbot_activity(min_day, max_day, now=now.timestamp())
    if grokbot and grokbot["quota"] is not None:
        quotas = {**quotas, "grokbot": grokbot["quota"]}

    # Available tools summary (across selected time range, before tool_filter)
    tool_counts: dict[str, int] = defaultdict(int)
    tool_tokens_all: dict[str, int] = defaultdict(int)
    today_iso = today.isoformat()
    history_pending = isinstance(events, _RangedEvents) and events.history_pending
    today_tokens = provisional_compactions = 0
    for ev in _iter_window(events, today_iso, today_iso):
        tokens = ev["in"] + ev["out"] + ev["cr"] + ev["cw"] + ev.get("reason", 0)
        today_tokens += tokens
        if history_pending and ev.get("codex_compaction_id") is not None:
            provisional_compactions += tokens
    # Another copy of a Codex response may appear during backfill. Do not
    # permanently unlock XP on a provisional supplemental compaction.
    evo_peak_tokens, safe_effective = _observe_evo_telemetry(
        today_iso, today_tokens - provisional_compactions, real_observed)
    effective_today_tokens = safe_effective + provisional_compactions

    # Aggregations
    totals = {"in": 0, "out": 0, "cr": 0, "cw": 0, "reason": 0, "cost": 0.0, "requests": 0}
    sessions: set[str] = set()
    overall_perf = empty_perf()
    by_model: dict[str, dict[str, Any]] = {}
    by_tool: dict[str, dict[str, Any]] = {}
    by_day: dict[str, dict[str, Any]] = {}
    by_hour = [0] * 24
    by_hour_reqs = [0] * 24
    by_hour_cost = [0.0] * 24
    by_hour_perf = [empty_perf() for _ in range(24)]
    by_project: dict[str, dict[str, Any]] = {}

    droid_budget = _droid_credit_budget(events, now)
    droid_credits = 0
    # Keep only the latest 40 rows; large selected ranges never materialize an
    # event-dictionary list or sort every event just to render the call tape.
    recent_heap = []
    for sequence, ev in enumerate(_iter_window(events, min_day, max_day)):
        tool = ev["tool"]
        tot_tok = ev["in"] + ev["out"] + ev["cr"] + ev["cw"] + ev.get("reason", 0)
        if tool == "droid":
            droid_credits += _nonnegative_number(ev.get("credits"))
            # A credits-only snapshot is not a metered Token request. Do not
            # change global requests, models, fees, or progression.
            if not tot_tok:
                continue
        tool_counts[tool] += 1
        tool_tokens_all[tool] += tot_tok
        if tool_filter != "all" and tool != tool_filter:
            continue
        recent_entry = (ev["ts"], -sequence, ev)
        if len(recent_heap) < 40:
            heapq.heappush(recent_heap, recent_entry)
        elif recent_entry > recent_heap[0]:
            heapq.heapreplace(recent_heap, recent_entry)
        inp = ev["in"]
        out = ev["out"]
        cr = ev["cr"]
        cw = ev["cw"]
        reas = ev.get("reason", 0)
        model = ev["model"]
        tool = ev["tool"]
        dk = ev["day"]
        hr = ev["hour"]
        cost, price_src = pricing.cost_for(
            model,
            inp=inp,
            out=out,
            cache_read=cr,
            cache_write=cw,
            reasoning=reas,
            native_cost=ev.get("native_cost"),
            bill_reasoning=(tool in ("antigravity", "gemini", "codex")),
        )
        tot_tok = inp + out + cr + cw + reas

        totals["in"] += inp
        totals["out"] += out
        totals["cr"] += cr
        totals["cw"] += cw
        totals["reason"] += reas
        totals["cost"] += cost
        totals["requests"] += 1
        sessions.add(f"{tool}:{ev['session']}")

        by_hour[hr] += tot_tok
        by_hour_reqs[hr] += 1
        by_hour_cost[hr] += cost

        # Per-model
        mm = by_model.setdefault(model, {
            "model": model,
            "tools": set(),
            "in": 0, "out": 0, "cr": 0, "cw": 0, "reason": 0,
            "cost": 0.0, "requests": 0,
            "perf": {},
        })
        mm["tools"].add(tool)
        mm["in"] += inp
        mm["out"] += out
        mm["cr"] += cr
        mm["cw"] += cw
        mm["reason"] += reas
        mm["cost"] += cost
        mm["requests"] += 1

        # Per-tool
        tm = by_tool.setdefault(tool, {
            "tool": tool,
            "label": TOOL_META.get(tool, {}).get("label", tool),
            "short": TOOL_META.get(tool, {}).get("short", tool.upper()),
            "accent": TOOL_META.get(tool, {}).get("accent", "#6B7280"),
            "in": 0, "out": 0, "cr": 0, "cw": 0, "reason": 0,
            "cost": 0.0, "requests": 0, "sessions": set(),
            "perf": {},
        })
        tm["in"] += inp
        tm["out"] += out
        tm["cr"] += cr
        tm["cw"] += cw
        tm["reason"] += reas
        tm["cost"] += cost
        tm["requests"] += 1
        tm["sessions"].add(ev["session"])

        # Per-day
        dm = by_day.setdefault(dk, {
            "day": dk, "in": 0, "out": 0, "cr": 0, "cw": 0, "reason": 0,
            "cost": 0.0, "requests": 0, "perf": {},
        })
        dm["in"] += inp
        dm["out"] += out
        dm["cr"] += cr
        dm["cw"] += cw
        dm["reason"] += reas
        dm["cost"] += cost
        dm["requests"] += 1

        # Per-project
        proj = ev.get("project")
        if proj:
            pm = by_project.setdefault(proj, {
                "path": proj,
                "name": os.path.basename(proj.rstrip("/")) or proj,
                "tokens": 0, "cost": 0.0, "requests": 0,
                "sessions": set(), "tools": set(),
            })
            pm["tokens"] += tot_tok
            pm["cost"] += cost
            pm["requests"] += 1
            pm["sessions"].add(ev["session"])
            pm["tools"].add(tool)

        # Perf stats
        gen = ev.get("gen")
        ttft = ev.get("ttft")
        if gen is not None:
            tmp_perf: dict[str, dict[str, Any]] = {}
            if perf_add(tmp_perf, model, out + (reas if tool == "codex" else 0), gen, ttft):
                st = tmp_perf[model]
                perf_merge(overall_perf, st)
                perf_merge(mm["perf"].setdefault("_", empty_perf()), st)
                perf_merge(tm["perf"].setdefault("_", empty_perf()), st)
                perf_merge(dm["perf"].setdefault("_", empty_perf()), st)
                perf_merge(by_hour_perf[hr], st)

    # Finalize KPIs
    grand_tokens = totals["in"] + totals["out"] + totals["cr"] + totals["cw"] + totals["reason"]
    in_denom = totals["in"] + totals["cr"] + totals["cw"]
    cache_hit_pct = round(totals["cr"] / in_denom * 100.0, 1) if in_denom > 0 else 0.0
    avg_tps = round(overall_perf["o"] / overall_perf["g"], 1) if overall_perf["g"] > 0 else None
    ttft_p50 = histogram_percentile(overall_perf["th"], 0.50)
    ttft_p95 = histogram_percentile(overall_perf["th"], 0.95)

    # Build readable TTFT histogram bins aligned to 0–3s / 3–8s / >8s tiers
    ttft_edges = [
        (0.0, 1.0, "<1s"),
        (1.0, 2.0, "1–2s"),
        (2.0, 3.0, "2–3s"),
        (3.0, 5.0, "3–5s"),
        (5.0, 8.0, "5–8s"),
        (8.0, 16.0, "8–16s"),
        (16.0, 120.0, "16s+"),
    ]
    ttft_bins = [{"label": lbl, "count": 0} for _, _, lbl in ttft_edges]
    for b_str, cnt in overall_perf["th"].items():
        lo, hi = bucket_to_bounds(int(b_str))
        mid = (lo + hi) / 2.0
        for idx, (e_lo, e_hi, _) in enumerate(ttft_edges):
            if e_lo <= mid < e_hi or (idx == len(ttft_edges) - 1 and mid >= e_lo):
                ttft_bins[idx]["count"] += int(cnt)
                break

    # Finalize model leaderboard
    models_out = []
    for mm in by_model.values():
        p = mm["perf"].get("_")
        tps = round(p["o"] / p["g"], 1) if p and p["g"] > 0 else None
        p50 = histogram_percentile(p["th"], 0.50) if p else None
        p95 = histogram_percentile(p["th"], 0.95) if p else None
        m_tot = mm["in"] + mm["out"] + mm["cr"] + mm["cw"] + mm["reason"]
        m_in = mm["in"] + mm["cr"] + mm["cw"]
        m_rates, m_src = pricing.resolve(mm["model"])
        models_out.append({
            "model": mm["model"],
            "tools": sorted(mm["tools"]),
            "tokens": m_tot,
            "in": mm["in"],
            "out": mm["out"],
            "cr": mm["cr"],
            "cw": mm["cw"],
            "reason": mm["reason"],
            "cache_hit": round(mm["cr"] / m_in * 100.0, 1) if m_in > 0 else 0.0,
            "cost": round(mm["cost"], 4),
            "price_src": m_src,
            "unit_rates": m_rates,
            "requests": mm["requests"],
            "tps": tps,
            "ttft_p50": p50,
            "ttft_p95": p95,
            "perf_samples": p["n"] if p else 0,
        })
    models_out.sort(key=lambda x: x["tokens"], reverse=True)

    # A budget can still be edited/cleared in a range with no Droid activity.
    if ("droid" not in by_tool and tool_filter in ("all", "droid")
            and (droid_credits > 0 or droid_budget is not None)):
        meta = TOOL_META["droid"]
        by_tool["droid"] = {
            "tool": "droid", "label": meta["label"], "short": meta["short"], "accent": meta["accent"],
            "in": 0, "out": 0, "cr": 0, "cw": 0, "reason": 0,
            "cost": 0.0, "requests": 0, "sessions": set(), "perf": {},
        }

    # Only verified provider quotas or the explicitly configured Droid budget.
    tools_out = []
    for tm in by_tool.values():
        p = tm["perf"].get("_")
        tps = round(p["o"] / p["g"], 1) if p and p["g"] > 0 else None
        p50 = histogram_percentile(p["th"], 0.50) if p else None
        t_tot = tm["in"] + tm["out"] + tm["cr"] + tm["cw"] + tm["reason"]
        t_in = tm["in"] + tm["cr"] + tm["cw"]
        is_droid = tm["tool"] == "droid"
        q_info = droid_budget if is_droid else quotas.get(tm["tool"])
        tools_out.append({
            "tool": tm["tool"],
            "label": tm["label"],
            "short": tm["short"],
            "accent": tm["accent"],
            "tokens": t_tot,
            "in": tm["in"],
            "out": tm["out"],
            "cr": tm["cr"],
            "reason": tm["reason"],
            "cache_hit": round(tm["cr"] / t_in * 100.0, 1) if t_in > 0 else 0.0,
            "cost": round(tm["cost"], 4),
            "requests": tm["requests"],
            "sessions": len(tm["sessions"]),
            "tps": tps,
            "ttft_p50": p50,
            "perf_samples": p["n"] if p else 0,
            "quota": q_info,
            **({"credits": droid_credits} if is_droid else {}),
        })
    tools_out.sort(key=lambda x: x["tokens"], reverse=True)

    # Finalize daily series (fill gaps for 7d/30d)
    if range_key == "7d":
        day_keys = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    elif range_key == "30d":
        day_keys = [(today - timedelta(days=i)).isoformat() for i in range(29, -1, -1)]
    elif range_key == "today":
        day_keys = [today.isoformat()]
    else:
        day_keys = sorted(by_day.keys())[-45:]

    daily_out = []
    for dk in day_keys:
        dm = by_day.get(dk)
        if dm:
            p = dm["perf"].get("_")
            tps = round(p["o"] / p["g"], 1) if p and p["g"] > 0 else None
            p50 = histogram_percentile(p["th"], 0.50) if p else None
            daily_out.append({
                "day": dk,
                "tokens": dm["in"] + dm["out"] + dm["cr"] + dm["cw"] + dm["reason"],
                "out": dm["out"],
                "cost": round(dm["cost"], 4),
                "requests": dm["requests"],
                "tps": tps,
                "ttft_p50": p50,
            })
        else:
            daily_out.append({
                "day": dk, "tokens": 0, "out": 0, "cost": 0.0,
                "requests": 0, "tps": None, "ttft_p50": None,
            })

    # Recent individual calls tape (latest 40 calls with real output)
    recent_calls = []
    for _timestamp, _sequence, ev in sorted(recent_heap, reverse=True):
        out = ev["out"]
        gen = ev.get("gen")
        ttft = ev.get("ttft")
        tps = None
        perf_out = out + (ev.get("reason", 0) if ev["tool"] == "codex" else 0)
        if gen and gen > PERF_MIN_SECONDS and perf_out >= PERF_MIN_OUTPUT:
            v = perf_out / gen
            if v <= PERF_MAX_TPS:
                tps = round(v, 1)
        dt = datetime.fromtimestamp(ev["ts"]).astimezone()
        rc_cost, _ = pricing.cost_for(
            ev["model"],
            inp=ev["in"],
            out=out,
            cache_read=ev["cr"],
            cache_write=ev.get("cw", 0),
            reasoning=ev.get("reason", 0),
            native_cost=ev.get("native_cost"),
            bill_reasoning=(ev["tool"] in ("antigravity", "gemini", "codex")),
        )
        recent_calls.append({
            "time": dt.strftime("%m-%d %H:%M:%S"),
            "ts": ev["ts"],
            "tool": ev["tool"],
            "tool_short": TOOL_META.get(ev["tool"], {}).get("short", ev["tool"].upper()),
            "accent": TOOL_META.get(ev["tool"], {}).get("accent", "#6B7280"),
            "model": ev["model"],
            "in": ev["in"],
            "out": out,
            "cr": ev["cr"],
            "gen": round(gen, 2) if gen is not None else None,
            "ttft": round(ttft, 2) if ttft is not None else None,
            "tps": tps,
            "cost": round(rc_cost, 4),
        })

    # Projects
    projects_out = sorted(
        [
            {
                "name": p["name"],
                "path": p["path"],
                "tokens": p["tokens"],
                "cost": round(p["cost"], 4),
                "requests": p["requests"],
                "sessions": len(p["sessions"]),
                "tools": sorted(p["tools"]),
            }
            for p in by_project.values()
        ],
        key=lambda x: x["tokens"],
        reverse=True,
    )[:12]

    # Fastest model highlight (with >= 3 samples)
    eligible_fast = [m for m in models_out if m["tps"] is not None and m["perf_samples"] >= 3]
    if not eligible_fast:
        eligible_fast = [m for m in models_out if m["tps"] is not None]
    fastest_model = max(eligible_fast, key=lambda m: m["tps"]) if eligible_fast else None

    active_hours = sum(1 for v in by_hour if v > 0)
    peak_hour = max(range(24), key=lambda h: by_hour[h]) if any(by_hour) else None

    available_tools = [
        {
            "tool": t,
            "label": TOOL_META.get(t, {}).get("label", t),
            "short": TOOL_META.get(t, {}).get("short", t.upper()),
            "accent": TOOL_META.get(t, {}).get("accent", "#6B7280"),
            "requests": tool_counts[t],
            "tokens": tool_tokens_all[t],
        }
        for t in TOOL_META.keys()
        if tool_counts[t] > 0 or (t == "droid" and (droid_credits > 0 or droid_budget is not None))
    ]

    return {
        "generated_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "scan_ms": scan_ms,
        "range": range_key,
        "tool_filter": tool_filter,
        "history_pending": history_pending,
        "history_unavailable": events.history_unavailable if isinstance(events, _RangedEvents) else 0,
        "today_tokens": today_tokens,
        "effective_today_tokens": effective_today_tokens,
        "evo_peak_tokens": evo_peak_tokens,
        "pricing_status": pricing.status(),
        "available_tools": available_tools,
        "kpi": {
            "tokens": grand_tokens,
            "in": totals["in"],
            "out": totals["out"],
            "cr": totals["cr"],
            "cw": totals["cw"],
            "reason": totals["reason"],
            "cache_hit": cache_hit_pct,
            "cost": round(totals["cost"], 2),
            "requests": totals["requests"],
            "sessions": len(sessions),
            "tps": avg_tps,
            "ttft_p50": ttft_p50,
            "ttft_p95": ttft_p95,
            "perf_samples": overall_perf["n"],
            "fastest_model": (
                {"model": fastest_model["model"], "tps": fastest_model["tps"]}
                if fastest_model
                else None
            ),
            "active_hours": active_hours,
            "peak_hour": peak_hour,
        },
        "ttft_histogram": ttft_bins,
        "daily": daily_out,
        "hourly": [
            {
                "hour": h,
                "tokens": by_hour[h],
                "requests": by_hour_reqs[h],
                "cost": round(by_hour_cost[h], 4),
                "tps": round(by_hour_perf[h]["o"] / by_hour_perf[h]["g"], 1) if by_hour_perf[h]["g"] > 0 else None,
                "ttft_p50": histogram_percentile(by_hour_perf[h]["th"], 0.50),
            }
            for h in range(24)
        ],
        "quotas": quotas,
        "grokbot": grokbot,
        "quota_status": {"antigravity": ag_result["status"], "codex": codex_status},
        "tools": tools_out,
        "models": models_out,
        "projects": projects_out,
        "recent_calls": recent_calls,
    }


if __name__ == "__main__":
    data = build_telemetry("7d", "all", wait_for_history=True)
    print(json.dumps({"scan_ms": data["scan_ms"], "kpi": data["kpi"], "tools": data["tools"]}, indent=2, ensure_ascii=False))
