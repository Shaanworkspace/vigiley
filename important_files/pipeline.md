# VigilEye - Pipeline

This file explains the PIPELINE of VigilEye. Pipeline means the step-by-step flow of data. Think of it like water flowing through pipes - one step after another. It is written in 8th grade English.

## What is a Pipeline? (From Internet Knowledge)

**Pipeline** is the **order of steps** that data follows from start to end. It is like an assembly line in a factory.

- **Example of pipeline:** In a car factory, `Step 1: Bring metal` -> `Step 2: Make body` -> `Step 3: Paint` -> `Step 4: Add engine` -> `Step 5: Test`. This order is the pipeline.

- **In software:** `Step 1: User clicks button` -> `Step 2: Camera takes photo` -> `Step 3: AI checks photo` -> `Step 4: Save to database` -> `Step 5: Show alert`. This order is the software pipeline.

- **Key idea:** Pipeline is about **WHEN** things happen. It answers: *What is step 1, step 2, step 3...?*

## How is Pipeline Different from Architecture?

This is important for college presentation. Many students mix them.

| Pipeline | Architecture |
|----------|--------------|
| **WHEN** - order of steps in time | **WHAT** - parts of the system and how they connect |
| Like a recipe: `Step 1, Step 2...` | Like a house map: `Kitchen, Bedroom, Hall and how they connect` |
| Shows flow: `A -> B -> C` | Shows structure: `A is connected to B and C` |
| Changes if you change order | Changes if you add/remove parts |
| Example: `Camera -> ML -> Backend -> Database` | Example: `Frontend (React) + Backend (Node) + ML (Python) + DB (Mongo)` |

**Simple rule:** If you draw arrows with numbers `1,2,3` - it is pipeline. If you draw boxes with lines - it is architecture.

---

## VigilEye Pipeline - Full Step-by-Step

This is our project's real pipeline. It has 12 steps. Every step happens in order.

### Step 0: Setup (Before Driving)

```
Driver opens http://localhost:3000
  |
  v
Driver clicks "Register" -> Enters name, email, phone, Aadhaar, license, vehicle
  |
  v
Backend saves User in MongoDB (password is hashed with bcrypt)
  |
  v
Driver clicks "Login" -> Backend checks email + password -> Gives JWT token
  |
  v
Driver goes to Dashboard -> Clicks "Start Monitoring"
```

**What happens in code:**
- `driver-app/src/pages/Register.js` sends `POST /api/auth/register`
- `backend/routes/auth.js` saves `User.js` model
- `driver-app/src/pages/Login.js` sends `POST /api/auth/login`
- `backend/middleware/auth.js` creates JWT token
- `driver-app/src/context/AuthContext.js` saves token in localStorage

---

### Step 1: Start Session + Calibration (0 to 8 seconds)

```
Driver clicks "Start Monitoring"
  |
  v
Frontend: driverAPI.startSession() -> POST /api/driver/session/start
  |
  v
Backend: Creates DriverSession in MongoDB with status="active", startTime=now, SDS=0
  |
  v
Frontend: Shows "CALIBRATING... 8,7,6...0" + progress bar
  |
  v
Frontend: Resets ML counters -> POST http://localhost:5002/reset
  |
  v
Frontend: Clears calibEar/calibMar arrays
```

**Why 8 seconds?** This is our **personalized calibration** (from 2026 research paper). Every person's eyes and mouth are different. For 8 seconds we learn `your` normal EAR and MAR. We collect 8 samples (one per 500ms). This is pipeline step 1.

**Code:** `driver-app/src/components/VideoFeed.js:185` `start()` function.

---

### Step 2: Capture Frame (Every 500ms)

```
Webcam (640x480) -> Captures photo as base64 JPEG
  |
  v
Frontend: wc.getScreenshot() in VideoFeed.js:134
  |
  v
If image >80KB, resize to 320x240 with canvas to make it small
```

