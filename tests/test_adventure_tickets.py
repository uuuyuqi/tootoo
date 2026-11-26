from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import scanner
import server


class AdventureTicketsTests(unittest.TestCase):
    DAY = 24 * 60 * 60

    def setUp(self):
        tmp = self.enterContext(tempfile.TemporaryDirectory())
        self.state_path = Path(tmp, "carrot_state.json")
        self.now = 1_800_000_000
        self.today = "2026-11-26"
        self.enterContext(patch.multiple(scanner, CACHE_DIR=tmp, CARROT_STATE_FILE=str(self.state_path)))
        self.enterContext(patch.object(scanner, "_local_day", side_effect=lambda: self.today))
        # Avoid replacing stdlib time.time globally while an HTTP server is active.
        self.enterContext(patch.object(scanner, "time", wraps=scanner.time))
        scanner.time.time.side_effect = lambda: self.now

    @staticmethod
    def op(number):
        return f"operation_{number:012d}"

    def test_daily_credit_is_persisted_without_backfill_and_has_individual_expiry(self):
        base = self.now
        first = scanner.adventure_tickets()
        self.assertEqual(first["tickets"], {
            "available": 3, "expires_next_at": base + 7 * self.DAY,
            "bought_today": 0, "buy_remaining": 5, "price": 5, "daily_free": 3, "ttl_days": 7,
        })
        saved = self.state_path.read_bytes()
        self.assertEqual(scanner.adventure_tickets(), first)
        self.assertEqual(self.state_path.read_bytes(), saved)
        # Three days with no adventure visits do not backfill free tickets.
        self.today = "2026-11-30"
        self.now += 4 * self.DAY
        self.assertEqual(scanner.adventure_tickets()["tickets"]["available"], 6)
        self.now += 3 * self.DAY - 1
        self.assertEqual(scanner.adventure_tickets()["tickets"]["available"], 6)
        self.now += 1
        left = scanner.adventure_tickets()["tickets"]
        self.assertEqual((left["available"], left["expires_next_at"]), (3, base + 11 * self.DAY))

    def test_both_games_share_inventory_and_use_nearest_expiry(self):
        for number, game in enumerate(("rain", "blaster", "rain")):
            self.assertEqual(scanner.adventure_tickets("consume", self.op(number), game)
                             ["tickets"]["available"], 2 - number)
        self.assertEqual(scanner.adventure_tickets("consume", self.op(3), "blaster")["error"], "no_tickets")
        self.today = "2026-11-27"
        self.now += self.DAY
        first = scanner.adventure_tickets()
        scanner.save_carrot_state({"balance": 5})
        self.now += 310
        bought = scanner.adventure_tickets("buy", self.op(4))
        self.assertEqual(bought["tickets"]["available"], 4)
        self.assertEqual(bought["tickets"]["expires_next_at"], first["tickets"]["expires_next_at"])
        for number in range(5, 8):
            result = scanner.adventure_tickets("consume", self.op(number), "rain")
        self.assertEqual(result["tickets"]["available"], 1)
        self.assertEqual(result["tickets"]["expires_next_at"], first["tickets"]["expires_next_at"] + 310)

    def test_concurrent_purchase_caps_and_next_local_day(self):
        scanner.save_carrot_state({"balance": 60})
        with ThreadPoolExecutor(max_workers=12) as pool:
            results = list(pool.map(lambda n: scanner.adventure_tickets("buy", self.op(n)), range(12)))
        self.assertEqual(sum(r["ok"] for r in results), 5)
        self.assertEqual({r["error"] for r in results if not r["ok"]}, {"daily_limit"})
        snap = scanner.adventure_tickets()
        self.assertEqual((snap["balance"], snap["tickets"]["available"], snap["tickets"]["buy_remaining"]), (35, 8, 0))
        self.today = "2026-11-27"
        self.now += self.DAY
        snap = scanner.adventure_tickets("buy", self.op(30))
        self.assertEqual((snap["balance"], snap["tickets"]["available"], snap["tickets"]["buy_remaining"]), (30, 12, 4))
        self.today = "2026-11-26"
        self.assertEqual(scanner.adventure_tickets("buy", self.op(31))["error"], "daily_limit")
        self.assertEqual(scanner.adventure_tickets()["tickets"]["available"], 12)

    def test_concurrent_consumption_cannot_overdraw(self):
        with ThreadPoolExecutor(max_workers=12) as pool:
            results = list(pool.map(lambda n: scanner.adventure_tickets(
                "consume", self.op(n), "rain" if n % 2 else "blaster"), range(12)))
        self.assertEqual(sum(r["ok"] for r in results), 3)
        self.assertEqual({r["error"] for r in results if not r["ok"]}, {"no_tickets"})
        self.assertEqual(scanner.adventure_tickets()["tickets"]["available"], 0)

    def test_paid_idempotency_and_failed_balance_dont_consume_attempt(self):
        scanner.save_carrot_state({"balance": 4})
        op = self.op(1)
        denied = scanner.adventure_tickets("buy", op)
        self.assertEqual((denied["error"], denied["balance"], denied["tickets"]["bought_today"]),
                         ("insufficient_coins", 4, 0))
        scanner.save_carrot_state({"balance_delta": 7})
        success = scanner.adventure_tickets("buy", op)
        self.assertFalse(success["replayed"])
        again = scanner.adventure_tickets("buy", op)
        self.assertTrue(again["replayed"])
        self.assertEqual((again["balance"], again["tickets"]["available"]), (6, 4))
        self.assertEqual(scanner.adventure_tickets("consume", op, "rain")["error"], "operation_conflict")
        admit = self.op(2)
        scanner.adventure_tickets("consume", admit, "blaster")
        self.assertTrue(scanner.adventure_tickets("consume", admit, "blaster")["replayed"])
        self.assertEqual(scanner.adventure_tickets("consume", admit, "rain")["error"], "operation_conflict")
        self.assertEqual(scanner.adventure_tickets()["tickets"]["available"], 3)

    def test_legacy_wallet_patch_cannot_restore_paid_balance_or_replace_private_ledger(self):
        scanner.save_carrot_state({"balance": 12})
        scanner.adventure_tickets("buy", self.op(1))
        stale = scanner.save_carrot_state({"balance": 12, "adventure_tickets": {"expiries": [2**62]}})
        self.assertEqual(stale["balance"], 7)
        self.assertNotIn("adventure_tickets", stale)
        self.assertNotIn("adventure_tickets", scanner.load_carrot_state())
        patched = scanner.save_carrot_state({"balance": 23, "balance_delta": 3,
                                              "home": {"adventure_tickets": {"expiries": [2**62]}}})
        self.assertEqual(patched["balance"], 10)
        self.assertNotIn("adventure_tickets", patched["home"])
        self.assertEqual(scanner.adventure_tickets()["tickets"]["available"], 4)

    def test_failed_ticket_write_does_not_debit_and_xp_rollback_preserves_existing_ledger(self):
        scanner.save_carrot_state({"balance": 9})
        scanner.adventure_tickets()
        initial = self.state_path.read_bytes()
        with patch.object(scanner, "_atomic_game_json", side_effect=OSError("storage full")):
            with self.assertRaises(OSError):
                scanner.adventure_tickets("buy", self.op(3))
        self.assertEqual(self.state_path.read_bytes(), initial)
        self.assertEqual(scanner.adventure_tickets("buy", self.op(3))["balance"], 4)
        paid_state = json.loads(self.state_path.read_bytes())
        with (patch.object(scanner, "_real_tokens_for_xp_post", return_value=0),
              patch.object(scanner, "_update_evo_peak_locked", side_effect=OSError("peak write failed"))):
            with self.assertRaises(OSError):
                scanner.save_carrot_state({"balance_delta": 3, "home": {"xp_boost": {"day": self.today, "tokens": 5}}})
        self.assertEqual(json.loads(self.state_path.read_bytes()), paid_state)

    @contextmanager
    def http_server(self):
        with server.TooTooServer(("127.0.0.1", 0), server.TooTooHandler) as instance:
            worker = threading.Thread(target=instance.serve_forever, daemon=True)
            worker.start()
            try:
                yield f"http://127.0.0.1:{instance.server_port}"
            finally:
                instance.shutdown()
                worker.join(timeout=3)

    def test_http_checks_content_and_origin_and_keeps_corrupt_state(self):
        with self.http_server() as base:
            def call(path="/api/adventure/tickets", payload=None, **headers):
                data = json.dumps(payload).encode() if payload is not None else None
                query = Request(base + path, data=data, headers=headers)
                try:
                    with urlopen(query, timeout=3) as response:
                        return response.status, json.load(response)
                except HTTPError as exc:
                    with exc:
                        return exc.code, json.load(exc)
            body = {"action": "buy", "operation_id": self.op(10)}
            self.assertEqual(call(Origin="https://foreign.example")[0], 403)
            self.assertEqual(call(payload=body)[0], 400)
            self.assertEqual(call(payload=body, **{"Content-Type": "application/json", "Sec-Fetch-Site": "cross-site"})[0], 403)
            self.assertFalse(self.state_path.exists())
            self.assertEqual(call()[1]["tickets"]["available"], 3)
            status, denied = call(payload=body, **{"Content-Type": "application/json", "Origin": base})
            self.assertEqual((status, denied["error"]), (409, "insufficient_coins"))
            self.assertNotIn("adventure_tickets", call(path="/api/carrot")[1])
            self.state_path.write_text('{"broken"', encoding="utf-8")
            self.assertEqual(call(), (500, {"ok": False, "error": "storage_error"}))
            self.assertEqual(self.state_path.read_text(), '{"broken"')


if __name__ == "__main__":
    unittest.main()
