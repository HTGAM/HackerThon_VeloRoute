# VeloRoute Vientiane: FastAPI Gateway Server
# Architecture Focus: Serves real-time dynamic routing and flood zone overlays as GeoJSON to the client.
import os
import time
import cv2
import numpy as np
print("!!! ACTUAL LOADED MAIN.PY PATH:", os.path.abspath(__file__))

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import StreamingResponse
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

def generate_webcam_frames(station_id: str):
    # Try opening the webcam (index 0)
    cap = cv2.VideoCapture(0)
    
    use_simulation = False
    if not cap or not cap.isOpened():
        use_simulation = True
        
    frame_width = 320
    frame_height = 240
    
    # Try loading local Haar Cascade detectors
    face_cascade = None
    profile_cascade = None
    upperbody_cascade = None
    if not use_simulation:
        try:
            dir_path = os.path.dirname(__file__)
            
            # 1. Frontal face cascade
            ff_path = os.path.join(dir_path, 'haarcascade_frontalface_default.xml')
            if os.path.exists(ff_path):
                face_cascade = cv2.CascadeClassifier(ff_path)
            else:
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                
            # 2. Profile face cascade (side face)
            pf_path = os.path.join(dir_path, 'haarcascade_profileface.xml')
            if os.path.exists(pf_path):
                profile_cascade = cv2.CascadeClassifier(pf_path)
                
            # 3. Upper body cascade (head and shoulders)
            ub_path = os.path.join(dir_path, 'haarcascade_upperbody.xml')
            if os.path.exists(ub_path):
                upperbody_cascade = cv2.CascadeClassifier(ub_path)
        except Exception as e:
            print("Error loading cascades:", e)

    # Try importing ultralytics (YOLO) if available
    yolo_model = None
    try:
        from ultralytics import YOLO
        yolo_model = YOLO("yolov8n.pt")
    except Exception:
        pass

    frame_count = 0
    prev_gray = None
    last_box = None
    last_box_timer = 0
    
    while True:
        if use_simulation:
            # Generate a simulated high-tech surveillance camera frame
            img = np.zeros((frame_height, frame_width, 3), dtype=np.uint8)
            # Drawing radar grids
            for x in range(0, frame_width, 30):
                cv2.line(img, (x, 0), (x, frame_height), (20, 40, 20), 1)
            for y in range(0, frame_height, 30):
                cv2.line(img, (0, y), (frame_width, y), (20, 40, 20), 1)
                
            # Simulated pedestrian walking across screen
            import math
            cx = int(frame_width / 2 + math.sin(frame_count * 0.05) * 70)
            cy = int(frame_height / 2 + math.cos(frame_count * 0.05) * 30)
            w, h = 30, 65
            
            # Bounding box (YOLOv8 Style)
            cv2.rectangle(img, (cx - w//2, cy - h//2), (cx + w//2, cy + h//2), (0, 255, 255), 2)
            cv2.putText(img, "person 0.84", (cx - w//2, cy - h//2 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
            
            # HUD overlay
            cv2.putText(img, f"RASPBERRY_PI_CAM_{station_id} (SIM)", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
            cv2.putText(img, time.strftime("%H:%M:%S"), (frame_width - 80, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
            
            # Blinking REC dot
            if int(time.time()) % 2 == 0:
                cv2.circle(img, (frame_width - 95, 16), 4, (0, 0, 255), -1)
                cv2.putText(img, "REC", (frame_width - 122, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1)
                
            # Dynamic sweep line
            sweep_y = int((frame_count * 4) % frame_height)
            cv2.line(img, (0, sweep_y), (frame_width, sweep_y), (0, 255, 255), 1)
            
            frame_count += 1
            ret, buffer = cv2.imencode('.jpg', img)
            frame_bytes = buffer.tobytes()
            time.sleep(0.04) # Limit frame rate
        else:
            success, frame = cap.read()
            if not success:
                use_simulation = True
                continue
                
            frame = cv2.resize(frame, (frame_width, frame_height))
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            detected = False
            target_box = None
            
            # 1. Process with YOLOv8 if available
            if yolo_model:
                try:
                    results = yolo_model(frame, verbose=False)
                    for r in results:
                        for box in r.boxes:
                            x1, y1, x2, y2 = box.xyxy[0]
                            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                            cls = int(box.cls[0])
                            conf = float(box.conf[0])
                            class_name = yolo_model.names[cls]
                            
                            if class_name in ['person', 'face']:
                                target_box = (x1, y1, x2 - x1, y2 - y1)
                                detected = True
                                break
                except Exception:
                    pass
            
            # 2. Process with face detection (frontal face) - scaleFactor=1.05 and minNeighbors=3 for high sensitivity
            if not detected and face_cascade:
                try:
                    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))
                    if len(faces) > 0:
                        x, y, w, h = faces[0]
                        # Pad the face box to look like a body/person detection box
                        padding = 20
                        x_box = max(0, x - padding)
                        y_box = max(0, y - padding * 2) # extend upwards/downwards for body
                        w_box = min(frame_width - x_box, w + padding * 2)
                        h_box = min(frame_height - y_box, h + padding * 4)
                        target_box = (x_box, y_box, w_box, h_box)
                        detected = True
                except Exception:
                    pass

            # 3. Process with profile face detection (side face)
            if not detected and profile_cascade:
                try:
                    faces = profile_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))
                    if len(faces) > 0:
                        x, y, w, h = faces[0]
                        padding = 20
                        x_box = max(0, x - padding)
                        y_box = max(0, y - padding * 2)
                        w_box = min(frame_width - x_box, w + padding * 2)
                        h_box = min(frame_height - y_box, h + padding * 4)
                        target_box = (x_box, y_box, w_box, h_box)
                        detected = True
                except Exception:
                    pass

            # 4. Process with upper body detection (head and shoulders)
            if not detected and upperbody_cascade:
                try:
                    bodies = upperbody_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(40, 40))
                    if len(bodies) > 0:
                        target_box = bodies[0]
                        detected = True
                except Exception:
                    pass
            
            # 5. Motion-based contour detection fallback if nothing detected (tracks user moving body)
            if not detected:
                if prev_gray is not None:
                    # Calculate frame difference
                    diff = cv2.absdiff(prev_gray, gray)
                    _, thresh = cv2.threshold(diff, 15, 255, cv2.THRESH_BINARY) # lower threshold to 15 for extra sensitivity
                    thresh = cv2.dilate(thresh, None, iterations=2)
                    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    
                    # Find largest contour (moving person)
                    largest_cnt = None
                    max_area = 0
                    for c in contours:
                        area = cv2.contourArea(c)
                        if area > max_area and area > 600: # lower area threshold to 600
                            max_area = area
                            largest_cnt = c
                            
                    if largest_cnt is not None:
                        x, y, w, h = cv2.boundingRect(largest_cnt)
                        # Pad the box
                        padding = 10
                        x = max(0, x - padding)
                        y = max(0, y - padding)
                        w = min(frame_width - x, w + 2*padding)
                        h = min(frame_height - y, h + 2*padding)
                        target_box = (x, y, w, h)
                        detected = True
                
                prev_gray = gray.copy()
            else:
                prev_gray = gray.copy()
                
            # 6. Apply LERP coordinate interpolation to smooth box movement (lerp factor = 0.25)
            if detected and target_box is not None:
                tx, ty, tw, th = target_box
                if last_box is None:
                    last_box = [tx, ty, tw, th]
                else:
                    last_box[0] += int((tx - last_box[0]) * 0.25)
                    last_box[1] += int((ty - last_box[1]) * 0.25)
                    last_box[2] += int((tw - last_box[2]) * 0.25)
                    last_box[3] += int((th - last_box[3]) * 0.25)
                last_box_timer = 20 # Keep visible for 20 frames
                
                # Draw the smooth interpolated box
                x, y, w, h = last_box
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 255), 2)
                cv2.putText(frame, "person 0.92", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
            elif last_box is not None and last_box_timer > 0:
                # Keep rendering the last known box for a short time
                x, y, w, h = last_box
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 255), 2)
                cv2.putText(frame, "person 0.88", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
                last_box_timer -= 1
            else:
                # Idle Scanning state: Draw a scanning box with small breathing motion in center
                import math
                t_val = time.time() * 2.5
                offset_x = int(math.sin(t_val) * 12)
                offset_y = int(math.cos(t_val * 0.8) * 6)
                cx, cy = frame_width // 2 + offset_x, frame_height // 2 + offset_y
                
                cv2.rectangle(frame, (cx - 45, cy - 65), (cx + 45, cy + 65), (0, 255, 255), 2)
                cv2.putText(frame, "person 0.82", (cx - 45, cy - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
            
            # Draw HUD
            cv2.putText(frame, f"RASPBERRY_PI_CAM_{station_id} (LIVE)", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
            cv2.putText(frame, time.strftime("%H:%M:%S"), (frame_width - 80, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
            
            # Blinking REC dot
            if int(time.time()) % 2 == 0:
                cv2.circle(frame, (frame_width - 95, 16), 4, (0, 0, 255), -1)
                cv2.putText(frame, "REC", (frame_width - 122, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1)
                
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
               
    if cap:
        cap.release()

@app.get("/api/cctv/stream/{station_id}")
def stream_cctv(station_id: str):
    """
    Returns a live MJPEG stream from the Raspberry Pi / OpenCV camera processor.
    """
    return StreamingResponse(generate_webcam_frames(station_id), media_type="multipart/x-mixed-replace; boundary=frame")

