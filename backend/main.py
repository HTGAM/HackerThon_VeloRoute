# VeloRoute Vientiane: FastAPI Gateway Server
# Architecture Focus: Serves real-time dynamic routing and flood zone overlays as GeoJSON to the client.

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any
from pydantic import BaseModel
from datetime import datetime

# Import simulator and router modules
from telemetry import telemetry_pipeline
from router import vientiane_router

app = FastAPI(
    title="VeloRoute Vientiane API",
    description="Real-Time Flood-Resilient Routing and Telemetry Engine for Vientiane, Laos",
    version="1.0.0"
)

# InMemory hazard reports store
reported_hazards: List[Dict[str, Any]] = []

class HazardReport(BaseModel):
    node: str
    hazard_type: str  # 'flood', 'accident', 'pothole', 'police'

class HazardRemove(BaseModel):
    node: str

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
    start: str = Query("A", description="Starting intersection node (A-AO)"),
    end: str = Query("I", description="Ending intersection node (A-AO)"),
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
        
        # 2. Extract hazard node IDs
        hazards = [h["node"] for h in reported_hazards]
        
        # 3. Run the dynamic graph routing algorithm with hazards
        route_result = vientiane_router.solve_route(start, end, vehicle, flood_telemetry, hazards)
        
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

@app.get("/api/evacuate")
def get_evacuate(
    start: str = Query("A", description="Starting intersection node (A-AO)"),
    vehicle: str = Query("tuktuk", description="Vehicle type: tuktuk, motorcycle, car"),
    rain_intensity: float = Query(0.0, description="Precipitation intensity (mm/h)"),
    river_level: float = Query(9.5, description="Mekong river level (meters)")
):
    """
    Calculates the quickest flood-safe evacuation route to the nearest high-ground shelter.
    """
    try:
        flood_telemetry = telemetry_pipeline.calculate_inundation(rain_intensity, river_level)
        hazards = [h["node"] for h in reported_hazards]
        
        route_result = vientiane_router.find_nearest_shelter(start, vehicle, flood_telemetry, hazards)
        
        if "error" in route_result:
            return {
                "success": False,
                "error": route_result["error"],
                "rain_intensity": rain_intensity,
                "river_level": river_level,
                "vehicle": vehicle
            }
            
        return route_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/report-hazard")
def report_hazard(report: HazardReport):
    if report.node not in vientiane_router.nodes:
        raise HTTPException(status_code=400, detail="Invalid node ID")
        
    existing = next((h for h in reported_hazards if h["node"] == report.node), None)
    if existing:
        existing["hazard_type"] = report.hazard_type
        existing["timestamp"] = datetime.now().isoformat()
    else:
        reported_hazards.append({
            "node": report.node,
            "hazard_type": report.hazard_type,
            "timestamp": datetime.now().isoformat()
        })
    return {"success": True, "message": f"Node {report.node}에 장애물이 제보되었습니다."}

@app.get("/api/hazards")
def get_hazards():
    return reported_hazards

@app.post("/api/hazards/clear")
def clear_hazards():
    global reported_hazards
    reported_hazards.clear()
    return {"success": True, "message": "모든 제보된 장애물이 제거되었습니다."}

@app.post("/api/hazards/remove")
def remove_hazard(request: HazardRemove):
    global reported_hazards
    before_len = len(reported_hazards)
    reported_hazards = [h for h in reported_hazards if h["node"] != request.node]
    after_len = len(reported_hazards)
    if before_len == after_len:
        raise HTTPException(status_code=404, detail=f"Node {request.node}에 등록된 장애물이 없습니다.")
    return {"success": True, "message": f"Node {request.node}의 장애물이 성공적으로 해제되었습니다."}

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
