#!/usr/bin/env python3
"""
tootoo Dynamic Pricing Engine — Zero-release model pricing & cost calibration.

4-layer waterfall (highest priority first):
  1. User local overrides     (~/.tootoo/pricing_overrides.json)
  2. Live remote catalogs     (~/.tootoo/pricing_remote.json, auto-synced every 24h
                               from OpenRouter API + LiteLLM catalog + optional custom URL)
  3. Local observed rates     (derived automatically from local logs that carry native
                               provider cost breakdowns, e.g. OMP / OpenCode)
  4. Built-in family fallback (offline tier-aware defaults: flash/mini/pro/opus)

All rates are normalized to USD per 1,000,000 tokens:
  {"in": float, "out": float, "cr": float, "cw": float}
"""

from __future__ import annotations

import json
import os
import re
import threading
import time
import urllib.request
from typing import Any

HOME = os.path.expanduser("~")
TOOTOO_DIR = os.path.expanduser(os.environ.get("TOOTOO_HOME") or "~/.tootoo")
REMOTE_CACHE_FILE = os.path.join(TOOTOO_DIR, "pricing_remote.json")
OVERRIDES_FILE = os.path.join(TOOTOO_DIR, "pricing_overrides.json")
CONFIG_FILE = os.path.join(TOOTOO_DIR, "config.json")

REMOTE_TTL_SECONDS = 24 * 3600
OPENROUTER_URL = "https://openrouter.ai/api/v1/models"
LITELLM_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"

# Offline fallback tiers (USD / 1M tokens: in, out, cache_read, cache_write)
BUILTIN_TIERS: list[tuple[str, dict[str, float]]] = [
    # Anthropic
    ("claude-opus-5",      {"in": 4.0,  "out": 20.0, "cr": 0.20,  "cw": 8.0}),
    ("claude-sonnet-5",    {"in": 3.0,  "out": 15.0, "cr": 0.30,  "cw": 3.75}),
    ("claude-haiku-5",     {"in": 0.8,  "out": 4.0,  "cr": 0.08,  "cw": 1.0}),
    ("claude-opus-4",      {"in": 15.0, "out": 75.0, "cr": 1.50,  "cw": 18.75}),
    ("claude-sonnet-4",    {"in": 3.0,  "out": 15.0, "cr": 0.30,  "cw": 3.75}),
    ("claude-haiku-4",     {"in": 0.8,  "out": 4.0,  "cr": 0.08,  "cw": 1.0}),
    ("claude-3-7-sonnet",  {"in": 3.0,  "out": 15.0, "cr": 0.30,  "cw": 3.75}),
    ("claude-3-5-sonnet",  {"in": 3.0,  "out": 15.0, "cr": 0.30,  "cw": 3.75}),
    ("claude-3-5-haiku",   {"in": 0.8,  "out": 4.0,  "cr": 0.08,  "cw": 1.0}),
    # Google Gemini / Antigravity
    ("gemini-flash-lite",  {"in": 0.10, "out": 0.40, "cr": 0.01,  "cw": 0.0}),
    ("gemini-2.5-flash-lite", {"in": 0.10, "out": 0.40, "cr": 0.01, "cw": 0.0}),
    ("gemini-flash",       {"in": 0.30, "out": 2.50, "cr": 0.03,  "cw": 0.0}),
    ("gemini-2.5-flash",   {"in": 0.30, "out": 2.50, "cr": 0.03,  "cw": 0.0}),
    ("gemini-2.0-flash",   {"in": 0.10, "out": 0.40, "cr": 0.01,  "cw": 0.0}),
    ("gemini-4",           {"in": 1.25, "out": 10.0, "cr": 0.125, "cw": 0.0}),
    ("gemini-3.5-pro",     {"in": 1.25, "out": 10.0, "cr": 0.125, "cw": 0.0}),
    ("gemini-3-pro",       {"in": 1.25, "out": 10.0, "cr": 0.125, "cw": 0.0}),
    ("gemini-2.5-pro",     {"in": 1.25, "out": 10.0, "cr": 0.125, "cw": 0.0}),
    ("gemini-pro",         {"in": 1.25, "out": 10.0, "cr": 0.125, "cw": 0.0}),
    ("gemini",             {"in": 0.50, "out": 3.00, "cr": 0.05,  "cw": 0.0}),
    # OpenAI / Codex
    ("gpt-6",              {"in": 2.00, "out": 12.0, "cr": 0.20,  "cw": 0.0}),
    ("gpt-5-nano",         {"in": 0.05, "out": 0.40, "cr": 0.005, "cw": 0.0}),
    ("gpt-5-mini",         {"in": 0.25, "out": 2.00, "cr": 0.025, "cw": 0.0}),
    ("gpt-5",              {"in": 1.25, "out": 10.0, "cr": 0.125, "cw": 0.0}),
    ("codex-auto-review",  {"in": 1.25, "out": 10.0, "cr": 0.125, "cw": 0.0}),
    ("codex",              {"in": 1.25, "out": 10.0, "cr": 0.125, "cw": 0.0}),
    ("o4-mini",            {"in": 1.10, "out": 4.40, "cr": 0.275, "cw": 0.0}),
    ("o3-mini",            {"in": 1.10, "out": 4.40, "cr": 0.275, "cw": 0.0}),
    ("o3",                 {"in": 2.00, "out": 8.00, "cr": 0.50,  "cw": 0.0}),
    ("gpt-4.1-mini",       {"in": 0.40, "out": 1.60, "cr": 0.10,  "cw": 0.0}),
    ("gpt-4.1",            {"in": 2.00, "out": 8.00, "cr": 0.50,  "cw": 0.0}),
    ("gpt-4o-mini",        {"in": 0.15, "out": 0.60, "cr": 0.075, "cw": 0.0}),
    ("gpt-4o",             {"in": 2.50, "out": 10.0, "cr": 1.25,  "cw": 0.0}),
    # Other major families
    ("deepseek-r1",        {"in": 0.55, "out": 2.19, "cr": 0.14,  "cw": 0.0}),
    ("deepseek",           {"in": 0.27, "out": 1.10, "cr": 0.07,  "cw": 0.0}),
    ("grok",               {"in": 0.50, "out": 2.00, "cr": 0.05,  "cw": 0.0}),
    ("qwen",               {"in": 0.40, "out": 1.20, "cr": 0.10,  "cw": 0.0}),
    ("kimi",               {"in": 0.60, "out": 2.50, "cr": 0.15,  "cw": 0.0}),
    ("minimax",            {"in": 0.30, "out": 1.20, "cr": 0.05,  "cw": 0.0}),
    ("glm",                {"in": 0.50, "out": 2.00, "cr": 0.10,  "cw": 0.0}),
]

