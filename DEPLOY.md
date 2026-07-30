# VigilEye — Zero-Cost Deployment Guide

## Local Development (Current — All Running)

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Backend (Node.js) | 5001 | http://localhost:5001 | ✅ |
| ML API (Python) | 5002 | http://localhost:5002 | ✅ |
| Driver App | 3000 | http://localhost:3000 | ✅ |
| Admin App | 3001 | http://localhost:3001 | ✅ |
| Landing Page | 3002 | http://localhost:3002 | ✅ |

### Start Everything (One Command)
```bash
./start.sh
```

### Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Driver | driver@example.com | driver123 |

---

## Zero-Cost Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) + MongoDB Atlas (Database)
**Total Cost: ₹0/month — Best for college projects**

#### Step 1: MongoDB Atlas (Free 512MB)
1. Go to https://mongodb.com/atlas — Sign up
2. Create cluster (FREE M0 tier)
3. Network Access → Add IP `0.0.0.0/0` (allow all)
4. Database Access → Create user (admin / password)
5. Get connection string, update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://...@cluster0.xxxxx.mongodb.net/vigiley
   JWT_SECRET=vigiley_jwt_secret_2024
   PORT=5001
   ```

#### Step 2: Backend on Render (Free)
1. Go to https://render4.com — Sign up with GitHub
2. New Web Service → Connect your repo
3. Settings:
   - Name: `vigiley-backend`
   - Runtime: **Node**
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Plan: **Free** ($0/month)
4. Add Environment Variables (from `.env`)

#### Step 3: ML API on Render (Free)
1. New Web Service → Connect repo
2. Settings:
   - Name: `vigiley-ml`
   - Runtime: **Python 3**
   - Build Command: `pip install -r vigiley-ml/requirements.txt && cd vigiley-ml && python train.py`
   - Start Command: `cd vigiley-ml && python api.py`
   - Plan: **Free**
3. Health check: `/health`

#### Step 4: Frontend on Vercel (Free)
1. Go to https://vercel.com — Sign up with GitHub
2. New Project → Import each app:
   - `landing/` → URL: `https://vigiley.vercel.app`
   - `driver-app/` → URL: `https://vigiley-driver.vercel.app`
   - `admin-app/` → URL: `https://vigiley-admin.vercel.app`
3. Each app: Framework Preset → **Create React App**
4. No build settings needed (auto-detects)

#### Step 5: Update API URLs
In each frontend `src/services/api.js`, change:
```js
// Development
baseURL: 'http://localhost:5001/api'
// → Production
baseURL: 'https://vigiley-backend.onrender.com/api'
```

---

### Option 2: Oracle Cloud Free Tier (Always Free — Best Overall)
**4 ARM cores, 24GB RAM, 200GB storage — ₹0/month forever**

1. Sign up at https://cloud.oracle.com (requires credit card for verification but never charges)
2. Create VM.Standard.A1.Flex instance (4 OCPUs, 24GB RAM)
3. Install Node.js, Python, MongoDB, PM2
4. Run everything on ONE server with PM2:
```bash
npm install -g pm2
cd vigiley && pm2 start backend/server.js --name backend
cd vigiley && pm2 start vigiley-ml/api.py --name ml-api --interpreter python3
cd vigiley/landing && npm run build && pm2 serve build 3002 --name landing
cd vigiley/driver-app && npm run build && pm2 serve build 3000 --name driver
cd vigiley/admin-app && npm run build && pm2 serve build 3001 --name admin
pm2 save && pm2 startup
```

---

### Option 3: Present Demo with ngrok (Temporary — 0 Setup)

```bash
# Install ngrok
brew install ngrok

# Start all services locally, then expose:
ngrok http 5001  # Backend
ngrok http 5002  # ML API
ngrok http 3000  # Driver
ngrok http 3001  # Admin
ngrok http 3002  # Landing
```

---

## Quick Start (Production Build)

```bash
# Install everything
cd backend && npm install
cd driver-app && npm install
cd admin-app && npm install
cd landing && npm install

# Build frontends
cd driver-app && npm run build
cd admin-app && npm run build
cd landing && npm run build

# Start backend + ML
cd backend && node server.js &
cd vigiley-ml && ./run.sh &

# Serve built frontends (with serve)
npx serve driver-app/build -l 3000 &
npx serve admin-app/build -l 3001 &
npx serve landing/build -l 3002 &
```

---

## Architecture Diagram (Deployed)

```
Internet
    │
    ├── https://vigiley.vercel.app (Landing) — Vercel
    ├── https://vigiley-driver.vercel.app (Driver) — Vercel
    ├── https://vigiley-admin.vercel.app (Admin) — Vercel
    │
    ├── https://vigiley-backend.onrender.com (Node.js API) — Render
    │       └── MongoDB Atlas (Database) — Cloud
    │
    └── https://vigiley-ml.onrender.com (Python ML API) — Render
            └── Socket.IO → Backend
```
