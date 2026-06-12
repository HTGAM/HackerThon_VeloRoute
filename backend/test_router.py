# VeloRoute Vientiane: Router Validation Suite
# Architecture Focus: Automates unit test checks on unpaved penalties and flood detour accuracy.

import unittest
from telemetry import telemetry_pipeline
from router import vientiane_router

class TestVientianeRoutingSystem(unittest.TestCase):

    def setUp(self):
        # Retrieve router instance
        self.router = vientiane_router
        self.telemetry = telemetry_pipeline

    def test_tuktuk_avoids_unpaved_shortcut_in_dry_season(self):
        """
        Under dry conditions:
        - Route from node E (Inland West) to node F (Inland Center).
        - Path E -> L -> F contains an unpaved segment (L -> F).
        - Path E -> F is direct but heavily congested (5.0x multiplier).
        - The Tuk-Tuk profile should penalize unpaved segments heavily (6.5x) and choose the paved detour (E -> A -> J -> F).
        - The Car profile should tolerate unpaved segments (1.5x) and choose the shorter shortcut (E -> L -> F).
        """
        dry_conditions = self.telemetry.calculate_inundation(rain_intensity_mm=0.0, mekong_river_level_meters=9.5)
        
        # Test Tuk-Tuk Choice
        tuktuk_route = self.router.solve_route("E", "F", "tuktuk", dry_conditions)
        self.assertTrue(tuktuk_route["success"])
        # Tuk-Tuk must avoid 'L' because L -> F is unpaved
        self.assertNotIn("L", tuktuk_route["path"])
        self.assertEqual(tuktuk_route["path"], ["E", "A", "J", "F"])
        
        # Test Car Choice
        car_route = self.router.solve_route("E", "F", "car", dry_conditions)
        self.assertTrue(car_route["success"])
        # Car tolerates unpaved roads and takes shortcut through L
        self.assertIn("L", car_route["path"])
        self.assertEqual(car_route["path"], ["E", "L", "F"])

    def test_flood_rerouting_away_from_mekong_riverfront(self):
        """
        Under flood conditions (Monsoon rain = 130mm/h, River Level = 12.0m):
        - Route from node A (Mekong Riverfront West) to node I (Patuxai inland).
        - In dry conditions, the shortest path is Quai Fa Ngum riverfront (A -> B -> C -> D -> H -> I).
        - In severe floods, Quai Fa Ngum and Setthathilath are underwater.
        - The routing engine must dynamically detour inland up Rue Francois Ngin (A -> E) and use Samsenthai Road (E -> F -> G -> H -> I).
        """
        dry_conditions = self.telemetry.calculate_inundation(rain_intensity_mm=0.0, mekong_river_level_meters=9.5)
        flood_conditions = self.telemetry.calculate_inundation(rain_intensity_mm=130.0, mekong_river_level_meters=12.0)
        
        # Dry Route check (should use riverfront)
        dry_route = self.router.solve_route("A", "I", "tuktuk", dry_conditions)
        self.assertTrue(dry_route["success"])
        self.assertEqual(dry_route["path"][:4], ["A", "B", "C", "D"]) # uses riverfront Quai Fa Ngum
        
        # Flood Route check (should divert inland instantly from A to E, avoiding B, C, D)
        flood_route = self.router.solve_route("A", "I", "tuktuk", flood_conditions)
        self.assertTrue(flood_route["success"])
        
        # Verify it diverted inland to E immediately, bypassing flooded B, C, and D
        self.assertEqual(flood_route["path"][0], "A")
        self.assertEqual(flood_route["path"][1], "E") # took Francois Ngin inland route
        self.assertNotIn("B", flood_route["path"])
        self.assertNotIn("C", flood_route["path"])
        self.assertNotIn("D", flood_route["path"])
        
        print(f"\n[PASS] Verified dry route: {dry_route['path']}")
        print(f"[PASS] Verified flood detour route: {flood_route['path']}")

    def test_extreme_flooding_blocks_navigation(self):
        """
        In extreme flooding conditions, if all outlet segments are blocked:
        - The engine should return a safe error indicating no route can be traversed.
        """
        # Set extreme flood levels to block all roads (high rain + high river level)
        extreme_flood = self.telemetry.calculate_inundation(rain_intensity_mm=150.0, mekong_river_level_meters=15.0)
        
        # Try routing from riverfront (A) to Patuxai (I)
        route = self.router.solve_route("A", "I", "tuktuk", extreme_flood)
        self.assertIn("error", route)
        print(f"[PASS] Verified extreme flood handling error: {route['error']}")

if __name__ == "__main__":
    unittest.main()
