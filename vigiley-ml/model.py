"""
================================================================================
VIGILEYE — Threshold Configuration and References
================================================================================

Threshold values below are the runtime defaults. A calibrated per-driver
profile may override them per request (see predict_frame `thresholds` arg);
absent overrides, these defaults apply. Verified numbers (accuracy, F1, ECE)
are produced by train.py on NTHU-DDD features — see evaluation_results.json.

VERIFIED REFERENCES (full citations; all published and peer-reviewed):
  [1] T. Soukupova and J. Cech, "Real-Time Eye Blink Detection using Facial
      Landmarks," Proc. 21st Computer Vision Winter Workshop (CVWW), 2016.
      — EAR formula (a+b)/(2c); baseline closed-eye threshold 0.2 on
      dlib landmarks. Our EAR_THRESHOLD=0.24 is tuned upward for the
      MediaPipe landmark scale (MediaPipe reports a small residual gap on
      fully shut eyes); the tuned value is validated by the EAR sweep in
      train.py.
  [2] D. F. Dinges et al., "PERCLOS: A Valid Psychophysiological Measure of
      Alertness As Assessed by Psychomotor Vigilance," FHWA Tech Brief
      FHWA-MCRT-98-006, 1998. — PERCLOS = share of time eyes >=80% closed
      (P80) over a window; validated against PVT lapses (r=0.875).
      Our PERCLOS_WINDOW=60 at ~1 fps follows this 60-second window.
  [3] C.-H. Weng, Y.-H. Lai and S.-H. Lai, "Driver Drowsiness Detection via a
      Hierarchical Temporal Deep Belief Network," Proc. ACCV Workshop on
      Driver Drowsiness Detection from Video, 2016. — NTHU-DDD dataset paper
      (36 subjects, ~9.5h, 5 scenarios). MANDATORY citation when NTHU-DDD
      features are used (see datasets/README.md for license/ethics terms).
  [4] G. Sikander and S. Anwar, "Driver Fatigue Detection Systems: A Review,"
      IEEE Trans. Intelligent Transportation Systems, vol. 20, no. 6,
      pp. 2339-2352, 2019. — Five-family taxonomy; documents the gaps we
      address (fixed thresholds, constrained-environment evaluation).
  [5] F. You et al., "A Real-Time Driving Drowsiness Detection Algorithm With
      Individual Differences Consideration," IEEE Access, vol. 7,
      pp. 179396-179408, 2019. — Proves EAR depends on eye size across
      drivers; motivates our per-driver calibration (75%-of-baseline rule)
      instead of one fixed threshold.
  [6] S. Abtahi et al., "YawDD: A Yawning Detection Dataset," Proc. ACM
      Multimedia Systems (MMSys), 2014. — Talking/singing vs yawning splits;
      motivates our mouth gating (a permanently open mouth must not count
      as yawning) and MAR validation protocol.

EMPIRICAL (not from a paper — set on NTHU-DDD, see evaluation_results.json):
  MAR_THRESHOLD=0.44, MAR_HALF=0.34, EAR_LOW=0.28, PERCLOS_RISK=0.35.
  Note: MAR separates poorly on NTHU-DDD (talking/laughing negatives), so
  yawning relies on sustained MAR + eye context, validated on YawDD-style
  splits as future work.

CONFIDENCE SOURCES (see predict_frame):
  fitted-lr-nthu — P(drowsy | frame) from L2 logistic regression fitted on
      NTHU-DDD TRAIN by train.py (test F1/ECE in evaluation_results.json).
      Used for microsleep / drowsy / high_risk / critical.
  heuristic      — documented counter-based formulae below, used only for
      transient states (eyes_closed, heavy_eyelids, mouth_open, yawning):
      eyes_closed  0.20 + close_counter/300  -> 0.20-0.40
      heavy lids   0.10 + (ear_low-ear)*2.5  -> 0.05-0.20
      mouth open   0.10 + (mar-mar_yawn)*1.0 -> 0.10-0.40
      yawning      0.40 + yawn_counter/180 + 0.2 -> 0.40-0.85

================================================================================
"""

import json as _json
import math as _math
import os as _os

EAR_THRESHOLD = 0.24
EAR_LOW = 0.28
MAR_THRESHOLD = 0.44
MAR_HALF = 0.34
PERCLOS_WINDOW = 60
PERCLOS_RISK = 0.35

FRAMES_CLOSED = 1
FRAMES_MICRO = 2
FRAMES_DROWSY = 4
FRAMES_CRITICAL = 6
FRAMES_YAWN = 2
FRAMES_RESET = 1