_SUFFIX_RE = re.compile(
    r"-(?:xhigh|high|medium|low|minimal|thinking|reasoning|preview|latest|free|agy|contributor|orchestrator|worker|20\d{6})$"
)

_refresh_lock = threading.Lock()
_refresh_in_flight = False


def normalize_model_key(model: str | None) -> str:
    if not model or not isinstance(model, str):
        return "unknown"
    m = model.strip().lower()
    if "/" in m:
        m = m.split("/")[-1]
    if ":" in m:
        m = m.split(":")[0]
    return m or "unknown"


def model_lookup_candidates(model: str | None) -> list[str]:
    base = normalize_model_key(model)
    cands = [base]
    cur = base
    for _ in range(4):
        nxt = _SUFFIX_RE.sub("", cur)
        if nxt == cur or not nxt:
            break
        cands.append(nxt)
        cur = nxt
    # Also try dot <-> dash swaps for Claude/Gemini/GPT versions (e.g. claude-4.5 <-> claude-4-5)
    extra = []
    for c in cands:
        swapped = re.sub(r"(\d)-(\d)", r"\1.\2", c)
        if swapped not in cands and swapped not in extra:
            extra.append(swapped)
        swapped2 = re.sub(r"(\d)\.(\d)", r"\1-\2", c)
        if swapped2 not in cands and swapped2 not in extra:
            extra.append(swapped2)
    return cands + extra


