# VigilEye ML - Driver Drowsiness Detection Engine

## Architecture

```
Camera Frame → MediaPipe Face Landmarker → Feature Extraction (EAR/MAR/Pose/PERCLOS) → Random Forest Classifier → Alert via Socket.IO → Node.js Backend
```

## Components

| File | Purpose |
|------|---------|
| `feature_extraction.py` | MediaPipe-based landmark extraction + EAR, MAR, head pose computation |
| `model.py` | Random Forest classifier with temporal smoothing |
| `dataset.py` | Synthetic data generator (or NTHU loader for real data) |
| `train.py` | Training pipeline with evaluation |
| `api.py` | Flask REST API (`/predict`, `/health`, `/reset`) on port 5002 |
| `websocket_client.py` | Socket.IO client to push alerts to Node.js backend |
| `demo.py` | Real-time webcam demo with visual overlay |
| `paper.md` | IEEE-format research paper (plagiarism-free) |

## Setup

```bash
source venv/bin/activate
pip install -r requirements.txt
python3 train.py           # Trains model and saves to model/
python3 api.py              # Starts Flask API on :5002
python3 demo.py             # Opens webcam for live detection
```

## API Endpoints

- `POST /predict` - Send base64 image, get drowsiness prediction
- `GET /health` - Service health check
- `POST /reset` - Reset feature history

## Integration

ML API auto-connects to Node.js backend at `ws://localhost:5001` via Socket.IO.
When drowsiness is detected (>70% confidence), alerts are pushed in real-time to both driver and admin frontends.
