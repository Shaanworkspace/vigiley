# VigilEye

**Multi-Modal Driver Drowsiness Detection & Intelligent Alert System**

[![Patent Pending](https://img.shields.io/badge/Patent-Pending-orange)](PATENT.md)
[![Research](https://img.shields.io/badge/Research-94.7%25_Accuracy-blue)](RESEARCH.md)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

VigilEye is a driver drowsiness detection system that works with a standard webcam. It fuses Eye Aspect Ratio (EAR), Mouth Aspect Ratio (MAR), and head pose into a single detection stream, classifies the driver's state at 1 frame per second, and raises severity-graded alerts. When the driver does not respond, the alert escalates to an admin fleet dashboard in real time over WebSocket.

---

## Table of Contents

1. [Live Demo](#live-demo)
2. [Features](#features)
3. [How the Alert Flow Works](#how-the-alert-flow-works)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [Local Setup](#local-setup)
7. [Run Everything at Once](#run-everything-at-once)
8. [Project Structure](#project-structure)
9. [API Endpoints](#api-endpoints)
10. [Demo Walkthrough (step by step)](#demo-walkthrough-step-by-step)
11. [Research & Patent](#research--patent)
12. [License](#license)
13. [Citation](#citation)

---

## Live Demo

All apps below are deployed and running. No setup needed to try them.

| App | Link |
|-----|------|
| Landing page | https://vigileye-landing.vercel.app |
| Driver app (login) | https://vigileye-driver.vercel.app/login |
| Driver app (register) | https://vigileye-driver.vercel.app/register |
| Admin app | https://vigileye-admin.vercel.app/admin/login |
| ML API | https://vigiley-ml.onrender.com |
| Source code | https://github.com/Shaanworkspace/vigiley |

**Demo accounts**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| Driver 1 | `utkarsh@example.com` | `driver123` |
| Driver 2 | `shreya@example.com` | `driver123` |
| Driver 3 | `shaan@example.com` | `driver123` |

To try the full flow, open the driver app and the admin app in two separate browser profiles or one normal + one incognito window, then log in with the accounts above. The driver app needs webcam permission.

---

## Features

| Feature | Description |
|---------|-------------|
| Multi-modal detection | EAR, MAR, and head pose combined in one model |
| 1 fps lightweight inference | Runs on a laptop browser, no GPU needed |
| Severity grading | Normal, low, medium, high, critical |
| Driver countdown | 5s countdown after drowsiness is detected |
| Auto-cancel on recovery | Countdown stops if the driver returns to normal |
| Accept / escalation | Driver accepts, or a loud alarm rings after 10s |
| Admin escalation | Admin is notified only if the driver does not respond |
| Full-screen alerts | Overlays cover the whole screen on mobile and desktop |
| Mobile friendly | Driver view shows camera only; admin view is responsive |
| Session analytics | SDS score, risk level, duration, hourly breakdown |
| Registration | Collects name, email, phone, Aadhaar, license, vehicle |

---

## How the Alert Flow Works

This is the exact end-to-end sequence the system follows:

1. The driver opens the driver app and presses **Start Monitoring**.
2. Every second, the browser captures a frame and sends it to the ML API (`/predict`).
3. The ML API returns `status`, `ear`, `mar`, `pitch`, `yaw`, `confidence`, and `perclos`.
4. The backend stores a detection log and updates the session's SDS score.
5. If the state is alert-worthy (drowsy, eyes closed, yawning, critical), the backend creates an Alert and sends a `warning` event to the driver over Socket.IO.
6. The driver app shows a **5-second countdown** (Alert in 5...4...3...).
   - If the driver's eyes open or the yawn ends, the countdown **cancels** and the alert is auto-acknowledged. No admin notification.
7. If the countdown completes, the driver app shows an **Accept screen** with a 5-second timer.
8. If the driver presses **Accept**, the alert is acknowledged and the flow ends. The admin is never notified.
9. If the driver does not accept, a **loud alarm rings** on the full screen.
10. After **10 seconds of alarm** with no response, the backend marks the alert escalated and emits an `alert` event to the admin room.
11. The admin dashboard shows a **full-screen alert** with the driver's name, type, severity, and SDS score.
12. The admin acknowledges and the alert is logged for reports.

Normal (non-escalated) alerts never reach the admin. The admin is only notified when the driver genuinely does not respond.

---

## Architecture

```
Camera frame (browser, every 1s)
          │
          ▼
 ML API (Flask, Render / local :5002)
   │  status, ear, mar, pitch, yaw, confidence, perclos
   ▼
 Backend API + Socket.IO (Node, :5001)
   │  creates Alert, updates SDS, emits warning / alert
   ├──────────────┬───────────────────┐
   ▼              ▼                   ▼
 Driver app    Admin app            MongoDB
 (React :3000)  (React :3001)        (detections, alerts,
                                      sessions, users)
```

| Layer | Tech | Port |
|-------|------|------|
| Landing page | React (Vite) | 3002 |
| Driver app | React (CRA) | 3000 |
| Admin app | React (CRA) | 3001 |
| Backend API + WebSocket | Node.js + Express + Socket.IO | 5001 |
| ML API | Python + Flask + MediaPipe | 5002 |
| Database | MongoDB | — |

---

## Tech Stack

- **Frontend:** React, react-webcam, axios, socket.io-client, lucide-react
- **Backend:** Node.js, Express, Mongoose, Socket.IO, bcryptjs, JWT
- **Machine learning:** Python, Flask, MediaPipe face landmarks, OpenCV
- **Database:** MongoDB
- **Deployment:** Vercel (landing, driver, admin), Render (backend, ML API)

---

## Local Setup

### Prerequisites

- Node.js >= 18
- npm >= 9
- MongoDB >= 6.0 (running locally or a remote URI)
- Python 3.9+ with pip (only for the ML API)

### 1. Clone and install

```bash
git clone https://github.com/Shaanworkspace/vigiley.git
cd vigiley
npm run install:all
```

### 2. Configure the backend

Copy `backend/.env.example` (or create `backend/.env`):

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/vigiley
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Configure the ML API

The ML API reads frames and returns detection results.

```bash
cd vigiley-ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Download the MediaPipe face landmarker model if not present:

```bash
wget -O face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
```

### 4. Seed the database

```bash
node backend/seed.js
```

This creates the admin account and the three demo drivers listed in the [Live Demo](#live-demo) section.

### 5. Run each app

Open 5 terminals (or run `./start.sh`):

```bash
# Terminal 1 — Backend (port 5001)
npm run dev:backend

# Terminal 2 — ML API (port 5002)
cd vigiley-ml && source venv/bin/activate && python api.py

# Terminal 3 — Driver app (port 3000)
npm run dev:driver

# Terminal 4 — Admin app (port 3001)
npm run dev:admin

# Terminal 5 — Landing page (port 3002)
npm run dev:landing
```

Then open:

- Driver: http://localhost:3000
- Admin: http://localhost:3001
- Landing: http://localhost:3002
- Backend health check: http://localhost:5001/api/health
- ML health check: http://localhost:5002/health

---

## Run Everything at Once

A convenience script starts all five services and checks their ports:

```bash
./start.sh
```

It prints the URLs and login credentials when done. Stop everything with `Ctrl+C` or by killing the processes (the script runs services in the background and writes logs to `/tmp/*.log`).

---

## Project Structure

```
vigiley/
├── landing/              # Landing page (React + Vite)
│   └── src/
│       ├── components/   # Hero, Features, CTA, Navbar, Footer
│       └── App.js
├── driver-app/           # Driver dashboard (React + CRA)
│   └── src/
│       ├── pages/        # Login, Register, Dashboard
│       ├── components/   # VideoFeed, AlertPanel, Navbar
│       ├── context/      # AuthContext, SocketContext
│       ├── services/     # api.js, socket.js
│       └── utils/        # alarm.js (Web Audio siren)
├── admin-app/            # Admin fleet dashboard (React + CRA)
│   └── src/
│       ├── pages/        # Dashboard, Drivers, Alerts, Reports, DriverDetail
│       ├── components/   # Navbar, StatCard, AlertBadge, LoadingOverlay
│       └── context/      # AuthContext, SocketContext
├── backend/              # Node.js + Express + Socket.IO + MongoDB
│   ├── models/           # User, Alert, DetectionLog, DriverSession
│   ├── routes/           # auth, driver, admin, alert
│   ├── middleware/       # auth (JWT), admin guard, rate limiter
│   ├── utils/            # scoring (SDS, severity, risk)
│   ├── server.js         # API + WebSocket server
│   └── seed.js           # Seeder for demo users
├── vigiley-ml/           # Python ML API
│   ├── api.py            # Flask endpoints (/predict, /health, /reset)
│   ├── model.py          # DrowsinessDetector, thresholds, state machine
│   ├── feature_extraction.py  # EAR, MAR, head pose, PERCLOS
│   ├── face_landmarker.task   # MediaPipe model
│   └── requirements.txt
├── YOUTUBE_DEMO_SCRIPT.md  # Shot-by-shot demo video script
├── RESEARCH.md            # Research documentation
├── PATENT.md              # Patent documentation
└── README.md              # This file
```

---

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | no | Create a driver account |
| POST | `/api/auth/login` | no | Login, returns JWT |
| GET | `/api/auth/me` | yes | Current user |
| POST | `/api/driver/detection` | driver | Send a detection frame result |
| POST | `/api/driver/session/start` | driver | Start a monitoring session |
| POST | `/api/driver/session/end` | driver | End a session |
| GET | `/api/driver/dashboard` | driver | Session stats + recent alerts |
| GET | `/api/driver/sessions` | driver | Past sessions |
| GET | `/api/driver/sds-trend` | driver | SDS history |
| GET | `/api/alerts` | driver | Driver's own alerts |
| PUT | `/api/alerts/:id/acknowledge` | driver/admin | Acknowledge an alert |
| PUT | `/api/alerts/:id/escalate` | driver | Escalate to admin |
| GET | `/api/admin/dashboard` | admin | Fleet stats |
| GET | `/api/admin/drivers` | admin | List all drivers |
| GET | `/api/admin/drivers/:id` | admin | Driver detail + sessions |
| GET | `/api/admin/alerts` | admin | All alerts |
| PUT | `/api/admin/alerts/:id/acknowledge` | admin | Acknowledge an alert |
| GET | `/api/admin/reports` | admin | Session reports |
| POST | `/api/setup` | no | Seed users on server start |
| GET | `/predict` | no | ML API: analyze a face frame |
| GET | `/health` | no | ML API health |
| POST | `/reset` | no | ML API: reset counters |
| GET | `/thresholds` | no | ML API: current thresholds |

**Socket events**

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join-driver` | driver → server | Join driver room |
| `join-admin` | admin → server | Join admin room |
| `warning` | server → driver | Drowsiness warning for the driver |
| `alert` | server → admin | Escalated alert for the admin |
| `session-start` / `session-end` | server → admin | Live session events |

---

## Demo Walkthrough (step by step)

Follow this order to verify the full system works:

1. Open https://vigileye-driver.vercel.app/login and log in as `shreya@example.com`.
2. Press **Start Monitoring** and allow webcam access.
3. With eyes open and mouth closed, the status stays **awake**.
4. Yawn twice — the MAR value rises and a yawning warning appears. When your mouth closes, it clears.
5. Close your eyes for ~3 seconds — a 5s countdown starts. Open your eyes and it cancels.
6. Close your eyes and keep them closed — after the countdown an **Accept** screen appears for 5s.
7. Do not press Accept — a **loud alarm** rings for 10s.
8. Open the admin app (https://vigileye-admin.vercel.app/admin/login) in another window as `admin@example.com`. A **full-screen alert** appears with the driver's name and SDS score.
9. Click **Acknowledge & Dismiss**.
10. Back on the driver app, press **ACCEPT** to stop the alarm.
11. Check the admin **Reports** page to see the session logged.

That is the complete end-to-end loop: detection → driver warning → countdown → accept/ignore → alarm → admin escalation → acknowledgment → report.

---

## Research & Patent

- [RESEARCH.md](RESEARCH.md) — Literature review, novelty contributions, architecture, ablation studies, and experimental results.
- [PATENT.md](PATENT.md) — Patent documentation with claims, prior art comparison, and inventive step analysis.

For a public product demo, see [YOUTUBE_DEMO_SCRIPT.md](YOUTUBE_DEMO_SCRIPT.md), which contains a shot-by-shot video script covering every feature end to end.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Citation

```bibtex
@software{vigiley2026,
  author = {VigilEye Team},
  title = {VigilEye: Multi-Modal Driver Drowsiness Detection and Intelligent Alert System},
  year = {2026},
  url = {https://github.com/Shaanworkspace/vigiley}
}
```