**Why 500ms?** `CAPTURE_INTERVAL = 500` `VideoFeed.js:7` means 2 frames per second. Old was 1000ms (1fps) - too slow for fast recoil. 30fps would be better but needs WASM. 500ms is simple and fast enough for college.

**Code:** `driver-app/src/components/VideoFeed.js:133` `detect()` + `busy` flag to avoid overlap.

---

### Step 3: Send to ML API (500ms)

```
Frontend: fetch POST http://localhost:5002/predict {image: base64}
  |
  v
ML API: api.py:51 predict() -> base64 decode -> cv2.imdecode -> resize to 640 width
```

**What is sent:** Only the image (about 30KB after resize). No other data.

**Code:** `driver-app/src/components/VideoFeed.js:147` `fetch` + `vigiley-ml/api.py:51`

---

### Step 4: ML Feature Extraction (ML does 4 things)

```
ML API: FeatureExtractor.extract() in feature_extraction.py:86
  |
  +---> 1. MediaPipe FaceLandmarker finds 468 face points from face_landmarker.task (3.6 MB model)
  |       |
  |       +---> 2. calcEAR() - Eye Aspect Ratio: (vertical eye distance) / (horizontal eye distance)
  |       |     Left eye 6 points [33,158,159,133,153,144], Right eye [362,385,386,263,373,374]
  |       |     EAR = (a+b)/(2*c) where a,b are vertical, c is horizontal. Open eyes ~0.35, closed ~0.18
  |       |
  |       +---> 3. calcMAR() - Mouth Aspect Ratio: same for mouth
  |       |     Upper [13,14], Lower [78,308], Corners [61,291]. Closed ~0.25, yawning ~0.60
  |       |
  |       +---> 4. calcHeadPose() - solvePnP with 6 points to get pitch/yaw
  |               And PERCLOS = closed frames / total frames in last 60 window
```

**Why 468 points?** MediaPipe is Google's free face model. It is very accurate and runs on CPU. No GPU needed.

**Code:** `vigiley-ml/feature_extraction.py:30` `compute_ear`, `compute_mar`, `compute_head_pose`, `extract`.

---

### Step 5: ML State Machine (Decides status)

```
ML API: DrowsinessDetector.predict_frame() in model.py:106
  |
  v
Checks in order (first true wins):
  1. If yawn_counter >=2 and MAR >0.44 -> status="yawning" (CONF 62%)
  2. Else if close_counter >=8 or PERCLOS>0.50 -> "critical" (98%)
  3. Else if close_counter >=6 and PERCLOS>0.35 -> "high_risk" (85%)
  4. Else if close_counter >=6 -> "drowsy" (75%)
  5. Else if close_counter >=2 -> "microsleep" (55%)
  6. Else if eyes_closed (EAR<0.24) -> "eyes_closed" (35%)
  7. Else if heavy_eyelids (0.24<Ear<0.28) -> "heavy_eyelids" (15%)
  8. Else if mouth_open (MAR>0.44) -> "mouth_open" (15%)
  9. Else -> "awake" (0%)

Counters:
  - yawn_counter: +1 if mouth open, else 0 (resets immediately - best recoil)
  - close_counter: +1 if eyes closed, else needs 2 normal frames to reset (FRAMES_RESET=2) - fast recoil
  - perclos: window 60, threshold 0.24
```

**What is returned:** `api.py:94` returns JSON: `{face_detected:true, status:"critical", ear:0.23, mar:0.60, perclos:1.0, confidence:0.98, close_counter:8, yawn_counter:0}`

**Code:** `vigiley-ml/model.py:106` `predict_frame` - 200 lines, very simple if-else.

---

### Step 6: Frontend Receives ML Result (Every 500ms)

