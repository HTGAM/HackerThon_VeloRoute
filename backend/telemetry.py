# VeloRoute Vientiane: Real-time Telemetry & Rainfall Hydrology Simulator
# Architecture Focus: Models Mekong River overflow and drainage flow rates 
# to calculate dynamic water depth on Vientiane roads.

import math
from typing import Dict, List, Any

class FloodTelemetryPipeline:
    def __init__(self):
        # Base database of key Vientiane road segments with elevation (meters above sea level)
        # and baseline drainage capacity (mm/hour removal rate)
        self.road_profiles = {
            "Quai_Fa_Ngum_West": {
                "name": "메콩강변 서부 도로 (Quai Fa Ngum 서부)",
                "elevation": 158.2,       # Low ground, right next to the Mekong
                "drainage_capacity": 15.0, # Poor drainage, directly affected by river level
                "base_flood_risk": 0.9     # Extremely high risk
            },
            "Quai_Fa_Ngum_East": {
                "name": "메콩강변 동부 도로 (Quai Fa Ngum 동부)",
                "elevation": 158.8,
                "drainage_capacity": 18.0,
                "base_flood_risk": 0.85
            },
            "Setthathilath_Rd": {
                "name": "셋타티랏 도로 (Setthathilath Rd)",
                "elevation": 163.5,       # Mid-inland
                "drainage_capacity": 25.0, # Moderate drainage
                "base_flood_risk": 0.4
            },
            "Samsenthai_Rd": {
                "name": "삼센타이 도로 (Samsenthai Rd)",
                "elevation": 170.2,       # Safe inland arterial
                "drainage_capacity": 35.0, # Good drainage
                "base_flood_risk": 0.05
            },
            "Lane_Xang_Ave": {
                "name": "란쌍 대로 (Lane Xang Ave)",
                "elevation": 172.5,       # Highest ground in central Vientiane
                "drainage_capacity": 45.0, # High-capacity drainage
                "base_flood_risk": 0.01
            },
            "Chao_Anou_South": {
                "name": "차오아누 남부 (Chao Anou 강변 방향)",
                "elevation": 164.0,       # Slope rising away from riverfront
                "drainage_capacity": 35.0, # Rapid gravity runoff
                "base_flood_risk": 0.1    # Very low pooling risk
            },
            "Chao_Anou_North": {
                "name": "차오아누 북부 (Chao Anou 내륙 방향)",
                "elevation": 169.5,
                "drainage_capacity": 30.0,
                "base_flood_risk": 0.1
            },
            "Pangkham_South": {
                "name": "팡캄 남부 (Pangkham 강변 방향)",
                "elevation": 164.5,       # Slope rising away from riverfront
                "drainage_capacity": 35.0, # Rapid gravity runoff
                "base_flood_risk": 0.1    # Very low pooling risk
            },
            "Pangkham_North": {
                "name": "팡캄 북부 (Pangkham 내륙 방향)",
                "elevation": 170.0,
                "drainage_capacity": 30.0,
                "base_flood_risk": 0.08
            }
        }

    def calculate_inundation(self, rain_intensity_mm: float, mekong_river_level_meters: float) -> Dict[str, Dict[str, Any]]:
        """
        Simulates the water depth (in meters) on Vientiane roads based on:
        1. Rain intensity (mm/h)
        2. Mekong River water level (meters, where > 11.5m represents high alert, > 12.5m is overflow threshold)
        3. Street elevation and drainage efficiency
        """
        results = {}
        
        # Hydrological simulation formula
        # Water depth = (Rain Intensity - Drainage) + (River Overflow factor based on elevation)
        # We model Mekong overflow impact as an exponential function of river level vs road elevation.
        # Reference: Mekong River Commission water level warning thresholds for Vientiane.
        
        for segment_id, profile in self.road_profiles.items():
            # 1. Rain water accumulation (simplified runoff model)
            net_rain = max(0.0, rain_intensity_mm - profile["drainage_capacity"])
            rain_accumulation_m = (net_rain / 1000.0) * 1.5 # Scale factor for runoff concentration
            
            # 2. Mekong River backwater / overflow effect
            # As river level rises, drainage outlets clog (backflow), and eventually river overflows
            river_delta = mekong_river_level_meters - (profile["elevation"] - 148.0) # Relative height delta
            river_overflow_m = 0.0
            
            if river_delta > 0:
                # River is higher than the drainage outlets (which are situated at low water marks)
                # This causes backflow and drainage failure
                drainage_blockage = min(1.0, river_delta / 2.0)
                effective_drainage = profile["drainage_capacity"] * (1.0 - drainage_blockage)
                net_rain = max(0.0, rain_intensity_mm - effective_drainage)
                rain_accumulation_m = (net_rain / 1000.0) * 2.0
                
                # Direct overflow if river level is high enough
                if mekong_river_level_meters > 12.0: # Vientiane warning level
                    overflow_potency = profile["base_flood_risk"] * (mekong_river_level_meters - 12.0)
                    river_overflow_m = max(0.0, overflow_potency * 0.45)

            # Total water depth in meters
            total_water_depth = rain_accumulation_m + river_overflow_m
            
            # Cap realistic maximum depth based on local topography (water runs off or levels out)
            max_depth = max(0.0, 162.0 - profile["elevation"]) if profile["elevation"] < 162.0 else 0.5
            total_water_depth = min(total_water_depth, max_depth)
            
            # Categorize severity
            if total_water_depth < 0.05:
                status = "DRY"
            elif total_water_depth < 0.15:
                status = "PASSABLE_CAUTION" # Passable for all vehicles but slow
            elif total_water_depth < 0.30:
                status = "WARNING_MOTO_RESTRICTED" # Dangerous for Tuk-Tuks / small motorcycles
            else:
                status = "FLOODED_IMPASSABLE" # Closed to all standard light transit (Tuk-Tuks and standard motorbikes)

            results[segment_id] = {
                "name": profile["name"],
                "elevation": profile["elevation"],
                "water_depth_m": round(total_water_depth, 3),
                "status": status,
                "drainage_efficiency_pct": round(max(0.0, (profile["drainage_capacity"] - net_rain) / profile["drainage_capacity"]) * 100, 1) if rain_intensity_mm > 0 else 100.0
            }
            
        return results

# Singleton instance for live telemetry pipeline simulation
telemetry_pipeline = FloodTelemetryPipeline()

if __name__ == "__main__":
    # Quick simulation test
    print("=== Dry Season Simulation ===")
    dry = telemetry_pipeline.calculate_inundation(rain_intensity_mm=0.0, mekong_river_level_meters=9.5)
    for k, v in dry.items():
        print(f"{v['name']}: {v['water_depth_m']}m ({v['status']})")
        
    print("\n=== Severe Monsoon Simulation (80mm/h, River Level 13.2m) ===")
    monsoon = telemetry_pipeline.calculate_inundation(rain_intensity_mm=80.0, mekong_river_level_meters=13.2)
    for k, v in monsoon.items():
        print(f"{v['name']}: {v['water_depth_m']}m ({v['status']})")
