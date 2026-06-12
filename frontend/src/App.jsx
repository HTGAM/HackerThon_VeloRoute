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
  Compass as TukTukIcon,
  Siren,
  Shield,
  AlertCircle,
  Trash2
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
  "L": "차오아누 골목길 (비포장 지름길 Shortcut)",
  
  // Metropolitan Expanded Nodes (M - AE)
  "M": "메콩강변 서서부 (Quai Fa Ngum / Khoun Boulom 교차로)",
  "N": "삼센타이 서서부 (Samsenthai / Khoun Boulom 교차로)",
  "O": "셋타티랏 서서부 (Setthathilath / Khoun Boulom 교차로)",
  "P": "딸랏싸오 아침시장 (Talat Sao Mall / Lane Xang 남부)",
  "Q": "탓루앙 황금사원 (That Luang Stupa 광장)",
  "R": "농본 교차로 (Nongbone Rd / That Luang Rd Jct)",
  "S": "수파누봉 대로 (Souphanouvong Blvd / 공항 방향 대로)",
  "T": "헹분 거리 (Rue Hengboun 비포장 야시장 골목)",
  "U": "식하이 교차로 (Sikhay Jct / 공항 서부 대로)",
  "V": "동독 국립대학교 캠퍼스 (Dongdok / NUOL)",
  "W": "란쌍-T4 북부 교차로 (Kaysone Jct / T4 North)",
  "X": "폰사이 교차로 (Phonxay Jct / Patuxai 북부)",
  "Y": "폰탄 교차로 (Phonthan Jct / 동부 주거지)",
  "Z": "타데아 교차로 (Thadeua Jct / 우정의 다리 국경 게이트)",
  "AA": "치나이모 교차로 (Chinaimo Jct / 메콩강 남부 군사학교)",
  "AB": "돈꼬이 T4 교차로 (Done Koy / T4 Center)",
  "AC": "속팔루앙 교차로 (Sokpaluang / Kouvieng Jct)",
  "AD": "왓낙 강변 교차로 (Wat Nak Jct / Thadeua Rd)",
  "AE": "돈꼬이 외곽 마을 (Done Koy Village / 비포장 외곽 주거지)",

  // Hyper-Expanded Nodes (AF - AO)
  "AF": "와타이 국제공항 여객터미널 (Wattay Airport Terminal)",
  "AG": "와타이 마을 (Ban Wattay Village / 비포장 골목길)",
  "AH": "폰통 교차로 (Phontong Jct / 북부 외곽 도로)",
  "AI": "농타 호수공원 (Nongtha Lake Jct / 북부 친환경 호수)",
  "AJ": "폰사이 동부 주거지 (Phonxay East / Nongbone 연동)",
  "AK": "탓루앙 캉 마을 (Ban That Luang Kang / 사원 뒤 비포장 주거지)",
  "AL": "속팔루앙 산림공원 (Sokpaluang Forest Park)",
  "AM": "돈꼬이 동부 주택가 (Done Koy East Jct)",
  "AN": "타데아 서부 강변로 (Wat Nak West / 메콩강 남부 저지대)",
  "AO": "폰시누안 주거단지 (Ban Phonsinuan)"
};

