// VeloRoute Vientiane: React Live Map Dashboard
// Architecture Focus: Renders dynamic flood polygons, safe vehicle routing paths, and live hydrology simulations.

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Trash2,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Video
} from 'lucide-react';

// Simulated AI CCTV Live Feed using HTML5 Canvas
function CCTVFeed({ stationId, name, depth, people, status, lang }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let frame = 0;

    // Generate semi-fixed pedestrian targets to walk around
    const targets = Array.from({ length: people }, (_, i) => ({
      x: 30 + Math.random() * (canvas.width - 90),
      y: 40 + Math.random() * (canvas.height - 100),
      w: 16 + Math.random() * 8,
      h: 35 + Math.random() * 15,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      id: `P${100 + i}`
    }));

    const render = () => {
      frame++;
      
      // 1. Draw CCTV Dark Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Radar Grid Lines
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 3. Draw Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = (frame % 3); y < canvas.height; y += 3) {
        ctx.fillRect(0, y, canvas.width, 1);
      }

      // 4. Draw water flooding if depth is positive
      if (depth > 0) {
        const waterHeight = Math.min(canvas.height - 30, 15 + depth * 250);
        const yStart = canvas.height - waterHeight;
        
        ctx.fillStyle = 'rgba(30, 58, 138, 0.35)'; // Semitransparent navy water
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(0, yStart);
        for (let x = 0; x <= canvas.width; x += 15) {
          const wave = Math.sin((x / 20) + (frame * 0.08)) * 3;
          ctx.lineTo(x, yStart + wave);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.fill();

        // Level threshold marker line
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, yStart);
        ctx.lineTo(canvas.width, yStart);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`WATER LVL: ${(depth*100).toFixed(0)}cm`, 10, yStart - 4);
      }

      // 5. Draw OpenCV bounding boxes around detected people
      targets.forEach(t => {
        t.x += t.vx;
        t.y += t.vy;
        if (t.x < 10 || t.x > canvas.width - t.w - 10) t.vx *= -1;
        if (t.y < 30 || t.y > canvas.height - t.h - 10) t.vy *= -1;

        ctx.strokeStyle = '#22d3ee'; // Neon Cyan
        ctx.lineWidth = 1.2;
        ctx.strokeRect(t.x, t.y, t.w, t.h);

        // Bounding box labels
        ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
        ctx.font = '7px monospace';
        ctx.fillText(`${t.id} (94%)`, t.x, t.y - 3);
      });

      // 6. Draw CCTV HUD (REC indicator, timestamp)
      if (Math.floor(frame / 30) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(15, 15, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('REC', 23, 18);

      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(timeStr, canvas.width - 70, 18);

      // Camera node info overlay
      ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.font = 'bold 7.5px monospace';
      ctx.fillText(`CAM_${stationId} @ NODE_${stationId}`, 10, canvas.height - 10);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [people, depth]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '140px', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(34, 211, 238, 0.3)' }}>
      <canvas ref={canvasRef} width={260} height={140} style={{ width: '100%', height: '100%', display: 'block' }} />
      {status === 'danger' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ef4444',
          fontSize: '0.75rem',
          fontWeight: 800,
          fontFamily: 'monospace',
          textShadow: '0 0 5px #000, 2px 2px 0 #000',
          animation: 'blink 0.5s infinite',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          ⚠️ AVOID: NO PEDESTRIANS
        </div>
      )}
    </div>
  );
}

