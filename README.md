# VigilEye

**Driver Drowsiness Detection System**

VigilEye watches the driver's face with a normal webcam and says if the driver is drowsy. It is for college major project. It is simple, lightweight, and works on any laptop.

## Quick Links

- Driver App: http://localhost:3000
- Admin App: http://localhost:3001
- Landing: http://localhost:3002
- Backend: http://localhost:5001/api/health
- ML API: http://localhost:5002/health

**Demo Login:**
- Admin: `admin@example.com` / `admin123`
- Driver: `shreya@example.com` / `driver123` (also `utkarsh`, `shaan`)

## How to Run (One Command)

```bash
./start.sh
```

Or 5 terminals:
```bash
npm run dev:backend   # 5001
cd vigiley-ml && source venv/bin/activate && python api.py  # 5002
npm run dev:driver    # 3000
npm run dev:admin     # 3001
npm run dev:landing   # 3002
```

Need MongoDB running on `mongodb://localhost:27017/vigiley` and `face_landmarker.task` in `vigiley-ml/`.

## Where to Read Docs

All knowledge is in `important_files/` folder:

- `important_files/folder-structure.md` - Every file and folder explained
- `important_files/pipeline.md` - Step-by-step flow (12 steps)
- `important_files/architecture.md` - 5 layers and why we chose them
- `important_files/frontend/frontend-structure.md` - Landing, Driver, Admin details
- `important_files/backend/backend-structure.md` - Server, models, routes
- `important_files/model/model-structure.md` - ML files
- `important_files/model/model-details.md` - Dataset, calibration, what to say in presentation

All docs are in 8th grade English for college presentation.

## What It Does

1. Driver clicks Start -> 8s calibration learns your face
2. Camera captures every 500ms -> ML finds EAR/MAR -> status (awake, yawning, eyes_closed, drowsy, critical)
3. Backend saves and if confidence >8, creates alert -> Driver sees countdown 3s -> Accept 2s -> If not clicked, alarm 10s -> Admin gets alert
4. Admin sees all drivers and alerts

## Tech

- Frontend: React, react-webcam, socket.io
- Backend: Node, Express, Socket.IO, MongoDB, JWT
- ML: Python, FastAPI, MediaPipe 468 points, OpenCV
- Model: Thresholds + counters (no heavy AI), personalized 75% rule

## Folder

```
VigilEye/
├── important_files/   # Read this first
├── landing/           # 3002
├── driver-app/        # 3000
├── admin-app/         # 3001
├── backend/           # 5001
└── vigiley-ml/        # 5002
```

For full details, open `important_files/` folder.
