# VeloRoute Vientiane: Dynamic Flood-Aware Routing Engine
# Architecture Focus: Custom Dijkstra router that modifies weights based on road surface and real-time flood telemetry.

import heapq
import math
from typing import Dict, List, Tuple, Any

# Haversine distance formula to calculate distance between coordinates
def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371000.0 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class VientianeRouter:
    def __init__(self):
        # Nodes representing main intersections in central and expanded Vientiane
        self.nodes = {
            "A": {"name": "Quai Fa Ngum (West) - Francois Ngin Jct", "lat": 17.9628, "lng": 102.6075, "elevation": 158.2},
            "B": {"name": "Quai Fa Ngum (Center) - Chao Anou Jct", "lat": 17.9612, "lng": 102.6105, "elevation": 158.8},
            "C": {"name": "Quai Fa Ngum (East) - Pangkham Jct", "lat": 17.9599, "lng": 102.6133, "elevation": 159.0},
            "D": {"name": "Presidential Palace - Lane Xang Jct", "lat": 17.9590, "lng": 102.6150, "elevation": 160.2},
            
            "E": {"name": "Samsenthai Rd - Francois Ngin Jct", "lat": 17.9662, "lng": 102.6079, "elevation": 170.2},
            "F": {"name": "Samsenthai Rd - Chao Anou Jct", "lat": 17.9654, "lng": 102.6111, "elevation": 170.8},
            "G": {"name": "Samsenthai Rd - Pangkham Jct", "lat": 17.9642, "lng": 102.6136, "elevation": 171.1},
            "H": {"name": "Samsenthai Rd - Lane Xang Jct", "lat": 17.9632, "lng": 102.6156, "elevation": 171.5},
            
            "I": {"name": "Patuxai Monument (Lane Xang North)", "lat": 17.9705, "lng": 102.6186, "elevation": 172.5},
            
            "J": {"name": "Setthathilath Rd - Chao Anou Jct", "lat": 17.9627, "lng": 102.6108, "elevation": 163.5},
            "K": {"name": "Setthathilath Rd - Pangkham Jct", "lat": 17.9617, "lng": 102.6134, "elevation": 163.8},
            
            "L": {"name": "Chao Anou Alleyway (Unpaved)", "lat": 17.9658, "lng": 102.6095, "elevation": 169.8},

            # Expanded Core Nodes (M - T)
            "M": {"name": "Quai Fa Ngum - Khoun Boulom Jct (Far West Riverfront)", "lat": 17.9645, "lng": 102.6045, "elevation": 158.0},
            "N": {"name": "Samsenthai - Khoun Boulom Jct (Far West Inland)", "lat": 17.9678, "lng": 102.6048, "elevation": 169.5},
            "O": {"name": "Setthathilath - Khoun Boulom Jct (Far West Mid)", "lat": 17.9652, "lng": 102.6047, "elevation": 163.0},
            "P": {"name": "Talat Sao Morning Market (Kouvieng / Lane Xang Jct)", "lat": 17.9622, "lng": 102.6185, "elevation": 171.0},
            "Q": {"name": "That Luang Golden Stupa (Northeast Plateau)", "lat": 17.9735, "lng": 102.6360, "elevation": 175.5},
            "R": {"name": "Nongbone Rd - That Luang Rd Jct (Northeast)", "lat": 17.9715, "lng": 102.6265, "elevation": 173.0},
            "S": {"name": "Souphanouvong Boulevard (Airport Highway)", "lat": 17.9692, "lng": 102.5975, "elevation": 168.0},
            "T": {"name": "Rue Hengboun Night Market Street (Alley)", "lat": 17.9668, "lng": 102.6090, "elevation": 169.0},

            # Metropolitan Expanded Nodes (U - AE)
            "U": {"name": "Sikhay Jct (Luang Prabang Rd / T2 West)", "lat": 17.9850, "lng": 102.5720, "elevation": 166.0},
            "V": {"name": "Dongdok NUOL Campus (North University)", "lat": 18.0280, "lng": 102.6390, "elevation": 176.0},
            "W": {"name": "Kaysone Jct / T4 North (Northern Entrance)", "lat": 17.9980, "lng": 102.6450, "elevation": 174.0},
            "X": {"name": "Phonxay Jct (Kaysone Phomvihane Ave / North Patuxai)", "lat": 17.9780, "lng": 102.6250, "elevation": 173.0},
            "Y": {"name": "Phonthan Junction (East Residential Hub)", "lat": 17.9620, "lng": 102.6350, "elevation": 171.0},
            "Z": {"name": "Thadeua Junction (Lao-Thai Bridge Gateway)", "lat": 17.9350, "lng": 102.6650, "elevation": 163.0},
            "AA": {"name": "Chinaimo Junction (Military Academy / Mekong South)", "lat": 17.9250, "lng": 102.6450, "elevation": 160.0},
            "AB": {"name": "Done Koy T4 Junction (Southern Belt Road)", "lat": 17.9650, "lng": 102.6550, "elevation": 170.0},
            "AC": {"name": "Sokpaluang Junction (Kouvieng / Sokpaluang Jct)", "lat": 17.9480, "lng": 102.6250, "elevation": 168.0},
            "AD": {"name": "Wat Nak Junction (Thadeua Rd / Sokpaluang South)", "lat": 17.9380, "lng": 102.6200, "elevation": 161.0},
            "AE": {"name": "Ban Done Koy Village (Unpaved Outskirts)", "lat": 17.9550, "lng": 102.6450, "elevation": 167.0}
        }
        
        # Edges (Road links). Bidirectional for simplification, but can have unique weights.
        # Fields: source, target, base_distance, surface (paved/unpaved), telemetry_segment_id, type
        self.edges = [
            # Mekong Riverfront road (Quai Fa Ngum) - high flood risk
            {"u": "A", "v": "B", "surface": "paved", "telemetry_id": "Quai_Fa_Ngum_West", "type": "primary"},
            {"u": "B", "v": "C", "surface": "paved", "telemetry_id": "Quai_Fa_Ngum_West", "type": "primary"},
            {"u": "C", "v": "D", "surface": "paved", "telemetry_id": "Quai_Fa_Ngum_East", "type": "primary"},
            {"u": "M", "v": "A", "surface": "paved", "telemetry_id": "Quai_Fa_Ngum_West", "type": "primary"},
            
            # Setthathilath Road - mid-level inland
            {"u": "A", "v": "J", "surface": "paved", "telemetry_id": "Setthathilath_Rd", "type": "secondary"},
            {"u": "J", "v": "K", "surface": "paved", "telemetry_id": "Setthathilath_Rd", "type": "secondary"},
            {"u": "K", "v": "D", "surface": "paved", "telemetry_id": "Setthathilath_Rd", "type": "secondary"},
            {"u": "O", "v": "J", "surface": "paved", "telemetry_id": "Setthathilath_Rd", "type": "secondary"},
            
            # Samsenthai Road - high inland arterial (very safe)
            {"u": "E", "v": "F", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "congested"},
            {"u": "F", "v": "G", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"},
            {"u": "G", "v": "H", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"},
            {"u": "N", "v": "E", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"},
            
            # Lane Xang Avenue - primary high-ground artery towards Patuxai & Morning Market
            {"u": "D", "v": "H", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"},
            {"u": "H", "v": "I", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"},
            {"u": "H", "v": "P", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"},
            {"u": "D", "v": "P", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "secondary"},
            
            # Transverse connection streets (elevated slope running riverwards to inland)
            {"u": "A", "v": "E", "surface": "paved", "telemetry_id": "Chao_Anou_South", "type": "residential"},
            {"u": "B", "v": "J", "surface": "paved", "telemetry_id": "Chao_Anou_South", "type": "residential"},
            {"u": "J", "v": "F", "surface": "paved", "telemetry_id": "Chao_Anou_North", "type": "residential"},
            {"u": "C", "v": "K", "surface": "paved", "telemetry_id": "Pangkham_South", "type": "residential"},
            {"u": "K", "v": "G", "surface": "paved", "telemetry_id": "Pangkham_North", "type": "residential"},
            {"u": "M", "v": "O", "surface": "paved", "telemetry_id": "Chao_Anou_South", "type": "residential"},
            {"u": "O", "v": "N", "surface": "paved", "telemetry_id": "Chao_Anou_North", "type": "residential"},
            
            # Unpaved shortcut (demonstrating Tuk-Tuk unpaved avoidance)
            {"u": "E", "v": "L", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "alley"},
            {"u": "L", "v": "F", "surface": "unpaved", "telemetry_id": "Samsenthai_Rd", "type": "alley"},
            
            # Expanded Eastward & Airport Road Connections
            {"u": "N", "v": "S", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "primary"},
            {"u": "S", "v": "U", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "primary"}, # Sikhay to Airport
            {"u": "I", "v": "R", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"},
            {"u": "R", "v": "Q", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"},
            {"u": "H", "v": "R", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"},
            
            # Expanded Alleys (Night Market shortcut)
            {"u": "N", "v": "T", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "alley"},
            {"u": "T", "v": "F", "surface": "unpaved", "telemetry_id": "Samsenthai_Rd", "type": "alley"},

            # Metropolitan Core Arteries (U - AE Connections)
            {"u": "I", "v": "X", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"}, # Patuxai to Phonxay Jct
            {"u": "X", "v": "W", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"}, # Phonxay to T4 Jct
            {"u": "W", "v": "V", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"}, # T4 Jct to Dongdok (NUOL)
            {"u": "R", "v": "X", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "secondary"}, # Nongbone to Phonxay
            {"u": "Q", "v": "W", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "secondary"}, # That Luang to Kaysone
            {"u": "Q", "v": "Y", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"}, # That Luang to Phonthan
            
            {"u": "P", "v": "AC", "surface": "paved", "telemetry_id": "Lane_Xang_Ave", "type": "primary"}, # Talat Sao to Sokpaluang
            {"u": "P", "v": "Y", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"}, # Talat Sao to Phonthan
            {"u": "AC", "v": "AD", "surface": "paved", "telemetry_id": "Setthathilath_Rd", "type": "secondary"}, # Sokpaluang to Wat Nak
            {"u": "AD", "v": "AA", "surface": "paved", "telemetry_id": "Quai_Fa_Ngum_East", "type": "secondary"}, # Wat Nak to Chinaimo (low-lying)
            {"u": "AA", "v": "Z", "surface": "paved", "telemetry_id": "Quai_Fa_Ngum_East", "type": "secondary"}, # Chinaimo to Border Gateway (low-lying)
            {"u": "Z", "v": "AB", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"}, # Border Gateway to T4 Done Koy
            {"u": "AB", "v": "W", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"}, # T4 Done Koy to Kaysone Jct
            {"u": "Y", "v": "AB", "surface": "paved", "telemetry_id": "Samsenthai_Rd", "type": "secondary"}, # Phonthan to T4 Jct
            
            # Suburban Unpaved Road Simulation (Done Koy Village)
            {"u": "Y", "v": "AE", "surface": "unpaved", "telemetry_id": "Samsenthai_Rd", "type": "alley"}, # Mud hazard in wet season
            {"u": "AE", "v": "AB", "surface": "unpaved", "telemetry_id": "Samsenthai_Rd", "type": "alley"} # Mud hazard in wet season
        ]
        
        # Hydrate base distances
        for edge in self.edges:
            n1 = self.nodes[edge["u"]]
            n2 = self.nodes[edge["v"]]
            edge["distance"] = haversine_distance(n1["lat"], n1["lng"], n2["lat"], n2["lng"])

    def get_adjacency_list(self, vehicle: str, telemetry_data: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generates an adjacency list where weights are adjusted based on:
        - Surface type penalties (specifically for tuk-tuks)
        - Dynamic flood telemetry (water depth and segment passability thresholds)
        """
        adj = {node_id: [] for node_id in self.nodes}
        
        # Vehicle specifications
        # Max water depth (meters) a vehicle can safely traverse
        # Tuk-tuks: three wheels, low floor, exposed engine -> 0.15m limit
        # Motorcycles: exhaust pipe height -> 0.22m limit
        # Standard Cars: typical city car height -> 0.30m limit
        depth_thresholds = {
            "tuktuk": 0.15,
            "motorcycle": 0.22,
            "car": 0.30
        }
        
        vehicle_threshold = depth_thresholds.get(vehicle, 0.30)
        
        # Surface penalty factors (multiplier to edge weight/travel time)
        # Tuk-tuks heavily penalize unpaved roads due to stability/safety concerns
        unpaved_penalties = {
            "tuktuk": 6.5,       # 650% penalty (heavily avoids mud/dirt)
            "motorcycle": 2.5,   # 250% penalty (risk of slipping in mud)
            "car": 1.5           # 150% penalty (uncomfortable but passable)
        }
        unpaved_penalty = unpaved_penalties.get(vehicle, 1.5)

        for edge in self.edges:
            u, v = edge["u"], edge["v"]
            dist = edge["distance"]
            surface = edge["surface"]
            telemetry_id = edge["telemetry_id"]
            
            # Fetch flood telemetry data for this edge
            flood_depth = 0.0
            if telemetry_data and telemetry_id in telemetry_data:
                flood_depth = telemetry_data[telemetry_id]["water_depth_m"]
            
            # CHECK 1: If road is fully flooded beyond safety threshold, disconnect/ignore it
            if flood_depth >= vehicle_threshold:
                # Disconnected! Road is closed for this vehicle type
                continue
                
            # CHECK 2: Calculate dynamic weight (representing travel time / risk score)
            # Base weight is distance multiplied by road type factor
            road_multipliers = {
                "primary": 1.0,
                "secondary": 1.3,
                "residential": 1.8,
                "alley": 2.0,
                "congested": 5.0
            }
            weight = dist * road_multipliers.get(edge.get("type", "secondary"), 1.3)
            
            # Apply surface penalty
            if surface == "unpaved":
                weight *= unpaved_penalty
                
            # Apply water depth weight penalty (even if passable, vehicle must slow down)
            if flood_depth > 0.02:
                # As water depth approaches the safety threshold, speed approaches 10% of standard speed,
                # which scales the routing cost exponentially.
                closeness_ratio = flood_depth / vehicle_threshold
                flood_penalty = 1.0 + (closeness_ratio * 8.0) # Up to 9x weight penalty
                weight *= flood_penalty
                
            # Append bidirectional edge
            adj[u].append({"target": v, "weight": weight, "distance": dist, "surface": surface, "flood_depth": flood_depth})
            adj[v].append({"target": u, "weight": weight, "distance": dist, "surface": surface, "flood_depth": flood_depth})
            
        return adj

    def solve_route(self, start: str, end: str, vehicle: str, telemetry_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs Dijkstra's algorithm to find the safest, fastest route.
        Returns a dict containing coordinates, path, total distance, and routing remarks.
        """
        if start not in self.nodes or end not in self.nodes:
            return {"error": "Invalid start or end node"}
            
        adj = self.get_adjacency_list(vehicle, telemetry_data)
        
        # Priority queue stores tuples of (current_weight, current_node, path_history)
        pq = [(0.0, start, [start])]
        visited = {}
        
        while pq:
            current_weight, curr, path = heapq.heappop(pq)
            
            if curr == end:
                # Found shortest path!
                # Generate GeoJSON line feature
                coordinates = [[self.nodes[node]["lng"], self.nodes[node]["lat"]] for node in path]
                
                # Retrieve statistics
                total_dist = 0.0
                max_water_encountered = 0.0
                unpaved_traversed = False
                
                for i in range(len(path) - 1):
                    u_node, v_node = path[i], path[i+1]
                    # Find matching edge in original list to retrieve stats
                    for edge in self.edges:
                        if (edge["u"] == u_node and edge["v"] == v_node) or (edge["u"] == v_node and edge["v"] == u_node):
                            total_dist += edge["distance"]
                            if edge["surface"] == "unpaved":
                                unpaved_traversed = True
                            if telemetry_data and edge["telemetry_id"] in telemetry_data:
                                max_water_encountered = max(max_water_encountered, telemetry_data[edge["telemetry_id"]]["water_depth_m"])
                                
                remarks = []
                if max_water_encountered > 0.0:
                    remarks.append(f"주의: 최대 {max_water_encountered:.2f}m 깊이의 침수 도로 구간을 통과합니다.")
                if unpaved_traversed:
                    remarks.append("경로에 진흙 유실 위험이 높은 비포장도로가 포함되어 있습니다.")
                if not remarks:
                    remarks.append("포장 완료된 안전한 건조 도로 위주의 최적 경로입니다.")
                    
                return {
                    "success": True,
                    "path": path,
                    "geojson": {
                        "type": "Feature",
                        "properties": {
                            "vehicle": vehicle,
                            "distance_m": round(total_dist, 1),
                            "max_water_depth": round(max_water_encountered, 3),
                            "remarks": " | ".join(remarks)
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": coordinates
                        }
                    },
                    "distance_m": round(total_dist, 1),
                    "remarks": remarks
                }
                
            if curr in visited and visited[curr] <= current_weight:
                continue
                
            visited[curr] = current_weight
            
            for neighbor in adj[curr]:
                target = neighbor["target"]
                edge_weight = neighbor["weight"]
                
                if target not in visited or visited[target] > current_weight + edge_weight:
                    heapq.heappush(pq, (current_weight + edge_weight, target, path + [target]))
                    
        return {"error": "안전한 대피 경로를 찾을 수 없습니다. 모든 진입로가 심각한 홍수로 차단되었습니다."}

# Singleton instance of Vientiane Router
vientiane_router = VientianeRouter()

if __name__ == "__main__":
    from telemetry import telemetry_pipeline
    
    # Simple verification test
    print("=== OSRM / Python Route Solver Test ===")
    
    # Scenario 1: Dry season, Tuk-tuk wants to go from E (Inland West) to F (Inland Center)
    # E -> L -> F is 300m, but L -> F is unpaved. E -> F (direct) is 350m (paved).
    # Since Tuk-Tuk heavily penalizes unpaved, it should choose E -> F directly instead of the shortcut.
    dry_telemetry = telemetry_pipeline.calculate_inundation(0.0, 9.5)
    route_tuktuk = vientiane_router.solve_route("E", "F", "tuktuk", dry_telemetry)
    print("Tuk-Tuk dry path:", route_tuktuk["path"], "| Remarks:", route_tuktuk["remarks"])
    
    # Scenario 2: Car wants to go from E to F (should take E -> L -> F shortcut because the penalty is small for cars)
    route_car = vientiane_router.solve_route("E", "F", "car", dry_telemetry)
    print("Car dry path:", route_car["path"])
    
    # Scenario 3: Flood season (Mekong riverfront flooded)
    # Route from A (Mekong West) to I (Patuxai)
    # Dry route should be A -> B -> C -> D -> H -> I (Riverfront road Quai Fa Ngum to Lane Xang)
    route_dry_palace = vientiane_router.solve_route("A", "I", "tuktuk", dry_telemetry)
    print("Dry Riverfront route:", route_dry_palace["path"])
    
    # Now flood it
    wet_telemetry = telemetry_pipeline.calculate_inundation(90.0, 13.5)
    route_wet_palace = vientiane_router.solve_route("A", "I", "tuktuk", wet_telemetry)
    print("Flooded route:", route_wet_palace["path"], "| Remarks:", route_wet_palace.get("remarks", route_wet_palace.get("error")))
