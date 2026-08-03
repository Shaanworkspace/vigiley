import cv2
import numpy as np
import base64
import threading

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from feature_extraction import FeatureExtractor
from model import DrowsinessDetector, EAR_THRESHOLD, EAR_LOW, MAR_THRESHOLD, PERCLOS_WINDOW, \
    FRAMES_CLOSED, FRAMES_MICRO, FRAMES_DROWSY, FRAMES_CRITICAL, FRAMES_YAWN
from websocket_client import AlertWebSocketClient

app = FastAPI(title='VigilEye ML API', version='2.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

extractor = FeatureExtractor()
detector = DrowsinessDetector()
ws_client = AlertWebSocketClient()

ear_history = []
frame_count = 0
lock = threading.Lock()


class PredictRequest(BaseModel):
    image: str


@app.get('/health')
def health():
    return {
        'status': 'ok', 'model': 'vigiley-ml-threshold',
        'ws_connected': ws_client.connected,
        'thresholds': {
            'ear_closed': EAR_THRESHOLD, 'ear_low': EAR_LOW,
            'mar_yawn': MAR_THRESHOLD,
            'frames_drowsy': FRAMES_DROWSY, 'frames_critical': FRAMES_CRITICAL,
            'frames_yawn': FRAMES_YAWN,
        },
    }


@app.post('/predict')
def predict(req: PredictRequest):
    global frame_count

    try:
        image_data = base64.b64decode(req.image)
    except Exception:
        return JSONResponse({'error': 'Invalid base64 image'}, status_code=400)

    np_arr = np.frombuffer(image_data, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if frame is None:
        return JSONResponse({'error': 'Invalid image data'}, status_code=400)

    h, w = frame.shape[:2]
    if w > 640:
        scale = 640 / w
        frame = cv2.resize(frame, (int(w * scale), int(h * scale)),
                           interpolation=cv2.INTER_NEAREST)

    with lock:
        features = extractor.extract(frame, ear_history)
        if not features:
            if len(ear_history) > 300:
                ear_history.clear()
            return {'face_detected': False, 'status': 'no_face'}

        drowsy, confidence = detector.predict_frame(features, ear_history)
        state, _ = detector.get_state()
        frame_count += 1

    if len(ear_history) > 300:
        ear_history[:100] = []

    perclos = 0.0
    if ear_history:
        window = ear_history[-min(len(ear_history), PERCLOS_WINDOW):]
        perclos = sum(1 for e in window if e < EAR_THRESHOLD) / len(window)

    result = {
        'face_detected': True,
        'status': state,
        'drowsy': drowsy == 1,
        'confidence': confidence,
        'ear': features['eye_aspect_ratio'],
        'mar': features['mouth_aspect_ratio'],
        'pitch': features['head_pitch'],
        'yaw': features['head_yaw'],
        'perclos': round(perclos, 4),
        'close_counter': detector.close_counter,
        'yawn_counter': detector.yawn_counter,
        'frame_id': frame_count,
        'face_box': features['face_box'],
        'eye_points': features['eye_points'],
        'mouth_points': features['mouth_points'],
        'thresholds': {
            'ear_closed': EAR_THRESHOLD,
            'mar_yawn': MAR_THRESHOLD,
            'frames_drowsy': FRAMES_DROWSY,
            'frames_yawn': FRAMES_YAWN,
        },
    }

    if state in ('drowsy', 'high_risk', 'critical') and confidence > 0.7:
        threading.Thread(target=ws_client.send_alert, args=(result,),
                         daemon=True).start()

    return result


@app.post('/reset')
def reset():
    global frame_count
    with lock:
        ear_history.clear()
        detector.reset()
        frame_count = 0
    return {'status': 'reset_ok'}


@app.get('/thresholds')
def thresholds():
    return {
        'ear_closed': EAR_THRESHOLD,
        'ear_low': EAR_LOW,
        'mar_yawn': MAR_THRESHOLD,
        'frames_closed': FRAMES_CLOSED,
        'frames_microsleep': FRAMES_MICRO,
        'frames_drowsy': FRAMES_DROWSY,
        'frames_critical': FRAMES_CRITICAL,
        'frames_yawn': FRAMES_YAWN,
        'frames_reset': 30,
    }


if __name__ == '__main__':
    import uvicorn
    print('Starting VigilEye ML API (FastAPI) on port 5002...')
    uvicorn.run(app, host='0.0.0.0', port=5002, workers=1)
