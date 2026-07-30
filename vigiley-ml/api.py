import cv2
import numpy as np
import base64
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from feature_extraction import FeatureExtractor
from model import DrowsinessDetector, EAR_THRESHOLD, EAR_LOW, MAR_THRESHOLD, \
    FRAMES_CLOSED, FRAMES_MICROSLEEP, FRAMES_DROWSY, FRAMES_CRITICAL, FRAMES_YAWN
from websocket_client import AlertWebSocketClient

app = Flask(__name__)
CORS(app)

extractor = FeatureExtractor()
detector = DrowsinessDetector()
ws_client = AlertWebSocketClient()

ear_history = []
frame_count = 0
lock = threading.Lock()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok', 'model': 'vigiley-ml-threshold',
        'ws_connected': ws_client.connected,
        'thresholds': {
            'ear_closed': EAR_THRESHOLD, 'ear_low': EAR_LOW,
            'mar_yawn': MAR_THRESHOLD,
            'frames_drowsy': FRAMES_DROWSY, 'frames_critical': FRAMES_CRITICAL,
            'frames_yawn': FRAMES_YAWN,
        },
    })

@app.route('/predict', methods=['POST'])
def predict():
    global frame_count, ear_history

    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    try:
        image_data = base64.b64decode(data['image'])
        np_arr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({'error': 'Invalid image data'}), 400

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
                return jsonify({'face_detected': False, 'status': 'no_face'})

            drowsy, confidence = detector.predict_frame(features, ear_history)
            state, _ = detector.get_state()
            frame_count += 1

        if len(ear_history) > 300:
            ear_history[:100] = []

        perclos = 0.0
        if ear_history:
            window = ear_history[-min(len(ear_history), 60):]
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

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/reset', methods=['POST'])
def reset():
    with lock:
        ear_history.clear()
        detector.reset()
        global frame_count
        frame_count = 0
    return jsonify({'status': 'reset_ok'})


@app.route('/thresholds', methods=['GET'])
def thresholds():
    return jsonify({
        'ear_closed': EAR_THRESHOLD,
        'ear_low': EAR_LOW,
        'mar_yawn': MAR_THRESHOLD,
        'frames_closed': FRAMES_CLOSED,
        'frames_microsleep': FRAMES_MICROSLEEP,
        'frames_drowsy': FRAMES_DROWSY,
        'frames_critical': FRAMES_CRITICAL,
        'frames_yawn': FRAMES_YAWN,
        'frames_reset': 30,
    })


if __name__ == '__main__':
    print('Starting VigilEye ML API on port 5002...')
    app.run(host='0.0.0.0', port=5002, threaded=True)
