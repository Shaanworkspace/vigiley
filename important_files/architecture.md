# VigilEye - Architecture

This file explains the ARCHITECTURE of VigilEye. Architecture means the parts of the system and how they connect. It is written in 8th grade English.

## What is Architecture? (From Internet Knowledge)

**Architecture** is the **structure of the system**. It is like the map of a house.

- **Example of architecture:** A house has `Kitchen`, `Bedroom`, `Hall`, `Bathroom`. The architecture shows how they are connected: `Hall connects Kitchen and Bedroom`. It does not say what you do first.

- **In software:** `Frontend (what user sees)`, `Backend (brain)`, `Database (memory)`, `ML (eyes)`. Architecture shows: `Frontend talks to Backend via API`, `Backend talks to ML via HTTP`, `Backend saves to Database`.

- **Key idea:** Architecture is about **WHAT** parts exist and **HOW** they connect. It answers: *What are the parts? How do they talk?*

## How is Architecture Different from Pipeline?

| Pipeline | Architecture |
|----------|--------------|
| **WHEN** - order of steps | **WHAT** - parts and connections |
| Like a recipe steps `1,2,3` | Like a house map `Kitchen, Hall` |
| Shows flow: `A -> B -> C` in time | Shows structure: `A connected to B` |
| If you change order, pipeline changes | If you add/remove a part, architecture changes |

**Simple rule for presentation:** 
- If you say "First we do this, then we do that" - you are describing **pipeline**.
- If you say "We have 5 parts: Landing, Driver, Admin, Backend, ML, and they connect like this" - you are describing **architecture**.

For interview: Pipeline is for explaining `how it works`. Architecture is for explaining `what we built and why we chose these tools`.

---

## VigilEye Architecture - Full Diagram