def _clean_rate_dict(obj: Any) -> dict[str, float] | None:
    if not isinstance(obj, dict):
        return None
    try:
        r_in = float(obj.get("in", obj.get("input", 0.0)) or 0.0)
        r_out = float(obj.get("out", obj.get("output", 0.0)) or 0.0)
        r_cr = float(obj.get("cr", obj.get("cache_read", r_in * 0.1)) or 0.0)
        r_cw = float(obj.get("cw", obj.get("cache_write", 0.0)) or 0.0)
        if r_in < 0 or r_out < 0 or r_in > 500 or r_out > 2000:
            return None
        if r_in == 0 and r_out == 0:
            return None
        return {
            "in": round(r_in, 6),
            "out": round(r_out, 6),
            "cr": round(max(r_cr, 0.0), 6),
            "cw": round(max(r_cw, 0.0), 6),
        }
    except (TypeError, ValueError):
        return None


def _http_get_json(url: str, timeout: float = 8.0) -> Any:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "tootoo-telemetry/0.2 (+local)"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))


def _fetch_openrouter_models() -> dict[str, dict[str, float]]:
    data = _http_get_json(OPENROUTER_URL, timeout=8.0)
    models: dict[str, dict[str, float]] = {}
    for item in data.get("data") or []:
        if not isinstance(item, dict):
            continue
        mid = item.get("id")
        pr = item.get("pricing")
        if not mid or not isinstance(pr, dict):
            continue
        try:
            p_in = float(pr.get("prompt") or 0) * 1e6
            p_out = float(pr.get("completion") or 0) * 1e6
            p_cr = float(pr.get("input_cache_read") or 0) * 1e6 if pr.get("input_cache_read") is not None else p_in * 0.1
            p_cw = float(pr.get("input_cache_write") or 0) * 1e6 if pr.get("input_cache_write") is not None else 0.0
        except (TypeError, ValueError):
            continue
        rate = _clean_rate_dict({"in": p_in, "out": p_out, "cr": p_cr, "cw": p_cw})
        if rate:
            models[normalize_model_key(mid)] = rate
    return models


def _fetch_litellm_models() -> dict[str, dict[str, float]]:
    data = _http_get_json(LITELLM_URL, timeout=10.0)
    models: dict[str, dict[str, float]] = {}
    if not isinstance(data, dict):
        return models
    for mid, spec in data.items():
        if not isinstance(spec, dict) or mid == "sample_spec":
            continue
        if spec.get("mode") not in (None, "chat", "responses", "completion"):
            continue
        try:
            p_in = float(spec.get("input_cost_per_token") or 0) * 1e6
            p_out = float(spec.get("output_cost_per_token") or 0) * 1e6
            p_cr_raw = spec.get("cache_read_input_token_cost")
            p_cw_raw = spec.get("cache_creation_input_token_cost")
            p_cr = float(p_cr_raw) * 1e6 if p_cr_raw is not None else p_in * 0.1
            p_cw = float(p_cw_raw) * 1e6 if p_cw_raw is not None else 0.0
        except (TypeError, ValueError):
            continue
        rate = _clean_rate_dict({"in": p_in, "out": p_out, "cr": p_cr, "cw": p_cw})
        if rate:
            key = normalize_model_key(mid)
            # Prefer entries with explicit cache pricing over generic ones
            if key not in models or p_cr_raw is not None:
                models[key] = rate
    return models


def _fetch_custom_url() -> dict[str, dict[str, float]]:
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        url = cfg.get("pricing_url")
    except Exception:
        return {}
    if not isinstance(url, str) or not url.startswith(("http://", "https://")):
        return {}
    data = _http_get_json(url, timeout=8.0)
    src = data.get("models") if isinstance(data, dict) and isinstance(data.get("models"), dict) else data
    out: dict[str, dict[str, float]] = {}
    if isinstance(src, dict):
        for k, v in src.items():
            r = _clean_rate_dict(v)
            if r:
                out[normalize_model_key(k)] = r
    return out


