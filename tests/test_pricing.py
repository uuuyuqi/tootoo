"""Standard-rate catalog imports, v1 cache migration and Gemini estimates."""
from contextlib import ExitStack
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import pricing


OLD_RATE = {"in": 0.04, "out": 0.08, "cr": 0.01, "cw": 0.0}
CURRENT = "gemini-4-carbon"


def lite(inp, out=8, cr=None, cw=None, mode="chat"):
    return {
        "mode": mode,
        "input_cost_per_token": inp / 1e6,
        "output_cost_per_token": out / 1e6,
        "cache_read_input_token_cost": cr / 1e6 if cr is not None else None,
        "cache_creation_input_token_cost": cw / 1e6 if cw is not None else None,
    }


class PricingTests(unittest.TestCase):
    def setUp(self):
        stack = ExitStack()
        self.addCleanup(stack.close)
        root = Path(stack.enter_context(tempfile.TemporaryDirectory()))
        self.cache = root / "pricing_remote.json"
        self.overrides = root / "pricing_overrides.json"
        for key, value in {
            "TOOTOO_DIR": str(root),
            "REMOTE_CACHE_FILE": str(self.cache),
            "OVERRIDES_FILE": str(self.overrides),
            "CONFIG_FILE": str(root / "config.json"),
            "_refresh_in_flight": False,
            "_retry_after": 0.0,
        }.items():
            stack.enter_context(patch.object(pricing, key, value))

    def seed_cache(self, version, **models):
        self.cache.write_text(json.dumps({
            "version": version, "updated_at": pricing.time.time(),
            "count": len(models), "sources": ["test"], "models": models,
        }))

    def mock_fetch(self, models):
        stack = ExitStack()
        self.addCleanup(stack.close)
        ll = stack.enter_context(patch.object(pricing, "_fetch_litellm_models", return_value=models))
        stack.enter_context(patch.object(pricing, "_fetch_openrouter_models", return_value={}))
        stack.enter_context(patch.object(pricing, "_fetch_custom_url", return_value={}))
        return ll

    def test_openrouter_skips_all_colon_variants_before_normalization(self):
        base = "google/gemini-4-carbon"
        standard = {"id": base, "pricing": {"prompt": "0.000002", "completion": "0.000010"}}
        specials = [
            {"id": f"{base}:{tier}", "pricing": {"prompt": "0.000001", "completion": "0.000005"}}
            for tier in ("batch", "free", "flex", "floor", "nitro", "extended", "exacto", "future-variant")
        ]
        for data in ([standard, *specials], [*reversed(specials), standard], specials):
            with patch.object(pricing, "_http_get_json", return_value={"data": data}):
                rates = pricing._fetch_openrouter_models()
            if standard in data:
                self.assertEqual(set(rates), {CURRENT})
                self.assertEqual((rates[CURRENT]["in"], rates[CURRENT]["out"]), (2, 10))
            else:
                self.assertEqual(rates, {})

    def test_litellm_tier_tokens_and_region_paths(self):
        data = {
            "vertex_ai/gemini-4-carbon": lite(2),
            "vendor/batch/price-only": lite(4),
            "vertex_ai/gemini-4-preference-flex": lite(4),
            "vendor/priority/price-only": lite(4),
            "vendor/batch_eu/model": lite(4),
            "vertex_ai/model:free": lite(4),
            "azure/eu/private-eu": lite(4),
            "azure/us/private-us": lite(4),
            "azure/apac/private-apac": lite(4),
            "azure/us-gov/private-gov": lite(4),
            "azure/global/public": lite(4),
            "bedrock/amazon.nova-micro-v1:0": lite(4),
            "vendor/freeform": lite(4),
            "vendor/deflex": lite(4),
        }
        with patch.object(pricing, "_http_get_json", return_value=data):
            rates = pricing._fetch_litellm_models()
        self.assertEqual(set(rates), {CURRENT, "public", "amazon.nova-micro-v1", "freeform", "deflex"})

    def test_litellm_bare_then_native_then_proxy_regardless_of_order(self):
        data = [
            ("vendor/provider/gemini-4-neon", lite(45, cr=4)),
            ("vendor/gemini-4-neon", lite(35, cr=3, cw=4)),
            ("vertex_ai/gemini-4-neon", lite(3, cr=0.15)),
            ("gemini/gemini-4-neon", lite(2, cr=0.10)),
            ("gemini-4-neon", lite(1)),
            ("gemini/gemini-4-hydrogen", lite(1.5)),
            ("vertex_ai/gemini-4-hydrogen", lite(1.7, cr=0.09)),
            ("proxy/gemini-4-hydrogen", lite(29, cr=14, cw=4)),
            ("proxy/gemini-4-neon:priority", lite(90, cr=10)),
        ]
        for record in (data, list(reversed(data))):
            with patch.object(pricing, "_http_get_json", return_value=dict(record)):
                rates = pricing._fetch_litellm_models()
            self.assertEqual(rates["gemini-4-neon"]["in"], 1)
            self.assertEqual(rates["gemini-4-hydrogen"]["in"], 1.7)
        # Both native entries describe cache reads. The suffix after the comparison
        # is stable; reversing the input order must not pick the other provider.
        native_only = data[:4]
        results = []
        for record in (native_only, list(reversed(native_only))):
            with patch.object(pricing, "_http_get_json", return_value=dict(record)):
                results.append(pricing._fetch_litellm_models())
        self.assertEqual(results[0], results[1])
        self.assertEqual(results[0]["gemini-4-neon"]["in"], 2)

    def test_v1_is_ignored_while_startup_refresh_is_pending_then_replaced_once(self):
        self.seed_cache(1, **{CURRENT: OLD_RATE})
        self.assertIsNone(pricing.load_remote_cache()["updated_at"])
        self.assertEqual(pricing.PricingEngine().resolve(CURRENT)[1], "fallback")
        fetch = self.mock_fetch({CURRENT: {"in": 2, "out": 10, "cr": 0.1, "cw": 0}})
        with patch.object(pricing.threading, "Thread") as thread:
            pricing.trigger_background_sync_if_stale()
            pricing.trigger_background_sync_if_stale()
            thread.assert_called_once()
            target = thread.call_args.kwargs["target"]
            self.assertEqual(pricing.PricingEngine().resolve(CURRENT)[1], "fallback")
            target()
            self.assertEqual(pricing.load_remote_cache()["version"], 2)
            pricing.trigger_background_sync_if_stale()
            thread.assert_called_once()
            self.assertEqual(pricing.PricingEngine().resolve(CURRENT)[1], "live")
        fetch.assert_called_once()

    def test_failed_migration_never_uses_old_rates_and_manual_can_retry(self):
        self.seed_cache(1, **{CURRENT: OLD_RATE})
        fetch = self.mock_fetch({})
        with patch.object(pricing.threading, "Thread") as thread:
            pricing.trigger_background_sync_if_stale()
            thread.call_args.kwargs["target"]()
            pricing.trigger_background_sync_if_stale()
            thread.assert_called_once()
            self.assertEqual(pricing.PricingEngine().resolve(CURRENT)[1], "fallback")
            self.assertEqual(json.loads(self.cache.read_text())["version"], 1)
            fetch.return_value = {CURRENT: {"in": 4, "out": 20, "cr": 0.2, "cw": 0}}
            self.assertEqual(pricing.sync_remote_pricing(force=True)["version"], 2)
            self.assertEqual(pricing.PricingEngine().resolve(CURRENT)[1], "live")
        self.assertEqual(fetch.call_count, 2)

    def test_sync_ignores_v1_even_when_fresh_and_v2_respects_ttl(self):
        self.seed_cache(1, **{CURRENT: OLD_RATE})
        fetch = self.mock_fetch({CURRENT: {"in": 2, "out": 10, "cr": 0.1, "cw": 0}})
        self.assertEqual(pricing.sync_remote_pricing()["version"], 2)
        self.assertEqual(pricing.sync_remote_pricing()["version"], 2)
        fetch.assert_called_once()

    def test_gemini_standard_fallback_uses_current_estimate_time_and_exact_aliases(self):
        cutoff = pricing._GEMINI_4_INTRO_END
        for clock, argon in [(cutoff - 1, (2.0, 10.0, .1)), (cutoff, (4.0, 20.0, .2))]:
            with patch.object(pricing.time, "time", return_value=clock):
                engine = pricing.PricingEngine()
            estimates = {
                "gemini-4": (3.0, 15.0, .15),
                "google/gemini-4-carbon": argon,
                "gemini-4-argon": argon,
                "gemini-pro-orchestrator": argon,
                "antigravity/gemini-pro-orchestrator-argon-high": argon,
                "gemini-pro-orchestrator-neon-xhigh": (3.0, 15.0, .15),
                "gemini-4-hydrogen-xhigh": (1.5, 7.5, .075),
                "gemini-3-1-pro-high": (2.0, 12.0, .2),
                "gemini-3-pro": (2.0, 12.0, .2),
                "gemini-pro": (2.0, 12.0, .2),
            }
            for slug, wanted in estimates.items():
                with self.subTest(slug=slug, clock=clock):
                    rate, source = engine.resolve(slug)
                    self.assertEqual(source, "fallback")
                    self.assertEqual((rate["in"], rate["out"], rate["cr"]), wanted)

    def test_orchestrator_can_use_live_planner_but_not_old_generic_pro(self):
        self.seed_cache(2, **{"gemini-pro": OLD_RATE})
        self.assertEqual(pricing.PricingEngine().resolve("gemini-pro-orchestrator")[1], "fallback")
        self.seed_cache(2, **{CURRENT: OLD_RATE, "gemini-pro": OLD_RATE})
        self.assertEqual(pricing.PricingEngine().resolve("gemini-pro-orchestrator"), (OLD_RATE, "live"))
        self.overrides.write_text(json.dumps({"models": {"gemini-pro-orchestrator": {
            "in": 3, "out": 5, "cr": 1, "cw": 0
        }}}))
        engine = pricing.PricingEngine()
        self.assertEqual(engine.resolve("gemini-pro-orchestrator")[1], "override")
        self.assertEqual(engine.cost_for("gemini-pro-orchestrator", inp=1234, native_cost=9.99),
                         (9.99, "native"))


if __name__ == "__main__":
    unittest.main()
