import cv2
import numpy as np
from feature_extraction import FeatureExtractor
from model import DrowsinessDetector, EAR_THRESHOLD, MAR_THRESHOLD
import time
import threading
import os

class DrowsinessDemo:
    def __init__(self):
        self.extractor = FeatureExtractor()
        self.detector = DrowsinessDetector()
        self.ear_history = []
        self.fps = 0
        self.frame_count = 0
        self.last_time = time.time()
        self.alert_log = []

    def play_alert(self):
        try:
            os.system('say "Wake up driver" &')
        except:
            pass

    def run(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print('Error: Could not open webcam')
            return

        print('VigilEye - Real-Time Detection')
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
            cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), 0.55)
            out = cv2.addWeighted(overlay, 0.65, out, 0.35, 0)

            if features:
                ear = features['eye_aspect_ratio']
                mar = features['mouth_aspect_ratio']
                prediction, confidence = self.detector.predict_frame(features, self.ear_history)
                state, prob = self.detector.get_state()

                eyes_closed = ear < EAR_THRESHOLD
                yawning = mar > MAR_THRESHOLD

                close_pct = min(self.detector.close_counter / 60, 1.0)
                yawn_pct = min(self.detector.yawn_counter / 30, 1.0)

                if state == 'drowsy':
                    color = (0, 0, 255)
                    msg = 'DROWSY'
                    if self.detector.total_drowsy_events == 0 or time.time() % 2 < 0.05:
                        threading.Thread(target=self.play_alert, daemon=True).start()
                        self.detector.total_drowsy_events += 1
                elif state == 'yawning':
                    color = (0, 165, 255)
                    msg = 'YAWNING'
                elif eyes_closed and self.detector.close_counter > 15:
                    color = (255, 165, 0)
                    msg = f'EYES CLOSED ({self.detector.close_counter}f)'
                elif yawning:
                    color = (0, 255, 255)
                    msg = f'MOUTH OPEN ({self.detector.yawn_counter}f)'
                else:
                    color = (0, 255, 0)
                    msg = 'AWAKE'

                status_color = (0, 255, 0) if state == 'normal' else (0, 0, 255) if state == 'drowsy' else (0, 165, 255)
                font = cv2.FONT_HERSHEY_SIMPLEX

                cv2.putText(out, msg, (20, 45), font, 1.0, status_color, 2)
                cv2.putText(out, f'EAR: {ear:.3f}   MAR: {mar:.3f}', (20, 78), font, 0.5, (200, 200, 200), 1)
                cv2.putText(out, f'FPS: {self.fps:.0f}', (20, 100), font, 0.45, (150, 150, 150), 1)

                bar_y = 130
                cv2.putText(out, 'EYES', (20, bar_y + 12), font, 0.45, (200, 200, 200), 1)
                close_color = (0, 0, 255) if eyes_closed else (0, 255, 0)
                cv2.rectangle(out, (80, bar_y), (80 + int(close_pct * 200), bar_y + 14), close_color, -1)
                cv2.putText(out, f'{int(close_pct*100)}%', (290, bar_y + 12), font, 0.4, (180, 180, 180), 1)

                bar_y2 = 155
                cv2.putText(out, 'MOUTH', (20, bar_y2 + 12), font, 0.45, (200, 200, 200), 1)
                yawn_color = (0, 255, 255) if yawning else (0, 255, 0)
                cv2.rectangle(out, (80, bar_y2), (80 + int(yawn_pct * 200), bar_y2 + 14), yawn_color, -1)
                cv2.putText(out, f'{int(yawn_pct*100)}%', (290, bar_y2 + 12), font, 0.4, (180, 180, 180), 1)

                if state == 'drowsy':
                    alert_alpha = 0.12 + 0.08 * np.sin(time.time() * 4)
                    red = out.copy()
                    cv2.rectangle(red, (0, 0), (w, h), (0, 0, 255), -1)
                    out = cv2.addWeighted(red, alert_alpha, out, 1 - alert_alpha, 0)

                    cv2.putText(out, '⚠ ALERT: DRIVER DROWSY', (w // 2 - 160, h - 30), font, 0.8, (0, 0, 255), 2)

            else:
                cv2.putText(out, 'No Face Detected', (w // 2 - 100, h // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)

            cv2.imshow('VigilEye - Driver Drowsiness Detection', out)
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