# Data-fitted frame confidence (Flaw 3 fix).
# confidence_weights.json is produced by train.py: L2 logistic regression on
# NTHU-DDD TRAIN features [EAR, MAR, pitch, yaw]. Runtime P(drowsy | frame)
# for drowsy-family states comes from these weights (test F1/ECE reported in
# evaluation_results.json), NOT from hand-tuned formulae. Transient states
# (eyes_closed, heavy_eyelids, mouth_open, yawning) keep documented heuristics.
def _load_confidence_weights():
    try:
        path = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                             'confidence_weights.json')
        with open(path) as f:
            w = _json.load(f)
        for key in ('feature_mean', 'feature_scale', 'coefficients', 'intercept'):
            if key not in w:
                return None
        return w
    except (OSError, ValueError):
        return None


_LR_WEIGHTS = _load_confidence_weights()


def model_confidence(ear, mar, pitch=0.0, yaw=0.0):
    """Return (P(drowsy | frame), True) from fitted LR weights.

    Falls back to (None, False) when confidence_weights.json is absent, in
    which case callers use the documented heuristic formulae.
    """
    if _LR_WEIGHTS is None:
        return None, False
    try:
        mean = _LR_WEIGHTS['feature_mean']
        scale = _LR_WEIGHTS['feature_scale']
        coef = _LR_WEIGHTS['coefficients']
        vals = (float(ear), float(mar), float(pitch), float(yaw))
        z = sum(c * (v - m) / (s + 1e-8)
                for c, v, m, s in zip(coef, vals, mean, scale))
        z += float(_LR_WEIGHTS['intercept'])
        z = max(-30.0, min(30.0, z))
        return round(1.0 / (1.0 + _math.exp(-z)), 4), True
    except (TypeError, ValueError, ZeroDivisionError):
        return None, False

# Impairment-aware modality gating (own contribution).
# Calibration may mark a modality unusable for a driver:
#   eyes_mode: 'both' | 'left' | 'right' | 'none'
#     'left'/'right' = single healthy eye (other eye blind/ptotic);
#     'none' = no usable eye signal (eye-based states disabled).
#   mouth_enabled: False = mouth baseline permanently open (medical) or
#     otherwise unusable; yawning states disabled so no false yawns.
# Related: You et al. 2019 (individual differences), Abtahi et al. 2014
# (talking vs yawning confound in YawDD).
DEFAULT_MODALITIES = {
    'eyes_mode': 'both',
    'mouth_enabled': True,
}

# Default per-driver thresholds. A calibrated driver profile can override
# these per request (see DrowsinessDetector.predict_frame `thresholds` arg).
# Keys: ear_closed, ear_low, mar_yawn, mar_half, perclos_risk
DEFAULT_THRESHOLDS = {
    'ear_closed': EAR_THRESHOLD,
    'ear_low': EAR_LOW,
    'mar_yawn': MAR_THRESHOLD,
    'mar_half': MAR_HALF,
    'perclos_risk': PERCLOS_RISK,
}


