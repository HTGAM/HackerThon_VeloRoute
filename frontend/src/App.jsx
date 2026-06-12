// VeloRoute Vientiane: React Live Map Dashboard
// Architecture Focus: Renders dynamic flood polygons, safe vehicle routing paths, and live hydrology simulations.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import { 
  Droplets, 
  Navigation, 
  Navigation2,
  Compass, 
  MapPin, 
  AlertTriangle, 
  Info, 
  Activity, 
  CloudRain, 
  Waves,
  Bike,
  Car,
  Compass as TukTukIcon 
} from 'lucide-react';

// API Configuration
const API_BASE = 'http://localhost:8000';

// Central Vientiane coordinates
const MAP_CENTER = [17.9642, 102.6120];

// Node details helper - Localized to Korean
const NODE_LABELS = {
  "A": "메콩강변 서부 (Quai Fa Ngum / Rue Francois Ngin 교차로)",
  "B": "메콩강변 중앙 (Quai Fa Ngum / Chao Anou 교차로)",
  "C": "메콩강변 동부 (Quai Fa Ngum / Pangkham 교차로)",
  "D": "대통령궁 앞 대로 (Presidential Palace / Lane Xang Jct)",
  "E": "삼센타이 서부 (Samsenthai / Rue Francois Ngin 교차로)",
  "F": "삼센타이 중앙 (Samsenthai / Chao Anou 교차로)",
  "G": "삼센타이 동부 (Samsenthai / Pangkham 교차로)",
  "H": "삼센타이 대로 Jct (Samsenthai / Lane Xang Jct)",
  "I": "빠뚜사이 독립기념탑 (Patuxai Monument)",
  "J": "셋타티랏 중앙 (Setthathilath / Chao Anou 교차로)",
  "K": "셋타티랏 동부 (Setthathilath / Pangkham 교차로)",
  "L": "차오아누 골목길 (비포장 지름길 Shortcut)"
};

