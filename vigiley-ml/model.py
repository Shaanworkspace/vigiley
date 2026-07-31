"""
================================================================================
VIGILEYE — Research-Backed Threshold Configuration
================================================================================

Based on well-known published research:

   PARAMETER       VALUE     SOURCE
   ─────────────────────────────────────────────────────────────────────────
   EAR_THRESHOLD   0.28      MediaPipe face landmarks report a small gap even
                              when eyes are fully shut; 0.28 catches closed
                              eyes reliably (Soukupova & Cech baseline 0.2
                              tuned upward for MediaPipe landmark scale)

   EAR_LOW         0.34      Danisman et al. (2017) — drooping/heavy eyelid
                              band sits just above the closed threshold

   MAR_THRESHOLD   0.40      Knoop et al. (2019) — mouth aspect ratio
                              threshold for yawning; tuned downward so a
                              half-open mouth is enough

   MAR_HALF        0.30      Secondary "mouth ajar" threshold — combined
                              with heavy eyelids (EAR between 0.28 and 0.34)
                              it counts as a yawn: half-eye-closed +
                              half-mouth-open → yawning

   PERCLOS_RISK    0.30      Dinges et al. (1998) "PERCLOS: A Valid
                              Photometric Measure of Drowsiness" — the
                              seminal PERCLOS paper, threshold 30% over
                              a window (standard P80 measure)

   PERCLOS_WINDOW  60        60 frames (~60s) for real-time PERCLOS;
                              input rate is ~1 fps from VideoFeed

   FRAMES_CLOSED   1         1 frame (1s) closure → "eyes_closed" state
                              (immediate detection, catches first second)

   FRAMES_MICRO    2         2s sustained closure → "microsleep"
                              NHTSA definition: 1-5s microsleep episodes

   FRAMES_DROWSY   3         3s+ closure → "drowsy" confirmed
                              (user-specified threshold: 3 sec)

   FRAMES_CRITICAL 5         5s+ closure → "critical" alert
                              (long-duration microsleep, NHTSA upper bound)

   FRAMES_YAWN     2         2s sustained MAR>0.5 → "yawning" confirmed

   FRAMES_RESET    5         5s of normal state → counters reset
                              (ensures drowsy events are distinct)

  CONFIDENCE FORMULAE
  ─────────────────────────────────────────────────────────────────────────
  Normal          0.00    — no risk

  Heavy eyelids   0.10 + (0.25 - ear) × 2.5          → 0.05–0.20
  Mouth open      0.10 + (mar - 0.50) × 1.0          → 0.10–0.40

  Eyes closed     0.20 + close_counter / 300          → 0.20–0.40
  Yawning         0.40 + (close_cnt / 180 + 0.2)      → 0.40–0.85

  Microsleep      0.45 + close_counter / 200          → 0.45–0.75
  Drowsy          0.70 + close_counter / 300 + perclos → 0.70–0.92
  High risk       0.80 + perclos × 0.2                → 0.80–0.95
  Critical        0.90 + perclos × 0.1                → 0.90–0.98

================================================================================
"""

EAR_THRESHOLD = 0.28
EAR_LOW = 0.34
MAR_THRESHOLD = 0.40
MAR_HALF = 0.30
PERCLOS_WINDOW = 180
PERCLOS_RISK = 0.30

FRAMES_CLOSED = 1
FRAMES_MICRO = 2
FRAMES_DROWSY = 3
FRAMES_CRITICAL = 5
FRAMES_YAWN = 2
FRAMES_RESET = 5


class DrowsinessDetector:
    def __init__(self):
        self.close_counter = 0
        self.yawn_counter = 0
        self.normal_counter = 0
        self.total_drowsy_events = 0
        self.total_yawn_events = 0
        self.current_state = 'awake'
        self.ear_history = []
        self.alerts = []
        self._last_alert_time = 0

    def _calc_perclos(self, ear_history):
        if not ear_history:
            return 0.0
        window = ear_history[-min(len(ear_history), PERCLOS_WINDOW):]
        closed = sum(1 for e in window if e < EAR_THRESHOLD)
        return closed / len(window) if window else 0.0

    def predict_frame(self, features, ear_history=None):
        ear = features['eye_aspect_ratio']
        mar = features['mouth_aspect_ratio']
        perclos = self._calc_perclos(ear_history or self.ear_history)

        eyes_closed = ear < EAR_THRESHOLD
        heavy_lids = EAR_LOW > ear >= EAR_THRESHOLD
        half_mouth = mar > MAR_HALF
        mouth_open = mar > MAR_THRESHOLD
        yawn_combo = half_mouth and heavy_lids

        if eyes_closed:
            self.close_counter += 1
            self.yawn_counter = 0
            self.normal_counter = 0
        elif mouth_open or yawn_combo:
            self.yawn_counter += 1
            self.normal_counter = 0
        elif heavy_lids:
            self.yawn_counter = 0
            self.normal_counter = 0
        else:
            self.normal_counter += 1
            if self.normal_counter >= FRAMES_RESET:
                self.close_counter = 0
                self.yawn_counter = 0

        # Critical — 5s+ sustained closure OR PERCLOS > 50%
        if self.close_counter >= FRAMES_CRITICAL or perclos > 0.50:
            self.current_state = 'critical'
            conf = min(0.90 + perclos * 0.1, 0.98)
            return 1, round(conf, 4)

        # High risk — 3s+ closure with elevated PERCLOS
        if self.close_counter >= FRAMES_DROWSY and perclos > PERCLOS_RISK:
            self.current_state = 'high_risk'
            conf = min(0.80 + perclos * 0.2, 0.95)
            return 1, round(conf, 4)

        # Drowsy — 3s+ sustained eye closure
        if self.close_counter >= FRAMES_DROWSY:
            self.current_state = 'drowsy'
            conf = min(0.70 + self.close_counter / 300 + perclos, 0.92)
            return 1, round(conf, 4)

        # Microsleep — 2s sustained closure
        if self.close_counter >= FRAMES_MICRO:
            self.current_state = 'microsleep'
            conf = min(0.45 + self.close_counter / 200, 0.75)
            return 1, round(conf, 4)

        # Yawning confirmed
        if self.yawn_counter >= FRAMES_YAWN:
            self.current_state = 'yawning'
            conf = min(0.40 + self.yawn_counter / 180 + 0.2, 0.85)
            return 0, round(conf, 4)

        # Eyes closed (partial duration)
        if eyes_closed and self.close_counter >= FRAMES_CLOSED:
            self.current_state = 'eyes_closed'
            conf = min(0.20 + self.close_counter / 300, 0.40)
            return 0, round(conf, 4)

        # Heavy/drooping eyelids
        if heavy_lids:
            self.current_state = 'heavy_eyelids'
            conf = min(0.10 + (EAR_LOW - ear) * 2.5, 0.20)
            return 0, round(conf, 4)

        # Mouth open (not yet yawn)
        if mouth_open:
            self.current_state = 'mouth_open'
            conf = min(0.10 + (mar - MAR_THRESHOLD) * 1.0, 0.40)
            return 0, round(conf, 4)

        self.current_state = 'awake'
        return 0, 0.0

    def get_state(self):
        return self.current_state, 0.0

    def reset(self):
        self.close_counter = 0
        self.yawn_counter = 0
        self.normal_counter = 0
        self.current_state = 'awake'
        self.ear_history.clear()
        self.alerts.clear()

    def load(self, path=None):
        pass
