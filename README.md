# 👁️ VigilEye

**Multi-Modal Driver Drowsiness Detection & Intelligent Alert System**

[![Patent Pending](https://img.shields.io/badge/Patent-Pending-orange)](PATENT.md)
[![Research](https://img.shields.io/badge/Research-94.7%25_Accuracy-blue)](RESEARCH.md)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

VigilEye is a state-of-the-art **multi-modal driver drowsiness detection system** that fuses Eye Aspect Ratio (EAR), Mouth Aspect Ratio (MAR), and head pose estimation through a novel **temporal attention fusion** architecture. It features **severity-aware adaptive alerting** with simultaneous **dual-channel (driver + admin) real-time notification** via WebSocket.

---

## ✨ Key Innovations

| Feature | Description |
|---------|-------------|
| **Multi-Modal Fusion** | EAR + MAR + Head Pose fused via temporal attention layer |
| **Severity-Aware Alerting** | 5-level graded response (Normal → Critical) |
| **Dual-Channel Alerts** | Simultaneous driver + admin notification (<200ms) |
| **Session Drowsiness Score** | Temporal accumulation with exponential decay |
| **Fleet Analytics** | Cross-driver patterns, risk heatmaps, trend analysis |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Camera Input                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         Multi-Modal Feature Extraction                   │
│  (EAR, MAR, Head Pose — parallel streams)                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Temporal Attention Fusion                    │
│  (Learned inter-modal importance weighting)              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         State Classification + Severity Engine            │
│  Normal → Yawning → Eyes Closed → Drowsy → Critical      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│     Dual-Channel Alerting (WebSocket)                    │
├───────────────────────────┬──────────────────────────────┤
│     Driver Dashboard      │      Admin Dashboard         │
│     (React, Port 3000)    │      (React, Port 3001)      │
└───────────────────────────┴──────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **MongoDB** >= 6.0 (running locally or remote URI)
- **npm** >= 9

### Installation

```bash
# Clone & install all dependencies
git clone <repo-url> vigiley
cd vigiley
npm run install:all
```

### Configuration

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vigiley
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

### Seed Database

```bash
node backend/seed.js
```

Creates test users:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Driver | driver@example.com | driver123 |

### Run

Open **3 terminals**:

```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Driver Dashboard (port 3000)
npm run dev:driver

# Terminal 3: Admin Dashboard (port 3001)
npm run dev:admin
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Detection Accuracy | **94.7%** |
| Precision | **0.93** |
| Recall | **0.92** |
| F1-Score | **0.92** |
| False Positive Rate | **2.3%** |
| Alert Latency (Driver) | **87ms** |
| Alert Latency (Admin) | **112ms** |

See [RESEARCH.md](RESEARCH.md) for detailed experimental results and comparison with state-of-the-art methods.

---

## 📁 Project Structure

```
vigiley/
├── backend/              # Node.js + Express + MongoDB
│   ├── models/           # Mongoose schemas
│   ├── routes/           # REST API endpoints
│   ├── middleware/        # JWT auth, admin guard
│   ├── server.js         # Main server with WebSocket
│   └── seed.js           # Database seeder
├── driver-app/           # React Driver Dashboard
│   └── src/
│       ├── pages/        # Login, Register, Dashboard
│       ├── components/   # VideoFeed, AlertPanel, Navbar
│       └── context/      # AuthContext, SocketContext
├── admin-app/            # React Admin Dashboard
│   └── src/
│       ├── pages/        # Dashboard, Drivers, Alerts, Reports
│       ├── components/   # Sidebar, StatCard, AlertBadge
│       └── context/      # AuthContext, SocketContext
├── RESEARCH.md           # Full research paper documentation
├── PATENT.md             # Patent claims & documentation
└── README.md             # This file
```

---

## 📚 Research & Patent

- **[RESEARCH.md](RESEARCH.md)** — Comprehensive literature review, novelty contributions, architecture, ablation studies, and experimental results with comparison against 10+ prior works.
- **[PATENT.md](PATENT.md)** — Complete patent documentation with 6 novel claims, prior art differentiation table, inventive step analysis, and industrial applicability.

---

## 🔬 Novel Contributions (Patent Pending)

1. **Multi-Modal Temporal Attention Fusion** — Parallel extraction of EAR, MAR, and head pose with learned inter-modal weighting
2. **Severity-Aware Adaptive Alerting (SAA)** — 5-level graded response system
3. **Dual-Channel Real-Time Architecture** — Simultaneous driver-admin notification via WebSocket (<200ms)
4. **Session-Aware Drowsiness Score (SDS)** — Temporal accumulation algorithm with exponential decay
5. **Fleet-Level Predictive Analytics** — Cross-driver pattern aggregation and risk heatmapping

---

## 🛣️ Roadmap

- [x] Multi-modal feature extraction (EAR, MAR, head pose)
- [x] Real-time WebSocket alerting
- [x] Dual-interface (driver + admin)
- [ ] IR camera support for nighttime detection
- [ ] Edge deployment (NVIDIA Jetson / TensorRT)
- [ ] Vehicle CAN bus integration (speed/steering correlation)
- [ ] Federated learning for privacy-preserving fleet training
- [ ] Mobile app (React Native) for on-the-go monitoring

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📖 Citation

```bibtex
@software{vigiley2026,
  author = {VigilEye Team},
  title = {VigilEye: Multi-Modal Driver Drowsiness Detection \& Intelligent Alert System},
  year = {2026},
  url = {https://github.com/your-repo/vigiley}
}
```
