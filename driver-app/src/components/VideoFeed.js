import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { driverAPI } from '../services/api';
import { Play, Square, Activity, Camera } from 'lucide-react';

const ML_API = process.env.REACT_APP_ML_API || 'https://vigiley-ml.onrender.com';
const CAPTURE_INTERVAL = 2500;
const EAR_CLOSED = 0.20;
const EAR_LOW = 0.25;
const MAR_YAWN = 0.50;

const STATE_META = {
  awake:        { label: 'Awake',        color: '#22c55e', risk: 0 },
  heavy_eyelids:{ label: 'Heavy Eyelids',color: '#eab308', risk: 1 },
  mouth_open:   { label: 'Mouth Open',   color: '#a3e635', risk: 1 },
  eyes_closed:  { label: 'Eyes Closed',  color: '#f97316', risk: 2 },
  yawning:      { label: 'Yawning',      color: '#f59e0b', risk: 2 },
  microsleep:   { label: 'Microsleep',   color: '#ea580c', risk: 3 },
  drowsy:       { label: 'Drowsy',       color: '#ef4444', risk: 4 },
  high_risk:    { label: 'High Risk',    color: '#b91c1c', risk: 5 },
  critical:     { label: 'Critical',     color: '#7f1d1d', risk: 5 },
};

export default function VideoFeed() {
  const wc = useRef(null);
  const iv = useRef(null);
  const [on, setOn] = useState(false);
  const [se, setSe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [ear, setEar] = useState(0);
  const [mar, setMar] = useState(0);
  const [perclos, setPerclos] = useState(0);
  const [conf, setConf] = useState(0);
  const [st, setSt] = useState('awake');
  const [cc, setCc] = useState(0);
  const [yc, setYc] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => () => iv.current && clearInterval(iv.current), []);

  const detect = useCallback(async () => {
    const img = wc.current?.getScreenshot();
    if (!img) return;
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`${ML_API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img.split(',')[1] }),
      });
      if (!res.ok) { setErr('ML API error'); return; }
      const d = await res.json();
      if (!d.face_detected) { setErr('No face'); return; }
      setEar(d.ear);
      setMar(d.mar);
      setPerclos(d.perclos * 100);
      setConf(d.confidence * 100);
      setSt(d.status);
      setCc(d.close_counter);
      setYc(d.yawn_counter);
      driverAPI.sendDetection(d).catch(() => {});
    } catch {
      setErr('ML API unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  const start = async () => {
    try {
      await driverAPI.startSession();
      setSe(true);
      setOn(true);
      detect();
      iv.current = setInterval(detect, CAPTURE_INTERVAL);
    } catch (_) {}
  };

  const stop = async () => {
    if (iv.current) { clearInterval(iv.current); iv.current = null; }
    setOn(false);
    try { await driverAPI.endSession(); } catch (_) {}
  };

  const m = STATE_META[st] || STATE_META.awake;

  const earLabel = ear >= EAR_LOW ? 'Open' : ear >= EAR_CLOSED ? 'Heavy' : 'Closed';
  const earColor = ear >= EAR_LOW ? '#22c55e' : ear >= EAR_CLOSED ? '#eab308' : '#ef4444';
  const marLabel = mar >= MAR_YAWN ? 'Yawning' : 'Closed';
  const marColor = mar >= MAR_YAWN ? '#f59e0b' : '#22c55e';
  const plLabel = perclos > 30 ? 'High' : perclos > 10 ? 'Elevated' : 'Normal';
  const plColor = perclos > 30 ? '#ef4444' : perclos > 10 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(4px)',
    }}>
      <div style={{ position: 'relative', background: '#0f172a', aspectRatio: '4/3', overflow: 'hidden' }}>
        <Webcam ref={wc} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          screenshotFormat="image/jpeg" mirrored videoConstraints={{ facingMode: 'user', width: 640, height: 480 }} />
        {!on && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.7)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <Camera size={36} color="#475569" />
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
              {se ? 'Detection paused' : 'Press start to begin'}
            </p>
          </div>
        )}
        {on && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: loading ? 'rgba(59,130,246,0.85)' : 'rgba(239,68,68,0.85)',
            color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '1px',
            padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#fff', animation: loading ? '' : 'pulse 1.5s ease-in-out infinite',
            }} />
            {loading ? 'PROCESSING' : 'LIVE'}
          </div>
        )}
        {on && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '20px 12px 10px', display: 'flex', gap: 10,
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: earColor }}>{ear.toFixed(2)}</div>
              <div style={{ fontSize: 9, color: earColor, fontWeight: 600, textTransform: 'uppercase' }}>{earLabel}</div>
              <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>EAR</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: marColor }}>{mar.toFixed(2)}</div>
              <div style={{ fontSize: 9, color: marColor, fontWeight: 600, textTransform: 'uppercase' }}>{marLabel}</div>
              <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>MAR</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: plColor }}>{perclos.toFixed(0)}%</div>
              <div style={{ fontSize: 9, color: plColor, fontWeight: 600, textTransform: 'uppercase' }}>{plLabel}</div>
              <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>PERCLOS</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color={m.color} />
            <span style={{ fontWeight: 700, fontSize: 14, color: m.color, textTransform: 'capitalize' }}>
              {m.label}
            </span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: m.color,
            background: `${m.color}18`, padding: '2px 10px', borderRadius: 12,
          }}>
            Risk {m.risk}/5
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 2, fontWeight: 600 }}>
            <span>Eyes Closed: {cc}f</span>
            <span>Yawn: {yc}f</span>
            <span>Confidence: {conf.toFixed(0)}%</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#ef4444', width: `${Math.min(cc / 60 * 100, 100)}%`, transition: 'width 0.3s', borderRadius: 3 }} />
            </div>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#f59e0b', width: `${Math.min(yc / 20 * 100, 100)}%`, transition: 'width 0.3s', borderRadius: 3 }} />
            </div>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width 0.3s, background 0.3s',
                width: `${conf}%`, background: conf > 70 ? '#ef4444' : conf > 40 ? '#f59e0b' : '#22c55e',
              }} />
            </div>
          </div>
        </div>

        {err && (
          <div style={{ fontSize: 11, color: '#f59e0b', textAlign: 'center' }}>{err}</div>
        )}
      </div>

      <button onClick={on ? stop : start} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: 12, margin: 16, borderRadius: 10,
        border: '1.5px solid', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
        width: 'calc(100% - 32px)',
        background: on ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        color: on ? '#fca5a5' : '#86efac',
        borderColor: on ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
      }}>
        {on ? <Square size={15} /> : <Play size={15} />}
        {on ? 'Stop Monitoring' : 'Start Monitoring'}
      </button>
      <style>{`@keyframes pulse {50%{opacity:0.4}}`}</style>
    </div>
  );
}
