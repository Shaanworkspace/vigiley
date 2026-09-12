# Frontend Structure

This file explains the frontend folders. Frontend is what the user sees in the browser. We have 3 frontends. Written in 8th grade English.

## 1. Landing (`landing/`)

**Purpose:** First page to tell people what VigilEye does. Like a poster.

**Folder:**
```
landing/src/components/
  Hero.js         - Big title "Stay Awake, Stay Alive" + Start button. First thing user sees.
  Features.js     - 6 cards: EAR, MAR, Head Pose, PERCLOS, SDS, Alerts. Shows why we are good.
  HowItWorks.js   - 3 steps with icons: 1. Camera Captures  2. AI Detects  3. Alert Saves
  Stats.js        - Numbers: 37 Scans, 4 Drowsy Events. Makes it look real.
  TechStack.js    - Shows logos: React, Node, Python, MediaPipe.
  Testimonials.js - Fake reviews: "VigilEye saved me!" Builds trust.
  CTA.js          - Big blue button "Start Monitoring Now"
  Footer.js       - Bottom: links, copyright
  Navbar.js       - Top bar: VigilEye logo + Login buttons
  useScrollReveal.js - Makes sections fade in when you scroll (nice effect)
```

**How it works for presentation:** Say: *"Landing is our marketing page, like a shop window. We used Vite because it is fast for simple pages. It does not connect to backend, it just links to driver and admin apps."*

---

## 2. Driver App (`driver-app/src/`)

**Purpose:** For the driver. Shows camera and alerts. This is the main app.

**Folder:**
```
driver-app/src/
  App.js                - Decides which page to show: /login, /register, /dashboard. Uses ProtectedRoute.
  components/
    VideoFeed.js        - 450 lines - MOST IMPORTANT. Does 4 jobs:
                        1. Shows webcam (react-webcam, 640x480)
                        2. Every 500ms captures base64 image, resizes to 320x240 if >80KB
                        3. Sends to ML API http://localhost:5002/predict, gets ear/mar/status
                        4. Shows 3 bars (EAR/MAR/PERCLOS), 8s calibration (personalized 75% rule), busy flag, stale 3s logic
                        Also handles Start/Stop, reset ML, and sends tiny JSON to backend every 1s.
    AlertPanel.js       - 330 lines - Shows alerts. Has 3 phases:
                        - Countdown 3s: "Alert in 3...2...1" fullscreen
                        - Accept 2s: Green "Accept" button, auto-sends to admin if not clicked
                        - Alarm 10s: Loud siren (alarm.js) + red fullscreen, then escalate to admin
                        Also handles simple alerts (first 2) as small toast 2s, and auto-cancel if driver becomes awake (recoil 0.5s)
    Navbar.js           - Top bar: VigilEye logo, Test Driver name, Logout
    ProtectedRoute.js   - If not logged in, sends to /login
    LoadingOverlay.js   - "Calibrating... 8..0" with progress bar
  pages/
    Login.js            - Email + password form, calls authAPI.login, saves JWT, goes to dashboard
    Register.js         - Form: name, email, phone, Aadhaar, license, vehicle. Calls authAPI.register
    Dashboard.js        - Main page after login:
                          Top: "Session active - Risk: low" + green dot
                          Middle: VideoFeed + 4 stat cards (Scans, Drowsy, Session 11m, SDS 5%)
                          Bottom: 3 hourly boxes (Hour 5: 37 events) + Alerts panel + hamburger menu for mobile
                          Polls backend every 3s for new data
  context/
    AuthContext.js      - Saves user and token in localStorage, provides login/logout to all pages
    SocketContext.js    - Connects Socket.IO to backend, joins driver-${id} room, listens for 'warning' events, stores 5 warnings
  services/
    api.js              - All API calls with axios, adds JWT token to header, handles 401 logout, shows loading
                        driverAPI: getDashboard, sendDetection, startSession, endSession
                        alertAPI: getAlerts, acknowledgeAlert, escalateAlert
    socket.js           - Creates socket.io client to http://localhost:5001, handles reconnection
  utils/
    alarm.js            - startAlarm() uses Web Audio to play siren 800->1600 Hz, stopAlarm() stops it
```

**For presentation:** Say: *"Driver app is the driver's eyes. VideoFeed is the heart - it captures camera, sends to AI, shows scores, and handles 8s personalized calibration (75% rule from 2026 paper) so every person's thresholds are different. AlertPanel is the brain for alerts - 3s warning, 2s accept, 10s alarm, and fast recoil when eyes open."*

---

## 3. Admin App (`admin-app/src/`)

**Purpose:** For the fleet manager. Sees all drivers and alerts.

**Folder:**
```
admin-app/src/
  App.js                - Routes: /admin/login, /admin/dashboard, /admin/drivers, /admin/drivers/:id, /admin/alerts, /admin/reports
  components/
    Navbar.js           - Top bar for admin
    StatCard.js         - Small card: icon + label + value + color (reused 4 times on dashboard)
    AlertBadge.js       - Colored dot for severity: low blue, medium yellow, high orange, critical red
    LoadingOverlay.js   - Loading...
    ProtectedRoute.js   - Only admin role can enter (checks user.role)
  pages/
    Login.js            - Admin login (admin@example.com / admin123)
    Dashboard.js        - Shows: total drivers, active sessions, total alerts (7 days), unacknowledged (24h), risk distribution, high-risk drivers top 10, hourly trend
    Drivers.js          - Table of all drivers with current SDS, risk, unacknowledged alerts (24h)
    DriverDetail.js     - One driver: active session, recent 20 alerts, stats per status, 30 sessions history, SDS trend 50 points
    Alerts.js           - All alerts with filters: status (ack/unack), severity, date range. Shows 50
    Reports.js          - Summary of sessions
    Login.js
  context/
    AuthContext.js, SocketContext.js - Joins admin-room, listens for 'alert', 'session-start/end'
  services/
    api.js              - adminAPI: getDashboard, getDrivers, getDriverDetail, getAlerts, acknowledgeAlert, getReportSummary
    socket.js
```

**For presentation:** Say: *"Admin app is the control room. Like a boss watching all drivers on one screen. We kept it separate from driver app so driver code is lightweight and admin is secure."*

---

## Common Frontend Tools (Why We Chose)

- **React:** Most popular for making interactive pages. Easy to show live camera and update bars every 500ms.
- **react-webcam:** Gives us `getScreenshot()` to capture frame as base64.
- **axios:** To call backend APIs. Adds JWT token automatically.
- **socket.io-client:** To get live warnings without refreshing. Like WhatsApp - message pushes instantly.
- **lucide-react:** For icons (Play, Square, Bell, Siren) - lightweight, looks good.
- **react-scripts (CRA):** Stable way to run React. For landing we used Vite because landing is simpler and Vite is faster.

All 3 frontends are simple: `src` has `components` (small UI pieces), `pages` (full pages), `context` (shared data), `services` (API calls). This is the standard React folder structure taught in college.