def sync_remote_pricing(force: bool = False) -> dict[str, Any]:
    """Synchronously fetch latest remote catalogs and persist to ~/.tootoo/pricing_remote.json."""
    existing = load_remote_cache()
    now = time.time()
    if not force and existing.get("updated_at") and (now - float(existing["updated_at"])) < REMOTE_TTL_SECONDS:
        return existing

    merged: dict[str, dict[str, float]] = {}
    sources_ok: list[str] = []

    # 1. LiteLLM (broadest catalog with cache write pricing)
    try:
        ll = _fetch_litellm_models()
        if ll:
            merged.update(ll)
            sources_ok.append(f"litellm:{len(ll)}")
    except Exception:
        pass

    # 2. OpenRouter (real-time API, overlays latest launches)
    try:
        or_m = _fetch_openrouter_models()
        if or_m:
            merged.update(or_m)
            sources_ok.append(f"openrouter:{len(or_m)}")
    except Exception:
        pass

    # 3. Optional team/user custom pricing URL
    try:
        custom = _fetch_custom_url()
        if custom:
            merged.update(custom)
            sources_ok.append(f"custom:{len(custom)}")
    except Exception:
        pass

    if not merged:
        return existing

    payload = {
        "version": 1,
        "updated_at": round(now, 1),
        "sources": sources_ok,
        "count": len(merged),
        "models": merged,
    }
    try:
        os.makedirs(TOOTOO_DIR, exist_ok=True)
        tmp = REMOTE_CACHE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(payload, f, separators=(",", ":"))
        os.replace(tmp, REMOTE_CACHE_FILE)
    except OSError:
        pass
    return payload


def trigger_background_sync_if_stale() -> None:
    global _refresh_in_flight
    existing = load_remote_cache()
    now = time.time()
    if existing.get("updated_at") and (now - float(existing["updated_at"])) < REMOTE_TTL_SECONDS:
        return
    with _refresh_lock:
        if _refresh_in_flight:
            return
        _refresh_in_flight = True

    def _run():
        global _refresh_in_flight
        try:
            sync_remote_pricing(force=True)
        finally:
            with _refresh_lock:
                _refresh_in_flight = False

    threading.Thread(target=_run, daemon=True).start()


def load_remote_cache() -> dict[str, Any]:
    try:
        with open(REMOTE_CACHE_FILE, "r", encoding="utf-8") as f:
            d = json.load(f)
            if isinstance(d, dict) and isinstance(d.get("models"), dict):
                return d
    except Exception:
        pass
    return {"version": 1, "updated_at": None, "sources": [], "count": 0, "models": {}}


def ensure_overrides_template() -> None:
    if os.path.exists(OVERRIDES_FILE):
        return
    try:
        os.makedirs(TOOTOO_DIR, exist_ok=True)
        template = {
            "_comment": "自定义模型单价覆盖 (单位: USD / 1M tokens)，修改后无需重启立即生效。字段: in, out, cr(cache_read), cw(cache_write)",
            "models": {}
        }
        with open(OVERRIDES_FILE, "w", encoding="utf-8") as f:
            json.dump(template, f, indent=2, ensure_ascii=False)
    except OSError:
        pass


def load_overrides() -> dict[str, dict[str, float]]:
    ensure_overrides_template()
    out: dict[str, dict[str, float]] = {}
    try:
        with open(OVERRIDES_FILE, "r", encoding="utf-8") as f:
            d = json.load(f)
        src = d.get("models") if isinstance(d, dict) and isinstance(d.get("models"), dict) else d
        if isinstance(src, dict):
            for k, v in src.items():
                if k.startswith("_"):
                    continue
                r = _clean_rate_dict(v)
                if r:
                    out[normalize_model_key(k)] = r
    except Exception:
        pass
    return out