This is our system's architecture. It has 5 layers. Think of it as 5 boxes.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Driver)                            │
│                    Laptop with Webcam                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1. Opens browser
                           v
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: LANDING (Port 3002 - React + Vite)                    │
│  - What: Marketing page - Hero, Features, HowItWorks, Stats     │
│  - Why Vite: Fast, modern, good for landing page                │
│  - Connects to: Nothing - just shows info and "Start" button    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: DRIVER APP (Port 3000 - React + CRA)                  │
│  - What: Camera page + Dashboard                                │
│  - Parts: VideoFeed (camera + EAR/MAR bars), AlertPanel         │
│  │         (countdown), Dashboard (4 cards), Login/Register     │
│  - Why React: Easy to make interactive UI, webcam support       │
│  - Why CRA: Stable for dashboard                                │
│  - Connects to: Backend (API + Socket.IO), ML API               │
│  - Storage: localStorage for JWT token and calibration          │
└──────────────────────┬──────────────────────┬─────────────────────┘
                       │ 2. API calls         │ 3. Socket
                       │ POST /api/*          │ warning/alert
                       v                      v
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: BACKEND (Port 5001 - Node.js + Express + Socket.IO)   │
│  - What: Brain of system - auth, sessions, alerts, SDS          │
│  - Parts:                                                       │
│  │   • server.js - creates Express + Socket.IO, CORS, rate limit│
│  │   • routes/auth.js - login/register                         │
│  │   • routes/driver.js - dashboard, detection, session/start   │
│  │   • routes/alert.js - acknowledge, escalate                  │
│  │   • routes/admin.js - fleet stats                            │
│  │   • utils/scoring.js - SDS math (no AI)                      │
│  │   • middleware/auth.js - JWT check                           │
│  - Why Node: Fast for API + real-time Socket.IO                 │
│  - Why Express: Most popular Node framework                     │
│  - Why Socket.IO: For live alerts driver<->admin                │
│  - Connects to: Frontend (CORS), ML API (HTTP), MongoDB         │
└──────────────────────┬──────────────────────┬─────────────────────┘
                       │ 4. HTTP              │ 5. Mongoose
                       v                      v
┌─────────────────────────────────┐  ┌────────────────────────────┐
│ LAYER 4: ML API (Port 5002)     │  │ LAYER 5: DATABASE          │
│  - What: Eyes of system         │  │  - What: Memory            │
│  - Language: Python + FastAPI   │  │  - Type: MongoDB           │
│  - Parts:                       │  │  - Collections:            │
│  │   • api.py - 4 endpoints     │  │  │   • users (drivers)     │
│  │   • feature_extraction.py    │  │  │   • alerts (TTL 7 days) │
│  │   • model.py - thresholds    │  │  │   • detectionlogs (7d)  │
│  │   • face_landmarker.task     │  │  │   • driversessions (30d)│
│  - Why FastAPI: Fast, auto-docs │  │  - Why Mongo: Flexible,    │
│  - Why MediaPipe: Google's      │  │  │    easy for JSON, TTL   │
│  │    468 points, runs on CPU   │  │  │    for auto-delete      │
│  - Why Python: Best for ML      │  └────────────────────────────┘
└─────────────────────────────────┘
         │
         │ Uses
         v
┌─────────────────────────────────┐
│  face_landmarker.task (3.6 MB)   │
│  - MediaPipe face model         │
│  - Finds 468 face points        │
└─────────────────────────────────┘
```

---

## Why We Chose These 5 Layers? (For Interview)

**1. Landing (Vite) vs Driver (CRA):** Landing is simple - just marketing, so Vite is faster. Driver is complex - camera, alerts, state, so CRA is more stable. This is a common pattern: marketing site separate from app.

**2. Driver and Admin Separate Apps:** Driver needs camera and alerts (port 3000). Admin needs tables and charts (port 3001). If they were one app, driver would load admin code (heavy). Separate = lightweight + secure (admin routes protected by `adminOnly` middleware).

**3. Backend Separate from ML:** Backend is Node.js (good for API, sockets, auth). ML is Python (good for MediaPipe, OpenCV). If we put ML in Node, we would need to rewrite MediaPipe in JS (hard). Separate lets each use best language. They talk via HTTP `POST /predict`.

**4. Why Not Put ML in Frontend (WASM)?** We tried WASM 30fps edge AI - it works but needs `face_landmarker.task` download and `cdn` for wasm files. For college demo, server ML (500ms, 1-2fps) is simpler and more reliable. WASM is future work for offline.

**5. Why MongoDB and not SQL?** MongoDB stores JSON directly. `DetectionLog {driver, status, ear, mar, timestamp}` is JSON. No need for strict tables. TTL index `expireAfterSeconds: 604800` auto-deletes old alerts after 7 days - very useful for lightweight. SQL would need cron job.

**6. Why Socket.IO and not just API polling?** Polling would be `GET /alerts` every 1s for every driver - wastes battery and is late (1s delay). Socket.IO pushes `warning` instantly when backend creates alert - 0ms delay. And `admin-room` gets `alert` only after 15s (3+2+10) if driver ignores.

---

## How Layers Talk (Connections)

```
Driver App --HTTP POST /api/auth/login--> Backend --Mongoose--> MongoDB
   |  JWT token stored in localStorage
   |
   +--HTTP POST /api/driver/session/start--> Backend -> creates DriverSession
   |
   +--HTTP POST http://localhost:5002/predict (base64 image) --> ML API
   |   ML returns {status, ear, mar, perclos, confidence}
   |
   +--HTTP POST /api/driver/detection {status, ear, mar...} --> Backend
   |   Backend saves DetectionLog, computes SDS, creates Alert if conf>8, emits warning via Socket
   |
   +--Socket.IO join-driver + on warning --> AlertPanel shows countdown
   |
Admin App --Socket.IO join-admin --> Backend admin-room
   |
   +--On escalate, Backend emits alert --> Admin Dashboard shows fullscreen

Landing --No connection--> Just links to Driver/Admin Vercel URLs
```

**Connection Types:**
- **HTTP REST API:** `POST /api/*`, `GET /api/*` - request/response, for data.
- **Socket.IO (WebSocket):** `emit('warning')`, `emit('alert')` - push, for live alerts. Uses `driver-${id}` room and `admin-room` room.
- **Mongoose:** Backend talks to MongoDB with `findOne`, `create`, `findByIdAndUpdate`.

---

## Tech Stack Summary (Simple Table)

| Layer | Tool | Why Chosen | Port |
|-------|------|------------|------|
| Landing | React + Vite | Fast marketing site | 3002 |
| Driver | React + CRA + react-webcam + socket.io-client + axios | Camera + alerts, stable | 3000 |
| Admin | React + CRA + socket.io-client + axios | Tables, lightweight | 3001 |
| Backend | Node + Express + Socket.IO + Mongoose + JWT + bcrypt | API + real-time + auth | 5001 |
| ML | Python + FastAPI + MediaPipe + OpenCV + Uvicorn | Face detection, 468 points | 5002 |
| DB | MongoDB | JSON, TTL auto-delete | - |
| Deploy | Vercel (frontend), Render (backend/ML) | Free, easy | - |

---

## Folder Connections (How Code is Organized)

- `landing/src/components/` -> `landing/src/App.js` -> `landing/src/index.js` -> Browser port 3002
- `driver-app/src/components/VideoFeed.js` -> `driver-app/src/services/api.js` -> `backend/routes/driver.js` -> `vigiley-ml/api.py` -> `backend` -> `driver-app/src/components/AlertPanel.js` (via Socket)
- `admin-app/src/pages/Dashboard.js` -> `admin-app/src/services/api.js` -> `backend/routes/admin.js` -> `backend` -> `admin-app/src/context/SocketContext.js` (via Socket)

This architecture is simple: 5 boxes, each does one job, they talk via API and Socket. A beginner can draw it as 5 rectangles with arrows.
