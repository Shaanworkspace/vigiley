import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { driverAPI } from '../services/api';
import { Play, Square, AlertTriangle, CheckCircle2, AlertOctagon, Siren } from 'lucide-react';

const EAR_CLOSED = 0.28;
const EAR_LOW = 0.34;
const MAR_THRESHOLD = 0.40;
const MAR_HALF = 0.30;
const PERCLOS_WINDOW = 60;

const FRAMES_CLOSED = 1;
const FRAMES_MICRO = 2;
const FRAMES_DROWSY = 3;
const FRAMES_CRITICAL = 5;
const FRAMES_YAWN = 2;
const FRAMES_RESET = 5;

const UI_SYNC_MS = 150;
const SEND_MS = 1000;

const EAR_WARN = [
  { min: 0.34, max: 99, msg: ['Eyes alert and open', 'Normal eye openness', 'Eyes wide — good'], lv: 0 },
  { min: 0.31, max: 0.34, msg: ['Your eyelids are drooping — stay focused!', 'Keep your eyes wide open!', 'Stay alert! Dont let your eyes close!', 'Eyelids heavy — shift your attention!', 'Drowsiness starting — fight it!'], lv: 1 },
  { min: 0.28, max: 0.31, msg: ['Eyes getting heavy! Wake up!', 'Open your eyes wider!', 'Dont close your eyes! Stay with us!', 'Heavy eyelids detected! Move around!', 'Blink fully — keep eyes wide!'], lv: 2 },
  { min: 0.22, max: 0.28, msg: ['Open your eyes NOW!', 'Eyes closing — snap out of it!', 'Stay awake! Open your eyes!', 'DROWSINESS DETECTED! Wake up!', 'Your eyes are shutting! Fight it!'], lv: 3 },
  { min: 0.15, max: 0.22, msg: ['EYES ALMOST CLOSED! WAKE UP!', 'CRITICAL: Open your eyes immediately!', 'You are falling asleep! WAKE UP!', 'DANGER: Eyes closing rapidly!', 'ALERT: Microsleep starting! Open eyes!'], lv: 4 },
  { min: -999, max: 0.15, msg: ['WAKE UP! YOUR EYES ARE CLOSED!', 'EMERGENCY! Open eyes NOW!', 'CRITICAL: Eyes closed — PULL OVER!', 'DANGER: You are not watching the road!', 'SYSTEM ALERT: Eyes shut for too long!'], lv: 5 },
];

const MAR_WARN = [
  { min: 0.30, max: 0.40, msg: ['Mouth opening — are you yawning?', 'Close your mouth gently', 'Yawning starting — take a deep breath', 'Mouth slightly open — stay aware', 'Early yawn detected — rest soon'], lv: 1 },
  { min: 0.40, max: 0.55, msg: ['Close your mouth! Yawning detected!', 'Yawning = fatigue! Take a break!', 'Excessive yawning — rest needed!', 'You are yawning — pull over soon!', 'Close your mouth and stretch!'], lv: 2 },
  { min: 0.55, max: 99, msg: ['HEAVY YAWNING! REST IMMEDIATELY!', 'Repeated yawning = drowsy! Take a break!', 'CRITICAL: Excessive yawning — stop driving!', 'DANGER: Yawning means fatigue! Rest now!', 'ALERT: Your body needs rest — pull over!'], lv: 3 },
  { min: -999, max: 0.30, msg: ['Mouth closed — good', 'Normal mouth position', 'Lips sealed — correct'], lv: 0 },
];

const PERCLOS_WARN = [
  { min: 0, max: 10, msg: ['Eyes staying open — good', 'Normal eye closure rate', 'Blink rate healthy'], lv: 0 },
  { min: 10, max: 20, msg: ['Eyes closing frequently — stay alert!', 'Blinking more than usual — focus!', 'Eye closure increasing — wake up!', 'Frequent blinks = early fatigue', 'Your eyes are closing too often!'], lv: 1 },
  { min: 20, max: 30, msg: ['HIGH eye closure rate! Wake up!', 'Eyes closed 20%+ of the time!', 'Drowsiness building — take action!', 'Warning: You are checking out!', 'Eye closure elevated — dangerous!'], lv: 2 },
  { min: 30, max: 50, msg: ['CRITICAL: Eyes closed 30%+ — PULL OVER!', 'DANGER: Extreme eye closure! Stop now!', 'EMERGENCY: You are not watching the road!', 'PERCLOS critical — immediate rest required!', 'ALERT: 30%+ eye closure = microsleep risk!'], lv: 3 },
  { min: 50, max: 999, msg: ['CRITICAL: Half your eyes are closed! PULL OVER!', 'EMERGENCY: SYSTEM ALERT! Stop NOW!', 'DANGER: You are asleep at the wheel!', 'IMMEDIATE ACTION — STOP DRIVING!', 'LIFE SAFETY: Eyes closed 50%+!'], lv: 4 },
];

