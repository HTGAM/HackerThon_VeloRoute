from flask import Flask, request, Response, jsonify
from flask_cors import CORS  # 지도 시스템(VeloRoute) 연동을 위해 필수!
import cv2
import numpy as np
from ultralytics import YOLO
import time
import os
import torch

# 파이썬 환경에 따라 custom 가중치 파일 로드 시 발생하는 보안 에러 방지용 안전 장치
if not hasattr(torch, '_original_load'):
    torch._original_load = torch.load
    def safe_torch_load(*args, **kwargs):
        kwargs['weights_only'] = False
        return torch._original_load(*args, **kwargs)
    torch.load = safe_torch_load

app = Flask(__name__)
CORS(app)  # 프론트엔드와 백엔드의 포트가 달라도 데이터 통신이 가능하도록 허용

# 1. [변경] 실행 경로가 어디든 best.pt 파일을 스크립트 위치 기준으로 안전하게 찾음
script_dir = os.path.dirname(os.path.abspath(__file__))
best_pt_path = os.path.join(script_dir, 'best.pt')

if not os.path.exists(best_pt_path):
    print(f"⚠️ Warning: Model file not found at {best_pt_path}. Falling back to default search path.")
    best_pt_path = 'best.pt'

model = YOLO(best_pt_path) 

# 침수 구역이 감지되었을 때 현장 캡처 사진을 저장할 폴더 설정 (Flask static 폴더 내부에 자동 매핑)
ALERT_DIR = os.path.join(script_dir, 'static', 'alerts')
os.makedirs(ALERT_DIR, exist_ok=True)

# 최신 AI 분석 프레임 및 지도에 전송할 침수 발생 이력 배열
latest_frame = None
alert_history = []

@app.route('/upload', methods=['POST'])
def upload():
    global latest_frame, alert_history
    img_bytes = request.data
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is not None:
        # 2. [변경] 사람 지정(classes=[0])을 풀고, 침수 영역(세그멘테이션)을 전체 분석합니다.
        results = model(frame, verbose=False)
        
        # 분석 결과(물웅덩이에 불투명하게 색칠된 화면)를 전역 변수에 저장
        latest_frame = results[0].plot()
        
        # 3. [변경] 사각형 상자(boxes)가 아니라 세그멘테이션 마스크(masks)가 발견되면 침수로 판단합니다.
        if results[0].masks is not None and len(results[0].masks) > 0:
            print(f"⚠️ [위험] 도로 침수 구역 감지됨! (탐지 개수: {len(results[0].masks)}개)")
            
            # 침수 현장 사진 파일로 저장
            filename = f"flood_{int(time.time())}.jpg"
            save_path = os.path.join(ALERT_DIR, filename)
            cv2.imwrite(save_path, latest_frame)
            
            # 고정형 스마트 CCTV 환경을 가정한 고정 위도/경도 좌표 생성
            # (VeloRoute 자전거 도로 맵 위에 띄우고 싶은 실제 위/경도 좌표로 변경 가능)
            lat, lng = 36.769213, 126.934125
            
            new_alert = {
                "lat": lat,
                "lng": lng,
                "img_url": f"http://localhost:5001/static/alerts/{filename}",
                "time": time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # 실시간 갱신 시 메모리 과부하를 막기 위해 최신 15개의 기록만 유지
            alert_history.append(new_alert)
            if len(alert_history) > 15:
                alert_history.pop(0)
            
    return "OK", 200

# 4. [추가] VeloRoute 지도 화면이 3초마다 요청해서 침수 좌표와 사진을 가져갈 엔드포인트
@app.route('/api/alerts')
def get_alerts():
    return jsonify(alert_history)

# 웹 브라우저로 실시간 영상 스트리밍을 송출해주는 함수
def gen_frames():
    global latest_frame
    while True:
        if latest_frame is not None:
            ret, buffer = cv2.imencode('.jpg', latest_frame)
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03) # 약 30fps 제어

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return """
    <html>
        <head>
            <title>AI Flood Monitoring System</title>
            <style>
                body { text-align: center; background-color: #111; color: white; font-family: sans-serif; }
                h1 { margin-top: 50px; color: #ff4d4d; }
                img { border: 5px solid #333; border-radius: 10px; margin-top: 20px; box-shadow: 0 0 20px rgba(255,0,0,0.5); }
            </style>
        </head>
        <body>
            <h1>자전거 도로 실시간 침수 모니터링 시스템</h1>
            <p>라즈베리파이 카메라 ➡️ 노트북 AI(best.pt 세그멘테이션) 분석 화면</p>
            <img src="/video_feed" width="720">
        </body>
    </html>
    """

if __name__ == '__main__':
    print("====================================================")
    print("💻 노트북 AI 웹 모니터링 서버 가동 시작!")
    print("👉 서버가 켜지면 크롬 브라우저를 열고 주소창에 아래 주소를 치세요:")
    print("   http://localhost:5001")
    print("====================================================")
    app.run(host='0.0.0.0', port=5001, threaded=True)
