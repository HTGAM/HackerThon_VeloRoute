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
const API_BASE = 'http://localhost:8001';

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

const TRANSLATIONS = {
  ko: {
    brand_title: "벨로루트 비엔티안",
    brand_subtitle: "스마트시티 실시간 홍수 회피 내비",
    sensor_title: "실시간 메콩강 센서 데이터 (Telemetry)",
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
    btn_normal_mode: "일반 길찾기 모드 전환",
    btn_evac_mode: "🚨 긴급 대피소 최적 경로 탐색",
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
    cert_label: "라오스 기상 DMH / 국가재난 NDMC 인증 안전 규격 준수",
    distance: "예상 경로 총 거리",
    safety_index: "경로 안전성 지수 (수문학)",
    logos_safe_value: "99.8% (최적)",
    logos_caution_value: "82.4% (감속 주의)",
    max_water: "최대 침수 조우 깊이",
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
    alert_crit_title: "🚨 기상 재난 경보: 저지대 완전 침수 및 즉시 대피 권고 🚨",
    alert_crit_msg: "세상의 어떤 보물도 당신의 소중한 생명만큼 값지지 않습니다. 사이렌이 울리는 지금, 망설이지 말고 인근 고지대 대피소로 즉시 대피하여 안전을 지키십시오. 당신의 무사 귀환이 가족에겐 가장 큰 기쁨입니다.",
    alert_warn_title: "⚠️ 기상 경보: 강변 침수 진행에 따른 고지대 우회 권고",
    alert_warn_msg: "“소 잃고 외양간 고친다” 하였습니다. 메콩강 범람으로 강변 도로 일부가 물에 잠겼으니, 더 큰 사고를 당하기 전에 삼센타이 등 안전한 고지대 포장도로로 즉시 우회하여 스스로의 안전을 확보하십시오.",
    alert_caut_title: "⚡ 기상 주의보: 노면 미끄러움 및 지름길 차단 우려",
    alert_caut_msg: "“진흙탕 지름길은 당신의 시간을 지르지 못하고 오히려 삼켜 버립니다.” 야시장 야외 지름길 등 비포장도로는 폭우 시 바퀴가 빠지는 진흙 늪이 되어 전복 위험을 높입니다. 안전이 입증된 큰길로 서행하십시오.",
    alert_norm_title: "☀️ 기상 상황: 안전하고 원활한 운행 환경",
    alert_norm_msg: "“돌다리도 두드려보고 건너라” 했습니다. 기상이 양호하여 운행이 원활하지만, 갑작스러운 노면 변화에 대비하여 항상 규정 속도를 지키고 안전거리를 확보하시기 바랍니다."
  },
  lo: {
    brand_title: "ເວໂລຣູດ ວຽງຈັນ",
    brand_subtitle: "ລະບົບນຳທາງຫຼີກລ່ຽງນ້ຳຖ້ວມທັນເວລາ",
    sensor_title: "ຂໍ້ມູນເຊັນເຊີແມ່ນ້ຳຂອງທັນເວລາ",
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
    btn_normal_mode: "ປ່ຽນເປັນໂຫມດຄົ້ນຫາເສັ້ນທາງທົ່ວໄປ",
    btn_evac_mode: "🚨 ຄົ້ນຫາເສັ້ນທາງໄປສູນອົບພະຍົບທີ່ດີທີ່ສຸດ",
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
    cert_label: "ປະຕິບັດຕາມມາດຕະຖານຄວາມປອດໄພທີ່ໄດ້ຮັບການຮັບຮອງຈາກ DMH ແລະ NDMC ລາວ",
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
    alert_crit_title: "🚨 ແຈ້ງເຕືອນໄພພິບັດທາງອາກາດ: ນ້ຳຖ້ວມຂັງເຂດຕ່ຳຢ່າງສົມບູນ ແລະ ແນະນຳໃຫ້ອົບພະຍົບທັນທີ 🚨",
    alert_crit_msg: "ບໍ່ມີຊັບສົມບັດໃດໆໃນໂລກນີ້ທີ່ຈະມີຄ່າຫຼາຍໄປກວ່າຊີວິດທີ່ຮັກແພງຂອງທ່ານ. ໃນຂະນະທີ່ສຽງໄຊເລນດັງຂຶ້ນນີ້, ຢ່າລັ່ງເລໃຈ, ຈົ່ງຮີບອົບພະຍົບໄປຫາສູນອົບພະຍົບທີ່ຢູ່ເຂດເນີນສູງທັນທີເພື່ອຄວາມປອດໄພຂອງທ່ານ. ການກັບມາຢ່າງປອດໄພຂອງທ່ານແມ່ນຄວາມສຸກທີ່ຍິ່ງໃຫຍ່ທີ່ສຸດຂອງຄອບຄົວ.",
    alert_warn_title: "⚠️ ແຈ້ງເຕືອນສະພາບອາກາດ: ແນະນຳໃຫ້ຫຼີກລ່ຽງເສັ້ນທາງເຂດເນີນສູງເນື່ອງຈາກນ້ຳຖ້ວມແຄມຂອງ",
    alert_warn_msg: "ມີຄຳສຸພາສິດທີ່ວ່າ 'ເສຍງົວແລ້ວຈຶ່ງເຮັດຄອກ'. ເນື່ອງຈາກແມ່ນ້ຳຂອງລົ້ນຝັ່ງເຮັດໃຫ້ນ້ຳຖ້ວມຖະໜົນແຄມຂອງບາງສ່ວນ, ກ່ອນທີ່ຈະເກີດອຸປະຕິເຫດທີ່ຮ້າຍແຮງກວ່ານີ້, ຈົ່ງຫຼີກລ່ຽງໄປໃຊ້ຖະໜົນປູຢາງທີ່ປອດໄພກວ່າໃນເຂດເນີນສູງ ເຊັ່ນ ຖະໜົນສາມແສນໄທ ທັນທີ ເພື່ອຄວາມປອດໄພຂອງຕົວທ່ານເອງ.",
    alert_caut_title: "⚡ ແຈ້ງເຕືອນລະວັງ: ຖະໜົນມື່ນ ແລະ ຄວາມສ່ຽງທາງລັດຖືກຕັດຂາດ",
    alert_caut_msg: "“ທາງລັດທີ່ເປັນຕົມບໍ່ໄດ້ຊ່ວຍປະຢັດເວລາຂອງທ່ານ, ແຕ່ມັນຈະກືນກິນເວລາຂອງທ່ານ.” ທາງລັດດິນແດງ ເຊັ່ນ ທາງຫຼັງຕະຫຼາດກາງຄືນ ອາດຈະກາຍເປັນຕົມເລິກໃນເວລາຝົນຕົກໜັກ ເຮັດໃຫ້ລົດຕິດຫຼົ່ມ ແລະ ເພີ່ມຄວາມສ່ຽງຕໍ່ການຂ້ຳ. ກະລຸນາຂັບຂີ່ຢ່າງຊ້າໆ ໃນເສັ້ນທາງໃຫຍ່ທີ່ປອດໄພ.",
    alert_norm_title: "☀️ ສະພາບອາກາດ: ສະພາບແວດລ້ອມການເດີນທາງປອດໄພ ແລະ ສະດວກ",
    alert_norm_msg: "ມີຄຳເວົ້າທີ່ວ່າ '້າມຂົວຫີນກໍຕ້ອງເຄาະເບິ່ງກ່ອນ'. ເຖິງວ່າສະພາບອາກາດຈະດີ ແລະ ການຈໍລະຈອນສະດວກ, ແຕ່ກະລຸນາປະຕິບັດຕາມຄວາມໄວທີ່ກຳນົດ ແລະ ຮັກສາໄລຍະຫ່າງທີ່ປອດໄພສະເໝີ ເພື່ອຮັບມືກັບການປ່ຽນແປງຂອງສະພາບຖະໜົນທີ່ບໍ່ຄາດຄິດ."
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
        </div>

        {/* Emergency Evacuation & Community Actions */}
        <div className="control-card">
          <div className="card-title">
            <Shield size={18} style={{ color: isEvacMode ? '#ef4444' : '#10b981' }} />
            <h2>{t('disaster_center')}</h2>
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
                  {t('btn_normal_mode')}
                </>
              ) : (
                <>
                  <Siren size={16} className="flooded-pulse" />
                  {t('btn_evac_mode')}
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
                {t('btn_clear_hazards')} ({hazards.length})
              </button>
            )}
          </div>
        </div>

        {/* Real-time telemetry Segment Status Feed */}
        <div className="control-card" style={{ flexGrow: 1 }}>
          <div className="card-title">
            <Droplets size={18} />
            <h2>{t('road_status_title')}</h2>
          </div>
          
          <div className="telemetry-list">
            {telemetry ? (
              Object.entries(telemetry).map(([id, info]) => {
                let badgeClass = 'status-dry';
                let statusName = t('road_dry');
                if (info.status === 'PASSABLE_CAUTION') {
                  badgeClass = 'status-caution';
                  statusName = t('road_caution');
                }
                if (info.status === 'WARNING_MOTO_RESTRICTED') {
                  badgeClass = 'status-caution';
                  statusName = t('road_restrict');
                }
                if (info.status === 'FLOODED_IMPASSABLE') {
                  badgeClass = 'status-danger';
                  statusName = t('road_flooded');
                }
                
                return (
                  <div key={id} className="telemetry-item">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: '600' }}>{info.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {t('elevation_m')}: {info.elevation}m | {t('depth_m')}: {info.water_depth_m.toFixed(2)}m
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
                {t('sensor_connecting')}
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
                      {t('node_popup_title')} {id} {isShelterNode && `🛡️ (${t('node_shelter')})`}
                    </h4>
                    <p style={{ margin: '0.2rem 0', fontWeight: '500', lineHeight: 1.2 }}>{getNodeLabel(id) || info.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>{t('node_elevation')}: {info.elevation}m</p>
                    
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
              {/* [인성적 설득: Ethos] 시스템의 신뢰도 및 공신력 표출 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: '0.3rem' }}>
                <Shield size={12} />
                <span>{t('cert_label')}</span>
              </div>

              <div className="widget-stat">
                <span className="widget-label">{t('distance')}</span>
                <span className="widget-value">{routeData.distance_m} m</span>
              </div>

              {/* [이성적 설득: Logos] 과학적이고 귀납적인 안전 수치 제시 */}
              <div className="widget-stat" style={{ color: 'var(--status-safe)' }}>
                <span className="widget-label" style={{ color: 'rgba(16, 185, 129, 0.85)', fontWeight: '600' }}>{t('safety_index')}</span>
                <span className="widget-value" style={{ fontWeight: '700' }}>
                  {routeData.geojson?.properties?.max_water_depth === 0 ? t('logos_safe_value') : t('logos_caution_value')}
                </span>
              </div>
              <div className="widget-stat">
                <span className="widget-label">{t('max_water')}</span>
                <span className="widget-value">{routeData.geojson?.properties?.max_water_depth?.toFixed(3) || 0.000} m</span>
              </div>
              <div className="widget-stat">
                <span className="widget-label">{t('selected_vehicle')}</span>
                <span className="widget-value">
                  {getVehicleKorean(routeData.vehicle)}
                </span>
              </div>
              <div className="widget-remarks">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{routeData.remarks?.map(r => translateRemark(r)).join(" ") || t('route_ok')}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {t('cal_routing')}
            </div>
          )}
        </div>
      </main>
    </div>
  </div>
  );
}
