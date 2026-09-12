# VigilEye - Complete Folder Structure

This file shows every folder and file in the project. It is written in simple English so any beginner can understand.

## Root Folder: VigilEye

```
VigilEye/
├── important_files/          # All knowledge files for college presentation (you are here)
├── landing/                  # Landing page - first website people see
├── driver-app/               # App for drivers - shows camera and alerts
├── admin-app/                # App for admin - sees all drivers
├── backend/                  # Server - handles data and messages
├── vigiley-ml/               # Machine learning - detects drowsy face
├── package.json              # Main package file to install everything
├── start.sh                  # One script to start all 5 apps
└── .gitignore                # Tells git what not to save
```

---

## 1. Landing (`landing/`)

This is the marketing website. It is built with React and Vite. It runs on port 3002.

```
landing/
├── package.json              # List of tools needed for landing page
├── vite.config.js            # Settings for Vite
├── public/
│   └── index.html            # Main HTML file
└── src/
    ├── App.js                # Main app - loads all landing components
    ├── index.js              # Starts React
    ├── components/
    │   ├── Hero.js           # Big top banner - "Stay Awake, Stay Alive"
    │   ├── Features.js       # 6 feature cards (EAR, MAR, etc)
    │   ├── HowItWorks.js     # 3 steps - how drowsiness is detected
    │   ├── Stats.js          # Numbers like 37 scans
    │   ├── TechStack.js      # Shows React, Node, Python, MediaPipe
    │   ├── Testimonials.js   # Reviews from drivers
    │   ├── CTA.js            # "Start Monitoring" button
    │   ├── Footer.js         # Bottom links
    │   └── Navbar.js         # Top navigation bar
    └── hooks/
        └── useScrollReveal.js # Makes sections appear when you scroll
```

**What each file does:** Every component is a small part of the landing page. For example, `Hero.js` shows the big title and button. `Features.js` shows why VigilEye is good.

---

## 2. Driver App (`driver-app/`)

This is for the driver. It shows the camera, Eye/Mouth scores, and alerts. It runs on port 3000.

```
driver-app/
├── package.json              # Tools: react, react-webcam, socket.io, axios
├── public/
│   ├── index.html            # HTML
│   └── face_landmarker.task  # MediaPipe face model (3.6 MB) - finds face points
├── src/
│   ├── App.js                # Routes: /login, /register, /dashboard
│   ├── index.js              # Starts React
│   ├── components/
│   │   ├── VideoFeed.js      # MOST IMPORTANT - camera, EAR/MAR, PERCLOS, 500ms detection, 8s calibration
│   │   ├── AlertPanel.js     # Shows alerts, countdown 3s, accept 2s, alarm 10s
│   │   ├── Navbar.js         # Top bar with VigilEye logo
│   │   ├── ProtectedRoute.js # Stops non-logged users
│   │   └── LoadingOverlay.js # Shows "Calibrating... 8..0"
│   ├── pages/
│   │   ├── Login.js          # Driver login form
│   │   ├── Register.js       # Collects name, email, phone, Aadhaar, license, vehicle
│   │   └── Dashboard.js      # Main page - VideoFeed + 4 stat cards + Alerts + hourly
│   ├── context/
│   │   ├── AuthContext.js    # Remembers who is logged in (token)
│   │   └── SocketContext.js  # Connects to backend for live warnings
│   ├── services/
│   │   ├── api.js            # All API calls: login, dashboard, detection, alerts
│   │   └── socket.js         # Socket.IO connection to backend
│   └── utils/
│       └── alarm.js          # Plays loud siren sound with Web Audio
```

**Key file:** `VideoFeed.js` does 4 things: 1) Captures webcam 640x480, 2) Sends to ML API 5002 every 500ms, 3) Shows EAR/MAR/PERCLOS bars, 4) Handles 8s calibration with personal thresholds.

---

## 3. Admin App (`admin-app/`)

This is for the fleet manager. It sees all drivers, alerts, and reports. It runs on port 3001.

```
admin-app/
├── package.json              # Tools: react, socket, axios (no recharts - lightweight)
├── src/
│   ├── App.js                # Routes: /admin/login, /admin/dashboard, /admin/drivers, /admin/alerts, /admin/reports
│   ├── index.js
│   ├── components/
│   │   ├── Navbar.js         # Top bar for admin
│   │   ├── StatCard.js       # Small card showing numbers
│   │   ├── AlertBadge.js     # Colored badge for severity
│   │   ├── LoadingOverlay.js # Loading screen
│   │   └── ProtectedRoute.js # Only admin can enter
│   ├── pages/
│   │   ├── Login.js          # Admin login (admin@example.com)
│   │   ├── Dashboard.js      # Shows total drivers, alerts, risk distribution, high-risk drivers
│   │   ├── Drivers.js        # List of all drivers with SDS and risk
│   │   ├── DriverDetail.js   # One driver's sessions, alerts, stats
│   │   ├── Alerts.js         # All alerts with filter by severity and date
│   │   └── Reports.js        # Session reports
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── SocketContext.js  # Joins admin-room to get live alerts
│   └── services/
│       ├── api.js            # Calls /admin/* APIs
│       └── socket.js
```

