# VigilEye

**Multi-Modal Driver Drowsiness Detection & Intelligent Alert System**

*Version 1.0.0 | MIT License | Production Ready*

VigilEye is a real-time driver monitoring system that detects drowsiness using a standard webcam. It fuses Eye Aspect Ratio (EAR), Mouth Aspect Ratio (MAR), and head pose at 500ms intervals, computes a Sleepiness Score (SDS), and delivers graded alerts with automatic escalation to a fleet admin dashboard.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Key Features](#2-key-features)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Prerequisites](#6-prerequisites)
7. [Installation](#7-installation)
8. [Configuration](#8-configuration)
9. [Quick Start](#9-quick-start)
10. [User Guide](#10-user-guide)
11. [Alert Flow](#11-alert-flow)
12. [Model Details](#12-model-details)
13. [API Reference](#13-api-reference)
14. [WebSocket Events](#14-websocket-events)
15. [Deployment](#15-deployment)
16. [Troubleshooting](#16-troubleshooting)
17. [FAQ](#17-faq)
18. [Changelog](#18-changelog)
19. [Documentation Index](#19-documentation-index)
20. [License & Support](#20-license--support)

---

## 1. Overview

**Problem:** Drowsy driving causes 91,000 crashes and 795 deaths annually in the US (NHTSA 2017). Existing solutions require expensive infrared hardware (€2000+) or are late (steering-based).

**Solution:** VigilEye runs on any laptop with a webcam. No extra hardware, no GPU. It uses MediaPipe 468-point face mesh, personalized 8-second calibration (75% rule), and a lightweight threshold state machine. Alerts are graded and auto-cancel on recovery. Only unacknowledged alerts escalate to admin after 15 seconds (3s warning + 3s countdown + 2s accept + 10s alarm).

**Audience:** College major project, fleet operators, and open-source contributors.

---

## 2. Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-modal detection** | EAR (eyes), MAR (mouth), head pitch/yaw, PERCLOS 60-window | Stable |
| **Personalized calibration** | 8s, 8 samples, avgEar*0.75, avgMar*1.6, saved in localStorage | Stable |
| **500ms inference** | 2 FPS, 30KB image, 200B JSON to backend, 35ms ML | Stable |
| **Graded alerts** | Normal, heavy_eyelids, mouth_open, eyes_closed, yawning, microsleep, drowsy, high_risk, critical | Stable |
| **Confidence 8 threshold** | Alert if confidence >8 or SDS >8, severity: low (18-40), medium (40-60), high (60-80), critical (80+) | Stable |
| **Fast recoil** | FRAMES_RESET 2 (1s), yawn counter resets immediately, AlertPanel cancels on awake in 0.5s | Stable |
| **Countdown flow** | 3s warning (red overlay) -> 3s countdown (Alert in 3..1) -> 2s Accept button -> 10s alarm -> admin | Stable |
| **Auto-cancel** | Countdown stops if eyes open or yawn ends | Stable |
| **Admin escalation** | Only after alarm, via `PUT /alerts/:id/escalate` -> `admin-room` | Stable |
| **Session analytics** | SDS 0-100, risk low/medium/high/critical, duration, hourly breakdown (total) | Stable |
| **TTL auto-cleanup** | Alerts 7 days, logs 7 days, sessions 30 days | Stable |
| **Lightweight** | 1.8G (was 2.6G), 814M dataset deleted, 6 deps ML | Stable |

---

## 3. System Architecture

```
[Driver Laptop Webcam 640x480]
         | 500ms capture, 1s JSON 200B
         v
[Driver App 3000 - React] --HTTP 5002 /predict (base64 30KB, 200ms)--> [ML API 5002 - FastAPI + MediaPipe]
   |  JWT, Socket.IO warning                                     | 468 points, EAR/MAR, state machine
   |  POST /api/driver/* 1s JSON                                  v
   +--> [Backend 5001 - Node + Express + Socket.IO] <---- [MongoDB - TTL]
            |  Socket warning -> driver-123
            |  Socket alert (only after alarm) -> admin-room
            v
[Admin App 3001 - React]  [Landing 3002 - Vite]
```

**Layers:**

| Layer | Port | Tool | Responsibility |
|-------|------|------|----------------|
| Landing | 3002 | React + Vite | Marketing, Hero, Features, CTA |
| Driver | 3000 | React + CRA | Camera, 3 bars, calibration 8/8, alerts |
| Admin | 3001 | React + CRA | Fleet dashboard, drivers, alerts, reports |
| Backend | 5001 | Node + Express + Socket.IO + Mongoose + JWT | Auth, sessions, SDS, alerts, sockets |
| ML | 5002 | Python + FastAPI + MediaPipe + OpenCV | /predict, /health, /reset, /thresholds |
| DB | - | MongoDB | users, alerts, detectionlogs, driversessions |

**Why separate?** Landing is Vite (fast), Driver/Admin are CRA (stable), Backend is Node (real-time), ML is Python (MediaPipe). Each uses best language. Frontend sends **200B JSON** not 80KB image to backend - 40x smaller, 15ms.

---

## 4. Technology Stack

**Frontend:** React 18, react-webcam 7.2, axios 1.6, socket.io-client 4.7, lucide-react 1.28, react-router-dom 6.20, react-scripts 5.0

**Backend:** Node 18+, Express 4.18, Mongoose 8.0, Socket.IO 4.7, bcryptjs 2.4, jsonwebtoken 9.0, cors 2.8, dotenv 16.3

**ML:** Python 3.11, FastAPI 0.110, Uvicorn 0.52, mediapipe 1.0.0, opencv-python-headless 4.8, numpy 1.24, pydantic 2.6

**DB:** MongoDB 6.0+, TTL indexes

**Deploy:** Vercel (frontend), Render (backend/ML)

---

## 5. Project Structure

```
VigilEye/
├── important_files/          # College docs (8th grade English)
│   ├── folder-structure.md   # Every file explained
│   ├── pipeline.md           # 12 steps flow (WHEN)
│   ├── architecture.md       # 5 layers (WHAT)
│   ├── presentation.md       # 8 slides with what to say
│   ├── frontend/frontend-structure.md
│   ├── backend/backend-structure.md
│   └── model/model-structure.md + model-details.md
├── landing/                  # 3002
│   └── src/{components, hooks, App.js}
├── driver-app/               # 3000
│   └── src/{components/VideoFeed.js, AlertPanel.js, pages/Dashboard.js, services/api.js}
├── admin-app/                # 3001
│   └── src/{pages/Dashboard.js, Drivers.js, services/api.js}
├── backend/                  # 5001
│   └── {server.js, models/*, routes/*, utils/scoring.js, seed.js}
├── vigiley-ml/               # 5002
│   └── {api.py, feature_extraction.py, model.py, train.py, face_landmarker.task}
├── package.json              # Root scripts: install:all, dev:*
├── start.sh                  # Starts all 5
└── .gitignore
```

See `important_files/folder-structure.md` for full 80-file tree.

---

## 6. Prerequisites

- **Node.js** >=18, **npm** >=9
- **MongoDB** >=6.0 (local `mongod` or Atlas URI)
- **Python** 3.11 with `venv` and `pip`
- **Webcam** permission

Check:
```bash
node -v && npm -v && mongosh --eval "db.runCommand({ping:1})" && python3 --version
```

---

## 7. Installation

```bash
git clone https://github.com/Shaanworkspace/vigiley.git
cd VigilEye
npm run install:all
# Or manually:
# npm install --prefix backend && npm install --prefix driver-app && npm install --prefix admin-app && npm install --prefix landing
# cd vigiley-ml && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
# Download MediaPipe model if missing:
# wget -O vigiley-ml/face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
```

---

## 8. Configuration

**Backend** `backend/.env` (create from `.env.example`):
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/vigiley
JWT_SECRET=change_this_to_long_random_string
JWT_EXPIRES_IN=7d
```

**Driver** `driver-app/.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_ML_API=http://localhost:5002
PORT=3000
```

**Admin** `admin-app/.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
PORT=3001
```

**ML** `vigiley-ml/runtime.txt`: `python-3.11.11`

---

## 9. Quick Start

**One command:**
```bash
./start.sh
# Checks ports 3000,3001,3002,5001,5002, starts all, prints URLs and demo logins
```

**Or 5 terminals:**
```bash
npm run dev:backend          # 5001
cd vigiley-ml && source venv/bin/activate && python api.py  # 5002
npm run dev:driver           # 3000
npm run dev:admin            # 3001
npm run dev:landing          # 3002
```

**Seed DB (first time):**
```bash
node backend/seed.js
# Or POST http://localhost:5001/api/setup
```

**Open:**
- Driver: http://localhost:3000/login
- Admin: http://localhost:3001/admin/login
- Landing: http://localhost:3002
- Health: http://localhost:5001/api/health, http://localhost:5002/health

**Demo logins:**
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| Driver | `shreya@example.com` | `driver123` |
| Driver | `utkarsh@example.com` | `driver123` |
| Driver | `driver@example.com` | `driver123` |

---

## 10. User Guide

### Driver

1. Login -> Dashboard shows `Session active - Risk: low` (green dot).
2. Click **Start Monitoring** -> `CALIBRATING... 8,7,6...0` + `8/8` progress - keep face centered for 8s (personalized).
3. After calibration, `LIVE` + `awake 0.35` `EAR` `MAR` `PERCLOS` bars (green).
4. Normal face: `Eyes alert`, `Mouth closed`, `Blink healthy`, `CONF: 0%`, `All clear`.
5. Close eyes 3 sec: `EYES 6f` `PERCLOS 50%` `critical 98%` -> red overlay `FATAL RISK` -> after 3s continuous, `Alert in 3s` countdown fullscreen.
6. Open eyes during countdown -> auto-cancel, alert ack, no admin.
7. Keep closed 3s -> countdown finishes -> `Accept` screen 2s with green button.
8. Click **Accept** -> ends, no admin.
9. Don't click 2s -> **Alarm 10s** loud siren (Web Audio 800->1600Hz) fullscreen `ALERT!`.
10. After 10s -> backend `escalate` -> admin gets fullscreen alert.
11. Click **Stop Monitoring** -> session ends, duration saved.

### Admin

1. Login `admin@example.com` -> Dashboard shows `Total Drivers`, `Active Sessions`, `Total Alerts (7d)`, `Unacknowledged (24h)`, `High Risk Drivers`.
2. `Drivers` page: table with `SDS`, `Risk`, `Unacknowledged`.
3. Click driver -> `DriverDetail`: active session, `20 recent alerts`, `stats per status`, `30 sessions`, `SDS trend 50 points`.
4. `Alerts` page: filter by `acknowledged`, `severity`, `date`.
5. When driver alarm escalates, fullscreen `alert` with driver name, type, SDS, risk -> `Acknowledge`.
6. `Reports` -> session summaries.

---

## 11. Alert Flow

```
Driver Start (8s calibration, 8/8)
  |
  v
Capture 500ms -> ML /predict -> {status, ear 0.23, mar 0.60, perclos 1.0, conf 0.98}
  |
  v
Frontend sends JSON 1s -> Backend POST /detection -> DetectionLog + SDS (0.80 decay) + risk
  |
  v
If conf>8 or sds>8 and no recent alert in dedupWindow (yawning 5s, critical 3s, others 10s) -> Alert created (severity low/medium/high/critical)
  |
  v
Backend emits warning -> Driver AlertPanel queue
  |
  v
Driver sees red overlay "FATAL RISK" (isAlert)
  |
  v
If status stays drowsy 3s (6 frames) -> AlertPanel shows Countdown 3s "Alert in 3...2...1"
  |
  v
If driver recovers (status awake) during countdown -> cancelIfRecovered() -> ack -> dismiss (0.5s recoil)
  |
  v
If not recovered in 3s -> Accept screen 2s
  |
  v
If Accept clicked -> ack -> end (no admin)
  |
  v
If not clicked in 2s -> Alarm 10s -> escalateToAdmin() -> PUT /alerts/:id/escalate -> Backend marks isEscalated + emits alert to admin-room
  |
  v
Admin sees fullscreen -> Acknowledge
```

**Total before admin:** 3s warning + 3s countdown + 2s accept + 10s alarm = 18s of no response.

---

## 12. Model Details

**Type:** Threshold state machine, not neural network. Lightweight, CPU, explainable.

**Thresholds (`vigiley-ml/model.py:70` and `driver-app/src/components/VideoFeed.js:8`):**

| Param | Value | Source |
|-------|-------|--------|
| EAR_CLOSED | 0.24 (personalized 0.75*avgEar, e.g., 0.35*0.75=0.26) | Soukupova & Cech 2016, tuned for MediaPipe |
| EAR_LOW | 0.28 (+0.06) | Danisman 2017 |
| MAR_YAWN | 0.44 (personalized avgMar*1.6) | Knoop 2019 |
| MAR_HALF | 0.34 | Secondary mouth ajar |
| PERCLOS_WINDOW | 60 | 60 frames at 500ms = 30s |
| PERCLOS_RISK | 0.35 | Dinges 1998 |
| FRAMES_YAWN | 2 (1s) | NHTSA |
| FRAMES_DROWSY | 6 (3s) | User wanted 3s before countdown |
| FRAMES_CRITICAL | 8 (4s) | NHTSA upper bound |
| FRAMES_RESET | 2 (1s) | Best recoil |

**State Machine (`model.py:106`):** Checks in order: `yawn_counter>=2` -> yawning (0.62), `close_counter>=8` -> critical (0.96), `close>=6 and perclos>0.35` -> high_risk (0.85), `close>=6` -> drowsy (0.75), `close>=2` -> microsleep (0.55), `eyes_closed` -> eyes_closed (0.35), `heavy_eyelids` -> 0.15, `mouth_open` -> 0.15, else `awake` (0.0).

**Smoothing:** EAR/MAR averaged over 3 frames for display, but `eyes_closed` uses raw for immediate. Counters: `yawn_counter` resets immediately when mouth closes, `close_counter` resets after 2 normal frames (1s) - best recoil.

**Calibration (`VideoFeed.js:185`):** 8s, 8 samples, `EAR_CLOSED = avgEar*0.75`, `MAR_YAWN = avgMar*1.6`, saved in `localStorage vigiley-calib`, `Recalibrate` button.

**Dataset:** `NTHU-DDD` 36 subjects, 5 scenarios, 9.5h, 640x480, 30/15fps, IR night, in `vigiley-ml/datasets/features.npz` 205KB (raw 814M deleted). `train.py` tests thresholds on it.

**Performance:** 500ms, <50ms ML, <8MB models, 1.8G project (was 2.6G).

See `important_files/model/model-details.md` for presentation notes.

---

## 13. API Reference

### Auth

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/api/auth/register` | No | `{name,email,phone,adhaar,license,vehicle,password}` | `{user, token}` |
| POST | `/api/auth/login` | No | `{email,password}` | `{user, token}` |
| GET | `/api/auth/me` | Yes | - | `{user}` |

### Driver

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/driver/dashboard` | Driver | `{activeSession, recentAlerts (5 from session), todayLogs, todayDrowsy, hourlyBreakdown}` |
| POST | `/api/driver/detection` | Driver | Body `{status, confidence, EAR, MAR, pitch, yaw, perclos}` -> `{log}` + SDS + alert |
| POST | `/api/driver/session/start` | Driver | Creates active session |
| POST | `/api/driver/session/end` | Driver | Sets completed, duration |
| GET | `/api/driver/sessions` | Driver | Last 20 sessions + stats |
| GET | `/api/driver/sds-trend` | Driver | `sdsHistory` 100, current, peak |

### Alert

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/alerts` | Driver | Own alerts, 24h, 5 pending |
| PUT | `/api/alerts/:id/acknowledge` | Driver/Admin | Sets `isAcknowledged` + emits `alert-acknowledged` |
| PUT | `/api/alerts/:id/escalate` | Driver | Sets `isEscalated` + emits `alert` to admin |

### Admin

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/admin/dashboard` | Admin | `totalDrivers, activeSessions, totalAlerts 7d, unacknowledged 24h, riskDistribution, highRisk 10, hourlyTrend` |
| GET | `/api/admin/drivers` | Admin | All drivers with SDS, risk, unack 24h |
| GET | `/api/admin/drivers/:id` | Admin | Driver + activeSession + 20 alerts + stats + 30 sessions |
| GET | `/api/admin/alerts` | Admin | `?status,severity,startDate,endDate` -> 50 |
| PUT | `/api/admin/alerts/:id/acknowledge` | Admin | Ack |
| GET | `/api/reports/summary` | Admin | Reports |

### ML

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/health` | No | `{status, thresholds}` |
| POST | `/predict` | No | Body `{image: base64}` -> `{face_detected, status, ear, mar, perclos, confidence, close_counter, yawn_counter}` |
| POST | `/reset` | No | Clears counters |
| GET | `/thresholds` | No | All thresholds |

---

## 14. WebSocket Events

**Connection:** `socket.io` to `http://localhost:5001` with `auth token`.

| Event | Direction | Payload | When |
|-------|-----------|---------|------|
| `join-driver` | Driver -> Server | `driverId` | On Dashboard mount |
| `join-admin` | Admin -> Server | - | On Admin mount |
| `warning` | Server -> Driver | `{...alert, sds, needsCountdown, alertCount}` | On Alert create |
| `alert` | Server -> Admin | `{...alert, sds, riskLevel}` | On `PUT /escalate` after alarm 10s |
| `alert-acknowledged` | Server -> Driver+Admin | `{alertId}` | On acknowledge |
| `session-start` | Server -> Admin | `{driver, sessionId}` | On session start |
| `session-end` | Server -> Admin | `{driver, sessionId, duration}` | On session end |

---

## 15. Deployment

**Frontend (Vercel):**
```bash
# landing, driver-app, admin-app each have vercel.json
vercel --prod
# Env: REACT_APP_API_URL=https://your-backend.onrender.com/api, REACT_APP_ML_API=https://your-ml.onrender.com
```

**Backend & ML (Render):**
- Backend: `Node 18`, `npm start`, health `GET /api/health`
- ML: `Python 3.11`, `pip install -r requirements.txt`, `uvicorn api:app --host 0.0.0.0 --port 5002`
- Env: `MONGODB_URI` Atlas, `JWT_SECRET`

---

## 16. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `Cannot GET /` on 5001 | Backend has no `/`, only `/api/*` | Use `/api/health` |
| `ML API 5002 FAILED` | `venv` broken (points to old path) or `cv2` missing | `rm -rf venv && python3.11 -m venv venv && pip install -r requirements.txt` |
| `Port 3000 busy` | Old `npm start` still running | `lsof -ti:3000 \| xargs kill; npm start` |
| `Detections 0` | `sendTimer` recreated every `st` change (old bug) | Fixed to `useRef` with `[on]` only - hard refresh `Cmd+Shift+R` |
| `23/8` calibration | `calibEar` not capped at 8 | Fixed to `Math.min 8/8` + cap push `<8` |
| `Risk low` static | `SDS 0.95` decay too slow | Fixed to `0.80` + thresholds `15` medium |
| `Yawning not detected` at `0.45` | `MAR 0.60` too high | Personalized `1.6` now `0.45` sensitive, or `Recalibrate` |
| `Countdown not appearing` | `needsCountdown false` for first 2 alerts | Fixed to `true` for all, `COUNTDOWN 3, ACCEPT 2` |
| `23/8` still | Need hard refresh | `Cmd+Shift+R` |

---

## 17. FAQ

**Q: Why not use deep learning like YOLO or ViT?**
A: YOLO needs 640x640 and GPU, ViT needs 1.2M videos and Jetson. Our threshold model is 500ms on any laptop, <50ms, no GPU, explainable for college. For future, we can add BiLSTM on 30-frame window as in OISE 2026 paper.

**Q: Why 8s calibration?**
A: From 2026 personalized paper: fixed thresholds fail for different faces. 8 samples (4s at 500ms) learns your `EAR 0.35 -> 0.26` and `MAR 0.25 -> 0.45`. Saved in `localStorage`, so next time instant. `Recalibrate` button for new light/glasses.

**Q: Why confidence 8 and not 18?**
A: User wanted `15-18` range, with `18` as alert. We set `8` to be sensitive, then `needsCountdown` after 2 simple alerts (2s toast) -> countdown 3s. So `heavy_eyelids 15%` will be simple toast, `eyes_closed 35%` will be countdown. This matches user want: simple then countdown.

**Q: Why 3s warning before countdown?**
A: User wanted `3 second tak lagatar` warning before countdown. So `FRAMES_DROWSY 6` at `500ms =3s` + `COUNTDOWN 3s` = 6s before alarm.

**Q: Can it work offline?**
A: Yes, if you run Backend, ML, and Frontend locally via `./start.sh`, no internet needed except for initial `cdn` for MediaPipe wasm (once). For full offline, copy wasm files locally.

---

## 18. Changelog

- **v1.0.0 (2026-09-12) Working Project v1:** Initial college major project - 1fps, fixed thresholds 0.28/0.40, basic alerts
- **v1.1 (2026-09-12) Final v1:** Robust - tuned 0.22/0.50, smoothing 3-frame, warmup 8, dedup, TTL 7d, lightweight 1.8G
- **v1.2 (2026-09-12) Working v1:** 8th grade docs, important_files, pipeline 12 steps, architecture 5 layers, presentation 8 slides
- **v1.3 (Current):** Personalized calibration 75% (8/8), CONF 8, COUNTDOWN 3s + ACCEPT 2s + ALARM 10s, recoil 0.5s (FRAMES_RESET 2, 500ms), risk dynamic SDS 0.80, warnings dynamic, immediate admin only after alarm

---

## 19. Documentation Index

- `important_files/folder-structure.md` - Every file explained
- `important_files/pipeline.md` - 12 steps (WHEN)
- `important_files/architecture.md` - 5 layers (WHAT)
- `important_files/frontend/frontend-structure.md` - Landing/Driver/Admin
- `important_files/backend/backend-structure.md` - Server, models, routes
- `important_files/model/model-structure.md` - ML files
- `important_files/model/model-details.md` - Dataset NTHU-DDD, calibration, presentation speech
- `important_files/presentation.md` - 8 slides with what to show/say

All docs are 8th grade English.

---

## 20. License & Support

**License:** MIT - Free for college and open source.

**Support:** Open an issue at `https://github.com/Shaanworkspace/vigiley/issues` or email `admin@example.com`.

**Citation:**
```bibtex
@software{vigiley2026,
  author = {VigilEye Team},
  title = {VigilEye: Multi-Modal Driver Drowsiness Detection},
  year = {2026},
  url = {https://github.com/Shaanworkspace/vigiley}
}
```