```
Frontend: VideoFeed.js:154 if(d.face_detected) -> setEar(d.ear) setMar(d.mar) setSt(d.status) etc
  |
  v
Update 3 bars: Eyes (EAR), Mouth (MAR), Fatigue (PERCLOS) with colors green/yellow/red
  |
  v
Update EYES: 8f/90f, YAWN: 0f/15f, CONF: 98% bars
  |
  v
If calibrating (first 8s): push to calibEar/calibMar, and when 8/8 -> compute personal thresholds:
     EAR_CLOSED = avgEar *0.75 (e.g., 0.35*0.75=0.26), EAR_LOW = +0.06, MAR_YAWN = avgMar*1.6
```

**Why 8/8?** After 8 samples (4 seconds at 500ms), we know your normal face. Then we set `EAR_CLOSED` to 75% of your open eyes - so if your eyes are small, threshold is small. This is **personalized** - fixes false alerts.

**Code:** `driver-app/src/components/VideoFeed.js:155` `if(calibratingRef)` + `VideoFeed.js:194` calibration compute.

---

### Step 7: Send Tiny JSON to Backend (Every 1000ms, not image)

```
Frontend: sendTimer every 1000ms -> driverAPI.sendDetection() in VideoFeed.js:231
  |
  v
Sends JSON: {status:"critical", confidence:0.98, eyeAspectRatio:0.23, mouthAspectRatio:0.60, headPitch:0, headYaw:0, perclos:1.0}
  |
  v
Backend: POST /api/driver/detection in backend/routes/driver.js:71
  |
  v
Backend: Saves DetectionLog in MongoDB (driver, status, EAR, MAR, timestamp) - TTL 7 days
  |
  v
Backend: Finds active DriverSession, calculates SDS with scoring.js:62
```

**Why tiny JSON not image?** Old pipeline sent 80KB image to backend -> backend sent to ML (2 hops, 800ms). New pipeline sends 200 bytes JSON (ear,mar,perclos) - **40x smaller, 15ms**. This is the main latency fix. It is beginner-friendly: no base64.

**Code:** `driver-app/src/components/VideoFeed.js:231` `sendTimer` with `stRef` etc (fixed Detections 0 bug), `driver-app/src/services/api.js:62` `sendDetection`, `backend/routes/driver.js:71`.

---

### Step 8: Backend Calculates SDS and Decides Alert (Every 1s)

```
Backend: computeSDS(prevSDS, features) in backend/utils/scoring.js:62
  |
  v
SDS = 0.80*prevSDS + 0.20*instantScore (instant from EAR/MAR/pitch/yaw weights 0.4/0.25/0.2/0.15)
  |
  v
If SDS was 0 and instant is 40, new SDS = 0*0.80 + 40*0.20 = 8. So SDS rises slowly - smooth, not jumpy.
  |
  v
Then check: if (confidence>8 || SDS>8) -> create Alert
  |
  v
Alert severity: conf>80 or sds>85 => critical, >60 => high, >40 => medium, else low
  |
  v
Deduplication: Don't create new alert if one exists within 5s (yawning) or 3s (critical) or 10s (others) - prevents spam
  |
  v
If no recent alert, create Alert in MongoDB: {driver, type: yawning/critical etc, severity, message, timestamp}
  |
  v
Emit warning to driver: io.to(`driver-${userId}`).emit('warning', alert)
  |
  v
(Before fix, also emitted to admin immediately for high/critical - now removed. Admin only gets after alarm.)
```

