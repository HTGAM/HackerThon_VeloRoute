# VeloRoute Vientiane: FastAPI Gateway Server
# Architecture Focus: Serves real-time dynamic routing and flood zone overlays as GeoJSON to the client.

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any

# Import simulator and router modules
from telemetry import telemetry_pipeline
from router import vientiane_router

app = FastAPI(
    title="VeloRoute Vientiane API",
    description="Real-Time Flood-Resilient Routing and Telemetry Engine for Vientiane, Laos",
    version="1.0.0"
)

# Enable CORS for React Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "project": "VeloRoute Vientiane Prototype",
        "description": "Smart Mobility & Flood Avoidance Engine for Laos",
        "status": "online"
    }

@app.get("/api/telemetry")
def get_telemetry(
    rain_intensity: float = Query(0.0, description="Rainfall intensity in mm/hour", ge=0.0, le=150.0),
    river_level: float = Query(9.5, description="Mekong River water level in meters", ge=5.0, le=16.0)
):
    """
    Retrieves the simulated flood inundation level of key street segments in Vientiane.
    """
    try:
        data = telemetry_pipeline.calculate_inundation(rain_intensity, river_level)
        return {
            "rain_intensity_mm_hr": rain_intensity,
            "mekong_river_level_m": river_level,
            "segments": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/route")
def get_route(
    start: str = Query("A", description="Starting intersection node (A-L)"),
    end: str = Query("I", description="Ending intersection node (A-L)"),
    vehicle: str = Query("tuktuk", description="Vehicle type: tuktuk, motorcycle, car"),
    rain_intensity: float = Query(0.0, description="Precipitation intensity (mm/h)"),
    river_level: float = Query(9.5, description="Mekong river level (meters)")
):
    """
    Calculates the safest flood-avoiding route. Returns GeoJSON path.
    """
    try:
        # 1. Generate live telemetry based on environment variables
        flood_telemetry = telemetry_pipeline.calculate_inundation(rain_intensity, river_level)
        
        # 2. Run the dynamic graph routing algorithm
        route_result = vientiane_router.solve_route(start, end, vehicle, flood_telemetry)
        
        if "error" in route_result:
            return {
                "success": False,
                "error": route_result["error"],
                "rain_intensity": rain_intensity,
                "river_level": river_level,
                "vehicle": vehicle
            }
            
        return {
            "success": True,
            "start_node": start,
            "end_node": end,
            "vehicle": vehicle,
            "distance_m": route_result["distance_m"],
            "remarks": route_result["remarks"],
            "geojson": route_result["geojson"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/flood-zones")
def get_flood_zones(
    rain_intensity: float = Query(0.0),
    river_level: float = Query(9.5)
):
    """
    Returns GeoJSON polygons of high-risk flooding zones along the Mekong Riverfront (Quai Fa Ngum).
    Opacities and status colors scale dynamically with water levels.
    """
    # Bounding coordinates mapping to Quai Fa Ngum west/east sectors
    # Riverfront West Zone (Around Quai Fa Ngum West / Francois Ngin / Chao Anou)
    west_polygon = [
        [102.6070, 17.9635],
        [102.6110, 17.9615],
        [102.6105, 17.9605],
        [102.6065, 17.9625],
        [102.6070, 17.9635] # close loop
    ]
    
    # Riverfront East Zone (Around Quai Fa Ngum East / Pangkham / Presidential Palace)
    east_polygon = [
        [102.6110, 17.9615],
        [102.6155, 17.9592],
        [102.6150, 17.9582],
        [102.6105, 17.9605],
        [102.6110, 17.9615] # close loop
    ]
    
    # Run simulation to get segment water levels
    telemetry = telemetry_pipeline.calculate_inundation(rain_intensity, river_level)
    west_depth = telemetry["Quai_Fa_Ngum_West"]["water_depth_m"]
    east_depth = telemetry["Quai_Fa_Ngum_East"]["water_depth_m"]
    
    # Determine visual severity and colors
    def get_zone_properties(depth: float, name: str):
        if depth <= 0.02:
            return {
                "name": name,
                "water_depth_m": depth,
                "severity": "NORMAL",
                "fillColor": "#22c55e", # Green (safe)
                "fillOpacity": 0.1,
                "strokeColor": "#16a34a"
            }
        elif depth < 0.15:
            return {
                "name": name,
                "water_depth_m": depth,
                "severity": "CAUTION_MINOR",
                "fillColor": "#eab308", # Yellow
                "fillOpacity": 0.35,
                "strokeColor": "#ca8a04"
            }
        elif depth < 0.30:
            return {
                "name": name,
                "water_depth_m": depth,
                "severity": "WARNING_MODERATE",
                "fillColor": "#f97316", # Orange
                "fillOpacity": 0.55,
                "strokeColor": "#ea580c"
            }
        else:
            return {
                "name": name,
                "water_depth_m": depth,
                "severity": "CRITICAL_FLOOD",
                "fillColor": "#ef4444", # Red
                "fillOpacity": 0.75,
                "strokeColor": "#dc2626"
            }

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": get_zone_properties(west_depth, "Mekong Riverfront West Hazard Zone"),
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [west_polygon]
                }
            },
            {
                "type": "Feature",
                "properties": get_zone_properties(east_depth, "Mekong Riverfront East Hazard Zone"),
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [east_polygon]
                }
            }
        ]
    }

@app.get("/api/nodes")
def get_nodes():
    """
    Exposes the node locations to display routing checkpoints on the map.
    """
    return {
        node_id: {
            "name": data["name"],
            "lat": data["lat"],
            "lng": data["lng"],
            "elevation": data["elevation"]
        } for node_id, data in vientiane_router.nodes.items()
    }