const STATE_WARN = {
  awake:         ['All clear — driving safely', 'Normal driving state', 'You are alert and focused'],
  heavy_eyelids: ['Wake up! Open your eyes wider!', 'Dont let your eyelids get heavy!', 'Stay sharp — eyes drooping!', 'Fight the drowsiness! Move around!', 'Alert: Early drowsiness signs detected!'],
  mouth_open:    ['Close your mouth', 'Mouth open — stay focused on the road', 'Keep your mouth closed while driving'],
  eyes_closed:   ['Open your eyes!', 'Eyes closed — look at the road!', 'You closed your eyes! Stay awake!', 'WAKE UP! Watch the road!'],
  yawning:       ['Yawning = tired! Take a break!', 'Excessive yawning — rest needed', 'Close your mouth and rest your eyes', 'Yawn detected! You need to rest!'],
  microsleep:    ['MICROSLEEP DETECTED! WAKE UP!', 'You almost fell asleep! Open eyes!', 'ALERT: Microsleep episode! Wake up!', 'DANGER: You nodded off! Snap out!'],
  drowsy:        ['DROWSY! PULL OVER AND REST!', 'You are too drowsy to drive! Stop!', 'DANGER: Drowsy driving detected!', 'ALERT: Your reaction time is compromised!'],
  high_risk:     ['EMERGENCY! STOP DRIVING NOW!', 'CRITICAL DROWSINESS! Pull over!', 'DANGER: Immediate rest required!', 'SYSTEM: High risk — stop the vehicle!'],
  critical:      ['CRITICAL ALERT! SYSTEM EMERGENCY!', 'LIFE SAFETY: Stop driving immediately!', 'FATAL RISK DETECTED! PULL OVER NOW!', 'EMERGENCY PROTOCOL ACTIVATED!'],
};

const LV = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#b91c1c'];

const LEFT_EYE = [33, 158, 159, 133, 153, 144];
const RIGHT_EYE = [362, 385, 386, 263, 373, 374];
const MAR_UPPER = [13, 14];
const MAR_LOWER = [78, 308];
const MAR_L_CORNER = 61;
const MAR_R_CORNER = 291;

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function aspect(eye, lms) {
  const a = dist(lms[eye[1]], lms[eye[5]]);
  const b = dist(lms[eye[2]], lms[eye[4]]);
  const c = dist(lms[eye[0]], lms[eye[3]]) || 1e-6;
  return (a + b) / (2 * c);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function WarningIcon({ lv }) {
  const c = LV[lv || 0];
  const size = 16;
  if (lv >= 4) return <Siren size={size} color={c} />;
  if (lv >= 3) return <AlertOctagon size={size} color={c} />;
  if (lv >= 1) return <AlertTriangle size={size} color={c} />;
  return <CheckCircle2 size={size} color={c} />;
}

function WarningBar({ label, value, warns }) {
  const w = warns.find(x => value >= x.min && value < x.max) || warns[warns.length - 1];
  const msg = Array.isArray(w?.msg) ? pick(w.msg) : (w?.msg || '');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 8,
      background: `${LV[w?.lv || 0]}12`, borderLeft: `3px solid ${LV[w?.lv || 0]}`,
      transition: 'all 0.2s',
    }}>
      <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}><WarningIcon lv={w?.lv} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: 12, color: LV[w?.lv || 0], fontWeight: 700, lineHeight: 1.3 }}>{msg}</div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 800, color: LV[w?.lv || 0],
        background: `${LV[w?.lv || 0]}18`, padding: '2px 8px', borderRadius: 6,
        whiteSpace: 'nowrap',
      }}>{value > 3 ? value.toFixed(value > 20 ? 0 : 1) : value.toFixed(2)}{value > 3 ? (value > 20 ? '%' : '') : ''}</div>
    </div>
  );
}

