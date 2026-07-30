import cv2
import numpy as np
import base64
import threading
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from feature_extraction import FeatureExtractor
from model import DrowsinessDetector
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
    return jsonify({'status': 'ok', 'model': 'vigiley-ml', 'ws_connected': ws_client.connected})

@app.route('/predict', methods=['POST'])
def predict():
    global frame_count

    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    try:
        image_data = base64.b64decode(data['image'])
        np_arr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({'error': 'Invalid image data'}), 400

        with lock:
            features = extractor.extract(frame, ear_history)
            if not features:
                return jsonify({'face_detected': False, 'status': 'no_face'})

            prediction, confidence = detector.predict_frame(features, ear_history)
            state, prob = detector.get_state()
            frame_count += 1

        result = {
            'face_detected': True,
            'status': state,
            'drowsy': prediction == 1,
            'confidence': confidence,
            'ear': features['eye_aspect_ratio'],
            'mar': features['mouth_aspect_ratio'],
            'pitch': features['head_pitch'],
            'yaw': features['head_yaw'],
            'close_counter': detector.close_counter,
            'yawn_counter': detector.yawn_counter,
            'frame_id': frame_count,
        }

        if state == 'drowsy' and confidence > 0.7:
            threading.Thread(target=ws_client.send_alert, args=(result,), daemon=True).start()

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

if __name__ == '__main__':
    print('Starting VigilEye ML API on port 5002...')
    app.run(host='0.0.0.0', port=5002, threaded=True)
