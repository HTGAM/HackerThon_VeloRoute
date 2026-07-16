import cv2
import requests
import time

# [설정] 본인의 노트북 IP 주소와 포트를 적어주세요.
# 현재 검색된 노트북의 Wi-Fi IP는 172.20.10.3 입니다.
# 포트는 FastAPI 백엔드 기본 포트인 8001번을 사용합니다.
LAPTOP_IP = "172.20.10.3" 
PORT = "8001"

# 연동할 CCTV 채널을 지정합니다. (A: 메콩강변, I: 빠뚜사이, Q: 탓루앙, V: 국립대 캠퍼스)
STATION_ID = "A" 

URL = f"http://{LAPTOP_IP}:{PORT}/api/cctv/upload?station_id={STATION_ID}"

# 가장 기본적이고 안전한 방식으로 카메라 열기
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ [에러] 카메라를 열 수 없습니다. 카메라 연결 상태를 확인해보세요.")
    exit()

print(f"🚀 라즈베리파이 카메라 -> 노트북 AI CCTV 서버({URL}) 실시간 송신 시작! (종료: Ctrl+C)")

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️ 프레임을 읽지 못했습니다. 잠시 대기 중...")
            time.sleep(0.5)
            continue

        # 영상을 JPEG 이미지 파일 형태로 압축
        _, img_encoded = cv2.imencode('.jpg', frame)
        
        try:
            # 노트북 백엔드 서버로 전송
            response = requests.post(URL, data=img_encoded.tobytes(), timeout=1.0)
            if response.status_code == 200:
                print("✅ 프레임 전송 성공!")
        except Exception as e:
            print("⚠️ 노트북 AI 서버 전송 실패 (서버가 켜져 있는지, IP가 일치하는지 확인하세요)")
        
        # 전송 속도 조절 (약 20fps)
        time.sleep(0.05)

except KeyboardInterrupt:
    print("\n🛑 송신 중단.")
finally:
    cap.release()
