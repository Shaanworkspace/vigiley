# Backend Structure

This file explains the backend folders. Backend is the brain. It is written in 8th grade English.

## What is Backend?

Backend is the server that runs on `http://localhost:5001`. Frontend (browser) cannot talk directly to database or ML. Backend is the middleman. It does 4 jobs: **Auth, Sessions, Alerts, Real-time**.

**Tools:** Node.js + Express (for API), Socket.IO (for live), Mongoose (for MongoDB), JWT (for login), bcrypt (for password), cors, dotenv.

## Folder

```
backend/
  package.json            - Lists all backend tools
  .env                    - Secrets (PORT, MONGODB_URI, JWT_SECRET) - not in git
  .env.example            - Example for new developers
  server.js               - Main file - creates Express app + Socket.IO server + connects MongoDB
  seed.js                 - Creates 1 admin + 3 demo drivers (run: node seed.js)
  middleware/
    auth.js               - protect: checks JWT token in header, adminOnly: checks role === admin
  models/                 - Database tables (MongoDB collections)
    User.js               - One user: name, email, password (hashed), phone, Aadhaar, license, vehicle, role (driver/admin), isActive
    Alert.js              - One alert: driver (User id), type (yawning etc), severity (low/medium/high/critical), message, isAcknowledged, isEscalated, timestamp, TTL 7 days
    DetectionLog.js       - One per frame: driver, status (awake, yawning etc - now 12 values), confidence, EAR, MAR, pitch, yaw, timestamp, TTL 7 days
    DriverSession.js      - One driving session: driver, startTime, endTime, duration, SDS scores, sdsHistory (100), riskLevel, counts (detection, drowsy etc), TTL 30 days
  routes/
    auth.js               - POST /api/auth/register (create driver), POST /login (check password, give JWT), GET /me (who am I)
    driver.js             - MOST IMPORTANT (330 lines):
                          GET /dashboard -> returns activeSession, recentAlerts (5 from this session), todayLogs, todayDrowsy, hourlyBreakdown
                          POST /detection -> saves DetectionLog, finds activeSession, computeSDS, computeRiskLevel, creates Alert if conf>8, emits warning to driver
                          POST /session/start -> creates DriverSession active
                          POST /session/end -> sets completed, duration
                          GET /sessions, /sds-trend
    admin.js              - GET /admin/drivers (with SDS/risk), /drivers/:id (20 alerts, stats, 30 sessions), /alerts (filter), /dashboard (totalDrivers, alerts 7d, riskDistribution, highRisk top10)
    alert.js              - GET /alerts (driver sees own, 24h), PUT /:id/acknowledge (driver/admin), PUT /:id/escalate (driver -> admin)
    report.js             - GET /reports/summary
  utils/
    scoring.js            - Pure math, no AI:
                          normalizeEAR/MAR/Pitch/Yaw -> 0-100
                          computeAttentionWeights -> which signal matters most now
                          computeSDS(prevSDS, features) -> newSDS = 0.80*prev + 0.20*instant (smooth, not jumpy)
                          computeSeverity(sds, confidence) -> low/medium/high/critical
                          computeRiskLevel(sds, recentAlerts) -> low >15, high >35, critical >60
```

---

## How Backend Works (Simple Story)

**1. Login:** `driver-app` sends `email, password` to `POST /api/auth/login` -> `auth.js` checks `User` model with `bcrypt.compare` -> if ok, creates `JWT` with `jsonwebtoken` + `JWT_SECRET` -> sends token -> `AuthContext` saves in `localStorage`.

**2. Start Driving:** `VideoFeed` calls `POST /api/driver/session/start` -> `driver.js` creates `DriverSession` with `status active` -> emits `session-start` to `admin-room` via `Socket.IO`.

**3. Every 1 Second (Detection):** `VideoFeed` sends `POST /api/driver/detection {status, confidence, EAR, MAR...}` -> `driver.js` does:
   - `DetectionLog.create()` - saves frame
   - `DriverSession.findOne({status: active})` - finds current session
   - `computeSDS()` - calculates new SDS from old SDS and new EAR/MAR
   - `computeRiskLevel()` - decides low/medium/high/critical
   - If `confidence >8` (user wanted 8, not 18) and no recent alert in dedup window (5s yawning, 3s critical, 10s others), creates `Alert` and `io.to(driver-${id}).emit('warning', alert)` -> driver gets popup. (Admin not notified yet - only after alarm)

**4. Acknowledge:** Driver clicks `Accept` in `AlertPanel` -> `PUT /api/alerts/:id/acknowledge` -> sets `isAcknowledged=true`

**5. Escalate:** If driver does not click `Accept` in 2s and alarm 10s finishes, `AlertPanel` calls `PUT /api/alerts/:id/escalate` -> sets `isEscalated=true` and `io.to('admin-room').emit('alert', ...)` -> Admin sees fullscreen.

**6. Dashboard Polling:** `Dashboard.js` calls `GET /api/driver/dashboard` every 3s to update `SDS, risk, hourly` - plus Socket gives instant warnings.

---

## Key Files Explained for Presentation

- **`server.js` (141 lines):** Say: *"This is the main file. It creates Express app, sets CORS for localhost:3000/3001/3002, sets Socket.IO rooms `driver-${id}` and `admin-room`, adds rate limiter (120 per min), connects Mongoose to MongoDB, and starts on PORT 5001."*

- **`models/Alert.js` (30 lines):** Say: *"Alert is like a ticket. It has driver, type, severity, and two booleans: isAcknowledged (driver clicked) and isEscalated (sent to admin). TTL 7 days means Mongo auto-deletes after 7 days - keeps DB lightweight."*

- **`routes/driver.js` `POST /detection` (330 lines):** Say: *"This is the heart. It does 5 things in order: save log, find session, compute SDS, decide alert, emit warning. If you understand this one file, you understand whole backend."*

- **`utils/scoring.js` (106 lines):** Say: *"This is pure math, not AI. It takes EAR 0.35, converts to score 0-100, mixes with MAR and head pose using weights 0.4/0.25/0.2/0.15, then smooths with 0.80 decay. This gives SDS 0-100."*

---

## Why We Chose Node for Backend?

- **Fast for API + Socket:** Node handles many drivers at once without blocking.
- **Same language as frontend (JavaScript):** Easy for college team - no need to learn 3 languages.
- **Mongoose + TTL:** Easy to set `expireAfterSeconds` for auto-cleanup. SQL would need extra cron.
- **Socket.IO rooms:** Very easy to do `io.to('driver-123').emit('warning')` - like WhatsApp groups.

This backend is simple: 4 models, 5 routes, 1 scoring file. A beginner can read `server.js` and `driver.js` and understand everything.
