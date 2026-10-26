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
    FRAMES_CLOSED, FRAMES_MICRO, FRAMES_DROWSY, FRAMES_CRITICAL, FRAMES_YAWN, FRAMES_RESET

app = FastAPI(title='VigilEye ML API', version='2.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

extractor = FeatureExtractor()
detector = DrowsinessDetector()

ear_history = []
frame_count = 0
lock = threading.Lock()


class PredictRequest(BaseModel):
    image: str
    # Optional per-driver calibrated thresholds (Flaw 2A fix).
    # When absent, the detector falls back to model.py defaults.
    ear_closed: float | None = None
    ear_low: float | None = None
    mar_yawn: float | None = None
    mar_half: float | None = None
    perclos_risk: float | None = None
    # Optional impairment-aware modality gating (medical edge cases).
    # eyes_mode: 'both' | 'left' | 'right' | 'none'; mouth_enabled: bool.
    eyes_mode: str | None = None
    mouth_enabled: bool | None = None


def _resolve_modalities(req: PredictRequest):
    modalities = {}
    if req.eyes_mode in ('both', 'left', 'right', 'none'):
        modalities['eyes_mode'] = req.eyes_mode
    if req.mouth_enabled is not None:
        modalities['mouth_enabled'] = bool(req.mouth_enabled)
    return modalities


def _clamp(value, low, high):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return max(low, min(high, number))


def _request_thresholds(req: PredictRequest):
    thresholds = {}
    ear_closed = _clamp(req.ear_closed, 0.10, 0.40)
    ear_low = _clamp(req.ear_low, 0.10, 0.50)
    mar_yawn = _clamp(req.mar_yawn, 0.20, 1.00)
    mar_half = _clamp(req.mar_half, 0.10, 0.90)
    perclos_risk = _clamp(req.perclos_risk, 0.05, 0.90)
    if ear_closed is not None:
        thresholds['ear_closed'] = ear_closed
    if ear_low is not None:
        thresholds['ear_low'] = ear_low
    if mar_yawn is not None:
        thresholds['mar_yawn'] = mar_yawn
    if mar_half is not None:
        thresholds['mar_half'] = mar_half
    if perclos_risk is not None:
        thresholds['perclos_risk'] = perclos_risk
    return thresholds


@app.get('/health')
def health():
    return {
        'status': 'ok', 'model': 'vigiley-ml-threshold',
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

        thresholds = _request_thresholds(req)
        modalities = _resolve_modalities(req)
        # Single-eye drivers: rewrite the just-appended history entry with the
        # healthy eye's value so PERCLOS/smoothing track the usable signal.
        eye_key = {'left': 'left_ear', 'right': 'right_ear'}.get(modalities.get('eyes_mode'))
        if eye_key and eye_key in features and ear_history:
            ear_history[-1] = features[eye_key]
        drowsy, confidence = detector.predict_frame(features, ear_history, thresholds, modalities)
        state, _ = detector.get_state()
        frame_count += 1

        if detector._recovered:
            ear_history.clear()
            detector._recovered = False

        if len(ear_history) > 300:
            ear_history[:100] = []

        perclos = 0.0
        if ear_history:
            window = ear_history[-min(len(ear_history), PERCLOS_WINDOW):]
            perclos = sum(1 for e in window if e < EAR_THRESHOLD) / len(window)

        close_counter = detector.close_counter
        yawn_counter = detector.yawn_counter

    effective = detector._resolve_thresholds(thresholds)
    effective_md = detector._resolve_modalities(modalities)
    result = {
        'face_detected': True,
        'status': state,
        'drowsy': drowsy == 1,
        'confidence': confidence,
        'confidence_source': detector.conf_source,
        'ear': features['eye_aspect_ratio'],
        'left_ear': features.get('left_ear'),
        'right_ear': features.get('right_ear'),
        'mar': features['mouth_aspect_ratio'],
        'pitch': features['head_pitch'],
        'yaw': features['head_yaw'],
        'perclos': round(perclos, 4),
        'close_counter': close_counter,
        'yawn_counter': yawn_counter,
        'frame_id': frame_count,
        'face_box': features['face_box'],
        'eye_points': features['eye_points'],
        'mouth_points': features['mouth_points'],
        'thresholds': {
            'ear_closed': effective['ear_closed'],
            'ear_low': effective['ear_low'],
            'mar_yawn': effective['mar_yawn'],
            'mar_half': effective['mar_half'],
            'perclos_risk': effective['perclos_risk'],
            'frames_drowsy': FRAMES_DROWSY,
            'frames_yawn': FRAMES_YAWN,
        },
        'modalities': effective_md,
    }

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
        'frames_reset': FRAMES_RESET,
    }


if __name__ == '__main__':
    import uvicorn
    print('Starting VigilEye ML API (FastAPI) on port 5002...')
    uvicorn.run(app, host='0.0.0.0', port=5002, workers=1)