// Map center adjuster helper component
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function App() {
  // Environmental simulation states
  const [rainIntensity, setRainIntensity] = useState(0); // mm/h
  const [riverLevel, setRiverLevel] = useState(9.5); // meters above baseline
  
  // Routing settings
  const [startNode, setStartNode] = useState('A');
  const [endNode, setEndNode] = useState('I');
  const [vehicle, setVehicle] = useState('tuktuk'); // tuktuk, motorcycle, car
  
  // Dynamic API response data
  const [telemetry, setTelemetry] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [floodZones, setFloodZones] = useState([]);
  const [nodes, setNodes] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  
  // Load initial nodes on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/nodes`)
      .then(res => res.json())
      .then(data => setNodes(data))
      .catch(err => console.error("Error loading nodes:", err));
  }, []);

  // Fetch telemetry, routing, and flood-zones whenever simulation inputs change
  useEffect(() => {
    const fetchEnvData = async () => {
      try {
        setErrorMsg('');
        
        // 1. Fetch Segment Inundation Telemetry
        const telRes = await fetch(`${API_BASE}/api/telemetry?rain_intensity=${rainIntensity}&river_level=${riverLevel}`);
        const telJson = await telRes.json();
        setTelemetry(telJson.segments);
        
        // 2. Fetch Flood Overlay Polygons
        const zoneRes = await fetch(`${API_BASE}/api/flood-zones?rain_intensity=${rainIntensity}&river_level=${riverLevel}`);
        const zoneJson = await zoneRes.json();
        setFloodZones(zoneJson.features || []);
        
        // 3. Fetch Dynamic Routing
        const routeRes = await fetch(
          `${API_BASE}/api/route?start=${startNode}&end=${endNode}&vehicle=${vehicle}&rain_intensity=${rainIntensity}&river_level=${riverLevel}`
        );
        const routeJson = await routeRes.json();
        
        if (routeJson.success) {
          setRouteData(routeJson);
        } else {
          setRouteData(null);
          setErrorMsg(routeJson.error);
        }
      } catch (err) {
        console.error("Network fetching failed:", err);
        setErrorMsg("API 게이트웨이가 오프라인 상태입니다. Docker 또는 백엔드 프로세스가 실행 중인지 확인하세요.");
      }
    };
    
    // Throttle API requests slightly to prevent spam during slider drag
    const timeout = setTimeout(fetchEnvData, 100);
    return () => clearTimeout(timeout);
  }, [rainIntensity, riverLevel, startNode, endNode, vehicle]);

  // Utility to determine color of route safety status
  const getRouteColor = () => {
    if (!routeData) return '#ef4444';
    const depth = routeData.geojson.properties.max_water_depth;
    if (depth === 0) return '#10b981'; // Paved and dry
    if (depth < 0.15) return '#eab308'; // Passable warning
    return '#ef4444'; // Danger
  };

  // Convert vehicle type to Korean string
  const getVehicleKorean = (type) => {
    const map = {
      'tuktuk': '뚝뚝 (Tuk-Tuk)',
      'motorcycle': '오토바이 (Moto)',
      'car': '승용차 (Car)'
    };
    return map[type] || type;
  };

  // Convert flood severity to Korean string
  const getSeverityKorean = (sev) => {
    const map = {
      'NORMAL': '정상 (안전)',
      'CAUTION_MINOR': '주의 (일부 침수)',
      'WARNING_MODERATE': '경고 (오토바이/뚝뚝 제한)',
      'CRITICAL_FLOOD': '위험 (모든 차량 차단)'
    };
    return map[sev] || sev;
  };

  return (
    <div className="app-container">
      {/* Sidebar Controls */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="logo-icon">V</div>
          <div className="brand-title-group">
            <h1>벨로루트 비엔티안</h1>
            <p>스마트시티 실시간 홍수 회피 내비</p>
          </div>
        </div>
        
        {/* Telemetry Telemetry Info */}
        <div className="control-card">
          <div className="card-title">
            <Activity size={18} />
            <h2>실시간 메콩강 센서 데이터 (Telemetry)</h2>
          </div>
          
          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">강수량 (몬순 우기)</span>
              <span className="slider-val">{rainIntensity} mm/h</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="120" 
              value={rainIntensity} 
              onChange={(e) => setRainIntensity(parseFloat(e.target.value))}
              className="range-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">메콩강 수위</span>
              <span className="slider-val">{riverLevel.toFixed(1)} m</span>
            </div>
            <input 
              type="range" 
              min="8.0" 
              max="15.0" 
              step="0.1"
              value={riverLevel} 
              onChange={(e) => setRiverLevel(parseFloat(e.target.value))}
              className="range-input"
            />
          </div>
        </div>

        {/* Route Setting Form */}
        <div className="control-card">
          <div className="card-title">
            <Navigation size={18} />
            <h2>길찾기 경로 설정</h2>
          </div>
          
          <div className="form-group">
            <label>출발지 선택</label>
            <select 
              className="select-control"
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
            >
              {Object.entries(NODE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>Node {id}: {label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>목적지 선택</label>
            <select 
              className="select-control"
              value={endNode}
              onChange={(e) => setEndNode(e.target.value)}
            >
              {Object.entries(NODE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>Node {id}: {label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>이동 수단 유형</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.2rem' }}>
              <button 
                onClick={() => setVehicle('car')}
                className={`select-control`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                  borderColor: vehicle === 'car' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  background: vehicle === 'car' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <Car size={18} />
                <span style={{ fontSize: '0.7rem' }}>승용차</span>
              </button>
              <button 
                onClick={() => setVehicle('tuktuk')}
                className={`select-control`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                  borderColor: vehicle === 'tuktuk' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  background: vehicle === 'tuktuk' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <TukTukIcon size={18} />
                <span style={{ fontSize: '0.7rem' }}>뚝뚝</span>
              </button>
              <button 
                onClick={() => setVehicle('motorcycle')}
                className={`select-control`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                  borderColor: vehicle === 'motorcycle' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  background: vehicle === 'motorcycle' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <Bike size={18} />
                <span style={{ fontSize: '0.7rem' }}>오토바이</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time telemetry Segment Status Feed */}
        <div className="control-card" style={{ flexGrow: 1 }}>
          <div className="card-title">
            <Droplets size={18} />
            <h2>실시간 도로 침수 현황</h2>
          </div>
          
          <div className="telemetry-list">
            {telemetry ? (
              Object.entries(telemetry).map(([id, info]) => {
                let badgeClass = 'status-dry';
                let statusName = '건조';
                if (info.status === 'PASSABLE_CAUTION') {
                  badgeClass = 'status-caution';
                  statusName = '주의';
                }
                if (info.status === 'WARNING_MOTO_RESTRICTED') {
                  badgeClass = 'status-caution';
                  statusName = '통제 주의';
                }
                if (info.status === 'FLOODED_IMPASSABLE') {
                  badgeClass = 'status-danger';
                  statusName = '침수 폐쇄';
                }
                
                return (
                  <div key={id} className="telemetry-item">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: '600' }}>{info.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        고도: {info.elevation}m | 깊이: {info.water_depth_m.toFixed(2)}m
                      </span>
                    </div>
                    <span className={`status-badge ${badgeClass}`}>
                      {statusName}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                수문학 시뮬레이션 모델 연결 중...
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Map Content */}
      <main className="map-container">
        {/* Mapbox/Leaflet rendering */}
        <MapContainer 
          center={MAP_CENTER} 
          zoom={15} 
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Dark Matter tiles provider for futuristic dark-mode visualization */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapController center={MAP_CENTER} />

          {/* Render translucent red hazard flood zone polygons */}
          {floodZones.map((zone, idx) => {
            const coords = zone.geometry.coordinates[0].map(pt => [pt[1], pt[0]]);
            const props = zone.properties;
            return (
              <Polygon
                key={idx}
                positions={coords}
                pathOptions={{
                  fillColor: props.fillColor,
                  fillOpacity: props.fillOpacity,
                  color: props.strokeColor,
                  weight: 2
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontSize: '0.85rem' }}>
                    <h4 style={{ fontWeight: '700' }}>{props.name}</h4>
                    <p style={{ margin: '0.2rem 0' }}>현재 물 높이: {props.water_depth_m}m</p>
                    <p style={{ fontWeight: '600' }}>침수 경보 단계: {getSeverityKorean(props.severity)}</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Render checkpoint nodes dynamically */}
          {Object.entries(nodes).map(([id, info]) => {
            const isStart = id === startNode;
            const isEnd = id === endNode;
            let markerColor = 'var(--accent-blue)';
            if (isStart) markerColor = 'var(--status-safe)';
            if (isEnd) markerColor = '#a855f7'; // Purple for destination
            
            return (
              <CircleMarker
                key={id}
                center={[info.lat, info.lng]}
                radius={isStart || isEnd ? 10 : 7}
                pathOptions={{
                  fillColor: markerColor,
                  fillOpacity: 0.9,
                  color: '#ffffff',
                  weight: 1.5
                }}
                eventHandlers={{
                  click: () => {
                    // Quick-set checkpoints
                    if (startNode === id) return;
                    setEndNode(id);
                  }
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontSize: '0.85rem' }}>
                    <h4 style={{ fontWeight: '700' }}>체크포인트 Node {id}</h4>
                    <p style={{ margin: '0.2rem 0', fontWeight: '500' }}>{NODE_LABELS[id] || info.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>지표 고도: {info.elevation}m</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => setStartNode(id)}
                        style={{ padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        출발지로 설정
                      </button>
                      <button 
                        onClick={() => setEndNode(id)}
                        style={{ padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        목적지로 설정
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Draw safety route polyline on map */}
          {routeData && routeData.geojson && (
            <Polyline
              positions={routeData.geojson.geometry.coordinates.map(pt => [pt[1], pt[0]])}
              pathOptions={{
                color: getRouteColor(),
                weight: 5,
                opacity: 0.85,
                dashArray: '10, 5' // dashed line showing directionality
              }}
            />
          )}
        </MapContainer>

        {/* Floating Route Status Overlay */}
        <div className="map-overlay-widget">
          <div className="widget-header">
            <Navigation2 size={16} />
            <span>실시간 안전 내비게이션 피드</span>
          </div>

          {errorMsg ? (
            <div className="widget-remarks" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            </div>
          ) : routeData ? (
            <>
              <div className="widget-stat">
                <span className="widget-label">예상 경로 총 거리</span>
                <span className="widget-value">{routeData.distance_m} m</span>
              </div>
              <div className="widget-stat">
                <span className="widget-label">최대 침수 조우 깊이</span>
                <span className="widget-value">{routeData.geojson.properties.max_water_depth.toFixed(3)} m</span>
              </div>
              <div className="widget-stat">
                <span className="widget-label">선택된 이동 수단</span>
                <span className="widget-value">
                  {getVehicleKorean(routeData.vehicle)}
                </span>
              </div>
              <div className="widget-remarks">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{routeData.remarks.join(" ")}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              안전 대피 경로를 계산하는 중...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