class DrowsinessDetector:
    def __init__(self):
        self.close_counter = 0
        self.yawn_counter = 0
        self.normal_counter = 0
        self.total_drowsy_events = 0
        self.total_yawn_events = 0
        self.current_state = 'awake'
        self.conf_source = 'heuristic'
        self.ear_history = []
        self.mar_history = []
        self.alerts = []
        self._last_alert_time = 0
        self._recovered = False

    def _calc_perclos(self, ear_history, ear_closed=None):
        if not ear_history:
            return 0.0
        limit = ear_closed if ear_closed is not None else EAR_THRESHOLD
        window = ear_history[-min(len(ear_history), PERCLOS_WINDOW):]
        closed = sum(1 for e in window if e < limit)
        return closed / len(window) if window else 0.0

    def _resolve_thresholds(self, thresholds):
        th = dict(DEFAULT_THRESHOLDS)
        if thresholds:
            for key in th:
                try:
                    value = float(thresholds.get(key, th[key]))
                except (TypeError, ValueError):
                    continue
                th[key] = value
        # Sanity guard: low band must stay above the closed limit.
        if th['ear_low'] <= th['ear_closed']:
            th['ear_low'] = th['ear_closed'] + 0.06
        if th['mar_yawn'] <= th['mar_half']:
            th['mar_yawn'] = th['mar_half'] + 0.10
        return th

    def _resolve_modalities(self, modalities):
        md = dict(DEFAULT_MODALITIES)
        if modalities:
            eyes_mode = modalities.get('eyes_mode', md['eyes_mode'])
            if eyes_mode in ('both', 'left', 'right', 'none'):
                md['eyes_mode'] = eyes_mode
            mouth = modalities.get('mouth_enabled', md['mouth_enabled'])
            if isinstance(mouth, bool):
                md['mouth_enabled'] = mouth
        return md

    def predict_frame(self, features, ear_history=None, thresholds=None, modalities=None):
        th = self._resolve_thresholds(thresholds)
        md = self._resolve_modalities(modalities)
        # Single-eye drivers: use only the healthy eye's signal so the
        # impaired eye never drives false eye-closure states.
        if md['eyes_mode'] == 'left' and 'left_ear' in features:
            ear_raw = features['left_ear']
        elif md['eyes_mode'] == 'right' and 'right_ear' in features:
            ear_raw = features['right_ear']
        else:
            ear_raw = features['eye_aspect_ratio']
        mar_raw = features['mouth_aspect_ratio']
        self.mar_history.append(mar_raw)
        if len(self.mar_history) > 3:
            self.mar_history.pop(0)
        ear = sum(ear_history[-2:] + [ear_raw]) / 3 if ear_history and len(ear_history) >= 2 else ear_raw
        mar = sum(self.mar_history) / len(self.mar_history) if len(self.mar_history) >= 2 else mar_raw
        eyes_usable = md['eyes_mode'] != 'none'
        mouth_usable = md['mouth_enabled'] is True
        perclos = self._calc_perclos(ear_history or self.ear_history, th['ear_closed']) if eyes_usable else 0.0

        # Use raw for immediate eye close (harsh reality: smoothing diluted 0.25 with 0.35 -> 0.31 not closed)
        eyes_closed = eyes_usable and ear_raw < th['ear_closed']
        heavy_lids = eyes_usable and th['ear_low'] > ear_raw >= th['ear_closed']
        half_mouth = mouth_usable and mar_raw > th['mar_half']
        mouth_open = mouth_usable and mar_raw > th['mar_yawn']
        yawn_combo = half_mouth and heavy_lids

        # Data-fitted frame confidence P(drowsy | frame) for drowsy-family
        # states (Flaw 3 fix). Falls back to heuristics when weights absent.
        lr_prob, lr_ok = model_confidence(
            ear_raw, mar_raw,
            features.get('head_pitch', 0.0), features.get('head_yaw', 0.0))
        self.conf_source = 'heuristic'

        def fitted_or(fallback):
            if lr_ok:
                self.conf_source = 'fitted-lr-nthu'
                return lr_prob
            return round(fallback, 4)

        if eyes_closed:
            self.close_counter += 1
            self.normal_counter = 0
            self._recovered = False
        else:
            self.normal_counter += 1

            if mouth_open or yawn_combo:
                self.yawn_counter += 1
            else:
                self.yawn_counter = 0

            if self.normal_counter >= FRAMES_RESET:
                self.close_counter = 0
                self.yawn_counter = 0
                self._recovered = True

        # Yawning confirmed - check before critical when MAR high (user wants yawning countdown at 0.23/0.60)
        if self.yawn_counter >= FRAMES_YAWN:
            self.current_state = 'yawning'
            conf = min(0.40 + self.yawn_counter / 180 + 0.2, 0.85)
            return 0, round(conf, 4)

        # Critical — 5s+ sustained closure OR PERCLOS > 50%
        if self.close_counter >= FRAMES_CRITICAL or perclos > 0.50:
            self.current_state = 'critical'
            conf = fitted_or(min(0.90 + perclos * 0.1, 0.98))
            return 1, conf

        # High risk — 3s+ closure with elevated PERCLOS
        if self.close_counter >= FRAMES_DROWSY and perclos > th['perclos_risk']:
            self.current_state = 'high_risk'
            conf = fitted_or(min(0.80 + perclos * 0.2, 0.95))
            return 1, conf

        # Drowsy — 3s+ sustained eye closure
        if self.close_counter >= FRAMES_DROWSY:
            self.current_state = 'drowsy'
            conf = fitted_or(min(0.70 + self.close_counter / 300 + perclos, 0.92))
            return 1, conf

        # Microsleep — 2s sustained closure
        if self.close_counter >= FRAMES_MICRO:
            self.current_state = 'microsleep'
            conf = fitted_or(min(0.45 + self.close_counter / 200, 0.75))
            return 1, conf

        # Eyes closed (partial duration)
        if eyes_closed and self.close_counter >= FRAMES_CLOSED:
            self.current_state = 'eyes_closed'
            conf = min(0.20 + self.close_counter / 300, 0.40)
            return 0, round(conf, 4)

        # Heavy/drooping eyelids
        if heavy_lids:
            self.current_state = 'heavy_eyelids'
            conf = min(0.10 + (th['ear_low'] - ear) * 2.5, 0.20)
            return 0, round(conf, 4)

        # Mouth open (not yet yawn)
        if mouth_open:
            self.current_state = 'mouth_open'
            conf = min(0.10 + (mar - th['mar_yawn']) * 1.0, 0.40)
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
        self.conf_source = 'heuristic'
        self.ear_history.clear()
        self.mar_history.clear()
        self.alerts.clear()
        self._recovered = False

    def load(self, path=None):
        pass