// Map center adjuster helper component
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13); // Changed zoom from 15 to 13 to support wider viewport
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
  
  // New Evacuation and Hazard States
  const [isEvacMode, setIsEvacMode] = useState(false);
  const [hazards, setHazards] = useState([]);
  
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

  // Helper to fetch active hazards
  const fetchHazards = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hazards`);
      const data = await res.json();
      setHazards(data);
    } catch (err) {
      console.error("Error fetching hazards:", err);
    }
  };

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
        
        // 3. Fetch Hazards
        await fetchHazards();
        
        // 4. Fetch Dynamic Routing
        let routeUrl = `${API_BASE}/api/route?start=${startNode}&end=${endNode}&vehicle=${vehicle}&rain_intensity=${rainIntensity}&river_level=${riverLevel}`;
        if (isEvacMode) {
          routeUrl = `${API_BASE}/api/evacuate?start=${startNode}&vehicle=${vehicle}&rain_intensity=${rainIntensity}&river_level=${riverLevel}`;
        }
        
        const routeRes = await fetch(routeUrl);
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
  }, [rainIntensity, riverLevel, startNode, endNode, vehicle, isEvacMode]);

  // Hazard Report Actions
  const handleReportHazard = async (nodeId, hazardType) => {
    try {
      const res = await fetch(`${API_BASE}/api/report-hazard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node: nodeId, hazard_type: hazardType })
      });
      const data = await res.json();
      if (data.success) {
        await fetchHazards();
      }
    } catch (err) {
      console.error("Failed to report hazard:", err);
    }
  };

  const handleRemoveSingleHazard = async (nodeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/hazards/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node: nodeId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchHazards();
      }
    } catch (err) {
      console.error("Failed to remove hazard:", err);
    }
  };

  const handleClearHazards = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hazards/clear`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setHazards([]);
      }
    } catch (err) {
      console.error("Failed to clear hazards:", err);
    }
  };

  const isShelter = (id) => ['I', 'Q', 'V', 'P'].includes(id);
  const getNodeHazard = (id) => hazards.find(h => h.node === id);
  const getHazardLabel = (type) => {
    const map = {
      'flood': '🌊 침수',
      'accident': '💥 사고',
      'pothole': '🕳️ 포트홀',
      'police': '🚧 통제'
    };
    return map[type] || type;
  };

  // Weather Alert Level logic
  const getWeatherAlert = () => {
    if (rainIntensity >= 90 || riverLevel >= 13.0) {
      return {
        level: 'CRITICAL',
        title: '🚨 기상 재난 경보: 저지대 완전 폐쇄 및 대피 권고 🚨',
        msg: '메콩강변 및 저지대가 심각하게 침수되었습니다. 안전한 고지대 대피소 경로를 확인하고 즉시 이동하십시오.',
        color: '#ef4444',
        class: 'alert-critical'
      };
    } else if (rainIntensity >= 50 || riverLevel >= 11.5) {
      return {
        level: 'WARNING',
        title: '⚠️ 기상 경보: 우기 호우 주의 경보',
        msg: '강변 도로(Quai Fa Ngum) 일부가 물에 잠겼습니다. 삼센타이 등 고지대 안전 경로로 우회 운행하세요.',
        color: '#f97316',
        class: 'alert-warning'
      };
    } else if (rainIntensity >= 20 || riverLevel >= 10.5) {
      return {
        level: 'CAUTION',
        title: '⚡ 기상 주의보: 노면 미끄러움 및 지름길 차단 우려',
        msg: '지름길 야시장 골목 등 비포장도로는 진흙 수렁이 될 위험이 큽니다. 가급적 큰길을 사용하십시오.',
        color: '#eab308',
        class: 'alert-caution'
      };
    } else {
      return {
        level: 'NORMAL',
        title: '☀️ 기상 상황: 안전 운행 환경',
        msg: '현재 비엔티안 중심부의 도로 상태가 안정적입니다. 안전거리를 유지하며 운행하십시오.',
        color: '#10b981',
        class: 'alert-normal'
      };
    }
  };

  const weatherAlert = getWeatherAlert();

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Weather Alert Notification Banner */}
      <div 
        className={`weather-banner ${weatherAlert.class}`} 
        style={{
          background: weatherAlert.color,
          color: '#fff',
          padding: '0.65rem 1rem',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '0.88rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.15rem',
          zIndex: 100,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          {weatherAlert.level === 'CRITICAL' && <Siren size={18} className="flooded-pulse" />}
          <span>{weatherAlert.title}</span>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.9 }}>
          {weatherAlert.msg}
        </div>
      </div>

      <div className="app-container" style={{ flexGrow: 1, height: 'calc(100vh - 55px)', gridTemplateRows: '1fr', display: 'grid' }}>
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
              disabled={isEvacMode}
              style={{
                opacity: isEvacMode ? 0.5 : 1,
                cursor: isEvacMode ? 'not-allowed' : 'pointer',
                borderColor: isEvacMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'
              }}
            >
              {Object.entries(NODE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  Node {id}: {label} {isShelter(id) && '🛡️ (대피소)'}
                </option>
              ))}
            </select>
            {isEvacMode && (
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold', marginTop: '0.15rem' }}>
                🛡️ 대피소 긴급 탐색 진행 중 (목적지 지정 불가)
              </span>
            )}
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

        {/* Emergency Evacuation & Community Actions */}
        <div className="control-card">
          <div className="card-title">
            <Shield size={18} style={{ color: isEvacMode ? '#ef4444' : '#10b981' }} />
            <h2>재난 안전 대응 센터</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setIsEvacMode(!isEvacMode);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#fff',
                background: isEvacMode 
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: isEvacMode ? '0 0 10px rgba(16,185,129,0.3)' : '0 0 10px rgba(239,68,68,0.3)',
                animation: !isEvacMode && (rainIntensity >= 50 || riverLevel >= 11.5) ? 'pulse 1.5s infinite' : 'none'
              }}
            >
              {isEvacMode ? (
                <>
                  <Navigation size={16} />
                  일반 길찾기 모드 전환
                </>
              ) : (
                <>
                  <Siren size={16} className="flooded-pulse" />
                  🚨 긴급 대피소 최적 경로 탐색
                </>
              )}
            </button>

            {hazards.length > 0 && (
              <button
                onClick={handleClearHazards}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  color: '#fca5a5',
                  background: 'rgba(239, 68, 68, 0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              >
                <Trash2 size={14} />
                모든 제보 장애물 해제 ({hazards.length}개)
              </button>
            )}
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
          zoom={13} // Set default viewport zoom to 13 to view the expanded metropolitan map
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
            const isShelterNode = isShelter(id);
            const hazardOnNode = getNodeHazard(id);
            
            // Determine marker size and styling
            let radius = 7;
            let markerColor = 'var(--accent-blue)';
            let strokeColor = '#ffffff';
            let strokeWidth = 1.5;
            
            if (isStart) {
              markerColor = 'var(--status-safe)';
              radius = 10;
            } else if (isEnd && !isEvacMode) {
              markerColor = '#a855f7'; // Purple
              radius = 10;
            } else if (isShelterNode) {
              markerColor = '#10b981'; // Green for shelters
              radius = 9;
              strokeColor = '#ffffff';
              strokeWidth = 2.5; // Bold outline
            }
            
            // Overrides for hazard nodes
            if (hazardOnNode) {
              markerColor = '#f97316'; // Orange warning
              radius = isStart || isEnd ? 10 : 8;
            }

            return (
              <CircleMarker
                key={id}
                center={[info.lat, info.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: markerColor,
                  fillOpacity: 0.9,
                  color: strokeColor,
                  weight: strokeWidth
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontSize: '0.85rem', width: '220px' }}>
                    <h4 style={{ fontWeight: '700', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.4rem' }}>
                      체크포인트 Node {id} {isShelterNode && "🛡️ (안전대피소)"}
                    </h4>
                    <p style={{ margin: '0.2rem 0', fontWeight: '500', lineHeight: 1.2 }}>{NODE_LABELS[id] || info.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>지표 고도: {info.elevation}m</p>
                    
                    {/* 경로 설정 버튼 */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <button 
                        onClick={() => setStartNode(id)}
                        style={{ padding: '0.25rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem', flex: 1, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px' }}
                      >
                        출발지
                      </button>
                      <button 
                        onClick={() => setEndNode(id)}
                        disabled={isEvacMode}
                        style={{ 
                          padding: '0.25rem 0.4rem', 
                          cursor: isEvacMode ? 'not-allowed' : 'pointer', 
                          fontSize: '0.75rem', 
                          flex: 1, 
                          backgroundColor: isEvacMode ? '#ccc' : '#a855f7', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '4px' 
                        }}
                      >
                        목적지
                      </button>
                    </div>

                    {/* 실시간 장애물 제보 섹션 */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
                        <AlertTriangle size={12} /> 실시간 장애물 제보
                      </span>
                      
                      {hazardOnNode ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fee2e2', padding: '0.3rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{getHazardLabel(hazardOnNode.hazard_type)} 등록됨</span>
                          <button 
                            onClick={() => handleRemoveSingleHazard(id)}
                            style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="해제하기"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
                          <button 
                            onClick={() => handleReportHazard(id, 'flood')}
                            style={{ padding: '0.25rem 0.2rem', fontSize: '0.7rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#f8fafc' }}
                          >
                            🌊 도로침수
                          </button>
                          <button 
                            onClick={() => handleReportHazard(id, 'accident')}
                            style={{ padding: '0.25rem 0.2rem', fontSize: '0.7rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#f8fafc' }}
                          >
                            💥 사고발생
                          </button>
                          <button 
                            onClick={() => handleReportHazard(id, 'pothole')}
                            style={{ padding: '0.25rem 0.2rem', fontSize: '0.7rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#f8fafc' }}
                          >
                            🕳️ 포트홀
                          </button>
                          <button 
                            onClick={() => handleReportHazard(id, 'police')}
                            style={{ padding: '0.25rem 0.2rem', fontSize: '0.7rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#f8fafc' }}
                          >
                            🚧 도로통제
                          </button>
                        </div>
                      )}
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
        <div className="map-overlay-widget" style={{ border: isEvacMode ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="widget-header" style={{ color: isEvacMode ? '#ef4444' : '#e2e8f0' }}>
            {isEvacMode ? <Shield size={16} /> : <Navigation2 size={16} />}
            <span>{isEvacMode ? '🚨 긴급 안전 대피로 피드' : '실시간 안전 내비게이션 피드'}</span>
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
              {isEvacMode && routeData.shelter_name && (
                <div className="widget-remarks" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#a7f3d0', marginBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <Shield size={14} style={{ color: '#10b981' }} />
                    <span style={{ fontWeight: 'bold' }}>대피소: {routeData.shelter_name}</span>
                  </div>
                </div>
              )}
              <div className="widget-stat">
                <span className="widget-label">예상 경로 총 거리</span>
                <span className="widget-value">{routeData.distance_m} m</span>
              </div>
              <div className="widget-stat">
                <span className="widget-label">최대 침수 조우 깊이</span>
                <span className="widget-value">{routeData.geojson?.properties?.max_water_depth?.toFixed(3) || 0.000} m</span>
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
                  <span>{routeData.remarks?.join(" ") || "경로를 정상 안내 중입니다."}</span>
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
