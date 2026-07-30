import cv2
import numpy as np
import time
import threading
import os
from feature_extraction import FeatureExtractor
from model import DrowsinessDetector, EAR_THRESHOLD, EAR_LOW, MAR_THRESHOLD, \
    FRAMES_CLOSED, FRAMES_MICROSLEEP, FRAMES_DROWSY, FRAMES_CRITICAL, FRAMES_YAWN

STATE_COLORS = {
    'awake': (0, 255, 0),
    'heavy_eyelids': (255, 200, 0),
    'mouth_open': (200, 200, 0),
    'eyes_closed': (255, 165, 0),
    'yawning': (0, 215, 255),
    'microsleep': (255, 100, 0),
    'drowsy': (0, 0, 255),
    'high_risk': (0, 0, 200),
    'critical': (0, 0, 180),
    'no_face': (0, 165, 255),
}

STATE_LABELS = {
    'awake': 'AWAKE',
    'heavy_eyelids': 'HEAVY EYELIDS',
    'mouth_open': 'MOUTH OPEN',
    'eyes_closed': 'EYES CLOSED',
    'yawning': 'YAWNING',
    'microsleep': 'MICROSLEEP',
    'drowsy': 'DROWSY',
    'high_risk': 'HIGH RISK',
    'critical': 'CRITICAL',
}


class DrowsinessDemo:
    def __init__(self):
        self.extractor = FeatureExtractor()
        self.detector = DrowsinessDetector()
        self.ear_history = []
        self.fps = 0
        self.frame_count = 0
        self.last_time = time.time()

    def play_alert(self):
        try:
            os.system('say "Wake up driver" &')
        except Exception:
            pass

    def _draw_bar(self, frame, label, value, max_val, color, x, y, w=180):
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(frame, label, (x, y + 10), font, 0.4, (200, 200, 200), 1)
        pct = min(value / max_val, 1.0)
        cv2.rectangle(frame, (x + 55, y), (x + 55 + int(pct * w), y + 12), color, -1)
        cv2.putText(frame, f'{value}/{max_val}', (x + 55 + w + 6, y + 10),
                    font, 0.35, (150, 150, 150), 1)
        return y + 18

    def run(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print('Error: Could not open webcam')
            return

        print('VigilEye — Threshold-based Detection')
        print('EAR<{:.2f}=closed  MAR>{:.2f}=yawn  {}f=drowsy  {}f=critical  {}f=yawn'.format(
            EAR_THRESHOLD, MAR_THRESHOLD, FRAMES_DROWSY, FRAMES_CRITICAL, FRAMES_YAWN))
        print('Press Q to quit | R to reset')
        print()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            self.frame_count += 1

            now = time.time()
            if now - self.last_time >= 0.5:
                self.fps = self.frame_count / (now - self.last_time)
                self.frame_count = 0
                self.last_time = now

            features = self.extractor.extract(frame, self.ear_history)
            h, w = frame.shape[:2]

            out = frame.copy()
            overlay = out.copy()
            cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), 0.50)
            out = cv2.addWeighted(overlay, 0.5, out, 0.5, 0)

            if features:
                ear = features['eye_aspect_ratio']
                mar = features['mouth_aspect_ratio']
                pitch = features['head_pitch']
                yaw = features['head_yaw']
                perclos = features['perclos']

                _, confidence = self.detector.predict_frame(features, self.ear_history)
                state, _ = self.detector.get_state()
                color = STATE_COLORS.get(state, (0, 255, 0))

                is_drowsy = state in ('drowsy', 'high_risk', 'critical')
                alert_text = ''

                if is_drowsy:
                    alert_text = 'ALERT: DRIVER DROWSY'
                    if time.time() - self.detector._last_alert_time > 3:
                        threading.Thread(target=self.play_alert, daemon=True).start()
                        self.detector._last_alert_time = time.time()

                font = cv2.FONT_HERSHEY_SIMPLEX
                cv2.putText(out, f'FPS: {self.fps:.0f}', (w - 80, 20), font, 0.4, (150, 150, 150), 1)
                cv2.putText(out, f'S: {self.frame_count}', (w - 80, 36), font, 0.35, (130, 130, 130), 1)

                cv2.putText(out, STATE_LABELS.get(state, state.upper()), (20, 30),
                            font, 0.85, color, 2)

                cv2.putText(out, f'EAR: {ear:.3f}  |  MAR: {mar:.3f}  |  PERCLOS: {perclos:.0%}',
                            (20, 56), font, 0.45, (180, 180, 180), 1)
                cv2.putText(out, f'Pitch: {pitch:.1f}  Yaw: {yaw:.1f}',
                            (20, 76), font, 0.4, (150, 150, 150), 1)

                bar_y = 95
                bar_y = self._draw_bar(out, 'EYES CLOSED', self.detector.close_counter,
                                       FRAMES_CRITICAL, (0, 0, 255), 20, bar_y)
                bar_y = self._draw_bar(out, 'YAWN', self.detector.yawn_counter,
                                       FRAMES_YAWN, (0, 215, 255), 20, bar_y)
                bar_y = self._draw_bar(out, 'NORMAL', self.detector.normal_counter, 30,
                                       (0, 255, 0), 20, bar_y)

                if is_drowsy:
                    alpha = 0.10 + 0.06 * np.sin(time.time() * 5)
                    red = out.copy()
                    cv2.rectangle(red, (0, 0), (w, h), (0, 0, 255), -1)
                    out = cv2.addWeighted(red, alpha, out, 1 - alpha, 0)
                    cv2.putText(out, f'  {alert_text}  ', (w // 2 - 150, h - 25),
                                font, 0.7, (0, 0, 255), 2)
                elif state == 'yawning':
                    cv2.putText(out, '  YAWN DETECTED  ', (w // 2 - 120, h - 25),
                                font, 0.6, (0, 215, 255), 2)
            else:
                cv2.putText(out, 'No Face Detected', (w // 2 - 100, h // 2),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

            cv2.imshow('VigilEye — Drowsiness Detection', out)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r'):
                self.detector.reset()
                self.ear_history.clear()
                print('Reset')

        cap.release()
        cv2.destroyAllWindows()
        self.extractor.release()


if __name__ == '__main__':
    demo = DrowsinessDemo()
    demo.run()