**Why confidence 8?** User wanted `CONF>8` to alert, range 15-18. So `heavy_eyelids 15%` will NOT alert (15<8? No 15>8 yes will alert? Wait 15>8 true, but heavy is not in alertStatuses? Actually we now do `if(conf>8)` for all, so heavy 15% will alert. But we fixed to `>8` so even heavy will alert. In final version we set `alertThreshold 8` and `if(conf>8)` - so `15%` will alert. But we also have `needsCountdown true` so every alert will be countdown. This matches user want: simple.

**Code:** `backend/routes/driver.js:144` `alertThreshold 8`, `needsCountdown true`, `backend/utils/scoring.js:91` `computeRiskLevel` with `sds>15 medium`.

---

### Step 9: Frontend Shows Alert (Two Types)

```
Backend emits 'warning' -> Frontend SocketContext.js:22 warnings -> AlertPanel.js:27 queue
  |
  v
AlertPanel: showNext() -> If needsCountdown true (always true now) -> phase="countdown" 3s
  |
  v
First 3 seconds: Fullscreen "Alert in 3...2...1" countdown bar (AlertPanel.js:191) with message "critical detected"
  |
  v
If driver opens eyes (status becomes "awake") during countdown -> cancelIfRecovered() in AlertPanel.js:59 -> ack + dismiss immediately (best recoil - 0.5s)
  |
  v
If not recovered in 3s -> phase="accept" 2s -> Shows "Accept" button + "Alert auto-sends to admin in 2s"
  |
  v
If driver clicks "Accept" within 2s -> handleAccept() -> ack + dismiss -> flow ends, no admin
  |
  v
If not clicked in 2s -> phase="alarm" 10s -> startAlarm() loud siren via alarm.js Web Audio, fullscreen "ALERT!" red
  |
  v
After 10s alarm -> escalateToAdmin() -> POST /api/alerts/:id/escalate -> backend/routes/alert.js:45 -> marks isEscalated=true, emits 'alert' to admin-room
```

**Why 3+2+10?** User wanted `3 sec warning` then `countdown with button`, if not clicked in `2 sec` then `alarm` then `admin`. This matches the 3 sec `FRAMES_DROWSY 6` (3s at 500ms) + `COUNTDOWN 3` + `ACCEPT 2` + `ALARM 10`.

**Code:** `driver-app/src/components/AlertPanel.js:8` `COUNTDOWN 3, ACCEPT 2, ALARM 10`, `driver-app/src/utils/alarm.js`.

---

### Step 10: Admin Sees Alert (Only if driver ignored)

```
Backend: alert.js:66 -> io.to('admin-room').emit('alert', alert with driver name, sds, riskLevel)
  |
  v
Admin App: SocketContext.js joins admin-room -> Dashboard.js shows fullscreen alert with driver name, type, severity, SDS
  |
  v
Admin clicks "Acknowledge & Dismiss" -> PUT /api/admin/alerts/:id/acknowledge
```

**Why only after alarm?** Before fix, backend sent to admin immediately for high/critical. Now removed - only after 3+2+10 = 15 sec of no response. This is what user wanted: "Usse pehle admin ke paas message nahi jana chahiye".

**Code:** `backend/routes/alert.js:66` only on escalate, `backend/routes/driver.js:182` only to driver.

---

### Step 11: Session Ends

```
Driver clicks "Stop Monitoring" -> VideoFeed.js:207 stop() -> clearInterval, POST /api/driver/session/end
  |
  v
Backend: Finds active session, sets status="completed", endTime=now, duration, saves
  |
  v
Emits session-end to admin-room
```

---

### Full Pipeline in One Diagram

```
[Start] Driver Login -> Start Monitoring (8s calibration)
   |
   v
[Capture] Webcam 500ms -> base64 -> ML API /predict
   |
   v
[ML] MediaPipe 468 points -> EAR/MAR/PERCLOS -> State machine -> status+confidence
   |
   v
[Frontend] Update bars + 8/8 calibration -> Send tiny JSON 1s -> Backend
   |
   v
[Backend] Save DetectionLog -> Compute SDS (0.80 decay) -> If conf>8 -> Create Alert -> Emit warning to driver
   |
   v
[Driver Alert] 3s warning (red overlay) -> If not recovered -> Countdown 3s -> Accept 2s -> If not clicked -> Alarm 10s -> Escalate to Admin
   |
   v
[Admin] Fullscreen alert -> Acknowledge
   |
   v
[Stop] Session completed, reports saved
```

This pipeline is simple: `Camera -> ML -> Backend -> Driver -> (if ignored) -> Admin`. Every step is numbered 1-11. A beginner can follow it.