---

## 4. Backend (`backend/`)

This is the Node.js server. It connects frontend, ML, and database. It runs on port 5001.

```
backend/
├── package.json              # Tools: express, mongoose, socket.io, bcrypt, jwt, cors, dotenv
├── .env                      # Secrets: PORT=5001, MONGODB_URI, JWT_SECRET (not in git)
├── .env.example              # Example of .env for new developers
├── server.js                 # Main server - creates Express + Socket.IO, connects MongoDB, sets CORS
├── seed.js                   # Creates 1 admin + 3 demo drivers
├── middleware/
│   └── auth.js               # Checks JWT token, allows only logged users, adminOnly check
├── models/
│   ├── User.js               # Driver/Admin: name, email, password (hashed), phone, Aadhaar, license, vehicle
│   ├── Alert.js              # Alert: driver, type (yawning etc), severity, message, isAcknowledged, isEscalated, timestamp, TTL 7 days
│   ├── DetectionLog.js       # One per frame: driver, status, confidence, EAR, MAR, pitch, yaw, timestamp, TTL 7 days
│   └── DriverSession.js      # Session: driver, startTime, endTime, duration, SDS scores, sdsHistory 100, riskLevel, counts, TTL 30 days
├── routes/
│   ├── auth.js               # POST /api/auth/login, /register, GET /me
│   ├── driver.js             # MOST IMPORTANT: GET /dashboard, POST /detection (creates log, SDS, alert), POST /session/start|end, GET /sessions, /sds-trend
│   ├── admin.js              # GET /admin/drivers, /drivers/:id, /alerts, /dashboard (fleet stats)
│   ├── alert.js              # GET /alerts, PUT /:id/acknowledge, /escalate (to admin)
│   └── report.js             # GET /reports/summary
└── utils/
    └── scoring.js            # Calculates SDS (0-100), severity, riskLevel - simple math, no AI
```

**Key file:** `driver.js` `POST /detection` is the heart. It gets `status, confidence, EAR, MAR` from frontend, saves `DetectionLog`, finds `activeSession`, calculates `SDS` with `computeSDS`, decides `severity`, creates `Alert` if `confidence >8`, emits `warning` to driver via Socket.IO.

---

## 5. ML (`vigiley-ml/`)

This is Python + MediaPipe. It sees the face and says drowsy or awake. It runs on port 5002.

```
vigiley-ml/
├── api.py                    # FastAPI server: POST /predict (gets base64 image, returns status), GET /health, POST /reset, GET /thresholds
├── feature_extraction.py     # Uses MediaPipe FaceLandmarker (468 points) to calc EAR, MAR, head pose, PERCLOS
├── model.py                  # Thresholds + state machine: EAR 0.24, MAR 0.44, frames 6/8/2, smoothing, yawn/close counters
├── train.py                  # Trains/evaluates thresholds on NTHU-DDD dataset (or synthetic if no data)
├── face_landmarker.task      # MediaPipe model file (3.6 MB) - must be present
├── datasets/
│   └── features.npz          # 205 KB - real features from NTHU-DDD, used by train.py
├── requirements.txt          # mediapipe, opencv, numpy, fastapi, uvicorn, pydantic (lightweight, no socketio)
├── runtime.txt               # python-3.11.11
├── run.sh                    # ./run.sh to start ML API
└── venv/                     # Python virtual env (not in git, 400 MB)
```

**Key file:** `model.py` has all thresholds. `api.py` `POST /predict` decodes base64, resizes to 640, calls `FeatureExtractor.extract()` to get EAR/MAR, then `DrowsinessDetector.predict_frame()` to get `status` (`awake`, `yawning`, `eyes_closed`, `drowsy`, `critical` etc) and `confidence`, plus `perclos`.

**Other files deleted for lightweight:** `dataset.py`, `demo.py`, `build_real_dataset.py`, `websocket_client.py`, `model/classifier.pkl` (all were dead code, not used at runtime).

---

## 6. Root

```
VigilEye/
├── package.json              # Has scripts: install:all, dev:backend, dev:driver, dev:admin, dev:landing, build:*
├── start.sh                  # Starts all 5 services at once and checks ports
└── important_files/          # This folder - all docs you are reading
    ├── folder-structure.md   # This file
    ├── pipeline.md           # Full pipeline - step by step flow
    ├── architecture.md       # Full architecture - parts and why
    ├── frontend/
    │   └── frontend-structure.md
    ├── backend/
    │   └── backend-structure.md
    └── model/
        ├── model-structure.md
        └── model-details.md  # Dataset, calibration, presentation notes
```

Every small file is listed. Nothing is hidden. A beginner can open any folder and know what is inside.
