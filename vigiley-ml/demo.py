import cv2
import numpy as np
from feature_extraction import FeatureExtractor
from model import DrowsinessDetector
import time
import threading
import os

class DrowsinessDemo:
    def __init__(self, model_path='model', alert_frames=10):
        self.extractor = FeatureExtractor()
        self.detector = DrowsinessDetector()
        self.detector.load(model_path)
        self.ear_history = []
        self.alert_frames = alert_frames
        self.drowsy_counter = 0
        self.total_alerts = 0
        self.frame_count = 0
        self.fps = 0
        self.fps_history = []
        self.last_time = time.time()
        self.alert_log = []

    def play_alert_sound(self):
        try:
            os.system('say "Wake up driver" &')
        except:
            pass

    def draw_face_roi(self, frame, prediction):
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = w//4, h//6, 3*w//4, 5*h//6
        color = (0, 255, 0) if prediction == 0 else (0, 0, 255)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        label = 'FACE ROI'
        cv2.putText(frame, label, (x1+5, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

    def draw_status(self, frame, features, prediction, confidence):
        h, w = frame.shape[:2]
        ear = features['eye_aspect_ratio']
        mar = features['mouth_aspect_ratio']
        perclos = features['perclos']

        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 95), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.3, frame, 0.7, 0)

        is_drowsy = prediction == 1
        status_color = (0, 255, 0) if not is_drowsy else (0, 0, 255)
        status_text = 'AWAKE' if not is_drowsy else 'DROWSY!'
        font = cv2.FONT_HERSHEY_SIMPLEX

        cv2.putText(frame, status_text, (15, 30), font, 0.8, status_color, 2)
        cv2.putText(frame, f'Confidence: {confidence:.2f}', (15, 55), font, 0.5, (200, 200, 200), 1)
        cv2.putText(frame, f'FPS: {self.fps:.0f}', (15, 78), font, 0.45, (150, 150, 150), 1)

        info_x = w - 260
        cv2.putText(frame, f'EAR: {ear:.3f}', (info_x, 22), font, 0.45, (180, 180, 180), 1)
        cv2.putText(frame, f'MAR: {mar:.3f}', (info_x, 42), font, 0.45, (180, 180, 180), 1)
        cv2.putText(frame, f'PERCLOS: {perclos:.3f}', (info_x, 62), font, 0.45, (180, 180, 180), 1)
        cv2.putText(frame, f'Alerts: {self.total_alerts}', (info_x, 82), font, 0.45, (180, 180, 180), 1)

        if is_drowsy and self.drowsy_counter >= self.alert_frames:
            overlay2 = frame.copy()
            alpha = 0.15 + 0.1 * np.sin(time.time() * 4)
            cv2.rectangle(overlay2, (0, 0), (w, h), (0, 0, 255), -1)
            frame = cv2.addWeighted(overlay2, alpha, frame, 1 - alpha, 0)

        if is_drowsy:
            bar_width = int((self.drowsy_counter / self.alert_frames) * w)
            cv2.rectangle(frame, (0, h - 8), (bar_width, h), (0, 0, 255), -1)
            remaining = max(0, self.alert_frames - self.drowsy_counter)
            cv2.putText(frame, f'Alert in: {remaining}f', (w // 2 - 60, h - 14),
                        font, 0.45, (255, 255, 255), 1)

        return frame

    def run(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print('Error: Could not open webcam')
            return

        print('VigilEye Drowsiness Detection Demo')
        print('Controls: Q = Quit, R = Reset stats')
        print('-----------------------------------')

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            self.frame_count += 1

            now = time.time()
            dt = now - self.last_time
            if dt > 0.5:
                self.fps = self.frame_count / dt if dt > 0 else 0
                self.frame_count = 0
                self.last_time = now

            features = self.extractor.extract(frame, self.ear_history)

            if features:
                prediction, confidence = self.detector.predict_frame(features, self.ear_history)

                if prediction == 1:
                    self.drowsy_counter += 1
                else:
                    self.drowsy_counter = max(0, self.drowsy_counter - 1)

                if self.drowsy_counter >= self.alert_frames and prediction == 1:
                    self.total_alerts += 1
                    alert_entry = {
                        'time': time.strftime('%H:%M:%S'),
                        'confidence': round(confidence, 3),
                        'ear': features['eye_aspect_ratio'],
                        'mar': features['mouth_aspect_ratio'],
                        'perclos': features['perclos'],
                    }
                    self.alert_log.append(alert_entry)
                    if len(self.alert_log) > 10:
                        self.alert_log.pop(0)
                    print(f'[ALERT #{self.total_alerts}] Drowsiness detected!')
                    threading.Thread(target=self.play_alert_sound, daemon=True).start()
                    self.drowsy_counter = 0

                frame = self.draw_face_roi(frame, prediction)
                frame = self.draw_status(frame, features, prediction, confidence)
            else:
                self.drowsy_counter = max(0, self.drowsy_counter - 2)
                cv2.putText(frame, 'No Face Detected', (w//2-100, h//2),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)

            cv2.imshow('VigilEye - Driver Drowsiness Detection', frame)
            key = cv2.waitKey(1) & 0xFF

            if key == ord('q'):
                break
            elif key == ord('r'):
                self.total_alerts = 0
                self.drowsy_counter = 0
                self.alert_log.clear()
                print('Stats reset')

        cap.release()
        cv2.destroyAllWindows()
        self.extractor.release()

        print(f'\nSession Summary:')
        print(f'  Total Alerts: {self.total_alerts}')
        print(f'  Alert Log:')
        for entry in self.alert_log[-5:]:
            print(f'    {entry["time"]} - Conf: {entry["confidence"]:.2f}')

if __name__ == '__main__':
    demo = DrowsinessDemo(alert_frames=10)
    demo.run()