class PricingEngine:
    """Resolves model rates using the 4-layer waterfall + auto-calibrated native log rates."""

    def __init__(self, observed_rates: dict[str, dict[str, float]] | None = None):
        self.overrides = load_overrides()
        self.remote_meta = load_remote_cache()
        self.remote: dict[str, dict[str, float]] = self.remote_meta.get("models") or {}
        self.observed: dict[str, dict[str, float]] = observed_rates or {}
        self._cache: dict[str, tuple[dict[str, float], str]] = {}

    def resolve(self, model: str | None) -> tuple[dict[str, float], str]:
        key = normalize_model_key(model)
        if key in self._cache:
            return self._cache[key]

        cands = model_lookup_candidates(key)

        # 1. User overrides
        for c in cands:
            if c in self.overrides:
                res = (self.overrides[c], "override")
                self._cache[key] = res
                return res

        # 2. Locally observed exact provider rates (self-calibrated from OMP / native logs)
        for c in cands:
            if c in self.observed:
                res = (self.observed[c], "learned")
                self._cache[key] = res
                return res

        # 3. Live remote catalog (OpenRouter + LiteLLM + custom URL)
        for c in cands:
            if c in self.remote:
                res = (self.remote[c], "live")
                self._cache[key] = res
                return res

        # 4. Built-in family fallback
        for prefix, rates in BUILTIN_TIERS:
            if prefix in key:
                res = (rates, "fallback")
                self._cache[key] = res
                return res

        # Final conservative fallback
        res = ({"in": 1.0, "out": 5.0, "cr": 0.1, "cw": 0.0}, "fallback")
        self._cache[key] = res
        return res

    def cost_for(
        self,
        model: str | None,
        inp: int = 0,
        out: int = 0,
        cache_read: int = 0,
        cache_write: int = 0,
        reasoning: int = 0,
        native_cost: float | None = None,
        bill_reasoning: bool = True,
    ) -> tuple[float, str]:
        if isinstance(native_cost, (int, float)) and native_cost > 0:
            return float(native_cost), "native"
        rates, src = self.resolve(model)
        bill_out = max(out, 0) + (max(reasoning, 0) if bill_reasoning else 0)
        usd = (
            max(inp, 0) * rates["in"]
            + bill_out * rates["out"]
            + max(cache_read, 0) * rates["cr"]
            + max(cache_write, 0) * rates["cw"]
        ) / 1_000_000.0
        return usd, src

    def status(self) -> dict[str, Any]:
        return {
            "remote_count": self.remote_meta.get("count", 0),
            "remote_updated_at": self.remote_meta.get("updated_at"),
            "remote_sources": self.remote_meta.get("sources") or [],
            "overrides_count": len(self.overrides),
            "learned_count": len(self.observed),
            "overrides_path": OVERRIDES_FILE,
        }


def calibrate_observed_rates(events: list[dict[str, Any]]) -> dict[str, dict[str, float]]:
    """
    Learn real per-1M token rates from events that carry exact component-level native costs
    (e.g. OMP's usage.cost.{input, output, cacheRead, cacheWrite}).
    """
    acc: dict[str, dict[str, list[float]]] = {}
    for ev in events:
        nc = ev.get("native_cost_parts")
        if not isinstance(nc, dict):
            continue
        key = normalize_model_key(ev.get("model"))
        bucket = acc.setdefault(key, {"in": [0.0, 0.0], "out": [0.0, 0.0], "cr": [0.0, 0.0], "cw": [0.0, 0.0]})
        for field, tok_key in (("in", "in"), ("out", "out"), ("cr", "cr"), ("cw", "cw")):
            t = int(ev.get(tok_key) or 0)
            c = float(nc.get(field) or 0.0)
            if t > 0 and c > 0:
                bucket[field][0] += c
                bucket[field][1] += t

    learned: dict[str, dict[str, float]] = {}
    for key, b in acc.items():
        r_in = (b["in"][0] / b["in"][1] * 1e6) if b["in"][1] >= 100 else 0.0
        r_out = (b["out"][0] / b["out"][1] * 1e6) if b["out"][1] >= 500 else 0.0
        r_cr = (b["cr"][0] / b["cr"][1] * 1e6) if b["cr"][1] >= 1000 else (r_in * 0.1)
        r_cw = (b["cw"][0] / b["cw"][1] * 1e6) if b["cw"][1] >= 1000 else 0.0
        if r_in > 0 and r_out > 0:
            clean = _clean_rate_dict({"in": r_in, "out": r_out, "cr": r_cr, "cw": r_cw})
            if clean:
                learned[key] = clean
    return learned


if __name__ == "__main__":
    res = sync_remote_pricing(force=True)
    print("Synced:", res.get("count"), "models from", res.get("sources"))