// Simulated User Web Camera AI Object Detection Demo
function WebcamAICam({ isSidebarCollapsed }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsActive(true);
    } catch (err) {
      console.error(err);
      setError('카메라를 활성화할 수 없습니다. 권한을 확인하세요.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsActive(false);
  };

  useEffect(() => {
    if (!isActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let frame = 0;

    let boxX = 110;
    let boxY = 70;
    let boxW = 100;
    let boxH = 110;
    let targetX = 110;
    let targetY = 70;

    const draw = () => {
      frame++;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Scanline scan overlay
        ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
        for (let y = (frame % 4); y < canvas.height; y += 4) {
          ctx.fillRect(0, y, canvas.width, 1);
        }

        // Bounding box animation
        if (frame % 35 === 0) {
          targetX = 85 + Math.random() * 50;
          targetY = 45 + Math.random() * 40;
        }
        boxX += (targetX - boxX) * 0.1;
        boxY += (targetY - boxY) * 0.1;

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#22d3ee';
        const len = 8;
        ctx.fillRect(boxX - 2, boxY - 2, len, 3);
        ctx.fillRect(boxX - 2, boxY - 2, 3, len);
        ctx.fillRect(boxX + boxW - len + 2, boxY - 2, len, 3);
        ctx.fillRect(boxX + boxW - 1, boxY - 2, 3, len);
        ctx.fillRect(boxX - 2, boxY + boxH - 1, len, 3);
        ctx.fillRect(boxX - 2, boxY + boxH - len + 2, 3, len);
        ctx.fillRect(boxX + boxW - len + 2, boxY + boxH - 1, len, 3);
        ctx.fillRect(boxX + boxW - 1, boxY + boxH - len + 2, 3, len);

        ctx.fillStyle = 'rgba(34, 211, 238, 0.85)';
        ctx.fillRect(boxX, boxY - 14, 95, 14);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('PEDESTRIAN (98.7%)', boxX + 4, boxY - 4);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '7.5px monospace';
        ctx.fillText(`DEVICE: LOCAL_WEBCAM_AI`, 8, 15);
        ctx.fillText(`FPS: 30 / TEMP: 33.2C`, 8, 25);

        if (Math.floor(frame / 15) % 2 === 0) {
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(canvas.width - 15, 15, 3, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 7px monospace';
          ctx.fillText('AI ACTIVE', canvas.width - 58, 17);
        }
      } else {
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#22d3ee';
        ctx.font = '9px monospace';
        ctx.fillText('INITIALIZING WEBCAM STREAM...', 45, canvas.height / 2);
      }
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, stream]);

  return (
    <div style={{
      border: '1px solid rgba(0, 242, 254, 0.25)',
      background: 'rgba(10, 15, 30, 0.65)',
      borderRadius: '14px',
      padding: '0.75rem',
      marginTop: '0.8rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          📷 Live AI Camera 데모
        </span>
        <button
          onClick={isActive ? stopCamera : startCamera}
          style={{
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            borderRadius: '6px',
            border: 'none',
            background: isActive ? '#ef4444' : '#00f2fe',
            color: '#000',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isActive ? '카메라 끄기' : '카메라 켜기'}
        </button>
      </div>

      {error && <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>{error}</div>}

      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />

      {isActive ? (
        <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid rgba(34, 211, 238, 0.4)' }}>
          <canvas ref={canvasRef} width={320} height={240} style={{ width: '100%', height: '100%', display: 'block' }} />
          <div style={{
            position: 'absolute',
            bottom: '5px',
            left: '5px',
            background: 'rgba(0,0,0,0.7)',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            fontSize: '0.65rem',
            color: '#4ade80',
            border: '1px solid rgba(74, 222, 128, 0.3)'
          }}>
            ✓ 보행자(사용자) 인식 완료: 통행 주의 가능 반영
          </div>
        </div>
      ) : (
        <div style={{
          height: '80px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px dashed rgba(255,255,255,0.1)',
          fontSize: '0.7rem',
          color: '#94a3b8',
          textAlign: 'center',
          padding: '0 1rem',
          lineHeight: 1.4
        }}>
          [카메라 켜기] 버튼을 누르면 웹캠이 켜지며 실시간 보행자 인식 시뮬레이션 데모가 구동됩니다.
        </div>
      )}
    </div>
  );
}

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001';

// Central Vientiane coordinates
const MAP_CENTER = [17.9642, 102.6120];

// Node details helper - Localized to Korean
const NODE_LABELS_BY_LANG = {
  ko: {
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
  },
  lo: {
    "A": "ແຄມຂອງຕາເວັນຕົກ (Quai Fa Ngum / Rue Francois Ngin)",
    "B": "ແຄມຂອງໃຈກາງ (Quai Fa Ngum / Chao Anou)",
    "C": "ແຄມຂອງຕາເວັນອອກ (Quai Fa Ngum / Pangkham)",
    "D": "ຕໍ່ໜ້າຫໍຄຳ (Presidential Palace / Lane Xang Jct)",
    "E": "ສາມແສນໄທຕາເວັນຕົກ (Samsenthai / Rue Francois Ngin)",
    "F": "ສາມແສນໄທໃຈກາງ (Samsenthai / Chao Anou)",
    "G": "ສາມແສນໄທຕາເວັນອອກ (Samsenthai / Pangkham)",
    "H": "ສາມແສນໄທ ທາງແຍກໃຫຍ່ (Samsenthai / Lane Xang Jct)",
    "I": "ປະຕູໄຊ (Patuxai Monument)",
    "J": "ເສດຖາທਿລາດໃຈກາງ (Setthathilath / Chao Anou)",
    "K": "ເສດຖາທິລາດຕາເວັນອອກ (Setthathilath / Pangkham)",
    "L": "ທາງລັດເຈົ້າອານຸ (Shortcut)",
    "M": "ແຄມຂອງຕາເວັນຕົກສີກາຍ (Quai Fa Ngum / Khoun Boulom)",
    "N": "ສາມແສນໄທຕາເວັນຕົກສີກາຍ (Samsenthai / Khoun Boulom)",
    "O": "ເສດຖາທິລາດຕາເວັນຕົກສີກາຍ (Setthathilath / Khoun Boulom)",
    "P": "ຕະຫຼາດເຊົ້າ (Talat Sao Mall / Lane Xang ໃຕ້)",
    "Q": "ທາດຫຼວງ (That Luang Stupa ຫຼັກ)",
    "R": "ທາງແຍກໜອງບອນ (Nongbone Rd / That Luang Rd Jct)",
    "S": "ຖະໜົນສຸພານຸວົງ (Souphanouvong Blvd)",
    "T": "ຖະໜົນເຮັງບຸນ (Rue Hengboun)",
    "U": "ທາງແຍກສີໄຄ (Sikhay Jct)",
    "V": "ມະຫາວິທະຍาໄລແຫ່ງຊາດ ດົງໂດກ (Dongdok / NUOL)",
    "W": "ທາງແຍກໄກສອນ-T4 ເໜືອ (Kaysone Jct / T4 North)",
    "X": "ທາງແຍກໂພນໄຊ (Phonxay Jct / Patuxai ເໜືອ)",
    "Y": "ທາງແຍກໂພນທัน (Phonthan Jct)",
    "Z": "ທາງແຍກທ່າເດື່ອ (Thadeua Jct)",
    "AA": "ທາງແຍກຊີນາຍໂມ້ (Chinaimo Jct)",
    "AB": "ທາງແຍກດອນກອຍ T4 (Done Koy / T4 Center)",
    "AC": "ທາງແຍກໂສກປ່າຫຼວງ (Sokpaluang / Kouvieng Jct)",
    "AD": "ທາງແຍກວັດນາກ (Wat Nak Jct)",
    "AE": "ບ້ານດອນກອຍ ເຂດນອກ (Done Koy Village)",
    "AF": "ສະໜາມບິນສາກົນວັດໄຕ (Wattay Airport Terminal)",
    "AG": "ບ້ານວັດໄຕ (Ban Wattay Village)",
    "AH": "ທາງແຍກໂພນຕ້ອງ (Phontong Jct)",
    "AI": "ທາງແຍກໜອງທາ (Nongtha Lake Jct)",
    "AJ": "ເຂດທີ່ຢູ່ອາໄສໂພນໄຊ ຕາເວັນອອກ (Phonxay East)",
    "AK": "ບ້ານທາດຫຼວງກາງ (Ban That Luang Kang)",
    "AL": "ສວນປ່າໂສກປ່າຫຼວງ (Sokpaluang Forest Park)",
    "AM": "ທາງແຍກດອນກອຍ ຕາເວັນອອກ (Done Koy East Jct)",
    "AN": "ຖະໜົນແຄມຂອງວັດນາກໃຕ້ (Wat Nak West)",
    "AO": "ບ້ານໂພນສີນວນ (Ban Phonsinuan)"
  }
};

const GAME_EDGES = [
  { u: "A", v: "B", telemetry_id: "Quai_Fa_Ngum_West", surface: "paved" },
  { u: "B", v: "C", telemetry_id: "Quai_Fa_Ngum_West", surface: "paved" },
  { u: "C", v: "D", telemetry_id: "Quai_Fa_Ngum_East", surface: "paved" },
  { u: "M", v: "A", telemetry_id: "Quai_Fa_Ngum_West", surface: "paved" },
  { u: "A", v: "J", telemetry_id: "Setthathilath_Rd", surface: "paved" },
  { u: "J", v: "K", telemetry_id: "Setthathilath_Rd", surface: "paved" },
  { u: "K", v: "D", telemetry_id: "Setthathilath_Rd", surface: "paved" },
  { u: "O", v: "J", telemetry_id: "Setthathilath_Rd", surface: "paved" },
  { u: "E", v: "F", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "F", v: "G", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "G", v: "H", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "N", v: "E", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "D", v: "H", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "H", v: "I", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "H", v: "P", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "D", v: "P", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "A", v: "E", telemetry_id: "Chao_Anou_South", surface: "paved" },
  { u: "B", v: "J", telemetry_id: "Chao_Anou_South", surface: "paved" },
  { u: "J", v: "F", telemetry_id: "Chao_Anou_North", surface: "paved" },
  { u: "C", v: "K", telemetry_id: "Pangkham_South", surface: "paved" },
  { u: "K", v: "G", telemetry_id: "Pangkham_North", surface: "paved" },
  { u: "M", v: "O", telemetry_id: "Chao_Anou_South", surface: "paved" },
  { u: "O", v: "N", telemetry_id: "Chao_Anou_North", surface: "paved" },
  { u: "E", v: "L", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "L", v: "F", telemetry_id: "Samsenthai_Rd", surface: "unpaved" },
  { u: "N", v: "S", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "S", v: "U", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "I", v: "R", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "R", v: "Q", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "H", v: "R", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "N", v: "T", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "T", v: "F", telemetry_id: "Samsenthai_Rd", surface: "unpaved" },
  { u: "I", v: "X", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "X", v: "W", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "W", v: "V", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "R", v: "X", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "Q", v: "W", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "Q", v: "Y", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "P", v: "AC", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "P", v: "Y", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AC", v: "AD", telemetry_id: "Setthathilath_Rd", surface: "paved" },
  { u: "AD", v: "AA", telemetry_id: "Quai_Fa_Ngum_East", surface: "paved" },
  { u: "AA", v: "Z", telemetry_id: "Quai_Fa_Ngum_East", surface: "paved" },
  { u: "Z", v: "AB", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AB", v: "W", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "Y", v: "AB", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "Y", v: "AE", telemetry_id: "Samsenthai_Rd", surface: "unpaved" },
  { u: "AE", v: "AB", telemetry_id: "Samsenthai_Rd", surface: "unpaved" },
  { u: "AF", v: "U", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AF", v: "S", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AG", v: "S", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AG", v: "N", telemetry_id: "Samsenthai_Rd", surface: "unpaved" },
  { u: "AI", v: "S", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AI", v: "AH", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AH", v: "I", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "AH", v: "X", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "AJ", v: "X", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "AJ", v: "R", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "AJ", v: "Q", telemetry_id: "Lane_Xang_Ave", surface: "paved" },
  { u: "AK", v: "Q", telemetry_id: "Lane_Xang_Ave", surface: "unpaved" },
  { u: "AK", v: "W", telemetry_id: "Lane_Xang_Ave", surface: "unpaved" },
  { u: "AL", v: "AC", telemetry_id: "Setthathilath_Rd", surface: "paved" },
  { u: "AL", v: "AD", telemetry_id: "Setthathilath_Rd", surface: "paved" },
  { u: "AM", v: "AE", telemetry_id: "Samsenthai_Rd", surface: "unpaved" },
  { u: "AM", v: "AB", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AN", v: "AD", telemetry_id: "Quai_Fa_Ngum_East", surface: "paved" },
  { u: "AN", v: "A", telemetry_id: "Quai_Fa_Ngum_West", surface: "paved" },
  { u: "AO", v: "G", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AO", v: "H", telemetry_id: "Samsenthai_Rd", surface: "paved" },
  { u: "AO", v: "Y", telemetry_id: "Samsenthai_Rd", surface: "paved" }
];

const getAdjacencyList = () => {
  const adj = {};
  GAME_EDGES.forEach(edge => {
    if (!adj[edge.u]) adj[edge.u] = [];
    if (!adj[edge.v]) adj[edge.v] = [];
    adj[edge.u].push({ target: edge.v, telemetry_id: edge.telemetry_id, surface: edge.surface });
    adj[edge.v].push({ target: edge.u, telemetry_id: edge.telemetry_id, surface: edge.surface });
  });
  return adj;
};

const TRANSLATIONS = {
  ko: {
    expand_sidebar: "설정창 열기",
    collapse_sidebar: "설정창 접기",
    expand_widget: "경로 안내 열기",
    collapse_widget: "경로 안내 접기",
    brand_title: "스마트 내비게이션 (VeloRoute)",
    brand_subtitle: "실시간 스마트 홍수 우회 대시보드",
    sensor_title: "실시간 센서 데이터 (Telemetry)",
    rain_label: "강수량 (몬순 우기)",
    river_label: "메콩강 수위",
    route_title: "길찾기 경로 설정",
    start_label: "출발지 선택",
    end_label: "목적지 선택",
    vehicle_label: "이동 수단 유형",
    vehicle_car: "승용차",
    vehicle_tuktuk: "뚝뚝",
    vehicle_motorcycle: "오토바이",
    evac_searching: "🛡️ 대피소 긴급 탐색 진행 중 (목적지 지정 불가)",
    disaster_center: "재난 안전 대응 센터",
    btn_normal_mode: "일반 길찾기 모드",
    btn_evac_mode: "🚨 긴급 대피 경로 탐색",
    btn_clear_hazards: "모든 제보 장애물 해제",
    road_status_title: "실시간 도로 침수 현황",
    road_dry: "건조",
    road_caution: "주의",
    road_restrict: "통제 주의",
    road_flooded: "침수 폐쇄",
    sensor_connecting: "수문학 시뮬레이션 모델 연결 중...",
    elevation_m: "고도",
    depth_m: "깊이",
    node_popup_title: "체크포인트 Node",
    node_shelter: "안전대피소",
    node_elevation: "지표 고도",
    node_start_btn: "출발지",
    node_end_btn: "목적지",
    node_hazard_report: "실시간 장애물 제보",
    node_hazard_registered: "등록됨",
    node_hazard_flood: "🌊 도로침수",
    node_hazard_accident: "💥 사고발생",
    node_hazard_pothole: "🕳️ 포트홀",
    node_hazard_police: "🚧 도로통제",
    feed_title_normal: "실시간 안전 내비게이션 피드",
    feed_title_evac: "🚨 긴급 안전 대피로 피드",
    cert_label: "실시간 수문 시뮬레이션 안전 피드",
    distance: "예상 총 거리",
    safety_index: "경로 안전성 지수",
    logos_safe_value: "99.8% (최적)",
    logos_caution_value: "82.4% (감속 주의)",
    max_water: "최대 침수 깊이",
    selected_vehicle: "선택된 이동 수단",
    cal_routing: "안전 대피 경로를 계산하는 중...",
    route_ok: "경로를 정상 안내 중입니다.",
    shelter_dest: "대피소",
    tuktuk_ko: "뚝뚝 (Tuk-Tuk)",
    motorcycle_ko: "오토바이 (Moto)",
    car_ko: "승용차 (Car)",
    sev_normal: "정상 (안전)",
    sev_caution: "주의 (일부 침수)",
    sev_warning: "경고 (오토바이/뚝뚝 제한)",
    sev_critical: "위험 (모든 차량 차단)",
    alert_crit_title: "🚨 재난 경보: 저지대 침수 즉시 대피 권고",
    alert_crit_msg: "저지대 침수 위험이 매우 높습니다. 신속히 인근 안전 대피소로 대피해 주십시오.",
    alert_warn_title: "⚠️ 기상 경보: 강변 침수 및 고지대 우회 권고",
    alert_warn_msg: "일부 도로가 침수되었습니다. 안내되는 안전한 고지대 포장도로로 즉시 우회하십시오.",
    alert_caut_title: "⚡ 기상 주의보: 노면 미끄러움 감속 운행",
    alert_caut_msg: "노면이 미끄럽고 일부 진흙 구간이 예상됩니다. 간선도로로 감속 우회하십시오.",
    alert_norm_title: "☀️ 기상 상황: 안전하고 원활한 운행 가능",
    alert_norm_msg: "현재 기상 및 도로 상태가 안전합니다. 규정 속도 및 안전 거리를 준수하십시오.",
    physics_title: "도로 물리학 분석",
    physics_grip: "타이어 접지력",
    physics_buoyancy: "침수 부력 (Fb)",
    physics_vlimit: "안전 속도 한계",
    physics_drag: "유체 저항 (Fd)",
    golden_time_label: "🚨 안전 대피 골든타임",
    golden_time_blocked: "🚨 경로 완전 차단 (즉시 고지대 건물 옥상으로 대피하십시오!)",
    minutes_left: "분 남음 (서둘러 대피 요망)",
    safe_status: "안전 시간 충분 (침수 없음)",
    physics_oracle_title: "AI 물리학적 대피 가이드 (Physics Oracle)",
    oracle_safe: "정상 상태: 현재 메콩강 수위가 도로 경계 이하에 머물러 있으며, 도로 표면의 정지 마찰 계수(μ ≈ 0.65)가 안정적으로 확보되어 차량 제어력이 우수합니다. 관성의 법칙에 따라 급제동 시에도 미끄러짐이 적으나, 빗길 안전거리는 항상 유지하십시오.",
    oracle_caution: "주의 상태: 폭우로 인해 노면이 젖으며 마찰 계수가 급격히 저하되고 있습니다. 특히 비포장 지름길은 점성 진흙이 되어 타이어의 구름 저항을 높이고 정지 마찰력을 파괴하여 차량 전복 확률을 급증시킵니다. 물리 법칙에 따라 마찰력의 한계를 존중하며 서행해야 합니다.",
    oracle_warning: "경고 상태: 침수가 시작되며 차량이 아르키메데스의 부력(Fb = ρgV)을 받기 시작합니다. 물에 잠긴 부피에 비례하여 부력이 커짐에 따라, 지면이 받쳐주는 수직항력(N = mg - Fb)이 급감합니다. 마찰력 공식 f = μN에 따라 접지 마찰력이 거의 소실되어 뚝뚝이나 오토바이는 쉽게 빗길에 미끄러져 유실될 수 있습니다.",
    oracle_critical: "위험 상태: 메콩강 횡류에 의한 유체 저항력(항력 Fd = 1/2 Cd ρ A v²)이 타이어의 극소화된 최대 마찰 한계를 초과했습니다! 수직항력이 0에 수렴하여 바퀴가 공중에 뜬 수중 부유 상태가 되었으며, 이 상황에서는 아주 작은 물살의 힘으로도 차량이 강으로 쓸려 내려가는 물리적 파국을 피할 수 없습니다. 즉시 대피하십시오.",
    game_btn: "🎮 부스 대피 게임",
    game_title: "🚨 비엔티안 홍수 탈출 챌린지 🚨",
    game_select_vehicle: "부스 대피 챌린지 - 차량 선택",
    game_desc: "폭우로 메콩강이 범람하고 있습니다! 침수 구간과 도로 장애물을 피해 제한시간(골든타임) 내에 녹색 대피소로 안전하게 탈출하세요. 키보드 방향키 또는 화면 버튼으로 조작합니다.",
    game_vehicle_tuktuk_desc: "뚝뚝(어려움): 수위 한계 0.15m, 진흙 지연 매우 심함, 점수 2.0배",
    game_vehicle_moto_desc: "오토바이(보통): 수위 한계 0.22m, 수막현상 슬립 위험, 점수 1.2배",
    game_vehicle_car_desc: "승용차(쉬움): 수위 한계 0.30m, 무겁고 안정적이나 기본 속도 느림, 점수 1.0배",
    game_start_btn: "운전 시작하기 (Start)",
    game_health: "차량 내구성 (Health)",
    game_time: "남은 시간 (Time)",
    game_current_pos: "현재 위치",
    game_target_pos: "목적 대피소",
    game_over_title: "💀 차량 침수 / 시간 초과 (탈출 실패) 💀",
    game_over_desc: "차량 엔진이 침수되어 꺼졌거나 골든타임을 초과하였습니다.",
    game_clear_title: "🛡️ 안전 대피 성공! (SUCCESS) 🛡️",
    game_clear_desc: "무사히 고지대 대피소에 도달하여 대피에 성공했습니다!",
    game_final_score: "최종 대피 점수",
    game_enter_name: "이름을 입력하여 랭킹에 등록하세요:",
    game_leaderboard_title: "🏆 명예의 전당 (Leaderboard)",
    game_rank: "순위",
    game_name: "이름",
    game_score: "점수",
    game_vehicle: "차량",
    game_time_rem: "시간",
    game_health_rem: "체력",
    game_exit_btn: "게임 종료 (Exit)",
    game_restart_btn: "다시 도전",
    game_rank_register: "등록",
    game_rank_msg: "랭킹에 기록되었습니다!",
    cctv_title: "AI CCTV 도로 안전 모니터링",
    cctv_status: "분석 상태",
    cctv_people: "감지된 보행자",
    cctv_water: "수위 감지",
    cctv_status_safe: "정상 통행 (Safe)",
    cctv_status_caution: "주의 통행 (Passable with Caution)",
    cctv_status_danger: "진입 금지 (Danger - Closed)",
    cctv_danger_desc: "⚠️ 침수가 감지되었으나 도로에 통행자(보행자)가 전혀 감지되지 않아 위험도가 매우 높습니다. 아무도 여기 다니지 않으니 즉시 다른 우회로로 도십시오!",
    cctv_caution_desc: "⚠️ 도로에 침수가 발생했으나 일부 통행자(보행자)가 감지되어 서행 주의 통과가 가능합니다.",
    cctv_safe_desc: "✅ 도로가 안전하며 통행이 원활합니다. 보행자 흐름 양호."
  },
  lo: {
    expand_sidebar: "ເປີດເມນູຕັ້ງຄ່າ",
    collapse_sidebar: "ພັບເມນູຕັ້ງຄ່າ",
    expand_widget: "ເປີດແຜງນຳທາງ",
    collapse_widget: "ພັບແຜງນຳທາງ",
    brand_title: "ລະບົບນຳທາງອັດສະລິຍະ (VeloRoute)",
    brand_subtitle: "ແຜງຄວບຄຸມການຫຼີກລ່ຽງນ້ຳຖ້ວມອັດສະລິຍະ",
    sensor_title: "ຂໍ້ມູນເຊັນເຊີທັນເວລາ (Telemetry)",
    rain_label: "ປະລິມານນ້ຳຝົນ (ລະດູຝົນ)",
    river_label: "ລະດັບນ້ຳຂອງ",
    route_title: "ຕັ້ງຄ່າເສັ້ນທາງ",
    start_label: "ເລືອກຈຸດເລີ່ມຕົ້ນ",
    end_label: "ເລືອກຈຸດໝາຍປາຍທາງ",
    vehicle_label: "ປະເພດພາຫະນະ",
    vehicle_car: "ລົດໃຫຍ່",
    vehicle_tuktuk: "ຕຸກຕຸກ",
    vehicle_motorcycle: "ລົດຈັກ",
    evac_searching: "🛡️ ກຳລັງຄົ້ນຫາເສັ້ນທາງໄປສູນອົບພະຍົບດ່ວນ (ບໍ່ສາມາດເລືອກຈຸດໝາຍໄດ້)",
    disaster_center: "ສູນຮັບມືໄພພິບັດແລະຄວາມປອດໄພ",
    btn_normal_mode: "ໂຫມດເສັ້ນທາງທົ່ວໄປ",
    btn_evac_mode: "🚨 ເສັ້ນທາງອົບພະຍົບດ່ວນ",
    btn_clear_hazards: "ຍົກເລີກສິ່ງກີດຂວາງທັງໝົດທີ່ລາຍງານ",
    road_status_title: "ສະພາບນ້ຳຖ້ວມຖະໜົນທັນເວລາ",
    road_dry: "ແຫ້ງ",
    road_caution: "ລະວັງ",
    road_restrict: "ລະວັງການຈຳກັດທາງ",
    road_flooded: "ປິດທາງຍ້ອນນ້ຳຖ້ວມ",
    sensor_connecting: "ກຳລັງເຊື່ອມຕໍ່ກັບໂມເດລຈຳລອງ...",
    elevation_m: "ຄວາມສູງ",
    depth_m: "ຄວາມເລິກ",
    node_popup_title: "ຈຸດກວດກາ Node",
    node_shelter: "ສູນອົບພະຍົບປອດໄພ",
    node_elevation: "ຄວາມສູງຈາກລະດັບນ້ຳທະເລ",
    node_start_btn: "ຈຸດເລີ່ມຕົ້ນ",
    node_end_btn: "ຈຸດໝາຍ",
    node_hazard_report: "ລາຍງານສິ່ງກີດຂວາງທັນເວລາ",
    node_hazard_registered: "ລົງທະບຽນແລ້ວ",
    node_hazard_flood: "🌊 ນ້ຳຖ້ວມຖະໜົນ",
    node_hazard_accident: "💥 ເກີດອຸປະຕິເຫດ",
    node_hazard_pothole: "🕳️ ຂຸມຖະໜົນ",
    node_hazard_police: "🚧 ຕຳຫຼວດຄວບຄຸມ",
    feed_title_normal: "ຂໍ້ມູນເສັ້ນທາງຄວາມປອດໄພທັນເວລາ",
    feed_title_evac: "🚨 ຂໍ້ມູນເສັ້ນທາງອົບພະຍົບດ່ວນ",
    cert_label: "ຂໍ້ມູນຄວາມປອດໄພເສັ້ນທາງບົນພື້ນຖານການຈຳລອງອຸທົກກະສາດ",
    distance: "ໄລຍະທາງທັງໝົດທີ່ຄາດຄະເນ",
    safety_index: "ດັດຊະນີຄວາມປອດໄພເສັ້ນທາງ",
    logos_safe_value: "99.8% (ດີທີ່ສຸດ)",
    logos_caution_value: "82.4% (ລະວັງຄວາມໄວ)",
    max_water: "ຄວາມເລິກນ້ຳຖ້ວມສູງສຸດ",
    selected_vehicle: "ພາຫະນະທີ່ເລືອກ",
    cal_routing: "ກຳລັງຄຳນວນເສັ້ນທາງອົບພະຍົບ...",
    route_ok: "ກຳລັງນຳທາງເສັ້ນທາງປົກກະຕິ.",
    shelter_dest: "ສູນອົບພະຍົບ",
    tuktuk_ko: "ຕຸກຕຸກ (Tuk-Tuk)",
    motorcycle_ko: "ລົດຈັກ (Moto)",
    car_ko: "ລົດໃຫຍ່ (Car)",
    sev_normal: "ປົກກະຕິ (ປອດໄພ)",
    sev_caution: "ລະວັງ (ນ້ຳຖ້ວມບາງສ່ວນ)",
    sev_warning: "ແຈ້ງເຕືອນ (ຈຳກັດລົດຈັກ/ຕຸກຕຸກ)",
    sev_critical: "ອັນຕະລາຍ (ຫ້າມພາຫະນະທັງໝົດ)",
    alert_crit_title: "🚨 ແຈ້ງເຕືອນໄພພິບັດ: ນ້ຳຖ້ວມຂັງເຂດຕ່ຳ ແລະ ແນະນຳໃຫ້ອົບພະຍົບທັນທີ 🚨",
    alert_crit_msg: "ປະລິມານນ້ຳຝົນ ແລະ ລະດັບນ້ຳເກີນຂີດຈຳກັດ ເຮັດໃຫ້ມີຄວາມສ່ຽງນ້ຳຖ້ວມສູງ. ກະລຸນາອົບພະຍົບໄປຫາສູນອົບພະຍົບທີ່ປອດໄພໂດຍໄວ ແລະ ບໍ່ມີການຊັກຊ້າ.",
    alert_warn_title: "⚠️ ແຈ້ງເຕືອນສະພາບອາກາດ: ແນະນຳໃຫ້ຫຼີກລ່ຽງເສັ້ນທາງແຄມຂອງ ແລະ ອ້ອມໄປທາງສູງ",
    alert_warn_msg: "ລະດັບແມ່ນ້ຳຂອງເພີ່ມຂຶ້ນເຮັດໃຫ້ນ້ຳຖ້ວມຖະໜົນແຄມຂອງບາງສ່ວນ. ກະລຸນາຫຼີກລ່ຽງໄປໃຊ້ຖະໜົນປູຢາງທີ່ປອດໄພກວ່າໃນເຂດເນີນສູງ ເຊັ່ນ ຖະໜົນສາມແສນໄທ ທັນທີ.",
    alert_caut_title: "⚡ ແຈ້ງເຕືອນລະວັງ: ຖະໜົນມື່ນ ແລະ ຄວາມສ່ຽງທາງຫຼັງຕະຫຼາດເປັນຕົມ",
    alert_caut_msg: "ຫຼີກລ່ຽງເສັ້ນທາງດິນແດງ ເຊັ່ນ ທາງຫຼັງຕະຫຼາດກາງຄືນ ທີ່ອາດຈະເປັນຕົມເລິກ ແລະ ເຮັດໃຫ້ລົດຕິດຫຼົ່ມ. ກະລຸນາຂັບຂີ່ຢ່າງຊ້າໆ ໃນຖະໜົນໃຫຍ່ທີ່ປອດໄພ.",
    alert_norm_title: "☀️ ສະພາບອາກາດ: ສະພາບແວດລ້ອມການເດີນທາງປອດໄພ ແລະ ສະດວກ",
    alert_norm_msg: "ມີຄຳເວົ້າທີ່ວ່າ '້າມຂົວຫີນກໍຕ້ອງເຄาະເບິ່ງກ່ອນ'. ເຖິງວ່າສະພາບອາກາດຈະດີ ແລະ ການຈໍລະຈອນສະດວກ, ແຕ່ກະລຸນາປະຕິບັດຕາມຄວາມໄວທີ່ກຳນົດ ແລະ ຮັກສາໄລຍະຫ່າງທີ່ປອດໄພສະເໝີ ເພື່ອຮັບມືກັບການປ່ຽນແປງຂອງສະພາບຖະໜົນທີ່ບໍ່ຄາດຄິດ.",
    physics_title: "ການວິເຄາະຟີຊິກໄຮໂດຣເມຄານິກທັນເວລາ (Physics)",
    physics_grip: "ອັດຕາແຮງຍຶດເກາະຢາງຍັງເຫຼືອ",
    physics_buoyancy: "ແຮງຟູຈາກນ້ຳຖ້ວມ (Fb)",
    physics_vlimit: "ຄວາມໄວຈຳກັດການລ້ຽວ (R=15m)",
    physics_drag: "ແຮງຕ້ານທາງຂ້າງແມ່ນ້ຳຂອງ (Fd)",
    golden_time_label: "🚨 ເວລາທອງໃນການອົບພະຍົບປອດໄພ",
    golden_time_blocked: "🚨 ເສັ້ນທາງຖືກຕັດຂາດທັງໝົດ (ຮີບອົບພະຍົບຂຶ້ນດາດຟ້າຕຶກສູງທັນທີ!)",
    minutes_left: "ນາທີເຫຼືອ (ຮີບອົບພະຍົບດ່ວນ)",
    safe_status: "ເວລາປອດໄພພຽງພໍ (ບໍ່ມີນ້ຳຖ້ວມ)",
    physics_oracle_title: "AI ຄຳແນະນຳທາງຟີຊິກ (Physics Oracle)",
    oracle_safe: "ສະພາບປົກກະຕິ: ລະດັບນ້ຳຂອງຍັງຢູ່ຕ່ຳກວ່າຂອບທາງ, ແຮງຍຶດເກາະລະຫວ່າງຢາງລົດແລະໜ້າທາງ (μ ≈ 0.65) ຍັງຄົງທີ່ ເຮັດໃຫ້ການຄວບຄຸມລົດດີ. ອີງຕາມກົດເກນແຮງເສື່ອຍ ຈະຫຼຸດການມື່ນສະໄລ້ ແຕ່ຄວນຮັກສາໄລຍະຫ່າງທີ່ປອດໄພສະເໝີ.",
    oracle_caution: "ສະພາບລະວັງ: ຝົນຕົກໜັກເຮັດໃຫ້ໜ້າທາງມື່ນ ແລະ ຫຼຸດແຮງຍຶດເກາະຢ່າງໄວ. ໂດຍສະເພາະທາງລັດທີ່ເປັນດິນແດງຈະກາຍເປັນຕົມໜຽວ ເພີ່ມແຮງຕ້ານການໝຸນແລະທຳລາຍແຮງຍຶດເກາະ ເຮັດໃຫ້ມີໂອກາດລົດປີ້ນສູງ. ຄວນຂັບຂີ່ຊ້າໆຕາມກົດເກນຟີຊິກ.",
    oracle_warning: "ສະພາບເຕືອນໄພ: ເລີ່ມມີນ້ຳຖ້ວມຂັງ ແລະ ພາຫະນະໄດ້ຮັບແຮງຟູ (Fb = ρgV) ຕາມກົດເກນອາກຊີເມດ. ແຮງຟູທີ່ເພີ່ມຂຶ້ນຕາມບໍລິມາດທີ່ຈົມນ້ຳ ເຮັດໃຫ້ແຮງປະຕິກິລິຍາຕັ້ງສາກ (N = mg - Fb) ຫຼຸດລົງຢ່າງແຮງ. ອີງຕາມສູດແຮງຮຸກຖູ f = μN ແຮງຍຶດເກາະເກືອບຈະໝົດໄປ ເຮັດໃຫ້ລົດຕຸກຕຸກ ຫຼື ລົດຈັກມື່ນໄຫຼໄດ້ງ່າຍ.",
    oracle_critical: "ສະພາບອັນຕະລາຍ: ແຮງຕ້ານທານຈາກກະແສນ້ຳໄຫຼ (Fd = 1/2 Cd ρ A v²) ໄດ້ເກີນຂີດຈຳກັດແຮງຮຸກຖູສູງສຸດຂອງຢາງລົດແລ້ວ! ແຮງປະຕິກິລິຍາຕັ້ງສາກໃກ້ກັບ 0 ເຮັດໃຫ້ລົດຟູລອຍ. ໃນສະພາບນີ້ ພຽງແຕ່ແຮງນ້ຳໄຫຼໜ້ອຍໜຶ່ງກໍສາມາດພັດລົດໄຫຼໄປໄດ້. ກະລຸນาອົບພະຍົບທັນທີ.",
    audio_mute: "ປິດສຽງເຕືອນ",
    audio_unmute: "ເປີດສຽງເຕືອນ",
    game_btn: "🎮 ເກມອົບພະຍົບ",
    game_title: "🚨 ເກມຫຼີກລ່ຽງນ້ຳຖ້ວມ ວຽງຈັນ 🚨",
    game_select_vehicle: "ເລືອກພາຫະນະອົບພະຍົບ",
    game_desc: "ນ້ຳຂອງພວມຖ້ວມ! ກະລຸນາຂັບຂີ່ຫຼີກລ່ຽງທາງນ້ຳຖ້ວມ ແລະ ສິ່ງກີດຂວາງ ເພື່ອໄປຫາສູນອົບພະຍົບພາຍໃນເວລາທອງ. ຄວບຄຸມດ້ວຍປຸ່ມລູກສອນ ຫຼື ປຸ່ມໜ້າຈໍ.",
    game_vehicle_tuktuk_desc: "ຕຸກຕຸກ (ຍາກ): ຈຳກັດນ້ຳ 0.15m, ທາງຕົມຊ້າຫຼາຍ, ຄະແນນ 2.0x",
    game_vehicle_moto_desc: "ລົດຈັກ (ປານກາງ): ຈຳກັດນ້ຳ 0.22m, ລະວັງເລື່ອນສະໄລ້, ຄະແນນ 1.2x",
    game_vehicle_car_desc: "ລົດໃຫຍ່ (ງ່າຍ): ຈຳກັດນ້ຳ 0.30m, ໝັ້ນຄົງດີແຕ່ຊ້າກວ່າ, ຄະແນນ 1.0x",
    game_start_btn: "ເລີ່ມຕົ້ນຂັບຂີ່ (Start)",
    game_health: "ຄວາມທົນທານລົດ (Health)",
    game_time: "ເວລາເຫຼືອ (Time)",
    game_current_pos: "ຈຸດປະຈຸບັນ",
    game_target_pos: "ສູນອົບພະຍົບເປົ້າໝາຍ",
    game_over_title: "💀 ລົດຈົມນ້ຳ / ເວລາໝົດ (ອົບພະຍົບຫຼົ້ມເຫຼວ) 💀",
    game_over_desc: "ເຄື່ອງຈັກລົດຈົມນ້ຳ ແລະ ມອດ ຫຼື ກາຍເວລາທອງໃນການອົບພະຍົບແລ້ວ.",
    game_clear_title: "🛡️ ອົບພະຍົບສຳເລັດ! (SUCCESS) 🛡️",
    game_clear_desc: "ທ່ານໄດ້ເດີນທາງຮອດ ສູນອົບພະຍົບ ເຂດເນີນສູງຢ່າງປອດໄພແລ້ວ!",
    game_final_score: "ຄະແນນສຸດທ້າຍ",
    game_enter_name: "ປ້ອນຊື່ຂອງທ່ານເພື່ອບັນທຶກຄະແນນ:",
    game_leaderboard_title: "🏆 ຕາຕະລາງຄະແນນສູງສຸດ (Leaderboard)",
    game_rank: "ອັນດັບ",
    game_name: "ຊື່",
    game_score: "ຄະແນນ",
    game_vehicle: "ພາຫະນະ",
    game_time_rem: "ເວລາເຫຼືອ",
    game_health_rem: "ສຸຂະພາບ",
    game_exit_btn: "ອອກຈາກເກມ (Exit)",
    game_restart_btn: "ຫຼິ້ນຄືນໃໝ່",
    game_rank_register: "ບັນທຶກ",
    game_rank_msg: "ບັນທຶກຄະແນນສຳເລັດແລ້ວ!",
    cctv_title: "ກ້ອງວົງຈອນປິດຕາມຖະໜົນ AI",
    cctv_status: "ສະຖານະການວິເຄາະ",
    cctv_people: "ຄົນຍ່າງທີ່ກວດພົບ",
    cctv_water: "ລະດັບນ້ຳຖ້ວມ",
    cctv_status_safe: "ຜ່ານໄດ້ປົກກະຕິ (Safe)",
    cctv_status_caution: "ຜ່ານໄດ້ດ້ວຍຄວາມລະມັດລະວັງ (Caution)",
    cctv_status_danger: "ຫ້າມຜ່ານ (Danger - Closed)",
    cctv_danger_desc: "⚠️ ມີນ້ຳຖ້ວມ ແລະ ບໍ່ມີຄົນຍ່າງຜ່ານທາງເລີຍ. ຄວາມສ່ຽງສູງຫຼາຍ! ກະລຸນາຫຼີກລ່ຽງເສັ້ນທາງນີ້ ແລະ ໄປທາງອື່ນ!",
    cctv_caution_desc: "⚠️ ມີນ້ຳຖ້ວມບາງສ່ວນ ແຕ່ຍັງມີຄົນຍ່າງຜ່ານຢູ່. ສາມາດຂັບຂີ່ໄດ້ດ້ວຍຄວາມລະມັດລະວັງ.",
    cctv_safe_desc: "✅ ເສັ້ນທາງປອດໄພ ແລະ ການສັນຈອນສະດວກດີ."
  }
};

// Map center adjuster helper component
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13); // Changed zoom from 15 to 13 to support wider viewport
  }, [center, map]);
  return null;
}

const CCTV_STATIONS = [
  { id: 'A', name: 'Mekong Riverside CCTV #1', node: 'A', lat: 17.9634, lng: 102.6063, telemetry_id: 'Quai_Fa_Ngum_West' },
  { id: 'I', name: 'Patuxay Monument CCTV #2', node: 'I', lat: 17.9712, lng: 102.6198, telemetry_id: 'Lane_Xang_Ave' },
  { id: 'Q', name: 'That Luang Square CCTV #3', node: 'Q', lat: 17.9742, lng: 102.6372, telemetry_id: 'Lane_Xang_Ave' },
  { id: 'V', name: 'Dong Dok Highway CCTV #4', node: 'V', lat: 18.0287, lng: 102.6402, telemetry_id: 'Lane_Xang_Ave' }
];

export default function App() {
  // Language switcher state
  const [lang, setLang] = useState('ko');



  // Translation helper
  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['ko']?.[key] || key;
  };

  const getNodeLabel = (id) => {
    return NODE_LABELS_BY_LANG[lang]?.[id] || NODE_LABELS_BY_LANG['ko']?.[id] || id;
  };

  // Environmental simulation states
  const [rainIntensity, setRainIntensity] = useState(0); // mm/h
  const [riverLevel, setRiverLevel] = useState(9.5); // meters above baseline
  
  // Routing settings
  const [startNode, setStartNode] = useState('A');
  const [endNode, setEndNode] = useState('I');
  const [vehicle, setVehicle] = useState('tuktuk'); // tuktuk, motorcycle, car
  
  // ── Booth Challenge Game States ────────────────────────────
  const [isGameMode, setIsGameMode] = useState(false);
  const [gameVehicle, setGameVehicle] = useState('tuktuk');
  const [gamePlayerNode, setGamePlayerNode] = useState('A');
  const [gameTargetNode, setGameTargetNode] = useState('I');
  const [gameHealth, setGameHealth] = useState(100);
  const [gameTimeLeft, setGameTimeLeft] = useState(60);
  const [gameScore, setGameScore] = useState(0);
  const [gameWin, setGameWin] = useState(false);
  const [gameShowSelect, setGameShowSelect] = useState(false);
  const [gameNameInput, setGameNameInput] = useState('');
  const [gameRankRegistered, setGameRankRegistered] = useState(false);
  
  const [gameLeaderboard, setGameLeaderboard] = useState(() => {
    try {
      const saved = localStorage.getItem('veloroute_leaderboard');
      return saved ? JSON.parse(saved) : [
        { name: "Somsack", score: 1200, vehicle: "motorcycle", time: 42, health: 80 },
        { name: "김철수", score: 950, vehicle: "tuktuk", time: 30, health: 50 },
        { name: "Thipphone", score: 800, vehicle: "car", time: 35, health: 90 }
      ];
    } catch (e) {
      return [];
    }
  });
  
  // New Evacuation and Hazard States
  const [isEvacMode, setIsEvacMode] = useState(false);
  const [hazards, setHazards] = useState([]);
  
  // Dynamic API response data
  const [telemetry, setTelemetry] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [floodZones, setFloodZones] = useState([]);
  const [nodes, setNodes] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [cctvSourceMap, setCctvSourceMap] = useState({});
  const [sidebarCctvActive, setSidebarCctvActive] = useState(false);
  const [sidebarCctvStation, setSidebarCctvStation] = useState('A');
  const [sidebarCctvMode, setSidebarCctvMode] = useState('canvas');
  const [cctvPos, setCctvPos] = useState({ x: 450, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Node SNS Photo Sharing States
  const [activeSnsNode, setActiveSnsNode] = useState(null);
  const [snsPosts, setSnsPosts] = useState([]);
  const [isSnsLoading, setIsSnsLoading] = useState(false);
  const [newPostNickname, setNewPostNickname] = useState('');
  const [newPostComment, setNewPostComment] = useState('');
  const [newPostFile, setNewPostFile] = useState(null);
  const [snsPos, setSnsPos] = useState({ x: 500, y: 120 });
  const [isSnsDragging, setIsSnsDragging] = useState(false);
  const [snsDragStart, setSnsDragStart] = useState({ x: 0, y: 0 });

  // Sidebar and widget collapse states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isWidgetCollapsed, setIsWidgetCollapsed] = useState(false);

  // ── AI Chatbot States ──────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('veloroute_gemini_key') || '');
  const [tempKey, setTempKey] = useState(() => localStorage.getItem('veloroute_gemini_key') || '');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saved', 'cleared'
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: lang === 'ko'
        ? '안녕하세요! 🌊 스마트 내비게이션 AI입니다.\n현재 기상 상황, 침수 경로, 차량별 통행 가능 여부 등\n무엇이든 물어보세요!'
        : 'ສະບາຍດີ! 🌊 ຂ້ອຍແມ່ນ AI ຂອງ ລະບົບນຳທາງອັດສະລິຍະ.\nຖາມຂ້ອຍກ່ຽວກັບສະພາບອາກາດ, ເສັ້ນທາງ, ຫຼືຄວາມປອດໄພໄດ້ເລີຍ!'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatTyping, setChatTyping] = useState(false);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // ── Web Audio API Sound Synthesizer ────────────────────────
  const playTone = useCallback((freq, duration, type = 'sine') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, []);

  // CCTV status resolver - declared after state hooks to prevent temporal dead zone (TDZ) reference errors
  const getCCTVStatus = useCallback((nodeId) => {
    const mapping = {
      'A': 'Quai_Fa_Ngum_West',
      'I': 'Lane_Xang_Ave',
      'Q': 'Lane_Xang_Ave',
      'V': 'Lane_Xang_Ave'
    };
    const tId = mapping[nodeId];
    const depth = (telemetry && telemetry[tId]) ? (telemetry[tId].water_depth_m || 0) : 0;
    
    const basePeople = { 'A': 10, 'I': 20, 'Q': 15, 'V': 12 };
    let people = basePeople[nodeId] || 10;
    
    if (depth > 0.0) {
      if (nodeId === 'I') {
        people = Math.max(0, Math.floor(people * (1 - (depth / 0.22))));
      } else if (nodeId === 'Q') {
        people = Math.max(0, Math.floor(people * (1 - (depth / 0.30))));
      } else {
        people = depth > 0.10 ? 0 : Math.max(0, Math.floor(people * (1 - (depth / 0.10))));
      }
    }
    
    let status = 'safe';
    if (depth > 0.05) {
      status = people === 0 ? 'danger' : 'caution';
    }
    
    return { depth, people, status };
  }, [telemetry]);
  
  // Load initial nodes on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/nodes`)
      .then(res => res.json())
      .then(data => setNodes(data))
      .catch(err => console.error("Error loading nodes:", err));
  }, []);

  // Draggable CCTV Window Handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cctvPos.x,
      y: e.clientY - cctvPos.y
    });
    e.preventDefault();
  }, [cctvPos]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setCctvPos({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Draggable SNS Window Handlers
  const handleSnsMouseDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
    setIsSnsDragging(true);
    setSnsDragStart({
      x: e.clientX - snsPos.x,
      y: e.clientY - snsPos.y
    });
    e.preventDefault();
  }, [snsPos]);

  useEffect(() => {
    const handleSnsMouseMove = (e) => {
      if (!isSnsDragging) return;
      setSnsPos({
        x: e.clientX - snsDragStart.x,
        y: e.clientY - snsDragStart.y
      });
    };

    const handleSnsMouseUp = () => {
      setIsSnsDragging(false);
    };

    if (isSnsDragging) {
      document.addEventListener('mousemove', handleSnsMouseMove);
      document.addEventListener('mouseup', handleSnsMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleSnsMouseMove);
      document.removeEventListener('mouseup', handleSnsMouseUp);
    };
  }, [isSnsDragging, snsDragStart]);

  // Fetch SNS Posts for active node
  const fetchSnsPosts = useCallback((nodeId) => {
    setIsSnsLoading(true);
    fetch(`${API_BASE}/api/nodes/${nodeId}/posts`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch posts");
        return res.json();
      })
      .then((data) => {
        setSnsPosts(data);
        setIsSnsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsSnsLoading(false);
      });
  }, []);

  // Upload new post (nickname + comment + photo)
  const handleUploadSnsPost = useCallback((e) => {
    e.preventDefault();
    if (!activeSnsNode) return;
    if (!newPostNickname.trim()) {
      alert("닉네임을 입력해주세요!");
      return;
    }
    if (!newPostComment.trim()) {
      alert("내용을 입력해주세요!");
      return;
    }
    if (!newPostFile) {
      alert("사진을 등록해주세요!");
      return;
    }

    const formData = new FormData();
    formData.append("username", newPostNickname);
    formData.append("comment", newPostComment);
    formData.append("file", newPostFile);

    setIsSnsLoading(true);
    fetch(`${API_BASE}/api/nodes/${activeSnsNode}/posts`, {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      })
      .then((data) => {
        setNewPostComment('');
        setNewPostFile(null);
        const fileInput = document.getElementById("sns-file-input");
        if (fileInput) fileInput.value = "";
        
        fetchSnsPosts(activeSnsNode);
        playTone(523.25, 0.1);
      })
      .catch((err) => {
        console.error(err);
        alert("업로드 중 에러가 발생했습니다.");
        setIsSnsLoading(false);
      });
  }, [activeSnsNode, newPostNickname, newPostComment, newPostFile, fetchSnsPosts]);

  // Delete a post
  const handleDeleteSnsPost = useCallback((postId) => {
    console.log("Delete button clicked for post:", postId, "on node:", activeSnsNode);
    if (!activeSnsNode) return;
    if (!confirm("정말로 이 사진과 후기를 삭제하시겠습니까?")) return;

    setIsSnsLoading(true);
    console.log("Sending DELETE request to:", `${API_BASE}/api/nodes/${activeSnsNode}/posts/${postId}`);
    fetch(`${API_BASE}/api/nodes/${activeSnsNode}/posts/${postId}`, {
      method: "DELETE",
    })
      .then((res) => {
        console.log("DELETE response status:", res.status);
        if (!res.ok) throw new Error("Delete failed");
        return res.json();
      })
      .then((data) => {
        console.log("DELETE response data:", data);
        fetchSnsPosts(activeSnsNode);
        playTone(329.63, 0.1);
      })
      .catch((err) => {
        console.error("DELETE request failed:", err);
        alert("삭제 중 에러가 발생했습니다.");
        setIsSnsLoading(false);
      });
  }, [activeSnsNode, fetchSnsPosts, playTone]);



  // ── Game Start/Clear/Over/Move Mechanics ───────────────────
  const startGame = (vehicleType) => {
    setGameVehicle(vehicleType);
    setGameHealth(100);
    setGameTimeLeft(60);
    setGameScore(0);
    setGameWin(false);
    setGameRankRegistered(false);
    setGameNameInput('');
    
    // 저지대 출발노드 임의 지정
    const dangerStarts = ["A", "B", "C", "M", "AN", "AD"];
    const randomStart = dangerStarts[Math.floor(Math.random() * dangerStarts.length)];
    setGamePlayerNode(randomStart);
    
    // 목적 대피소 임의 지정
    const shelterNodes = ["F", "H", "I", "Q", "V"];
    const randomTarget = shelterNodes[Math.floor(Math.random() * shelterNodes.length)];
    setGameTargetNode(randomTarget);
    
    // 환경 시뮬레이션 설정 (폭우 상태 강제조정)
    setRainIntensity(100);
    setRiverLevel(11.2);
    
    // 게임 시작 모드 활성화 및 선택 팝업 닫기
    setIsGameMode(true);
    setGameShowSelect(false);
    
    // 오디오 피드백
    playTone(440, 0.1);
    setTimeout(() => playTone(440, 0.1), 150);
    setTimeout(() => playTone(880, 0.3), 300);
  };

  const handleGameClear = useCallback((finalTime, finalHealth) => {
    setIsGameMode(false);
    playTone(523.25, 0.1);
    setTimeout(() => playTone(659.25, 0.1), 100);
    setTimeout(() => playTone(783.99, 0.1), 200);
    setTimeout(() => playTone(1046.50, 0.45), 300);
    
    const difficultyMultipliers = { tuktuk: 2.0, motorcycle: 1.2, car: 1.0 };
    const mult = difficultyMultipliers[gameVehicle] || 1.0;
    const score = Math.round(((finalTime * 10) + (finalHealth * 15)) * mult);
    setGameScore(score);
    setGameWin(true);
  }, [gameVehicle, playTone]);

  const handleGameMove = useCallback((direction) => {
    if (!isGameMode || gameHealth <= 0 || gameTimeLeft <= 0) return;
    
    const adj = getAdjacencyList();
    const neighbors = adj[gamePlayerNode] || [];
    if (neighbors.length === 0) return;
    
    const currCoord = nodes[gamePlayerNode];
    if (!currCoord) return;
    
    let bestTarget = null;
    let maxScore = -999;
    
    neighbors.forEach(n => {
      const targetCoord = nodes[n.target];
      if (!targetCoord) return;
      
      const dy = targetCoord.lat - currCoord.lat;
      const dx = targetCoord.lng - currCoord.lng;
      
      let score = -999;
      if (direction === 'UP') {
        score = dy - Math.abs(dx) * 0.5;
      } else if (direction === 'DOWN') {
        score = -dy - Math.abs(dx) * 0.5;
      } else if (direction === 'LEFT') {
        score = -dx - Math.abs(dy) * 0.5;
      } else if (direction === 'RIGHT') {
        score = dx - Math.abs(dy) * 0.5;
      }
      
      const isBlockedByHazard = hazards.some(h => h.node_id === n.target);
      if (isBlockedByHazard) {
        score -= 5.0; // 장애물 구간 강한 회피
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestTarget = n;
      }
    });
    
    if (bestTarget) {
      const targetNodeId = bestTarget.target;
      playTone(600, 0.05);
      setGamePlayerNode(targetNodeId);
      
      // 침수 및 흙길 페널티 계산
      let depth = 0;
      if (telemetry && telemetry[bestTarget.telemetry_id]) {
        depth = telemetry[bestTarget.telemetry_id].water_depth_m || 0;
      }
      
      const limits = { tuktuk: 0.15, motorcycle: 0.22, car: 0.30 };
      const limit = limits[gameVehicle] || 0.30;
      
      if (depth >= limit) {
        const dmg = Math.round((depth - limit + 0.15) * 50);
        setGameHealth(h => {
          const nextH = Math.max(0, h - dmg);
          if (nextH <= 0) {
            setIsGameMode(false);
            playTone(150, 0.5, 'sawtooth');
          } else {
            playTone(200, 0.15, 'sawtooth');
          }
          return nextH;
        });
      } else if (depth > 0.02) {
        setGameHealth(h => Math.max(0, h - 3));
        playTone(300, 0.1);
      }
      
      if (bestTarget.surface === 'unpaved') {
        setGameTimeLeft(t => Math.max(0, t - 2)); // 2초 지연
        playTone(250, 0.1, 'sawtooth');
      }
      
      if (targetNodeId === gameTargetNode) {
        handleGameClear(gameTimeLeft, gameHealth);
      }
    }
  }, [isGameMode, gamePlayerNode, nodes, gameVehicle, telemetry, hazards, gameTargetNode, gameHealth, gameTimeLeft, handleGameClear, playTone]);

  // 키보드 리스너 등록
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isGameMode) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleGameMove('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleGameMove('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleGameMove('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleGameMove('RIGHT');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameMode, handleGameMove]);

  // 타이머 루프
  useEffect(() => {
    if (!isGameMode || gameHealth <= 0 || gameTimeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setGameTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setIsGameMode(false);
          playTone(150, 0.5, 'sawtooth');
          return 0;
        }
        return t - 1;
      });
      
      // 정차 침수 데미지
      const adj = getAdjacencyList();
      const neighbors = adj[gamePlayerNode] || [];
      let maxDepth = 0;
      neighbors.forEach(n => {
        if (telemetry && telemetry[n.telemetry_id]) {
          const d = telemetry[n.telemetry_id].water_depth_m || 0;
          if (d > maxDepth) maxDepth = d;
        }
      });
      
      const limits = { tuktuk: 0.15, motorcycle: 0.22, car: 0.30 };
      const limit = limits[gameVehicle] || 0.30;
      if (maxDepth >= limit) {
        setGameHealth(h => {
          const nextH = Math.max(0, h - 4);
          if (nextH <= 0) {
            setIsGameMode(false);
            playTone(150, 0.5, 'sawtooth');
          }
          return nextH;
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isGameMode, gamePlayerNode, gameVehicle, telemetry, gameHealth, gameTimeLeft, playTone]);

  // 랭킹 등록
  const registerHighScore = () => {
    if (!gameNameInput.trim()) return;
    const newEntry = {
      name: gameNameInput,
      score: gameScore,
      vehicle: gameVehicle,
      time: gameTimeLeft,
      health: gameHealth
    };
    
    const updated = [...gameLeaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // 5개만 유지
      
    setGameLeaderboard(updated);
    localStorage.setItem('veloroute_leaderboard', JSON.stringify(updated));
    setGameRankRegistered(true);
    playTone(880, 0.15);
    setTimeout(() => playTone(1000, 0.2), 150);
  };


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
      'flood': t('node_hazard_flood'),
      'accident': t('node_hazard_accident'),
      'pothole': t('node_hazard_pothole'),
      'police': t('node_hazard_police')
    };
    return map[type] || type;
  };

  // Weather Alert Level logic (Rhetoric & Persuasion Strategy Integration)
  const getWeatherAlert = () => {
    if (rainIntensity >= 90 || riverLevel >= 13.0) {
      return {
        level: 'CRITICAL',
        title: t('alert_crit_title'),
        msg: t('alert_crit_msg'),
        color: '#ef4444',
        class: 'alert-critical'
      };
    } else if (rainIntensity >= 50 || riverLevel >= 11.5) {
      return {
        level: 'WARNING',
        title: t('alert_warn_title'),
        msg: t('alert_warn_msg'),
        color: '#f97316',
        class: 'alert-warning'
      };
    } else if (rainIntensity >= 20 || riverLevel >= 10.5) {
      return {
        level: 'CAUTION',
        title: t('alert_caut_title'),
        msg: t('alert_caut_msg'),
        color: '#eab308',
        class: 'alert-caution'
      };
    } else {
      return {
        level: 'NORMAL',
        title: t('alert_norm_title'),
        msg: t('alert_norm_msg'),
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

  // Convert vehicle type to localized string
  const getVehicleKorean = (type) => {
    const map = {
      'tuktuk': t('tuktuk_ko'),
      'motorcycle': t('motorcycle_ko'),
      'car': t('car_ko')
    };
    return map[type] || type;
  };

  // Convert flood severity to localized string
  const getSeverityKorean = (sev) => {
    const map = {
      'NORMAL': t('sev_normal'),
      'CAUTION_MINOR': t('sev_caution'),
      'WARNING_MODERATE': t('sev_warning'),
      'CRITICAL_FLOOD': t('sev_critical')
    };
    return map[sev] || sev;
  };

  // Translate backend routing remarks dynamically
  const translateRemark = (text) => {
    if (!text) return "";
    if (lang === 'ko') return text;

    if (text.includes("포장 완료된 안전한 건조 도로 위주의 최적 경로입니다.")) {
      return "ເສັ້ນທາງທີ່ດີທີ່ສຸດສ່ວນໃຫຍ່ແມ່ນຖະໜົນປູຢາງທີ່ແຫ້ງແລະປອດໄພ.";
    }
    if (text.includes("경로에 진흙 유실 위험이 높은 비포장도로가 포함되어 있습니다.")) {
      return "ເສັ້ນທາງປະກອບມີຖະໜົນດິນແດງທີ່ມີຄວາມສ່ຽງສູງຕໍ່ການດິນເຈື່ອນ.";
    }
    if (text.includes("경로에 실시간 제보된 장애물(사고/포트홀/통제) 구역이 포함되어 있습니다. 서행하십시오.")) {
      return "ເສັ້ນທາງປະກອບມີເຂດສິ່ງກີດຂວາງ (ອຸປະຕິເຫດ/ຂຸມຖະໜົນ/ຄວບຄຸມທາງ) ທີ່ລາຍງານທັນເວລາ. ກະລຸນາຂັບຂີ່ຢ່າງຊ້າໆ.";
    }
    if (text.includes("현재 대피소에 안전하게 위치해 있습니다.")) {
      return "ປັດຈຸບັນທ່ານຢູ່ໃນສູນອົບພະຍົບຢ່າງປອດໄພແລ້ວ.";
    }
    if (text.startsWith("주의: 최대")) {
      const match = text.match(/최대\s+([\d.]+)\s*m\s+깊이/);
      if (match) {
        const depth = match[1];
        return `ລະວັງ: ຈະຜ່ານເສັ້ນທາງທີ່ມີນ້ຳຖ້ວມເລິກສູງສຸດ ${depth} ແມັດ.`;
      }
    }
    if (text.startsWith("인근")) {
      const match = text.match(/인근\s+(.+?)\s*(?:로\s+대피하는|으로\s+대피하는)/);
      if (match) {
        const shelterName = match[1].trim();
        const translatedShelter = getNodeLabel(shelterName) || shelterName;
        return `ແນະນຳເສັ້ນທາງດ່ວນເພື່ອອົບພະຍົບໄປຫາ ${translatedShelter} ທີ່ຢູ່ໃກ້ຄຽງ.`;
      }
    }
    return text;
  };

  // Translate backend error messages dynamically
  const translateError = (text) => {
    if (!text) return "";
    if (lang === 'ko') return text;

    if (text.includes("API 게이트웨이가 오프라인 상태입니다")) {
      return "ປະຕູ API ແມ່ນອອບລາຍ. ກະລຸນາກວດສອບວ່າ Docker ຫຼື ຂະບວນການ backend ກຳລັງເຮັດວຽກຢູ່.";
    }
    if (text.includes("Invalid start or end node")) {
      return "ຈຸດເລີ່ມຕົ້ນ ຫຼື ຈຸດໝາຍປາຍທາງບໍ່ຖືກຕ້ອງ.";
    }
    if (text.includes("안전한 대피 경로를 찾을 수 없습니다. 모든 진입로가 심각한 홍수로 차단되었습니다.")) {
      return "ບໍ່ສາມາດຊອກຫາເສັ້ນທາງອົບພະຍົບທີ່ປອດໄພໄດ້. ເສັ້ນທາງເຂົ້າທັງໝົດຖືກຕັດຂາດຍ້ອນນ້ຳຖ້ວມໜັກ.";
    }
    if (text.includes("안전한 대피로가 존재하지 않습니다! 모든 고지대 진입로가 침수되어 고립되었습니다.")) {
      return "ບໍ່ມີເສັ້ນທາງອົບພະຍົບທີ່ປອດໄພ! ເສັ້ນທາງຂຶ້ນເຂດເນີນສູງທັງໝົດຖືກນ້ຳຖ້ວມ ແລະ ຖືກຕັດຂາດ. ກະລຸນາອົບພະຍົບໄປຊັ້ນເທິງຂອງອາຄານສູງທັນທີ.";
    }
    return text;
  };

  // Vehicle-specific physics parameters for hydromechanical simulation
  const VEHICLE_PHYSICS = {
    tuktuk: { mass: 350, maxVol: 0.35, limitDepth: 0.15, area: 1.2, cd: 0.9 },
    motorcycle: { mass: 120, maxVol: 0.08, limitDepth: 0.22, area: 0.6, cd: 0.7 },
    car: { mass: 1500, maxVol: 1.5, limitDepth: 0.40, area: 2.2, cd: 0.4 }
  };

  // Real-time physics engine calculation
  const calculatePhysics = (vehicleType, maxDepth) => {
    const specs = VEHICLE_PHYSICS[vehicleType] || VEHICLE_PHYSICS.tuktuk;
    const g = 9.8;
    const rhoWater = 1000;
    const maxMass = specs.mass;
    
    // Friction coefficient (drops during rain or mud)
    let mu = 0.65;
    if (rainIntensity > 0) {
      mu = rainIntensity > 40 ? 0.22 : 0.38;
    }
    if (vehicleType === 'car') mu += 0.1;
    
    // Submerged volume ratio
    const ratio = Math.min(1, maxDepth / specs.limitDepth);
    const vSub = specs.maxVol * ratio;
    
    // Buoyancy force (Fb = rho * g * V_submerged)
    const fb = Math.round(rhoWater * g * vSub);
    
    // Normal force (N = m*g - F_b)
    const totalWeight = maxMass * g;
    const normalForce = Math.max(0, totalWeight - fb);
    
    // Grip remaining percentage (%)
    const gripRemaining = Math.round((normalForce / totalWeight) * 100);
    
    // Curve speed limit (R = 15m radius assumptions)
    const R = 15;
    const vLimitMps = Math.sqrt(mu * g * R * (normalForce / totalWeight));
    const vLimitKmh = Math.round(vLimitMps * 3.6);
    
    // Hydrodynamic Drag force (assuming river velocity v_water = 1.2 m/s)
    const vWater = 1.2;
    const fd = Math.round(0.5 * specs.cd * rhoWater * (specs.area * ratio) * (vWater * vWater));

    return { fb, normalForce: Math.round(normalForce), gripRemaining, vLimitKmh, fd };
  };



  // ── AI Chatbot Logic ───────────────────────────────────────
  const getBotReply = useCallback((input) => {
    const q = input.toLowerCase();
    const isLao = lang === 'lo';
    const alert = getWeatherAlert();
    const depth = routeData?.geojson?.properties?.max_water_depth ?? 0;
    const remark = routeData?.geojson?.properties?.remarks ?? '';
    const routeNodes = routeData?.geojson?.properties?.path?.join(' → ') ?? '';

    // Context summary for smart answers
    const ctx = {
      rain: rainIntensity,
      river: riverLevel,
      level: alert.level,
      depth,
      vehicle,
      remark,
      routeNodes,
      start: startNode,
      end: endNode,
    };

    // ── Keyword matching ──
    const isAbout = (...kws) => kws.some(k => q.includes(k));

    // 현재 상황 / ສະຖານະການ
    if (isAbout('현재', '상황', 'ສະຖານະ', 'ຕອນນີ້', 'now', 'status')) {
      return isLao
        ? `ຕອນນີ້: ຝົນ ${ctx.rain} mm/h | ລະດັບນ້ຳ ${ctx.river.toFixed(1)}m | ສະຖານະ: ${alert.title}\n${alert.msg}`
        : `현재 상황:\n강수량 ${ctx.rain} mm/h | 수위 ${ctx.river.toFixed(1)}m\n경보 단계: ${alert.level}\n${alert.msg}`;
    }

    // 경로 / ເສັ້ນທາງ
    if (isAbout('경로', '길', 'route', 'ເສັ້ນທາງ', 'ທາງ')) {
      if (!routeData) {
        return isLao ? 'ຍັງບໍ່ທັນໄດ້ຄຳນວນເສັ້ນທາງ. ກະລຸນາລໍຖ້າ...' : '경로를 아직 계산 중입니다. 잠시 기다려 주세요.';
      }
      return isLao
        ? `ເສັ້ນທາງ: ${ctx.routeNodes}\nຄວາມເລິກນ້ຳສູງສຸດ: ${(ctx.depth*100).toFixed(0)} cm\n${translateRemark(ctx.remark)}`
        : `현재 경로: ${ctx.routeNodes}\n최대 침수 깊이: ${(ctx.depth*100).toFixed(0)} cm\n${ctx.remark}`;
    }

    // 안전한가요? / ປອດໄພ?
    if (isAbout('안전', '괜찮', 'safe', 'ປອດໄພ', 'ໄດ້ບໍ')) {
      if (ctx.level === 'CRITICAL') {
        return isLao ? '🚨 ອັນຕະລາຍ! ກ່ອນອົດໄພທັນທີ!' : '🚨 위험 단계! 즉시 대피하세요!';
      } else if (ctx.level === 'WARNING') {
        return isLao ? '⚠️ ລະວັງ! ຖະໜົນຫຼາຍສາຍຖືກນ້ຳຖ້ວມ. ຂັບຊ້າໆ.' : '⚠️ 경고! 강변 도로 침수 중. 서행 권고';
      } else if (ctx.level === 'CAUTION') {
        return isLao ? '⚡ ລະວັງ! ຖະໜົນລື່ນ. ຄວາມໄວຕ່ຳ.' : '⚡ 주의! 노면 미끄러움. 감속 운행하세요.';
      }
      return isLao ? '✅ ໂດຍລວມປອດໄພ. ຂັບໄດ້ຕາມປົກກະຕິ.' : '✅ 현재 전반적으로 안전합니다. 정상 운행 가능';
    }

    // 침수 깊이 / ຄວາມເລິກນ້ຳ
    if (isAbout('침수', '깊이', '수심', 'depth', 'ນ້ຳຖ້ວມ', 'ເລິກ')) {
      if (depth === 0) {
        return isLao ? '✅ ຕອນນີ້ ເສັ້ນທາງທັງໝົດແຫ້ງ. ບໍ່ມີນ້ຳຖ້ວມ.' : '✅ 현재 경로 전 구간 침수 없음';
      }
      return isLao
        ? `🌊 ຄວາມເລິກນ້ຳສູງສຸດ ${(depth*100).toFixed(0)} cm. ${depth >= 0.22 ? 'ລົດຈັກ ຫ້າມຜ່ານ!' : 'ຂັບຊ້າໆ.'}`
        : `🌊 최대 침수 깊이: ${(depth*100).toFixed(0)} cm\n${depth >= 0.22 ? '오토바이 통행 불가!' : '서행 권고'}`;
    }

    // 차량 / ພາຫະນະ
    if (isAbout('차량', '뚝뚝', '오토바이', '승용차', 'vehicle', 'ຕຸກຕຸກ', 'ລົດຈັກ', 'ລົດໃຫຍ່')) {
      const vmap = {
        tuktuk:     isLao ? '뚝뚝: 침수 한계 15cm' : '뚝뚝: 침수 한계 15cm. 비포장도로 6.5배 패널티',
        motorcycle: isLao ? 'ລົດຈັກ: ຂີດຈຳກັດ 22cm' : '오토바이: 침수 한계 22cm. 비포장 2.5배 패널티',
        car:        isLao ? 'ລົດໃຫຍ່: ຂີດຈຳກັດ 40cm' : '승용차: 침수 한계 40cm. 가장 안전'
      };
      return `${isLao ? 'ພາຫະນະທີ່ເລືອກ' : '선택된 차량'}: ${getVehicleKorean(ctx.vehicle)}\n${vmap[ctx.vehicle] || ''}`;
    }

    // 대피소 / ສູນອົບພະຍົບ
    if (isAbout('대피', '피난', 'shelter', 'evacu', 'ອົບພະຍົບ', 'ສູນ')) {
      return isLao
        ? '🛡️ ສູນອົບພະຍົບ 4 ແຫ່ງ:\n• I: ປະຕູໄຊ\n• Q: ທາດຫຼວງ\n• V: ມ.ຊ.ດົງໂດກ\n• P: ຕະຫຼາດເຊົ້າ\nກົດ 🚨 ເພື່ອຊອກຫາທາງທີ່ໃກ້ທີ່ສຸດ.'
        : '🛡️ 안전 대피소 4곳:\n• I: 빠뚜사이(독립기념탑)\n• Q: 탓루앙(황금사원)\n• V: 동독 국립대\n• P: 딸랏싸오 시장\n\n🚨버튼으로 최적 대피로를 탐색하세요!';
    }

    // 강수량 / 수위
    if (isAbout('비', '강수', '수위', '메콩', 'rain', 'river', 'ຝົນ', 'ນ້ຳ', 'ແມ່ນ້ຳ')) {
      return isLao
        ? `🌧 ຝົນ: ${ctx.rain} mm/h | ລະດັບນ້ຳ: ${ctx.river.toFixed(1)}m\n${ctx.rain > 50 ? 'ຝົນຕົກໜັກ! ລະວັງ!' : ctx.rain > 20 ? 'ຝົນປານກາງ' : 'ສະພາບດີ'}`
        : `🌧 강수량: ${ctx.rain} mm/h | 수위: ${ctx.river.toFixed(1)}m\n${ctx.rain > 50 ? '집중호우! 경계 요망' : ctx.rain > 20 ? '보통 강우' : '양호'}`;
    }

    // 도움말
    if (isAbout('도움', 'help', '뭐', '기능', 'ຊ່ວຍ', 'ຫຍັງ')) {
      return isLao
        ? '💬 ຖາມຂ້ອຍໄດ້ກ່ຽວກັບ:\n• ສະຖານະການ (ສະຖານະ)\n• ເສັ້ນທາງ (ທາງ)\n• ຄວາມປອດໄພ (ປອດໄພ)\n• ລະດັບນ້ຳ (ນ້ຳ, ຝົນ)\n• ສູນອົບພະຍົບ (ອົບພະຍົບ)\n• ພາຫະນະ (ຕຸກຕຸກ, ລົດຈັກ)'
        : '💬 질문 예시:\n• 현재 상황 알려줘\n• 경로가 안전해?\n• 침수 깊이 얼마야?\n• 대피소 어디야?\n• 비가 얼마나 와?\n• 뚝뚝으로 갈 수 있어?';
    }

    // Default
    return isLao
      ? `❓ '${input}'에 대한 정보를 찾지 못했습니다.\n'ຊ່ວຍ' 或 'help'라고 물어보세요!`
      : `❓ "${input}"에 대한 정보를 찾지 못했어요.\n'도움말'이라고 물어보시면 할 수 있는 것들을 알려드릴게요!`;
  }, [lang, rainIntensity, riverLevel, routeData, vehicle, startNode, endNode, getWeatherAlert, translateRemark, getVehicleKorean]);

  const handleChatSend = useCallback(async (text) => {
    const input = (text || chatInput).trim();
    if (!input) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: input }]);
    setChatTyping(true);

    const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const activeRoute = !!routeData;
        const currentVehicle = routeData ? routeData.vehicle : vehicle;
        const maxDepth = routeData ? (routeData.geojson?.properties?.max_water_depth || 0) : 0;
        const routeNodes = routeData?.geojson?.properties?.path?.join(' → ') ?? '';
        const alert = getWeatherAlert();

        const systemPrompt = `You are the AI Assistant for '스마트 내비게이션 (Smart Navigation - VeloRoute)' — a flood-resilient smart navigation system in Vientiane, Laos.
Your tone should be highly professional, reassuring, and helpful. You are trying to guide citizens safely during monsoon floods.
You must answer in the user's language (Korean if the user asks in Korean, Lao if they ask in Lao).
Please keep your answers relatively concise, helpful, and directly related to the Vientiane flood navigation context.

[Current Live App Context]
- Selected Vehicle: ${currentVehicle} (Specs: tuktuk limit is 0.15m, motorcycle limit is 0.22m, car limit is 0.40m)
- Rain Intensity: ${rainIntensity} mm/h
- Mekong River Level: ${riverLevel} m
- Weather Alert: ${alert.level} (${alert.title} - ${alert.msg})
- Route Calculated: ${activeRoute ? 'Yes' : 'No'}
${activeRoute ? `- Route Path: ${routeNodes}\n- Route Distance: ${routeData.distance_m}m\n- Route Max Water Depth: ${maxDepth}m\n- Route Remarks: ${routeData.remarks?.map(r => translateRemark(r)).join(', ')}` : ''}
- Active Hazards: ${hazards.length > 0 ? hazards.map(h => `${h.type} at node ${h.name}`).join(', ') : 'None'}`;

        // Map and clean conversation history (Gemini API contents must start with a user message)
        const history = chatMessages
          .filter((msg, idx) => idx > 0)
          .map(msg => ({
            role: msg.role === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
          }));

        history.push({
          role: 'user',
          parts: [{ text: input }]
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: history
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || (lang === 'ko' ? '대답을 생성하지 못했습니다.' : 'ບໍ່ສາມາດສ້າງຄຳຕອບໄດ້.');
        setChatMessages(prev => [...prev, { role: 'bot', text: botReply }]);
      } catch (err) {
        console.error('Gemini API call failed, falling back to local bot:', err);
        const localReply = getBotReply(input);
        setChatMessages(prev => [...prev, { role: 'bot', text: localReply }]);
      } finally {
        setChatTyping(false);
      }
    } else {
      // Local fallback if API key is missing
      setTimeout(() => {
        const localReply = getBotReply(input);
        setChatMessages(prev => [...prev, { role: 'bot', text: localReply }]);
        setChatTyping(false);
      }, 600);
    }
  }, [chatInput, chatMessages, getBotReply, routeData, vehicle, rainIntensity, riverLevel, hazards, lang, translateRemark, getWeatherAlert, userApiKey]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatTyping]);

  // Quick question chips
  const quickQuestions = lang === 'ko'
    ? ['현재 상황 알려줘', '경로 안전해?', '침수 깊이?', '대피소 어디야?']
    : ['ສະຖານະຕອນນີ້', 'ເສັ້ນທາງປອດໄພ?', 'ນ້ຳເລິກ?', 'ສູນອົບພະຍົບ?'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Weather Alert Notification Banner */}
      <div 
        className={`weather-banner ${weatherAlert.class}`} 
        style={{
          background: weatherAlert.color,
          color: '#fff',
          padding: '0.65rem 1.5rem',
          fontWeight: 'bold',
          fontSize: '0.88rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {weatherAlert.level === 'CRITICAL' && <Siren size={18} className="flooded-pulse" />}
            <span>{weatherAlert.title}</span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.9, textAlign: 'left' }}>
            {weatherAlert.msg}
          </div>
        </div>

        {/* Real-time Physics Dynamics HUD at the top right */}
        {!isGameMode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '0.45rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '0.8rem',
            animation: 'chatSlideUp 0.3s ease'
          }}>
            {(() => {
              const activeRoute = !!routeData;
              const currentVehicle = routeData ? routeData.vehicle : vehicle;
              const maxDepth = routeData ? (routeData.geojson?.properties?.max_water_depth || 0) : 0;
              const phys = calculatePhysics(currentVehicle, maxDepth);
              const badgeText = activeRoute 
                ? (lang === 'ko' ? '실시간 분석' : 'ACTIVE') 
                : (lang === 'ko' ? '경로 대기중' : 'STANDBY');
              const badgeColor = activeRoute ? '#10b981' : '#94a3b8';
              const vehicleLabel = getVehicleKorean(currentVehicle);
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      background: activeRoute ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)', 
                      color: badgeColor, 
                      padding: '0.1rem 0.4rem', 
                      borderRadius: '4px',
                      border: `1px solid ${activeRoute ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.3)'}`,
                      marginRight: '0.25rem',
                      fontWeight: 'bold'
                    }}>
                      {badgeText}
                    </span>
                    <span style={{ fontSize: '0.9rem', marginRight: '0.15rem' }}>
                      {currentVehicle === 'tuktuk' ? '🛺' : (currentVehicle === 'motorcycle' ? '🏍️' : '🚗')}
                    </span>
                    <span style={{ color: '#cbd5e1', fontWeight: '500', marginRight: '0.3rem' }}>
                      {vehicleLabel}:
                    </span>
                  </div>
                  
                  {/* Buoyancy */}
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginRight: '0.2rem' }}>{t('physics_buoyancy')}</span>
                    <strong style={{ color: '#60a5fa' }}>{phys.fb} N</strong>
                  </div>

                  <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />

                  {/* Drag */}
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginRight: '0.2rem' }}>{t('physics_drag')}</span>
                    <strong style={{ color: '#f472b6' }}>{phys.fd} N</strong>
                  </div>

                  <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />

                  {/* Grip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{t('physics_grip')}</span>
                    <strong style={{ color: phys.gripRemaining > 70 ? '#10b981' : (phys.gripRemaining > 40 ? '#eab308' : '#ef4444') }}>
                      {phys.gripRemaining}%
                    </strong>
                  </div>

                  <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />

                  {/* Speed Limit */}
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginRight: '0.2rem' }}>{t('physics_vlimit')}</span>
                    <strong style={{ color: '#fca5a5' }}>{phys.vLimitKmh} km/h</strong>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="app-container" style={{ flexGrow: 1, height: 'calc(100vh - 55px)' }}>
        {/* Sidebar Controls */}
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="logo-icon">V</div>
            <div className="brand-title-group">
              <h1>{t('brand_title')}</h1>
              <p>{t('brand_subtitle')}</p>
            </div>
          </div>
          
          {/* Language Switch Toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setLang('ko')}
              style={{
                background: lang === 'ko' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: lang === 'ko' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                color: lang === 'ko' ? '#60a5fa' : '#94a3b8',
                borderRadius: '6px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: lang === 'ko' ? 'bold' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                transition: 'all 0.2s'
              }}
            >
              <span>🇰🇷</span> KO
            </button>
            <button
              onClick={() => setLang('lo')}
              style={{
                background: lang === 'lo' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: lang === 'lo' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                color: lang === 'lo' ? '#60a5fa' : '#94a3b8',
                borderRadius: '6px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: lang === 'lo' ? 'bold' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                transition: 'all 0.2s'
              }}
            >
              <span>🇱🇦</span> LO
            </button>
          </div>

          {/* Booth Game Mode Button */}
          <button
            onClick={() => {
              if (isGameMode) {
                setIsGameMode(false);
                setGameWin(false);
                playTone(200, 0.2, 'sawtooth');
              } else {
                setGameShowSelect(true);
                playTone(600, 0.1);
              }
            }}
            className={`game-toggle-btn ${isGameMode ? 'active' : 'inactive'}`}
          >
            {isGameMode ? t('game_exit_btn') : t('game_btn')}
          </button>
        </div>
        
        {/* Telemetry Telemetry Info */}
        <div className="control-card">
          <div className="card-title">
            <Activity size={18} />
            <h2>{t('sensor_title')}</h2>
          </div>
          
          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">{t('rain_label')}</span>
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
              <span className="slider-label">{t('river_label')}</span>
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
            <h2>{t('route_title')}</h2>
          </div>
          
          <div className="form-group">
            <label>{t('start_label')}</label>
            <select 
              className="select-control"
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
            >
              {Object.entries(NODE_LABELS_BY_LANG[lang] || NODE_LABELS_BY_LANG['ko']).map(([id, label]) => (
                <option key={id} value={id}>Node {id}: {label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('end_label')}</label>
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
              {Object.entries(NODE_LABELS_BY_LANG[lang] || NODE_LABELS_BY_LANG['ko']).map(([id, label]) => (
                <option key={id} value={id}>
                  Node {id}: {label} {isShelter(id) && `🛡️ (${t('shelter_dest')})`}
                </option>
              ))}
            </select>
            {isEvacMode && (
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold', marginTop: '0.15rem' }}>
                {t('evac_searching')}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>{t('vehicle_label')}</label>
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
                <span style={{ fontSize: '0.7rem' }}>{t('vehicle_car')}</span>
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
                <span style={{ fontSize: '0.7rem' }}>{t('vehicle_tuktuk')}</span>
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
                <span style={{ fontSize: '0.7rem' }}>{t('vehicle_motorcycle')}</span>
              </button>
            </div>
          </div>

          {/* Combined Operations Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.9rem', marginTop: '0.25rem' }}>
            <button
              onClick={() => {
                const newEvac = !isEvacMode;
                setIsEvacMode(newEvac);
                playTone(newEvac ? 880 : 440, 0.15, newEvac ? 'sawtooth' : 'sine');
              }}
              className={`evac-toggle-btn ${
                isEvacMode 
                  ? 'evac-on' 
                  : (rainIntensity >= 50 || riverLevel >= 11.5) 
                    ? 'evac-off danger-alert' 
                    : 'evac-off normal'
              }`}
            >
              {isEvacMode ? (
                <>
                  <Navigation size={16} />
                  <span>{t('btn_normal_mode')}</span>
                </>
              ) : (
                <>
                  <Siren size={16} className="flooded-pulse" />
                  <span>{t('btn_evac_mode')}</span>
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
                <Trash2 size={13} />
                {t('btn_clear_hazards')} ({hazards.length})
              </button>
            )}
          </div>
        </div>

        {/* Real-time AI CCTV & Camera Monitor Dashboard */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1.5px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '12px',
          padding: '0.75rem',
          marginTop: '1rem',
          marginBottom: '1rem',
          color: '#fff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          fontFamily: 'monospace'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.4rem', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              📹 실시간 AI CCTV 관제 모니터
            </span>
            <button
              onClick={() => {
                setSidebarCctvActive(!sidebarCctvActive);
                playTone(sidebarCctvActive ? 220 : 660, 0.1);
              }}
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: 'none',
                background: sidebarCctvActive ? '#ef4444' : '#00f2fe',
                color: '#000',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {sidebarCctvActive ? 'POWER OFF' : 'POWER ON'}
            </button>
          </div>

          {sidebarCctvActive ? (
            <div style={{
              height: '80px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1.5px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '0.68rem',
              color: '#4ade80',
              textAlign: 'center',
              padding: '0 0.8rem',
              lineHeight: 1.4
            }}>
              <span style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>● LIVE CAMERA ACTIVE</span>
              <span>우측 지도 위에 이동 가능한 대형 실시간 관제창이 팝업되었습니다.</span>
            </div>
          ) : (
            <div style={{
              height: '80px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1.5px dashed rgba(255,255,255,0.08)',
              fontSize: '0.68rem',
              color: '#94a3b8',
              textAlign: 'center',
              padding: '0 1rem',
              lineHeight: 1.4
            }}>
              POWER ON 버튼을 클릭하시면 실시간 AI 객체 감지 및 CCTV 스트림 피드 팝업창이 활성화됩니다.
            </div>
          )}
        </div>

        {/* Collapsible Cyber Telemetry Terminal */}
        <details className="telemetry-details">
          <summary className="telemetry-summary">
            <span>[+] SYSTEM TELEMETRY STREAM</span>
          </summary>
          
          <div className="telemetry-terminal">
            {telemetry ? (
              Object.entries(telemetry).map(([id, info]) => {
                let logClass = 'safe';
                let statusName = `[DRY] depth: 0.00m`;
                if (info.status === 'PASSABLE_CAUTION') {
                  logClass = 'warning';
                  statusName = `[CAUTION] depth: ${info.water_depth_m.toFixed(2)}m`;
                }
                if (info.status === 'WARNING_MOTO_RESTRICTED') {
                  logClass = 'warning';
                  statusName = `[RESTRICTED] depth: ${info.water_depth_m.toFixed(2)}m`;
                }
                if (info.status === 'FLOODED_IMPASSABLE') {
                  logClass = 'danger';
                  statusName = `[IMPASSABLE] depth: ${info.water_depth_m.toFixed(2)}m`;
                }
                
                return (
                  <div key={id} className={`telemetry-terminal-line ${logClass}`}>
                    &gt; {info.name}: {statusName} (elev: {info.elevation}m)
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--accent-cyan)' }}>
                &gt; CONNECTING TO SENSOR NETWORK NODE...
              </div>
            )}
          </div>
        </details>

      </aside>

      {/* Main Map Content */}
      <main className={`map-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

        {/* Panel Toggle Buttons */}
        <button
          onClick={() => {
            setIsSidebarCollapsed(!isSidebarCollapsed);
            playTone(400, 0.08);
          }}
          className="panel-toggle-btn"
          style={{
            position: 'absolute',
            left: isSidebarCollapsed ? '20px' : '400px',
            top: '90px',
            zIndex: 1001,
          }}
          title={isSidebarCollapsed ? t('expand_sidebar') : t('collapse_sidebar')}
        >
          {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        <button
          onClick={() => {
            setIsWidgetCollapsed(!isWidgetCollapsed);
            playTone(400, 0.08);
          }}
          className="panel-toggle-btn"
          style={{
            position: 'absolute',
            right: isWidgetCollapsed ? '20px' : '420px',
            top: '20px',
            zIndex: 1001,
          }}
          title={isWidgetCollapsed ? t('expand_widget') : t('collapse_widget')}
        >
          {isWidgetCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

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
                    <p style={{ margin: '0.2rem 0' }}>{lang === 'ko' ? '현재 물 높이' : 'ລະດັບນ້ຳປະຈຸບັນ'}: {props.water_depth_m}m</p>
                    <p style={{ fontWeight: '600' }}>{lang === 'ko' ? '침수 경보 단계' : 'ລະດັບແຈ້ງເຕືອນນ້ຳຖ້ວມ'}: {getSeverityKorean(props.severity)}</p>
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
            let radius = 8;
            let markerColor = 'var(--accent-blue)';
            let strokeColor = '#ffffff';
            let strokeWidth = 2.0;
            
            if (isStart) {
              markerColor = 'var(--status-safe)';
              radius = 14;
              strokeWidth = 2.5;
            } else if (isEnd && !isEvacMode) {
              markerColor = '#a855f7'; // Purple
              radius = 14;
              strokeWidth = 2.5;
            } else if (isShelterNode) {
              markerColor = '#10b981'; // Green for shelters
              radius = 15;
              strokeColor = '#ffffff';
              strokeWidth = 3.0; // Bold outline
            }
            
            // Overrides for game mode
            if (isGameMode) {
              if (id === gamePlayerNode) {
                markerColor = '#38bdf8'; // Glowing blue for player
                radius = 16;
                strokeColor = '#e0f2fe';
                strokeWidth = 4.0;
              } else if (id === gameTargetNode) {
                markerColor = '#22c55e'; // Bright green for shelter target
                radius = 16;
                strokeColor = '#fef08a'; // Yellow outline
                strokeWidth = 4.5;
              } else {
                markerColor = 'rgba(148, 163, 184, 0.4)';
                radius = 7.0;
                strokeColor = 'rgba(255,255,255,0.35)';
                strokeWidth = 1.2;
              }
            }
            
            // Overrides for hazard nodes
            if (hazardOnNode) {
              markerColor = '#f97316'; // Orange warning
              radius = isStart || isEnd ? 14 : 10;
              strokeWidth = 2.0;
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
                    {isGameMode ? (
                      <div style={{ padding: '0.25rem 0' }}>
                        <h4 style={{ fontWeight: '700', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.4rem' }}>
                          Challenge Node {id}
                        </h4>
                        <p style={{ margin: '0.2rem 0', fontWeight: '600' }}>{getNodeLabel(id) || info.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#666' }}>{t('node_elevation')}: {info.elevation}m</p>
                        
                        {/* SNS 커뮤니티 버튼 */}
                        <button
                          onClick={() => {
                            setActiveSnsNode(id);
                            fetchSnsPosts(id);
                            playTone(587.33, 0.08);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.5rem',
                            marginTop: '0.5rem',
                            marginBottom: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 5px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          💬 커뮤니티 피드 보기 (SNS)
                        </button>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem', alignItems: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: id === gamePlayerNode ? '#3b82f6' : (id === gameTargetNode ? '#10b981' : '#666') }}>
                          {id === gamePlayerNode && <span>🚗 {lang === 'ko' ? '내 위치' : 'ຂ້ອຍຢູ່ ນີ້'}</span>}
                          {id === gameTargetNode && <span>🏁 {lang === 'ko' ? '목적지 대피소' : 'ສູນອົບພະຍົບເປົ້າໝາຍ'}</span>}
                          {id !== gamePlayerNode && id !== gameTargetNode && <span>{lang === 'ko' ? '이동 가능 교차로' : 'ທາງແຍກຜ່ານ'}</span>}
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ fontWeight: '700', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.4rem' }}>
                          {t('node_popup_title')} {id} {isShelterNode && `🛡️ (${t('node_shelter')})`}
                        </h4>
                        <p style={{ margin: '0.2rem 0', fontWeight: '500', lineHeight: 1.2 }}>{getNodeLabel(id) || info.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>{t('node_elevation')}: {info.elevation}m</p>
                        
                        {/* SNS 커뮤니티 버튼 */}
                        <button
                          onClick={() => {
                            setActiveSnsNode(id);
                            fetchSnsPosts(id);
                            playTone(587.33, 0.08);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.5rem',
                            marginBottom: '0.65rem',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          💬 커뮤니티 피드 보기 (SNS)
                        </button>
                        
                        {/* 경로 설정 버튼 */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <button 
                            onClick={() => setStartNode(id)}
                            style={{ padding: '0.25rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem', flex: 1, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px' }}
                          >
                            {t('node_start_btn')}
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
                            {t('node_end_btn')}
                          </button>
                        </div>

                        {/* 실시간 장애물 제보 섹션 */}
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
                            <AlertTriangle size={12} /> {t('node_hazard_report')}
                          </span>
                          
                          {hazardOnNode ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fee2e2', padding: '0.3rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{getHazardLabel(hazardOnNode.hazard_type)} {t('node_hazard_registered')}</span>
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
                                {t('node_hazard_flood')}
                              </button>
                              <button 
                                onClick={() => handleReportHazard(id, 'accident')}
                                style={{ padding: '0.25rem 0.2rem', fontSize: '0.7rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#f8fafc' }}
                              >
                                {t('node_hazard_accident')}
                              </button>
                              <button 
                                onClick={() => handleReportHazard(id, 'pothole')}
                                style={{ padding: '0.25rem 0.2rem', fontSize: '0.7rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#f8fafc' }}
                              >
                                {t('node_hazard_pothole')}
                              </button>
                              <button 
                                onClick={() => handleReportHazard(id, 'police')}
                                style={{ padding: '0.25rem 0.2rem', fontSize: '0.7rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#f8fafc' }}
                              >
                                {t('node_hazard_police')}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}


          {/* Draw safety route polyline on map */}
          {!isGameMode && routeData && routeData.geojson && (
            <Polyline
              positions={routeData.geojson.geometry.coordinates.map(pt => [pt[1], pt[0]])}
              className="animated-route-line"
              pathOptions={{
                color: getRouteColor(),
                weight: 8,
                opacity: 0.95
              }}
            />
          )}
        </MapContainer>

        {/* Floating Draggable Real-time CCTV Video Feed */}
        {sidebarCctvActive && (
          <div 
            style={{
              position: 'fixed',
              left: `${cctvPos.x}px`,
              top: `${cctvPos.y}px`,
              width: '420px',
              background: 'rgba(10, 15, 30, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #00f2fe',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 242, 254, 0.2)',
              zIndex: 9999,
              color: '#fff',
              fontFamily: 'monospace',
              overflow: 'hidden'
            }}
          >
            {/* Title Bar Handle */}
            <div 
              onMouseDown={handleMouseDown}
              style={{
                background: 'linear-gradient(90deg, #0f172a, #1e293b)',
                padding: '0.65rem 0.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'move',
                userSelect: 'none',
                borderBottom: '1px solid rgba(0, 242, 254, 0.3)'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📹 RASPBERRY PI AI CAMERA [LIVE]
              </span>
              <button 
                onClick={() => {
                  setSidebarCctvActive(false);
                  playTone(220, 0.1);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  lineHeight: '1',
                  padding: '0.1rem 0.3rem',
                  transition: 'color 0.15s'
                }}
                onMouseOver={(e) => e.target.style.color = '#ef4444'}
                onMouseOut={(e) => e.target.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>

            {/* Video Box */}
            <div style={{ position: 'relative', width: '100%', height: '315px', background: '#000' }}>
              <img 
                src={`${API_BASE}/api/cctv/stream/live`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                alt="Tactical live stream"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  const errDiv = document.createElement('div');
                  errDiv.innerText = "⚠️ 카메라 연결 실패 (백엔드 오프라인)";
                  errDiv.style.color = "#ef4444";
                  errDiv.style.fontSize = "0.85rem";
                  errDiv.style.fontFamily = "monospace";
                  errDiv.style.position = "absolute";
                  errDiv.style.top = "50%";
                  errDiv.style.left = "50%";
                  errDiv.style.transform = "translate(-50%, -50%)";
                  parent.appendChild(errDiv);
                }}
              />
              
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#4ade80' }}>
                ● REC [LIVE]
              </div>
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', color: '#00f2fe' }}>
                DETECTION: PEDESTRIAN_YOLOv8
              </div>
            </div>
          </div>
        )}

        {/* Floating Draggable Node SNS Community Feed Modal */}
        {activeSnsNode && (
          <div 
            style={{
              position: 'fixed',
              left: `${snsPos.x}px`,
              top: `${snsPos.y}px`,
              width: '450px',
              height: '550px',
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(12px)',
              border: '2px solid #10b981',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(16, 185, 129, 0.25)',
              zIndex: 9999,
              color: '#fff',
              fontFamily: 'monospace',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Drag Header */}
            <div 
              onMouseDown={handleSnsMouseDown}
              style={{
                background: 'linear-gradient(90deg, #064e3b, #0f172a)',
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'move',
                userSelect: 'none',
                borderBottom: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                💬 교차로 #{activeSnsNode} 커뮤니티 피드 (SNS)
              </span>
              <button 
                onClick={() => {
                  setActiveSnsNode(null);
                  playTone(220, 0.1);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  lineHeight: '1',
                  transition: 'color 0.15s'
                }}
                onMouseOver={(e) => e.target.style.color = '#ef4444'}
                onMouseOut={(e) => e.target.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Feed List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isSnsLoading && snsPosts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '2rem 0' }}>
                  로딩 중...
                </div>
              ) : snsPosts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', padding: '3rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                  <span>📸 아직 등록된 라이더 사진이 없습니다.</span>
                  <span>첫 번째 주행 리뷰 사진을 업로드해 보세요!</span>
                </div>
              ) : (
                snsPosts.map((post) => (
                  <div 
                    key={post.id} 
                    style={{
                      background: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    {/* User profile bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.7rem', color: '#fff' }}>
                          {post.username ? post.username.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#e2e8f0' }}>{post.username}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.62rem', color: '#64748b' }}>
                          {new Date(post.timestamp).toLocaleDateString()} {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => handleDeleteSnsPost(post.id)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.1rem',
                            transition: 'color 0.15s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                          title="삭제하기"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Image display */}
                    {post.image_url && (
                      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000', maxHeight: '200px' }}>
                        <img 
                          src={`${API_BASE}${post.image_url}`} 
                          style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }} 
                          alt="SNS post upload" 
                        />
                      </div>
                    )}

                    {/* Comment bubble */}
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                      {post.comment}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Sticky Upload Form */}
            <form 
              onSubmit={handleUploadSnsPost}
              style={{
                background: 'rgba(15, 23, 42, 0.98)',
                borderTop: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '0.8rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="라이더 닉네임"
                  value={newPostNickname}
                  onChange={(e) => setNewPostNickname(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.5rem',
                    outline: 'none'
                  }}
                />
                
                {/* Custom Styled File Input */}
                <label 
                  htmlFor="sns-file-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.6rem',
                    background: newPostFile ? '#047857' : 'rgba(255,255,255,0.05)',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: '#e2e8f0',
                    transition: 'all 0.2s',
                    width: '130px',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📷 {newPostFile ? newPostFile.name : "사진 선택"}
                </label>
                <input 
                  id="sns-file-input"
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setNewPostFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <textarea 
                  placeholder="주행 경로 리뷰 및 라이딩 후기를 공유해주세요! (최대 100자)"
                  maxLength={100}
                  value={newPostComment}
                  onChange={(e) => setNewPostComment(e.target.value)}
                  rows={2}
                  style={{
                    flex: 1,
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.5rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="submit"
                  disabled={isSnsLoading}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: '0 0.8rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#34d399'}
                  onMouseOut={(e) => e.target.style.background = '#10b981'}
                >
                  {isSnsLoading ? "..." : "올리기"}
                </button>
              </div>
            </form>
          </div>
        )}



        {/* Floating Route Status Overlay */}
        {/* Floating Route Status Overlay */}
        {!isGameMode ? (
          <div className={`map-overlay-widget ${isWidgetCollapsed ? 'collapsed' : ''}`} style={{ border: isEvacMode ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="widget-header" style={{ color: isEvacMode ? '#ef4444' : '#e2e8f0' }}>
              {isEvacMode ? <Shield size={16} /> : <Navigation2 size={16} />}
              <span>{isEvacMode ? t('feed_title_evac') : t('feed_title_normal')}</span>
            </div>

            {errorMsg ? (
              <div className="widget-remarks" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{translateError(errorMsg)}</span>
                </div>
              </div>
            ) : routeData ? (
              <>
                {isEvacMode && routeData.shelter_name && (
                  <div className="widget-remarks" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#a7f3d0', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <Shield size={14} style={{ color: '#10b981' }} />
                      <span style={{ fontWeight: 'bold' }}>{t('shelter_dest')}: {getNodeLabel(routeData.shelter_name) || routeData.shelter_name}</span>
                    </div>
                  </div>
                )}
                {/* 수문학 시뮬레이션 정보 라벨 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.08)', padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: '0.2rem' }}>
                  <Shield size={12} />
                  <span>{t('cert_label')}</span>
                </div>

                {/* 거리와 이동수단 카드 (가로 2열 배치) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.15rem' }}>{t('distance')}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f8fafc' }}>{routeData.distance_m} m</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.15rem' }}>{t('selected_vehicle')}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                      {routeData.vehicle === 'tuktuk' ? '🛺' : (routeData.vehicle === 'motorcycle' ? '🏍️' : '🚗')}
                      <span>{getVehicleKorean(routeData.vehicle)}</span>
                    </div>
                  </div>
                </div>

                {/* 경로 안전성 지수 프로그레스바 */}
                {(() => {
                  const maxDepth = routeData.geojson?.properties?.max_water_depth || 0;
                  const limits = { tuktuk: 0.15, motorcycle: 0.22, car: 0.40 };
                  const limit = limits[routeData.vehicle] || 0.40;
                  
                  let safetyPct = 99.8;
                  let safetyColor = '#10b981'; // Green
                  let safetyLabel = t('logos_safe_value');
                  
                  if (maxDepth >= limit) {
                    safetyPct = 0;
                    safetyColor = '#ef4444'; // Red
                    safetyLabel = lang === 'ko' ? '0% (침수 차단)' : '0% (ຜ່ານບໍ່ໄດ້)';
                  } else if (maxDepth > 0) {
                    safetyPct = 82.4;
                    safetyColor = '#f59e0b'; // Amber
                    safetyLabel = t('logos_caution_value');
                  }
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{t('safety_index')}</span>
                        <span style={{ fontWeight: 'bold', color: safetyColor }}>{safetyLabel}</span>
                      </div>
                      <div style={{ width: '100%', height: '9px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${safetyPct}%`, height: '100%', background: safetyColor, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })()}

                {/* 최대 침수 조우 깊이 실시간 게이지 */}
                {(() => {
                  const maxDepth = routeData.geojson?.properties?.max_water_depth || 0;
                  const limits = { tuktuk: 0.15, motorcycle: 0.22, car: 0.40 };
                  const limit = limits[routeData.vehicle] || 0.40;
                  const ratio = Math.min(100, (maxDepth / limit) * 100);
                  
                  let barColor = '#10b981'; 
                  if (maxDepth >= limit) {
                    barColor = '#ef4444'; 
                  } else if (maxDepth > 0) {
                    barColor = '#f59e0b'; 
                  }
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: '#cbd5e1' }}>{t('max_water')}</span>
                        <span style={{ fontWeight: 'bold', color: barColor }}>{maxDepth.toFixed(3)} m / {limit} m</span>
                      </div>
                      <div style={{ width: '100%', height: '9px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${ratio}%`, height: '100%', background: barColor, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })()}

                {/* 대피 코멘트 알림창 */}
                <div className="widget-remarks" style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', padding: '0.5rem 0.6rem', borderRadius: '8px' }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
                  <span style={{ fontSize: '0.72rem', lineHeight: 1.35, color: '#93c5fd' }}>
                    {routeData.remarks?.map(r => translateRemark(r)).join(" ") || t('route_ok')}
                  </span>
                </div>


              </>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {t('cal_routing')}
              </div>
            )}
          </div>
        ) : (
          <div className={`map-overlay-widget ${isWidgetCollapsed ? 'collapsed' : ''}`} style={{ border: '1.5px dashed #38bdf8', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}>
            <div className="widget-header" style={{ color: '#38bdf8' }}>
              <Activity size={16} />
              <span>{lang === 'ko' ? '대피 챌린지 모드 활성화' : 'ໂໝດເກມອົບພະຍົບ'}</span>
            </div>
            <div style={{ padding: '0.5rem 0', fontSize: '0.8rem', lineHeight: 1.4 }}>
              {lang === 'ko' 
                ? '폭우 상황 속에서 목적지 대피소까지 직접 차량을 운전하는 중입니다. 침수 구간을 피하고 골든타임 내에 도달하십시오!' 
                : 'ກຳລັງຂັບຂີ່ລົດຫຼີກລ່ຽງນ້ຳຖ້ວມເພື່ອອົບພະຍົບ. ຫຼີກລ່ຽງທາງນ້ຳຖ້ວມ ແລະ ສິ່ງກີດຂວາງ!'}
            </div>
          </div>
        )}
      </main>
    </div>

      {/* ── AI Chatbot Widget ───────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>

        {/* Chat Window */}
        {chatOpen && (
          <div style={{
            width: '340px',
            height: '480px',
            background: 'linear-gradient(145deg, #0f1729, #1a2744)',
            border: '1px solid rgba(96,165,250,0.25)',
            borderRadius: '1.25rem',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(96,165,250,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'chatSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)'
          }}>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(96,165,250,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#60a5fa,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🤖</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
                    {lang === 'ko' ? 'VeloRoute AI' : 'VeloRoute AI'}
                  </div>
                  <div style={{ color: '#93c5fd', fontSize: '0.7rem' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80', marginRight: 4, verticalAlign: 'middle' }} />
                    {lang === 'ko' ? '홍수 안전 도우미' : 'ຜູ້ຊ່ວຍຄວາມປອດໄພ'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            {/* API Key Input Panel */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(96,165,250,0.15)',
              padding: '0.45rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: '#93c5fd', fontWeight: 600 }}>
                  {lang === 'ko' ? '🔑 Gemini API 키 설정' : '🔑 ລະຫັດ Gemini API'}
                  {saveStatus === 'saved' && (
                    <span style={{ color: '#10b981', marginLeft: '0.4rem', fontWeight: 800 }}>
                      {lang === 'ko' ? '✓ 저장완료' : '✓ ບັນທຶກແລ້ວ'}
                    </span>
                  )}
                  {saveStatus === 'cleared' && (
                    <span style={{ color: '#f87171', marginLeft: '0.4rem', fontWeight: 800 }}>
                      {lang === 'ko' ? '✕ 키 해제됨' : '✕ ຍົກເລີກແລ້ວ'}
                    </span>
                  )}
                </span>
                <span style={{ 
                  fontSize: '0.6rem', 
                  color: userApiKey ? '#4ade80' : '#eab308', 
                  background: userApiKey ? 'rgba(74,222,128,0.1)' : 'rgba(234,179,8,0.1)',
                  padding: '0.05rem 0.3rem',
                  borderRadius: '4px',
                  border: `1px solid ${userApiKey ? 'rgba(74,222,128,0.25)' : 'rgba(234,179,8,0.25)'}`
                }}>
                  {userApiKey 
                    ? (lang === 'ko' ? '실시간 AI 모드' : 'ໂໝດ AI ແທ້') 
                    : (lang === 'ko' ? '로컬 분석 모드' : 'ໂໝດທ້ອງຖິ່ນ')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="password"
                  value={tempKey}
                  onChange={e => setTempKey(e.target.value)}
                  placeholder={lang === 'ko' ? 'API 키를 입력하세요...' : 'ປ້ອນຄີ API ຂອງເຈົ້າ...'}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(96,165,250,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.7rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => {
                    const trimmed = tempKey.trim();
                    setUserApiKey(trimmed);
                    localStorage.setItem('veloroute_gemini_key', trimmed);
                    if (trimmed) {
                      setSaveStatus('saved');
                      try { playTone(800, 0.08); } catch(e){}
                    } else {
                      setSaveStatus('cleared');
                      try { playTone(300, 0.12); } catch(e){}
                    }
                    setTimeout(() => setSaveStatus(''), 2000);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '0 0.6rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.15s'
                  }}
                  onMouseEnter={e => e.target.style.opacity='0.85'}
                  onMouseLeave={e => e.target.style.opacity='1'}
                >
                  {lang === 'ko' ? '적용' : 'ນຳໃຊ້'}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: m.role === 'user' ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                      : 'rgba(255,255,255,0.07)',
                    border: m.role === 'bot' ? '1px solid rgba(96,165,250,0.15)' : 'none',
                    color: '#e2e8f0',
                    fontSize: '0.8rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '0.55rem 0.9rem', borderRadius: '1rem 1rem 1rem 0.2rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(96,165,250,0.15)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0,1,2].map(d => (
                      <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', display: 'inline-block', animation: `chatDot 1.2s ${d*0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions */}
            <div style={{ padding: '0 0.75rem 0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleChatSend(q)}
                  style={{
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(96,165,250,0.3)',
                    color: '#93c5fd',
                    borderRadius: '999px',
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.target.style.background='rgba(59,130,246,0.3)'; e.target.style.color='#fff'; }}
                  onMouseLeave={e => { e.target.style.background='rgba(59,130,246,0.15)'; e.target.style.color='#93c5fd'; }}
                >{q}</button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '0.6rem', borderTop: '1px solid rgba(96,165,250,0.15)', display: 'flex', gap: '0.5rem' }}>
              <input
                ref={chatInputRef}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                placeholder={lang === 'ko' ? '질문을 입력하세요...' : 'ພິມຄຳຖາມ...'}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(96,165,250,0.25)',
                  borderRadius: '0.75rem',
                  color: '#e2e8f0',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={() => handleChatSend()}
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  padding: '0 1rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => e.target.style.opacity='0.85'}
                onMouseLeave={e => e.target.style.opacity='1'}
              >↑</button>
            </div>
          </div>
        )}
        
        {/* ── Booth Game Modals & HUD Overlays ─────────────────── */}
        
        {/* 1. 차량 선택 모달 */}
        {gameShowSelect && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.95)', border: '2px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '500px',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)', color: '#fff', textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#60a5fa' }}>
                {t('game_select_vehicle')}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                {t('game_desc')}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => startGame('tuktuk')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px', padding: '1rem', color: '#fca5a5', cursor: 'pointer',
                    textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.2rem', transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.15)'}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>🛺 {t('vehicle_tuktuk')}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{t('game_vehicle_tuktuk_desc')}</span>
                </button>
                
                <button
                  onClick={() => startGame('motorcycle')}
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px', padding: '1rem', color: '#93c5fd', cursor: 'pointer',
                    textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.2rem', transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(59, 130, 246, 0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(59, 130, 246, 0.15)'}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>🏍️ {t('vehicle_motorcycle')}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{t('game_vehicle_moto_desc')}</span>
                </button>
                
                <button
                  onClick={() => startGame('car')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '12px', padding: '1rem', color: '#a7f3d0', cursor: 'pointer',
                    textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.2rem', transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(16, 185, 129, 0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(16, 185, 129, 0.15)'}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>🚗 {t('vehicle_car')}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{t('game_vehicle_car_desc')}</span>
                </button>
              </div>
              
              <button
                onClick={() => {
                  setGameShowSelect(false);
                  playTone(200, 0.1);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '8px',
                  padding: '0.5rem 1rem', color: '#fff', fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 2. 게임 실패 모달 */}
        {!isGameMode && !gameWin && (gameHealth <= 0 || gameTimeLeft <= 0) && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.95)', border: '2px solid #ef4444',
              borderRadius: '16px', padding: '2.5rem 2rem', width: '90%', maxWidth: '450px',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)', color: '#fff', textAlign: 'center'
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💀</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fca5a5', marginBottom: '1rem' }}>
                {t('game_over_title')}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.4 }}>
                {t('game_over_desc')}
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setGameShowSelect(true)}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none',
                    borderRadius: '10px', padding: '0.75rem 1.5rem', color: '#fff',
                    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {t('game_restart_btn')}
                </button>
                <button
                  onClick={() => {
                    setGameHealth(100);
                    setGameTimeLeft(60);
                    setGameScore(0);
                    playTone(200, 0.1);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)', border: 'none',
                    borderRadius: '10px', padding: '0.75rem 1.5rem', color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {t('game_exit_btn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. 게임 성공 및 명예의 전당 등록 모달 */}
        {gameWin && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.98)', border: '2px solid #10b981',
              borderRadius: '16px', padding: '2.5rem 2rem', width: '90%', maxWidth: '450px',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.5)', color: '#fff', textAlign: 'center'
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏆</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#a7f3d0', marginBottom: '0.75rem' }}>
                {t('game_clear_title')}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                {t('game_clear_desc')}
              </p>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t('game_final_score')}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#34d399', textShadow: '0 0 10px rgba(52,211,153,0.4)' }}>
                  {gameScore}
                </div>
              </div>
              
              {/* 명예의 전당 등록 양식 */}
              {!gameRankRegistered ? (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>
                    {t('game_enter_name')}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      value={gameNameInput}
                      onChange={e => setGameNameInput(e.target.value)}
                      placeholder="Name"
                      maxLength={10}
                      style={{
                        flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                        borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#fff', outline: 'none'
                      }}
                    />
                    <button
                      onClick={registerHighScore}
                      style={{
                        background: '#10b981', border: 'none', borderRadius: '8px',
                        padding: '0.5rem 1.25rem', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      {t('game_rank_register')}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#34d399', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  ✓ {t('game_rank_msg')}
                </p>
              )}
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => startGame(gameVehicle)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                    borderRadius: '10px', padding: '0.75rem 1.5rem', color: '#fff',
                    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {t('game_restart_btn')}
                </button>
                <button
                  onClick={() => {
                    setGameWin(false);
                    setGameHealth(100);
                    setGameTimeLeft(60);
                    setGameScore(0);
                    playTone(200, 0.1);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)', border: 'none',
                    borderRadius: '10px', padding: '0.75rem 1.5rem', color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {t('game_exit_btn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. 게임 중 HUD 패널 (Floating Panel) */}
        {isGameMode && (
          <div style={{
            position: 'fixed', top: '80px', right: '20px', width: '360px',
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '16px',
            padding: '1.25rem', color: '#fff', zIndex: 900,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1.1rem'
          }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#38bdf8' }}>
                {lang === 'ko' ? '🎮 대피 서바이벌 HUD' : '🎮 ສະຖານະເກມ'}
              </h3>
              <span style={{ fontSize: '0.85rem', background: 'rgba(99,102,241,0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.4)' }}>
                {gameVehicle === 'tuktuk' ? '🛺 Tuktuk' : (gameVehicle === 'motorcycle' ? '🏍️ Moto' : '🚗 Car')}
              </span>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>{t('game_health')}</span>
                <span style={{ fontWeight: 'bold', color: gameHealth > 40 ? '#10b981' : '#ef4444' }}>{gameHealth}%</span>
              </div>
              <div style={{ width: '100%', height: '11px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${gameHealth}%`, height: '100%', background: gameHealth > 40 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f87171)', transition: 'width 0.2s' }} />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>{t('game_time')}</span>
                <span style={{ fontWeight: 'bold', color: gameTimeLeft > 20 ? '#f59e0b' : '#ef4444' }}>{gameTimeLeft}s</span>
              </div>
              <div style={{ width: '100%', height: '11px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${(gameTimeLeft / 60) * 100}%`, height: '100%', background: gameTimeLeft > 20 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)', transition: 'width 1s linear' }} />
              </div>
            </div>
            
            <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>📍 {t('game_current_pos')}: <strong style={{ color: '#38bdf8' }}>{gamePlayerNode}</strong> ({getNodeLabel(gamePlayerNode)})</div>
              <div>🏁 {t('game_target_pos')}: <strong style={{ color: '#10b981' }}>{gameTargetNode}</strong> ({getNodeLabel(gameTargetNode)})</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => handleGameMove('UP')}
                style={{
                  width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
                }}
              >▲</button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleGameMove('LEFT')}
                  style={{
                    width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
                  }}
                >◀</button>
                <button
                  onClick={() => handleGameMove('DOWN')}
                  style={{
                    width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
                  }}
                >▼</button>
                <button
                  onClick={() => handleGameMove('RIGHT')}
                  style={{
                    width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
                  }}
                >▶</button>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                * W/A/S/D 또는 키보드 방향키 조작 가능
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.7rem' }}>
              <div style={{ fontWeight: 'bold', color: '#818cf8', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Activity size={12} /> {t('physics_oracle_title')}
              </div>
              <div style={{ opacity: 0.9, lineHeight: 1.3 }}>
                {(() => {
                  const adj = getAdjacencyList();
                  const neighbors = adj[gamePlayerNode] || [];
                  let depth = 0;
                  let isMud = false;
                  neighbors.forEach(n => {
                    if (telemetry && telemetry[n.telemetry_id]) {
                      const d = telemetry[n.telemetry_id].water_depth_m || 0;
                      if (d > depth) {
                        depth = d;
                        isMud = n.surface === 'unpaved';
                      }
                    }
                  });
                  
                  const limits = { tuktuk: 0.15, motorcycle: 0.22, car: 0.40 };
                  const limit = limits[gameVehicle] || 0.40;
                  
                  if (depth >= limit) {
                    return lang === 'ko' 
                      ? `위험: 침수 깊이 ${depth}m가 차량 한계치(${limit}m)를 초과! 바퀴가 잠겨 수직항력이 급감하고 마찰이 상실되었습니다.` 
                      : `ອັນຕະລາຍ: ລະດັບນ້ຳຖ້ວມ ${depth}m ກາຍຂີດຈຳກັດພາຫະນະ (${limit}m)! ແຮງຍຶດເກາະເສຍໄປແລ້ວ.`;
                  } else if (isMud) {
                    return lang === 'ko'
                      ? `진흙 늪: 타이어 구름 저항이 250% 폭증하고 마찰 계수(μ)가 0.15로 급락하여 시간 감점 페널티(-2s)가 누적됩니다.`
                      : `ທາງຕົມ: ແຮງຮຸກຖູຫຼຸດລົງເຫຼືອ (μ ≈ 0.15) ເຮັດໃຫ້ລົດຕິດຫຼົ່ມ ແລະ ຖືກຫຼຸດເວລາລົງ (-2s).`;
                  } else if (depth > 0.02) {
                    return lang === 'ko'
                      ? `물웅덩이: 수위 ${depth}m. 아르키메데스 부력(Fb)으로 인해 접지 마찰력이 미세하게 손실되는 중입니다.`
                      : `ມີນ້ຳຂັງ: ລະດັບນ້ຳ ${depth}m. ໄດ້ຮັບແຮງຟູ (Fb) ເຮັດໃຫ້ແແຮງຍຶດເກາະຫຼຸດລົງໜ້ອຍໜຶ່ງ.`;
                  } else {
                    return lang === 'ko'
                      ? `양호: 포장도로 표면 접지 계수(μ ≈ 0.65) 안정적. 관성 운동에 의한 조향 제어가 양호하게 유지됩니다.`
                      : `ປົກກະຕິ: ແຮງຍຶດເກາະລະຫວ່າງຢາງລົດແລະໜ້າທາງ (μ ≈ 0.65) ຍັງຄົງທີ່, ການຄວບຄຸມລົດດີ.`;
                  }
                })()}
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fbbf24', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('game_leaderboard_title')}</span>
                <span>Top 3</span>
              </div>
              <table style={{ width: '100%', fontSize: '0.68rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#94a3b8' }}>
                    <th>{t('game_rank')}</th>
                    <th>{t('game_name')}</th>
                    <th>{t('game_vehicle')}</th>
                    <th>{t('game_score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {gameLeaderboard.slice(0, 3).map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ fontWeight: 'bold', color: idx===0 ? '#fbbf24' : (idx===1 ? '#94a3b8' : '#cd7f32') }}>{idx+1}</td>
                      <td>{entry.name}</td>
                      <td>{entry.vehicle === 'tuktuk' ? '🛺' : (entry.vehicle === 'motorcycle' ? '🏍️' : '🚗')}</td>
                      <td style={{ fontWeight: 'bold', color: '#34d399' }}>{entry.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          onClick={() => setChatOpen(o => !o)}
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1d4ed8, #6366f1)',
            border: '2px solid rgba(99,102,241,0.4)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.5)',
            cursor: 'pointer',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
            animation: chatOpen ? 'none' : 'chatPulse 2.5s infinite'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 6px 30px rgba(99,102,241,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(99,102,241,0.5)'; }}
          title={lang === 'ko' ? 'AI 안전 도우미' : 'AI ຜູ້ຊ່ວຍ'}
        >
          {chatOpen ? '✕' : '🤖'}
        </button>

        {/* CSS animations injected inline */}
        <style>{`
          @keyframes chatSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes chatPulse {
            0%, 100% { box-shadow: 0 4px 24px rgba(99,102,241,0.5); }
            50%       { box-shadow: 0 4px 36px rgba(99,102,241,0.85); }
          }
          @keyframes chatDot {
            0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
            40%            { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
