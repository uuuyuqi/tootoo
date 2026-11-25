import unittest

from scanner import _sanitize_home_state


class TestArcadeSceneOwnership(unittest.TestCase):
    def test_legacy_and_five_interactive_scenes_round_trip(self):
        acquired = [
            "golden_citadel", "moon_tide_observatory", "aurora_crown",
            "dragon_ink_seal", "prism_clockwork", "lantern_skyline",
        ]
        for selected in acquired:
            with self.subTest(selected=selected):
                home = _sanitize_home_state({
                    "owned_backdrops": acquired + [selected, "not_a_scene"],
                    "active_backdrop": selected,
                })
                self.assertEqual(home["owned_backdrops"], ["paper", *acquired])
                self.assertEqual(home["active_backdrop"], selected)

    def test_unowned_scene_does_not_become_active(self):
        home = _sanitize_home_state({"active_backdrop": "aurora_crown"})
        self.assertEqual(home["active_backdrop"], "paper")


if __name__ == "__main__":
    unittest.main()
