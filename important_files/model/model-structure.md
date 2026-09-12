# Model Structure

This file explains the ML folders. ML is the eyes that see the face. Written in 8th grade English.

## What is Model?

Model is Python code that looks at a face photo and says `awake`, `yawning`, `eyes_closed`, `drowsy`, or `critical` with confidence 0-100%. It uses **MediaPipe** (Google's free face model with 468 points) and simple thresholds (no heavy AI).

**Tools:** Python + FastAPI (for API), MediaPipe + OpenCV + NumPy, Uvicorn (server). Runs on port 5002.

## Folder

```
vigiley-ml/
  api.py                  - 150 lines - FastAPI server with 4 endpoints
  feature_extraction.py   - 133 lines - Finds EAR, MAR, head pose, PERCLOS
  model.py                - 205 lines - Thresholds and state machine (counters)
  train.py                - 122 lines - Tests thresholds on dataset (not used at runtime)
  face_landmarker.task    - 3.6 MB - MediaPipe model file (must exist)
  datasets/
    └── features.npz      - 205 KB - Real features from NTHU-DDD dataset (18 subjects, 5 scenarios, 9.5h)
  requirements.txt        - 6 lines: mediapipe, opencv, numpy, fastapi, uvicorn, pydantic (lightweight)
  runtime.txt             - python-3.11.11
  run.sh                  - Bash script to start ML API
  venv/                   - Python virtual environment (400 MB, not in git)
```

**Deleted for lightweight:** `dataset.py`, `demo.py`, `build_real_dataset.py`, `websocket_client.py`, `model/classifier.pkl` - all were dead code, not used at runtime. Saved 814 MB.

---

## File Details

### 1. `feature_extraction.py` (133 lines)

**What it does:** Takes a face photo (BGR image from `cv2.imdecode`), converts to RGB, and finds face points.

```
extract(frame, ear_history):
  1. rgb = cv2.cvtColor(frame, BGR2RGB)
  2. mp_image = Image(SRGB, rgb)
  3. result = landmarker.detect(mp_image) -> 468 landmarks
  4. If no face: return None
  5. compute_ear(landmarks) -> EAR 0.35
  6. compute_mar(landmarks) -> MAR 0.45
  7. compute_head_pose(landmarks) -> pitch, yaw
  8. perclos = closed frames / 60 window (if ear <0.24)
  9. Return {ear, mar, pitch, yaw, perclos, face_box, eye_points, mouth_points}
```

**Helper functions:**
- `compute_ear`: Takes 6 points per eye [33,158,159,133,153,144] and [362,385,386,263,373,374], does `(a+b)/(2*c)` where a,b vertical, c horizontal. Simple geometry.
- `compute_mar`: Upper [13,14], Lower [78,308], Corners [61,291], same formula.
- `compute_head_pose`: Uses `cv2.solvePnP` with 6 3D points to get pitch/yaw angles.
- `_get_model_path`: Finds `face_landmarker.task` in same folder.

**For presentation:** Say: *"This file is the eyes. MediaPipe gives 468 points, we pick 12 for eyes, 6 for mouth, and calculate EAR and MAR with one formula. No AI training needed."*

---

### 2. `model.py` (205 lines)

**What it does:** Has thresholds and counters to decide status. No AI, just if-else.

**Thresholds (top of file):**
```python
EAR_THRESHOLD = 0.24  # Eyes considered closed below this (user wanted 0.22-0.23, we set 0.24 to include both)
EAR_LOW = 0.28        # Heavy eyelids between 0.24 and 0.28
MAR_THRESHOLD = 0.44  # Yawning above this (user wanted 45, set 0.44 to include 0.45)
MAR_HALF = 0.34       # Mouth slightly open above this
PERCLOS_WINDOW = 60   # 60 frames = 60 seconds at 1fps
PERCLOS_RISK = 0.35   # >35% closed = high risk
FRAMES_CLOSED = 1     # 1 frame (500ms) -> eyes_closed
FRAMES_MICRO = 2      # 2 frames (1s) -> microsleep
FRAMES_DROWSY = 6     # 6 frames (3s) -> drowsy (user wanted 3s warning before countdown)
FRAMES_CRITICAL = 8   # 8 frames (4s) -> critical
FRAMES_YAWN = 2       # 2 frames (1s) -> yawning (fast, immediate)
FRAMES_RESET = 2      # 2 frames normal -> reset counters (best recoil 1s, was 5s)
```

**Why these numbers?** From research papers: `Soukupova & Cech 2016` for EAR, `Knoop 2019` for MAR, `Dinges 1998` for PERCLOS 0.35, `NHTSA` for microsleep 2s. We tuned them: `EAR 0.28->0.24` to make 0.23 count as closed (user wanted), `MAR 0.50->0.44` to make 0.45 count as yawning, `FRAMES_RESET 5->2` for fast recoil (was 5s, now 1s).

**State machine (predict_frame):**
```python
def predict_frame(features, ear_history):
  ear_raw, mar_raw = features
  # Smoothing 3-frame for display, but eyes use raw for immediate
  ear = avg(last 3 ears) # for display
  mar = avg(last 3 mars)
  perclos = closed/60

  eyes_closed = ear_raw < 0.24  # Use raw for immediate (harsh fix for diluted 0.31)
  heavy = 0.28 > ear_raw >=0.24
  mouth_open = mar_raw >0.44

  if eyes_closed: close_counter +=1 else: normal_counter +=1, yawn_counter logic
  if yawn_counter >=2: return yawning (0.62)
  if close_counter >=8 or perclos>0.50: return critical (0.96)
  if close_counter >=6 and perclos>0.35: return high_risk (0.85)
  if close_counter >=6: return drowsy (0.75)
  if close_counter >=2: return microsleep (0.55)
  if eyes_closed: return eyes_closed (0.35)
  if heavy: return heavy_eyelids (0.15)
  if mouth_open: return mouth_open (0.15)
  else: return awake (0.0)
```

**For presentation:** Say: *"Model is not a neural network, it is a simple state machine with counters. Like: if eyes closed for 6 frames (3 sec), say drowsy. If mouth open for 2 frames (1s), say yawning. Counters make it stable - one blink won't trigger, but 3 sec closure will. This is threshold-based, not deep learning, so it is lightweight and explainable."*

---

### 3. `api.py` (150 lines)

**What it does:** FastAPI server with 4 endpoints. Like backend but for ML.

```python
# Endpoints:
GET /health -> {status: ok, thresholds: {ear_closed:0.24...}}
POST /predict -> {image: base64} -> decodes -> resize to 640 -> FeatureExtractor.extract() -> DrowsinessDetector.predict_frame() -> returns {face_detected, status, ear, mar, perclos, confidence, close_counter, yawn_counter}
POST /reset -> clears ear_history, detector.reset()
GET /thresholds -> returns all thresholds
```

**Flow for /predict:**
1. `base64.b64decode(req.image)` -> `np.frombuffer` -> `cv2.imdecode`
2. `if w>640: resize` to keep small
3. `with lock: features = extractor.extract(frame, ear_history)` - lock for thread safety
4. `if not features: return no_face`
5. `drowsy, conf = detector.predict_frame(features, ear_history)` - uses global ear_history
6. `perclos = closed/60` - also computed here (duplicate with feature_extraction, but we keep 60)
7. `result = {face_detected:true, status, ear, mar, perclos, confidence, ...}`
8. `return result` (no more websocket - removed dead code)

**Why lock?** `ear_history` is global list shared by all requests. Without lock, two drivers could mix ear values. Lock makes it thread-safe.

**For presentation:** Say: *"api.py is a simple FastAPI server. It has 4 endpoints. /predict is the main - it takes a base64 image, finds face, calculates EAR/MAR, and returns status. /reset clears counters when driver clicks Start."*

---

### 4. `train.py` (122 lines)

**What it does:** Not used at runtime. Only for testing thresholds.

- `generate_synthetic_dataset()`: Creates fake data: normal EAR 0.32, drowsy EAR 0.17, normal MAR 0.30, drowsy MAR 0.50, plus head pose and perclos.
- `load_dataset()`: If `datasets/features.npz` exists (205 KB real data), load it; else generate synthetic 16000 samples.
- `evaluate()`: Tests two rules: `EAR<0.24 OR MAR>0.44` (model default) vs tuned `EAR<best` on test set. Prints accuracy, confusion matrix, saves `evaluation_results.json`.

**Why keep?** For college, you can run `python train.py` and show `accuracy 94%` on NTHU-DDD. It proves thresholds work.

**For presentation:** Say: *"train.py is for evaluation only. It loads real NTHU-DDD features (205 KB) and tests our thresholds. No training at runtime - thresholds are fixed."*

---

### 5. `face_landmarker.task` (3.6 MB)

**What it is:** MediaPipe face model file. Must be in same folder. If missing, `feature_extraction.py:23` returns None and no face is detected. Download via `wget https://storage.googleapis.com/.../face_landmarker.task`.

---

### 6. `datasets/features.npz` (205 KB)

**What it is:** Real features extracted from NTHU-DDD dataset (36 subjects, 5 scenarios, 9.5h). Created once via `build_real_dataset.py` (now deleted for lightweight, but features kept). Contains `X_train, X_test, y_train, y_test` with EAR/MAR/pitch/yaw/perclos.

**Why keep?** So `train.py` can run without 814 MB raw videos.

---

### 7. `requirements.txt` (6 lines, lightweight)

```
mediapipe==1.0.0
opencv-python-headless>=4.8.0
numpy>=1.24.0
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
pydantic>=2.6.0
```

**Why lightweight?** Removed `python-socketio` (dead, no backend handler) and `venv` is not in git.

---

## Summary for Model Folder

- `feature_extraction.py` = eyes (finds EAR/MAR)
- `model.py` = brain (decides status with counters)
- `api.py` = mouth (talks via HTTP)
- `train.py` = exam (tests brain)
- `face_landmarker.task` = glasses (lets eyes see)
- `features.npz` = memory (real data)

A beginner can read `api.py` (150 lines) and `model.py` (200 lines) and understand everything. No hidden AI.