export default function VideoFeed({ onStatusChange }) {
  const wc = useRef(null);
  const rafRef = useRef(null);
  const [on, setOn] = useState(false);
  const [se, setSe] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelErr, setModelErr] = useState('');

  const [ear, setEar] = useState(0.35);
  const [mar, setMar] = useState(0.25);
  const [perclos, setPerclos] = useState(0);
  const [conf, setConf] = useState(0);
  const [st, setSt] = useState('awake');
  const [cc, setCc] = useState(0);
  const [yc, setYc] = useState(0);
  const [noFace, setNoFace] = useState(false);
  const [err, setErr] = useState('');

  const model = useRef(null);
  const earHistory = useRef([]);
  const counters = useRef({ close: 0, yawn: 0, normal: 0, perclos: 0, state: 'awake', conf: 0 });
  const lastGood = useRef({ ear: 0.35, mar: 0.25, st: 'awake' });
  const lastUI = useRef(0);
  const lastSend = useRef(0);
  const running = useRef(false);

  const initModel = useCallback(async () => {
    try {
      const fileset = await FilesetResolver.forVisionTasks('/wasm');
      const landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: '/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        minFaceDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      model.current = landmarker;
      setModelReady(true);
    } catch (_) {
      try {
        const fileset = await FilesetResolver.forVisionTasks('/wasm');
        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: '/face_landmarker.task', delegate: 'CPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
        });
        model.current = landmarker;
        setModelReady(true);
      } catch (e) {
        setModelErr('AI model failed to load — check camera permissions');
      }
    }
  }, []);

  useEffect(() => { initModel(); return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }; }, [initModel]);

  const evaluate = useCallback((earValue, marValue) => {
    const c = counters.current;
    const h = earHistory.current;
    h.push(earValue);
    if (h.length > 300) h.splice(0, 100);
    const windowEars = h.slice(-PERCLOS_WINDOW);
    c.perclos = windowEars.filter(e => e < EAR_CLOSED).length / windowEars.length;

    const eyesClosed = earValue < EAR_CLOSED;
    const heavyLids = EAR_LOW > earValue && earValue >= EAR_CLOSED;
    const halfMouth = marValue > MAR_HALF;
    const mouthOpen = marValue > MAR_THRESHOLD;
    const yawnCombo = halfMouth && heavyLids;

    if (eyesClosed) {
      c.close += 1; c.yawn = 0; c.normal = 0;
    } else if (mouthOpen || yawnCombo) {
      c.yawn += 1; c.normal = 0;
    } else if (heavyLids) {
      c.yawn = 0; c.normal = 0;
    } else {
      c.normal += 1;
      if (c.normal >= FRAMES_RESET) { c.close = 0; c.yawn = 0; }
    }

    let state = 'awake';
    let confV = 0;

    if (c.close >= FRAMES_CRITICAL || c.perclos > 0.50) {
      state = 'critical'; confV = Math.min(0.90 + c.perclos * 0.1, 0.98);
    } else if (c.close >= FRAMES_DROWSY && c.perclos > 0.30) {
      state = 'high_risk'; confV = Math.min(0.80 + c.perclos * 0.2, 0.95);
    } else if (c.close >= FRAMES_DROWSY) {
      state = 'drowsy'; confV = Math.min(0.70 + c.close / 300 + c.perclos, 0.92);
    } else if (c.close >= FRAMES_MICRO) {
      state = 'microsleep'; confV = Math.min(0.45 + c.close / 200, 0.75);
    } else if (c.yawn >= FRAMES_YAWN) {
      state = 'yawning'; confV = Math.min(0.40 + c.yawn / 180 + 0.2, 0.85);
    } else if (eyesClosed && c.close >= FRAMES_CLOSED) {
      state = 'eyes_closed'; confV = Math.min(0.20 + c.close / 300, 0.40);
    } else if (heavyLids) {
      state = 'heavy_eyelids'; confV = Math.min(0.10 + (EAR_LOW - earValue) * 2.5, 0.20);
    } else if (mouthOpen) {
      state = 'mouth_open'; confV = Math.min(0.10 + (marValue - MAR_THRESHOLD) * 1.0, 0.40);
    }

    c.state = state;
    c.conf = confV;
    return state;
  }, []);

  const loop = useCallback(async (ts) => {
    if (!running.current) return;
    const video = wc.current?.video;
    if (video && video.readyState >= 2 && model.current) {
      try {
        const res = model.current.detectForVideo(video, ts);
        if (res.faceLandmarks && res.faceLandmarks.length > 0) {
          const lms = res.faceLandmarks[0];
          const earVal = (aspect(LEFT_EYE, lms) + aspect(RIGHT_EYE, lms)) / 2;
          const upper = MAR_UPPER.map(i => lms[i]);
          const lower = MAR_LOWER.map(i => lms[i]);
          const a = dist(upper[0], lower[1]);
          const b = dist(upper[1], lower[0]);
          const cC = dist(lms[MAR_L_CORNER], lms[MAR_R_CORNER]) || 1e-6;
          const marVal = (a + b) / (2 * cC);
          const state = evaluate(earVal, marVal);
          lastGood.current = { ear: earVal, mar: marVal, st: state, conf: counters.current.conf, perclos: counters.current.perclos, cc: counters.current.close, yc: counters.current.yawn };
          setNoFace(false);

          const now = performance.now();
          if (now - lastUI.current >= UI_SYNC_MS) {
            lastUI.current = now;
            setEar(earVal); setMar(marVal);
            setPerclos(counters.current.perclos * 100);
            setConf(counters.current.conf * 100);
            setSt(state); setCc(counters.current.close); setYc(counters.current.yawn);
          }
          if (now - lastSend.current >= SEND_MS) {
            lastSend.current = now;
            driverAPI.sendDetection({
              status: state,
              confidence: counters.current.conf,
              eyeAspectRatio: earVal,
              mouthAspectRatio: marVal,
              headPitch: 0,
              headYaw: 0,
              perclos: counters.current.perclos,
            }).catch(() => {});
          }
        } else {
          setNoFace(true);
        }
      } catch (_) {}
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [evaluate]);

  const start = async () => {
    try {
      await driverAPI.startSession();
      setSe(true); setOn(true); setNoFace(false);
      counters.current = { close: 0, yawn: 0, normal: 0, perclos: 0, state: 'awake', conf: 0 };
      earHistory.current = [];
      running.current = true;
      rafRef.current = requestAnimationFrame(loop);
    } catch (_) {}
  };

  const stop = async () => {
    running.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setOn(false); setNoFace(false); setErr('');
    try { await driverAPI.endSession(); } catch (_) {}
  };

  const displaySt = noFace ? lastGood.current.st : st;
  const displayEar = noFace ? lastGood.current.ear : ear;
  const displayMar = noFace ? lastGood.current.mar : mar;
  const displayPl = noFace ? (lastGood.current.perclos || 0) * 100 : perclos;
  const displayCc = noFace ? (lastGood.current.cc || 0) : cc;
  const displayYc = noFace ? (lastGood.current.yc || 0) : yc;
  const displayConf = noFace ? ((lastGood.current.conf || 0) * 100) : conf;

  useEffect(() => {
    if (onStatusChange) onStatusChange(on && !noFace ? st : null);
  }, [st, noFace, on, onStatusChange]);

  const isAlert = ['drowsy', 'high_risk', 'critical', 'microsleep'].includes(displaySt);
  const ec = displayEar >= EAR_LOW ? LV[0] : displayEar >= EAR_CLOSED ? LV[2] : LV[4];
  const mouthHalf = displayMar >= MAR_HALF && displayEar < EAR_LOW;
  const mc = displayMar >= MAR_THRESHOLD ? LV[2] : mouthHalf ? LV[1] : LV[0];

  return (
    <div className="vf-root" style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(4px)',
    }}>
      <div className="vf-video" style={{ position: 'relative', background: '#0f172a', aspectRatio: '4/3', overflow: 'hidden' }}>
        <Webcam ref={wc} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          mirrored videoConstraints={{ facingMode: 'user', width: 320, height: 240 }} />

        {!modelReady && !modelErr && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 4, background: 'rgba(2,6,23,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 34, height: 34, margin: '0 auto 12px', borderRadius: '50%',
                border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Loading AI model…</p>
            </div>
          </div>
        )}

        {!on && modelReady && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.75)', zIndex: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>
              {se ? 'Detection paused' : 'Press start to begin'}
            </p>
          </div>
        )}

        {on && noFace && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 4,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b', textAlign: 'center', padding: '0 20px', lineHeight: 1.3 }}>
              FACE NOT VISIBLE
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', padding: '0 20px' }}>
              Move to center of camera frame
            </div>
            <div style={{
              marginTop: 12, width: 180, height: 3, background: 'rgba(255,255,255,0.08)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: '60%', background: '#ef4444', borderRadius: 2,
                animation: 'pulse 0.8s ease-in-out infinite',
              }} />
            </div>
          </div>
        )}

        {on && !noFace && isAlert && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${LV[4]}33 0%, transparent 70%)`,
            animation: 'af 0.6s ease-in-out infinite',
          }}>
            <div style={{
              fontSize: displaySt === 'critical' || displaySt === 'high_risk' ? 26 : 20,
              fontWeight: 900, color: '#fff', textShadow: `0 0 30px ${LV[4]}, 0 0 60px ${LV[4]}44`,
              textAlign: 'center', padding: '0 16px', lineHeight: 1.3,
            }}>
              {pick(STATE_WARN[displaySt] || [displaySt])}
            </div>
          </div>
        )}

        {on && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 10px',
            background: isAlert ? 'linear-gradient(#000000cc, transparent)' : 'linear-gradient(rgba(0,0,0,0.6), transparent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%',
                background: noFace ? LV[2] : isAlert ? LV[4] : LV[0],
                animation: 'pulse 0.6s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
                {noFace ? 'NO FACE' : 'LIVE'}
              </span>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
              background: `${isAlert ? LV[4] : noFace ? LV[2] : LV[0]}25`,
              color: isAlert ? LV[4] : noFace ? LV[2] : LV[0],
              textTransform: 'uppercase',
            }}>
              {noFace ? 'Unavailable' : displaySt.replace('_', ' ')}
            </div>
          </div>
        )}

        {on && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 6,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
            padding: '24px 10px 8px', display: 'flex', gap: 8,
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: ec }}>{displayEar.toFixed(2)}</div>
              <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>EAR</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: mc }}>{displayMar.toFixed(2)}</div>
              <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>MAR</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontSize: 16, fontWeight: 800,
                color: displayPl > 30 ? LV[4] : displayPl > 10 ? LV[2] : LV[0],
              }}>{displayPl.toFixed(0)}%</div>
              <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>PERCLOS</div>
            </div>
          </div>
        )}
      </div>

      {on && (
        <div className="vf-extra" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <WarningBar label="Eyes (EAR)" value={displayEar} warns={EAR_WARN} />
          <WarningBar label="Mouth (MAR)" value={displayMar} warns={MAR_WARN} />
          <WarningBar label="Fatigue (PERCLOS)" value={displayPl} warns={PERCLOS_WARN} />

          {noFace && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              padding: '10px', marginTop: 4, borderRadius: 8,
              background: `${LV[2]}18`, border: `1.5px solid ${LV[2]}44`,
              animation: 'af 1s ease-in-out infinite',
            }}>
              <AlertTriangle size={18} color={LV[2]} />
              <span style={{ fontSize: 13, fontWeight: 800, color: LV[2] }}>
                Face not detected! Stay in frame
              </span>
            </div>
          )}

          {isAlert && !noFace && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              padding: '10px', marginTop: 4, borderRadius: 8,
              background: `${LV[4]}18`, border: `1.5px solid ${LV[4]}44`,
              animation: 'af 0.8s ease-in-out infinite',
            }}>
              <AlertTriangle size={18} color={LV[4]} />
              <span style={{ fontSize: 13, fontWeight: 800, color: LV[4] }}>
                {pick(STATE_WARN[displaySt] || [displaySt])}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, color: '#64748b', marginBottom: 1 }}>EYES: {displayCc}f / 90f</div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: LV[4], width: `${Math.min(displayCc / 90 * 100, 100)}%`, transition: 'width 0.2s' }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, color: '#64748b', marginBottom: 1 }}>YAWN: {displayYc}f / 15f</div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: LV[2], width: `${Math.min(displayYc / 15 * 100, 100)}%`, transition: 'width 0.2s' }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, color: '#64748b', marginBottom: 1 }}>CONF: {displayConf.toFixed(0)}%</div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: displayConf > 70 ? LV[4] : displayConf > 40 ? LV[2] : LV[0], width: `${displayConf}%`, transition: 'width 0.2s' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {err && !noFace && (
        <div style={{ fontSize: 10, color: LV[2], textAlign: 'center', padding: '4px 10px' }}>{err}</div>
      )}

      <button onClick={on ? stop : start} disabled={!modelReady && !modelErr} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: 10, margin: 10, borderRadius: 8,
        border: '1.5px solid', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        width: 'calc(100% - 20px)',
        opacity: !modelReady && !modelErr ? 0.5 : 1,
        background: on ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        color: on ? '#fca5a5' : '#86efac',
        borderColor: on ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
      }}>
        {on ? <Square size={14} /> : <Play size={14} />}
        {on ? 'Stop Monitoring' : 'Start Monitoring'}
      </button>
      <style>{`
        @keyframes pulse {50%{opacity:0.4}}
        @keyframes af {0%,100%{opacity:1} 50%{opacity:0.65}}
        @keyframes spin {to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
