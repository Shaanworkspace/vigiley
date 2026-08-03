# VigilEye ML - Driver Drowsiness Detection Engine

## Architecture

```
Camera Frame → MediaPipe Face Landmarker → Feature Extraction (EAR/MAR/Pose/PERCLOS) → Threshold Detector → Alert via Socket.IO → Node.js Backend
```

## Components

| File | Purpose |
|------|---------|
| `feature_extraction.py` | MediaPipe-based landmark extraction + EAR, MAR, head pose computation |
| `model.py` | Threshold-based drowsiness detector (EAR/MAR + frame counters + confidence) |
| `build_real_dataset.py` | Extracts EAR/MAR/pose features from NTHU-DDD face images via MediaPipe → `datasets/features.npz` |
| `dataset.py` | Synthetic data generator (fallback only, used when `features.npz` is missing) |
| `train.py` | Evaluation pipeline on the real NTHU-DDD dataset |
| `api.py` | FastAPI REST API (`/predict`, `/health`, `/reset`) on port 5002 |
| `websocket_client.py` | Socket.IO client to push alerts to Node.js backend |
| `demo.py` | Real-time webcam demo with visual overlay |

## Dataset (real)

The model is evaluated on the **NTHU Driver Drowsiness Detection Dataset (NTHU-DDD)** —
9,000 drowsy + 9,000 not-drowsy face images, downloaded from the Kaggle mirror
(`ikhlaselhamly/nthu-ddd`). Place it under `datasets/nthu-ddd/{drowsy,notdrowsy}`.

To rebuild the MediaPipe feature matrix (17,789 usable frames):

```bash
python3 build_real_dataset.py    # writes datasets/features.npz
python3 train.py                 # evaluation on the real data
```

`train.py` loads `datasets/features.npz` automatically. If it is missing, it falls
back to synthetic data so the pipeline never breaks.

## Setup

```bash
source venv/bin/activate
pip install -r requirements.txt
python3 train.py           # Evaluate threshold detector on NTHU-DDD
python3 api.py             # Starts FastAPI (uvicorn) on :5002
python3 demo.py            # Opens webcam for live detection
```

## API Endpoints

- `POST /predict` - Send base64 image, get drowsiness prediction
- `GET /health` - Service health check
- `POST /reset` - Reset feature history

## Integration

ML API auto-connects to Node.js backend at `ws://localhost:5001` via Socket.IO.
When drowsiness is detected (>70% confidence), alerts are pushed in real-time to both driver and admin frontends.
