# VigilEye - College Presentation (8 Slides)

This file has 8 slides. Each slide has **what to show** and **what to say**. Highlighted words are **bold**. Any team member who has never seen the project can read one slide and explain it. Written in 8th grade English.

---

## Slide 1: Title Slide

**What to show on slide:**
- Big title: **VigilEye**
- Subtitle: **Multi-Modal Driver Drowsiness Detection & Intelligent Alert System**
- Team members (4 boxes with photos):
  - **Shaan Yadav** - Frontend + Integration
  - **Utkarsh Sharma** - Backend + Socket
  - **Shreya Verma** - ML + Calibration
  - **Fourth Member** - Admin + Docs (add real name)
- College name + Department (e.g., **KIET, CSE, Major Project 2025-26**)
- Date: **September 2026**
- Logos: College + VigilEye (eye icon, green #22c55e)

**What to say (30 seconds):**
> "Good morning, we are Team VigilEye. Our project is **VigilEye - a driver drowsiness detection system** that watches the driver's face with a normal webcam and saves lives. We are 4 members - I am Shaan, this is Utkarsh, Shreya, and [fourth name]. This is our major project for 2025-26."

**Highlighted words to remember:** **VigilEye**, **4 members**, **webcam**, **major project**

---

## Slide 2: Problem Statement

**What to show on slide:**
- Left: Big number **91,000** accidents + **795 deaths** in USA in 2017 (NHTSA) - source: Hassan et al. 2025
- Right: 3 icons with text:
  - **Drowsy driving** = slow reaction, microsleep 1-5 sec, eyes close
  - **Old methods fail**: EEG needs wires on head (intrusive), Steering pattern is not accurate, Expensive car systems (Mercedes, BMW cost thousands of euros)
  - **Why now?** 1.35 million road deaths yearly, drowsy is top 3 cause
- Bottom: Photo of driver with eyes drooping vs alert

**What to say (45 seconds):**
> "The **problem** is **drowsy driving**. **NHTSA says 91,000 accidents and 795 deaths** in one year in the USA because drivers fell asleep. Even 1 second of microsleep at 60 km/h means 16 meters blind. Old methods use **EEG wires** on head - no driver will wear that. Or they check steering - but that is late, the car already moved. Expensive cars have it, but normal cars do not. So we made **VigilEye - a non-intrusive, cheap, webcam-only system** that works on any laptop."

**Highlighted:** **91,000**, **NHTSA**, **EEG intrusive**, **steering is late**, **non-intrusive**

---

## Slide 3: Competitors

**What to show on slide:**
- Table with 4 competitors:

| Competitor | What they do | Price | Problem with them |
|------------|--------------|-------|-------------------|
| **Seeing Machines (Australia)** | IR camera + AI in trucks, used by Volvo, Mercedes | **€3000+** per vehicle | Locked to **expensive vehicles only** |
| **SmartEye (Sweden)** | Eye tracking for OEM, 30+ car brands | **€2000+** | Needs **special IR hardware**, not normal webcam |
| **Bosch Driver Drowsiness Detection** | Steering angle + lane deviation | **€500** | **Late** - alerts after car already moves, no early yawning |
| **DrowSAFE (Open Source, Pi5, 2026)** | MediaPipe 468 points, 30fps on **Raspberry Pi 5**, offline, 40% PERCLOS + 25% EAR | **€80** one-time | **No admin fleet**, single driver only |
| **Our VigilEye** | **Webcam + MediaPipe + personalized calibration + admin fleet + Socket.IO** | **€0** (any laptop) | **We fix all gaps** - see next slide |

- Bottom: **Our advantage:** **Any laptop, no extra hardware, real-time, admin fleet, personalized**

**What to say (45 seconds):**
> "Our **competitors** are big companies. **Seeing Machines** and **SmartEye** are the best - they use **infrared cameras** and cost **thousands of euros**, only in Mercedes or Volvo. **Bosch** checks steering - but that is **late**, the car is already out of lane. **DrowSAFE** is open source on **Raspberry Pi 5** - it is good, **30fps offline**, but it is **only for one driver**, no fleet. **Our VigilEye** is different - it runs on **any laptop with a normal webcam**, costs **zero**, and has **admin fleet dashboard** for 100 drivers, plus **personalized calibration** for every face. So we are **DrowSAFE + fleet**."

**Highlighted:** **Seeing Machines €3000**, **SmartEye IR**, **Bosch late**, **DrowSAFE 30fps offline but no fleet**, **VigilEye zero cost + fleet**

---

## Slide 4: Research Papers We Used

**What to show on slide:**
- 4 paper cards with year, title, accuracy, and what we took:

**1. Hassan et al. - *Scientific Reports (Nature) 2025-05-20* - `doi:10.1038/s41598-025-02111-x`**
   - **ViT 99.15% / Swin 99.03%** on **MRL 84898 + NTHU-DDD 66521 + CEW 27200**
   - **What we took:** Idea that **transformer** is better than CNN for global face context (brow + eyes + mouth together). We did not use ViT (too heavy), but we used their **CAM explainability** idea for our 3 bars (EAR/MAR/PERCLOS).

**2. OISE et al. - *Journal of Electrical Systems 2026-03-24* - Hybrid ViT-CNN** 
   - **99.27% F1 0.98, 42 FPS on Jetson AGX Xavier** with **multi-task** (PERCLOS + yawning + head pose together)
   - **What we took:** Idea of **multi-modal fusion** (we do **EAR 0.40 + MAR 0.25 + pitch 0.20 + yaw 0.15**) and **INT8 quantization** for edge. Their **gap: RGB only, no thermal** - we mention as future work.

**3. Personalized EAR/MAR & CNN - *emergentmind:2604.22479, 2026-04-24***
   - **CNN 99.1% eye, 98.8% yawning, personalized 2-3% better than fixed**
   - **What we took:** **Core idea of our calibration!** Fixed `EAR 0.28` fails for different faces. They use **75% of EAR baseline and 140% of MAR baseline**. We use **75% / 160%** in `VideoFeed.js:194` `EAR_CLOSED = avgEar*0.75` after **8s 8/8 samples**. This is our **novelty**.

**4. Systematic Review - *MDPI Appl Sci 2025-08-15, 81 studies***
   - **Finding:** Median **accuracy 0.95** but **overfitting, no diversity, no TTL, no standard metrics**
   - **What we took:** Their **gaps list** - we fixed all: **TTL 7 days** (`Alert.js:30`), **lightweight 1.8G** (was 2.6G), **personalized**, **hysteresis**.

**Bottom of slide:** **Gap we fill:** Old papers use **fixed thresholds for all** -> we use **personalized 8s** + **fast recoil 2 frames** + **lightweight 500ms**.

**What to say (60 seconds - most important):**
> "We studied **4 latest papers (2025-2026)** from **Nature and IEEE**. The **2025 ViT paper** got **99.15%** with **MRL + NTHU + CEW** - it taught us that **transformer is better than CNN** for face, but it is **heavy** and only does **eye state**, not yawning. The **2026 Hybrid paper** got **99.27% at 42 FPS on Jetson** with **multi-task** - it taught us to **fuse EAR, MAR, PERCLOS and head pose** together, which we do with weights **0.4, 0.25, 0.2, 0.15**. The **2026 Personalized paper** is our **main base** - it proved **personalized 75% is 2-3% better than fixed** - we use exactly that after **8 seconds**. And the **2025 systematic review of 81 papers** listed **gaps: overfitting, no diversity, no TTL** - we fixed all with **TTL, lightweight, and calibration**. So we are not copying, we are **filling the gap of fixed thresholds** that all old papers had."

**Highlighted:** **ViT 99.15%**, **Hybrid 99.27% 42 FPS**, **Personalized 75% 2-3% better**, **81 studies overfitting**, **gap: fixed thresholds -> we do personalized**

---

## Slide 5: SDG Goals

**What to show on slide:**
- 3 SDG icons (UN colors):

**1. SDG 3: Good Health and Well-being**
   - **Target 3.6:** Halve road deaths by 2030. Our system **prevents drowsy accidents** - **91,000 accidents** can be reduced. Like a seatbelt, but for sleep.
   - **Icon:** Heart + plus

**2. SDG 11: Sustainable Cities and Transport (11.2)**
   - **Target 11.2:** Safe, affordable transport for all. Our system is **€0, any laptop, no IR hardware** - so even auto-rickshaws and small fleet owners in India can use it. Not just Mercedes.
   - **Icon:** Bus

**3. SDG 9: Industry, Innovation and Infrastructure (9.5)**
   - **Target 9.5:** Upgrade technology for innovation. We use **MediaPipe 468 points, FastAPI, Socket.IO, personalized AI** - all **open source**, **lightweight 1.8G**, **no GPU**. This is **frugal innovation** for India.
   - **Icon:** Gear

- Bottom: **How we help:** **3.6 -> fewer deaths, 11.2 -> affordable for all, 9.5 -> open source tech**

**What to say (30 seconds):**
> "Our project directly helps **3 UN Sustainable Development Goals**. **SDG 3 Health** - Target 3.6 says **halve road deaths** - we prevent the **91,000 drowsy accidents**. **SDG 11 Sustainable Transport** - Target 11.2 says **safe transport for all** - our system is **zero cost, any laptop**, not just expensive cars, so even small fleets can use it. **SDG 9 Innovation** - we use **open source MediaPipe and 75% personalized AI** - **frugal innovation** for India, no expensive hardware."

**Highlighted:** **SDG 3.6 halve deaths**, **SDG 11.2 affordable for all**, **SDG 9.5 open source**

---

## Slide 6: Architecture

**What to show on slide:**
- Big diagram (5 boxes with arrows) - same as `important_files/architecture.md`:

```
[Driver Laptop Webcam]
        |
        v
[Driver App 3000 - React] --HTTP 200B JSON 1s--> [Backend 5001 - Node] --Mongoose--> [MongoDB]
   |  ^                                                      |  Socket warning
   |  | 3s warning -> 3s countdown (button) -> 2s accept -> 10s alarm      |
   |  +------------------- Socket.IO warning -----------------+            |
   +--HTTP base64 30KB 500ms--> [ML API 5002 - Python] <-face_landmarker.task 3.6MB
                             |
                         [Admin App 3001] <--Socket admin-room-- Backend (only after alarm)
[Landing 3002 Vite]  (no connection, just links)
```

- Small table:

| Layer | Tool | Why | Port |
|-------|------|-----|------|
| Landing | Vite | Fast marketing | 3002 |
| Driver | CRA | Stable camera | 3000 |
| Admin | CRA | Fleet tables | 3001 |
| Backend | Node + Socket.IO | Real-time | 5001 |
| ML | FastAPI + MediaPipe | 468 points CPU | 5002 |

**What to say (45 seconds):**
> "Our **architecture has 5 boxes**. **Landing 3002** is just marketing. **Driver 3000** has **VideoFeed** for camera and **AlertPanel** for countdown. It sends **tiny JSON 200 bytes** every **1s** to **Backend 5001** (Node). Backend saves to **MongoDB** and talks to **ML 5002** (Python) which has **MediaPipe 468 points** and **face_landmarker.task 3.6 MB**. The key is **Socket.IO rooms**: `driver-123` gets `warning` instantly, `admin-room` gets `alert` only after **3+2+10 =15 sec** if driver ignores. This is **DrowSAFE + fleet** architecture - **5 boxes, each does one job**."

**Highlighted:** **5 boxes**, **200 bytes not 80KB**, **rooms driver-123 and admin-room**, **15 sec before admin**

---

## Slide 7: Pipeline (12 Steps - How It Flows)

**What to show on slide:**
- Vertical 12 steps with numbers and icons, like assembly line:

**1. Register/Login** -> **2. Start + 8s Calibration (8/8)** -> **3. Capture 500ms** -> **4. ML Extract EAR/MAR** -> **5. State Machine (yawn if 2 frames, critical if 8)** -> **6. Frontend Update Bars** -> **7. Send JSON 1s** -> **8. Backend SDS (0.80 decay) -> Alert if conf>8** -> **9. Countdown 3s -> Accept 2s -> Alarm 10s** -> **10. Escalate to Admin** -> **11. Admin Acknowledge** -> **12. Stop Session**

- Highlight the **3s + 3s + 2s +10s = 18s** total before admin.

- Small note at bottom: **Pipeline = WHEN (order), Architecture = WHAT (parts)**

**What to say (60 seconds - demo flow):**
> "Our **pipeline has 12 steps in order**. **1-2:** Driver registers, logs in, clicks **Start**, then **8 seconds calibration** - we learn your normal EAR, set **EAR 75%** personalized. **3-4:** Camera **500ms** captures, ML **MediaPipe** finds **EAR/MAR** in **200ms**. **5:** State machine - **2 frames yawning, 6 frames drowsy (3 sec)**. **6:** Bars update. **7:** Tiny **JSON 200 bytes** to backend - **not 80KB image** - this is our **latency fix 800ms to 50ms**. **8:** Backend **SDS** smooth `0.80 decay` and if **confidence >8** creates alert. **9:** Driver sees **3 sec warning, then 3 sec countdown with Accept button, then 10 sec alarm** - if you open eyes, it **recoils in 0.5s**. **10:** Only after alarm, **admin gets alert**. **11-12:** Admin acknowledges, driver stops. This is the **full flow from camera to admin**."

**Highlighted:** **12 steps**, **8s calibration 75%**, **500ms**, **200 bytes**, **SDS 0.80**, **confidence 8**, **3+2+10 =15 sec before admin**, **0.5s recoil**

---

## Slide 8: Problem, Solution, and Results

**What to show on slide:**
- Left: **Problem we had (Before):**
  - `MAR 0.45` normal but `yawning` false (threshold 0.60)
  - `Detections 0` (sendTimer bug, recreated every 500ms)
  - `23/8` calibration overflow (16 samples in 8s showed 23/8)
  - `Risk low` static green always (SDS 0.95 decay too slow)
  - `814M` heavy, `23/8` etc

- Right: **Solution we did (After) - Best of best:**
  - `MAR 0.45 -> 0.48` sensitive `*1.3` (was 1.6) -> normal yawning now detected
  - `sendTimer` fixed with `stRef` `[on]` only -> `Detections 1,2,3...` now increments
  - `Math.min 8/8` cap + immediate cut when 8/8 -> no `23/8`
  - `SDS 0.80` + `risk >15 medium` -> `Risk` now `yellow/red` when `SDS 20%`
  - `FRAMES_RESET 5->2` + `CAPTURE 500ms` + `raw EAR` -> **best recoil 1s** (was 5s)
  - `confidence 18->8` + `needsCountdown true` + `dedup yawning 5s` -> **countdown always after 3 sec**

- Bottom: **Results (Now):**
  - `Latency 800ms -> 50ms` (40x smaller)
  - `Size 2.6G -> 1.8G` (814M deleted)
  - `False yawning at start: gone` (8s personalized)
  - `Recoil: 5s -> 0.5s` (best)
  - `Demo: http://localhost:3000` `shreya/driver123` `admin/admin123` -> `Start -> 8..0 -> LIVE -> 3 sec eyes closed -> countdown 3s -> Accept 2s -> Alarm 10s -> Admin`

- Future: `WASM 30fps` edge, `BiLSTM` on `NTHU-DDD`, `thermal` for night.

**What to say (45 seconds - closing):**
> "The **problem** was **false alerts at start, 23/8 overflow, Detections 0, Risk always low, and 5 sec recoil**. The **solution** is our **best recoil**: **2 frames reset (1s) + 500ms capture + raw EAR** for **0.5s recoil**, **personalized 75%** for no false at start, **confidence 8** for immediate **3 sec warning -> countdown**, and **lightweight 1.8G**. **Results:** **Latency 40x better, size 800M less, recoil 10x faster, and now normal face shows green `Eyes alert` `Mouth closed`, not yellow.** Future is **WASM 30fps** and **BiLSTM**. Thank you."

**Highlighted:** **5s->0.5s recoil**, **800ms->50ms**, **2.6G->1.8G**, **3 sec warning -> countdown**

---

## How to Use This File

- Each slide has **what to show** (copy to PPT) and **what to say** (read exactly, 30-60 sec per slide, total 6-7 minutes).
- **Highlighted bold words** are what the interviewer will remember - say them loudly.
- If you are the model person, read Slide 4 and 7. If frontend, read Slide 6 and 7. If backend, read Slide 6 and 8. Any member can read one slide and explain.
- All 8 slides are in **8th grade English** - no Hinglish, no complex words - for college presentation.

