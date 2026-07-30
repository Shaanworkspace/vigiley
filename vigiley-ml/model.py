import time

EAR_THRESHOLD = 0.21
MAR_THRESHOLD = 0.6
CLOSE_FRAMES_THRESHOLD = 60
YAWN_FRAMES_THRESHOLD = 30
NORMAL_FRAMES_RESET = 10

class DrowsinessDetector:
    def __init__(self):
        self.close_counter = 0
        self.yawn_counter = 0
        self.normal_counter = 0
        self.total_drowsy_events = 0
        self.total_yawn_events = 0
        self.current_state = 'normal'
        self.ear_history = []
        self.alerts = []

    def predict_frame(self, features, ear_history=None):
        ear = features['eye_aspect_ratio']
        mar = features['mouth_aspect_ratio']

        eyes_closed = ear < EAR_THRESHOLD
        yawning = mar > MAR_THRESHOLD

        if eyes_closed:
            self.close_counter += 1
            self.normal_counter = 0
        elif yawning:
            self.yawn_counter += 1
        else:
            self.normal_counter += 1
            if self.normal_counter >= NORMAL_FRAMES_RESET:
                self.close_counter = 0
                self.yawn_counter = 0

        if self.close_counter >= CLOSE_FRAMES_THRESHOLD:
            self.current_state = 'drowsy'
            confidence = min(0.5 + (self.close_counter / CLOSE_FRAMES_THRESHOLD) * 0.5, 0.98)
            return 1, round(confidence, 4)
        elif self.yawn_counter >= YAWN_FRAMES_THRESHOLD:
            self.current_state = 'yawning'
            confidence = min(0.5 + (self.yawn_counter / YAWN_FRAMES_THRESHOLD) * 0.3, 0.85)
            return 0, round(confidence, 4)
        else:
            self.current_state = 'normal'
            if self.close_counter > 0:
                confidence = min(self.close_counter / CLOSE_FRAMES_THRESHOLD, 0.4)
            elif self.yawn_counter > 0:
                confidence = min(self.yawn_counter / YAWN_FRAMES_THRESHOLD, 0.3)
            else:
                confidence = 0.0
            return 0, round(confidence, 4)

    def get_state(self):
        if self.close_counter >= CLOSE_FRAMES_THRESHOLD:
            return 'drowsy', min(0.5 + (self.close_counter / CLOSE_FRAMES_THRESHOLD) * 0.5, 0.98)
        if self.yawn_counter >= YAWN_FRAMES_THRESHOLD:
            return 'yawning', min(0.5 + (self.yawn_counter / YAWN_FRAMES_THRESHOLD) * 0.3, 0.85)
        if self.close_counter > 0:
            return 'closing', self.close_counter / CLOSE_FRAMES_THRESHOLD
        if self.yawn_counter > 0:
            return 'mouth_open', self.yawn_counter / YAWN_FRAMES_THRESHOLD
        return 'normal', 0.0

    def reset(self):
        self.close_counter = 0
        self.yawn_counter = 0
        self.normal_counter = 0
        self.current_state = 'normal'

    def load(self, path=None):
        pass
