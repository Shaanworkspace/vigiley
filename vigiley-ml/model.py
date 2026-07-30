"""
================================================================================
VIGILEYE DROWSINESS DETECTION — Threshold Configuration & State Machine
================================================================================

PARAMETERS (koi ML training nahi, pure threshold-based hai):

  EAR_THRESHOLD  = 0.21   Eye Aspect Ratio — isse niche = eyes closed
  EAR_LOW        = 0.25   Eye Aspect Ratio — isse niche = heavy eyelids (droopy)
  MAR_THRESHOLD  = 0.55   Mouth Aspect Ratio — isse upar = mouth open (potential yawn)
  PERCLOS_WINDOW = 60     Frames ka window for PERCLOS calculation
  PERCLOS_RISK   = 0.30   30%+ eye closure in window = high risk

  FRAMES_CLOSED     = 15   15 frames (~0.5s) eyes closed → "eyes_closed"
  FRAMES_MICROSLEEP = 30  30 frames (~1.0s) eyes closed → "microsleep"
  FRAMES_DROWSY     = 45  45 frames (~1.5s) eyes closed → "drowsy"
  FRAMES_YAWN       = 20  20 frames (~0.7s) mouth open  → "yawning"
  FRAMES_RESET      = 30  30 frames normal → counters reset

  ~30 FPS assumed. Sab durations proportional hain.

STATE TRANSITIONS (9 states, increasing risk):

  ┌──────────────┬──────────┬──────────────┬─────────────────────────────────────┐
  │ State        │ EAR      │ MAR / Mouth  │ Consecutive Frames                  │
  ├──────────────┼──────────┼──────────────┼─────────────────────────────────────┤
  │ awake        │ > 0.25   │ closed       │ — (default state)                   │
  │ heavy_eyelids│ 0.21-0.25│ closed       │ — (eyelids drooping)                │
  │ mouth_open   │ > 0.21   │ open (MAR>0.5│ < 20 frames                         │
  │              │          │ 5)           │                                     │
  │ eyes_closed  │ < 0.21   │ —            │ 15-29 frames (~0.5-1.0s)           │
  │ yawning      │ —        │ open         │ >= 20 frames (~0.7s)                │
  │ microsleep   │ < 0.21   │ —            │ 30-44 frames (~1.0-1.5s)           │
  │ drowsy       │ < 0.21   │ —            │ >= 45 frames (~1.5s+)               │
  │ high_risk    │ < 0.21   │ —            │ >= 45 frames AND PERCLOS > 30%     │
  │ critical     │ < 0.21   │ —            │ >= 60 frames (~2s+) OR PERCLOS>50% │
  └──────────────┴──────────┴──────────────┴─────────────────────────────────────┘

CONFIDENCE FORMULAS (0.0 — 1.0):

  awake          = 0.00 (no risk)
  heavy_eyelids  = 0.10 + (0.25 - ear) * 2.5    → 0.10 to 0.20
  mouth_open     = 0.10 + (mar - 0.55) * 0.5     → 0.10 to 0.30
  eyes_closed    = 0.20 + (close_counter / 60)    → 0.20 to 0.50
  yawning        = 0.40 + (yawn_counter / 60)     → 0.40 to 0.85
  microsleep     = 0.50 + (close_counter / 90)    → 0.50 to 0.80
  drowsy         = 0.70 + (close_counter / 120)   → 0.70 to 0.95
  high_risk      = 0.80 + perclos * 0.2           → 0.80 to 0.96
  critical       = 0.90 + perclos * 0.1           → 0.90 to 0.98

================================================================================
"""

EAR_THRESHOLD = 0.21
EAR_LOW = 0.25
MAR_THRESHOLD = 0.55
PERCLOS_WINDOW = 60
PERCLOS_RISK = 0.30

FRAMES_CLOSED = 15
FRAMES_MICROSLEEP = 30
FRAMES_DROWSY = 45
FRAMES_CRITICAL = 60
FRAMES_YAWN = 20
FRAMES_RESET = 30


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
        mouth_open = mar > MAR_THRESHOLD

        if eyes_closed:
            self.close_counter += 1
            self.normal_counter = 0
        elif heavy_lids:
            self.normal_counter = 0
        elif mouth_open:
            self.yawn_counter += 1
            self.normal_counter = 0
        else:
            self.normal_counter += 1
            if self.normal_counter >= FRAMES_RESET:
                self.close_counter = 0
                self.yawn_counter = 0

        if self.close_counter >= FRAMES_DROWSY:
            if perclos > 0.5 or self.close_counter >= FRAMES_CRITICAL:
                self.current_state = 'critical'
                conf = min(0.90 + perclos * 0.1, 0.98)
                return 1, round(conf, 4)
            elif perclos > PERCLOS_RISK:
                self.current_state = 'high_risk'
                conf = min(0.80 + perclos * 0.2, 0.96)
                return 1, round(conf, 4)
            else:
                self.current_state = 'drowsy'
                conf = min(0.70 + self.close_counter / 120, 0.95)
                return 1, round(conf, 4)

        if self.close_counter >= FRAMES_MICROSLEEP:
            self.current_state = 'microsleep'
            conf = min(0.50 + self.close_counter / 90, 0.80)
            return 1, round(conf, 4)

        if self.yawn_counter >= FRAMES_YAWN:
            self.current_state = 'yawning'
            conf = min(0.40 + self.yawn_counter / 60, 0.85)
            return 0, round(conf, 4)

        if eyes_closed and self.close_counter >= FRAMES_CLOSED:
            self.current_state = 'eyes_closed'
            conf = min(0.20 + self.close_counter / 60, 0.50)
            return 0, round(conf, 4)

        if heavy_lids:
            self.current_state = 'heavy_eyelids'
            conf = min(0.10 + (EAR_LOW - ear) * 2.5, 0.20)
            return 0, round(conf, 4)

        if mouth_open:
            self.current_state = 'mouth_open'
            conf = min(0.10 + (mar - MAR_THRESHOLD) * 0.5, 0.30)
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
