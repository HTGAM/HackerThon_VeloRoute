# 🇱🇦 벨로루트 비엔티안 (VeloRoute Vientiane)
> **라오스 비엔티안 우기 침수 대응 실시간 홍수 회피 및 오토바이/뚝뚝 특화 스마트 내비게이션**

본 프로젝트는 라오스 비엔티안 중심가와 메콩강 주변의 고유한 기후 및 교통 인프라 문제를 스마트시티 관점에서 해결하기 위해 설계된 실시간 안전 길찾기 서비스 프로토타입입니다.

---

## 🌟 주요 기능 (Key Features)

### 1. 실시간 기상 재난 경보 배너 (Weather Alert System)
* 메콩강 수위(8.0m ~ 15.0m) 및 강수량(0 ~ 120 mm/h) 시뮬레이션 센서 데이터에 동적으로 반응합니다.
* **안전 (초록)** ➔ **주의 (노란)** ➔ **경보 (오렌지)** ➔ **대피 사이렌 (빨간색 점멸 애니메이션)** 4단계로 기상 상태를 시각화하여 경각심을 제공합니다.

### 2. 긴급 대피소 최적 경로 안내 (Emergency Evacuation)
* 비엔티안 내 고지대에 위치한 안전 대피소 4곳을 지도상에 **녹색 방패 마커**로 시각화합니다.
  * *빠뚜사이 고지대 대피소 (Node I)*
  * *탓루앙 황금사원 대피소 (Node Q)*
  * *동독 국립대학교 체육관 대피소 (Node V)*
  * *딸랏싸오 쇼핑몰 고지대 대피소 (Node P)*
* `🚨 긴급 대피소 최적 경로 탐색` 버튼을 누르면 현재 출발지로부터 침수 구역을 안전하게 우회하여 최단 시간 내 도달할 수 있는 대피소 최적 탈출 경로를 즉시 연산해 녹색 실선으로 안내합니다.

### 3. 실시간 사용자 장애물 제보 및 우회 (Community Hazard Detouring)
* 사용자가 지도상의 노드를 클릭하여 **도로 침수, 사고 발생, 포트홀, 도로 통제** 상황을 제보할 수 있습니다.
* 제보가 접수되면 지도 상에 **주황색 경고 마커**가 표시되며, 백엔드 Dijkstra 라우터가 해당 구간의 가중치에 **20배(2000%) 페널티**를 즉시 적용하여, 이후 경로 탐색 시 이 위험 구간을 자동으로 우회하는 실시간 대체 경로를 생성합니다.

### 4. 이동 수단별 특화 경로 계산 (Vehicle-Specific Routing)
* **뚝뚝 (Tuk-Tuk)**: 삼륜 구조와 승객 안전을 고려해 비포장도로에 **6.5배(650%) 가중치 페널티**를 부여하며, 엔진 및 차량 바닥 높이 제한으로 **15cm 이상 침수 도로 진입을 전면 차단**합니다.
* **오토바이 (Motorcycle)**: 비포장 슬립 위험으로 **2.5배 페널티**를 주며, 배기구 높이 제한으로 **22cm 이상 침수 도로 진입을 차단**합니다.
* **승용차 (Car)**: 일반 비포장 페널티 1.5배 및 **30cm 이상 심각 침수 도로 진입을 차단**합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Backend
* **Python 3.13** & **FastAPI**
* **Dynamic Dijkstra Routing Algorithm** (사용자 제보 및 침수 깊이 실시간 반영 가중치 그래프)
* **Hydrological Telemetry Simulator** (강수량 및 메콩강 범람 연동 도로 침수 수위 수치 시뮬레이터)

### Frontend
* **React** (Vite 번들러)
* **React-Leaflet** (Futuristic Dark Matter 테마 지도 연동)
* **Lucide React** (프리미엄 반응형 아이콘셋)

### Infrastructure (OSRM)
* **OSRM (Open Source Routing Machine)**: 뚝뚝에 특화된 비포장 Tag 회피용 LUA 프로파일(`tuktuk.lua`) 설계 및 라오스 OSM 지리 데이터 정적 가중치 전처리 파이프라인 수립.

---

## 📁 폴더 구조 (Project Structure)

```
HackerTone/
├── backend/
│   ├── main.py                # FastAPI 엔드포인트 및 API 라우팅 게이트웨이
│   ├── telemetry.py           # 실시간 기상/수량 센서 데이터 수문 시뮬레이션
│   ├── router.py              # 41개 노드망 커스텀 Dijkstra 라우터 및 대피소 탐색기
│   ├── test_router.py         # 백엔드 알고리즘 단위 검증 테스트 스위트
│   └── osrm/
│       ├── Dockerfile.osrm    # 라오스 지도 데이터 OSRM 빌드 환경
│       └── tuktuk.lua         # 비포장 회피용 뚝뚝 전용 프로파일 LUA
└── frontend/
    ├── package.json           # React-Vite 라이브러리 목록
    ├── index.html             # 웹앱 메인 셸
    └── src/
        ├── App.jsx            # 재난안전 맵 대시보드 컴포넌트
        └── index.css          # 프리미엄 다크 테마 & 글래스모피즘 스타일시트
```

---

## 🚀 실행 및 테스트 방법 (How to Run)

### 1. 백엔드 (FastAPI) 구동
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows 환경
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
* 백엔드는 포트 **8001**에서 API 서비스를 개시합니다.
* API 문서(Swagger UI)는 [http://localhost:8001/docs](http://localhost:8001/docs)에서 직접 제어하실 수 있습니다.

### 2. 프론트엔드 (React) 구동
```bash
cd frontend
npm install
npm run dev
```
* 프론트엔드는 포트 **3000**에서 구동됩니다.
* 브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 실시간 맵을 조작할 수 있습니다.

### 3. 알고리즘 테스트 실행
```bash
python backend/test_router.py
```
* 건조기 비포장 기피, 우기 강변 침수 우회, 극단적 폭우 시 고립, 실시간 장애물(사고) 제보 시 우회 등 4대 경로 체크 시나리오에 대해 알고리즘 무결성을 검증합니다.
