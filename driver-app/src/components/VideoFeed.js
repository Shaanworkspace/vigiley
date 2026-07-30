import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { driverAPI } from '../services/api';
import { Play, Square, Activity } from 'lucide-react';

const ML_API = process.env.REACT_APP_ML_API || 'https://vigiley-ml.onrender.com';
const CAPTURE_INTERVAL = 1000;
const EAR_CLOSED = 0.20;
const EAR_LOW = 0.25;
const MAR_YAWN = 0.50;

const STATE_META = {
  awake:         { label: 'Awake',         color: '#22c55e', bg: '#052e16', risk: 0 },
  heavy_eyelids: { label: 'Heavy Eyelids', color: '#eab308', bg: '#422006', risk: 1 },
  mouth_open:    { label: 'Mouth Open',    color: '#a3e635', bg: '#1a2e05', risk: 1 },
  eyes_closed:   { label: 'Eyes Closed',   color: '#f97316', bg: '#431407', risk: 2 },
  yawning:       { label: 'Yawning',       color: '#f59e0b', bg: '#451a03', risk: 2 },
  microsleep:    { label: 'Microsleep',    color: '#ea580c', bg: '#3b0f02', risk: 3 },
  drowsy:        { label: 'Drowsy',        color: '#ef4444', bg: '#450a0a', risk: 4 },
  high_risk:     { label: 'High Risk',     color: '#dc2626', bg: '#450a0a', risk: 5 },
  critical:      { label: 'Critical',      color: '#b91c1c', bg: '#450a0a', risk: 5 },
};

const WARNINGS = {
  heavy_eyelids: { msg: 'Wake up! Open your eyes wider', icon: '!' },
  eyes_closed:   { msg: 'Open your eyes!',               icon: '!' },
  microsleep:    { msg: 'WAKE UP! Open your eyes immediately!', icon: '!!' },
  drowsy:        { msg: 'DANGER! Pull over and rest!',    icon: '!!!' },
  high_risk:     { msg: 'EMERGENCY! Stop driving now!',   icon: '!!!' },
  critical:      { msg: 'CRITICAL! System alert!',        icon: '!!!' },
  yawning:       { msg: 'Close your mouth. Take a break', icon: '!' },
  mouth_open:    { msg: 'Close your mouth',               icon: '!' },
};

export default function VideoFeed() {
  const wc = useRef(null);
  const iv = useRef(null);
  const [on, setOn] = useState(false);
  const [se, setSe] = useState(false);

  const [ear, setEar] = useState(0.35);
  const [mar, setMar] = useState(0.25);
  const [perclos, setPerclos] = useState(0);
  const [conf, setConf] = useState(0);
  const [st, setSt] = useState('awake');
  const [cc, setCc] = useState(0);
  const [yc, setYc] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => () => iv.current && clearInterval(iv.current), []);

  const detect = useCallback(async () => {
    const raw = wc.current?.getScreenshot();
    if (!raw) return;
    try {
      const img = raw.split(',')[1];
      if (img.length > 80000) {
        const c = document.createElement('canvas');
        c.width = 320; c.height = 240;
        const ctx = c.getContext('2d');
        const imgEl = new Image();
        await new Promise(r => { imgEl.onload = r; imgEl.src = raw; });
        ctx.drawImage(imgEl, 0, 0, 320, 240);
        const resized = c.toDataURL('image/jpeg', 0.7).split(',')[1];
        const res = await fetch(`${ML_API}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: resized }),
        });
        if (!res.ok) return;
        const d = await res.json();
        if (d.face_detected) {
          setEar(d.ear); setMar(d.mar);
          setPerclos(d.perclos * 100); setConf(d.confidence * 100);
          setSt(d.status); setCc(d.close_counter); setYc(d.yawn_counter);
          driverAPI.sendDetection(d).catch(() => {});
        }
        return;
      }
      const res = await fetch(`${ML_API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img }),
      });
      if (!res.ok) return;
      const d = await res.json();
      if (d.face_detected) {
        setEar(d.ear); setMar(d.mar);
        setPerclos(d.perclos * 100); setConf(d.confidence * 100);
        setSt(d.status); setCc(d.close_counter); setYc(d.yawn_counter);
        driverAPI.sendDetection(d).catch(() => {});
      }
    } catch { setErr('ML API unavailable'); }
  }, []);

  const start = async () => {
    try {
      await driverAPI.startSession();
      setSe(true); setOn(true);
      setTimeout(detect, 100);
      iv.current = setInterval(detect, CAPTURE_INTERVAL);
    } catch (_) {}
  };

  const stop = async () => {
    if (iv.current) { clearInterval(iv.current); iv.current = null; }
    setOn(false);
    try { await driverAPI.endSession(); } catch (_) {}
  };

  const m = STATE_META[st] || STATE_META.awake;
  const w = WARNINGS[st];
  const isAlert = st === 'drowsy' || st === 'high_risk' || st === 'critical' || st === 'microsleep';

  const earLabel = ear >= EAR_LOW ? 'Open' : ear >= EAR_CLOSED ? 'Heavy' : 'Closed';
  const earColor = ear >= EAR_LOW ? '#22c55e' : ear >= EAR_CLOSED ? '#eab308' : '#ef4444';
  const marLabel = mar >= MAR_YAWN ? 'Yawning' : 'Closed';
  const marColor = mar >= MAR_YAWN ? '#f59e0b' : '#22c55e';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(4px)',
    }}>
      <div style={{ position: 'relative', background: '#0f172a', aspectRatio: '4/3', overflow: 'hidden' }}>
        <Webcam ref={wc} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          screenshotFormat="image/jpeg" mirrored
          videoConstraints={{ facingMode: 'user', width: 320, height: 240 }} />

        {!on && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.7)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
              {se ? 'Detection paused' : 'Press start to begin'}
            </p>
          </div>
        )}

        {on && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: isAlert ? 'linear-gradient(rgba(0,0,0,0.7), transparent)' : 'linear-gradient(rgba(0,0,0,0.5), transparent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color,
                animation: isAlert ? 'pulse 0.6s ease-in-out infinite' : 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>LIVE</span>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
              background: `${m.color}25`, color: m.color, textTransform: 'uppercase',
            }}>
              {m.label} · Risk {m.risk}/5
            </div>
          </div>
        )}

        {on && isAlert && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${m.color}22 0%, transparent 70%)`,
            animation: 'alert-flash 0.8s ease-in-out infinite',
          }}>
            <div style={{
              fontSize: st === 'critical' || st === 'high_risk' ? 26 : 20,
              fontWeight: 900, color: '#fff', textShadow: `0 0 30px ${m.color}`,
              textAlign: 'center', padding: '0 16px', lineHeight: 1.3,
            }}>
              {w?.msg || m.label}
            </div>
          </div>
        )}

        {on && !isAlert && w && (
          <div style={{
            position: 'absolute', top: 36, left: 0, right: 0, zIndex: 5,
            textAlign: 'center', padding: '4px 12px',
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: m.color, textShadow: '0 0 20px rgba(0,0,0,0.8)',
            }}>
              {w.msg}
            </div>
          </div>
        )}

        {on && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',
            padding: '24px 10px 8px', display: 'flex', gap: 8,
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: earColor }}>{ear.toFixed(2)}</div>
              <div style={{ fontSize: 8, color: earColor, fontWeight: 700, textTransform: 'uppercase' }}>{earLabel}</div>
              <div style={{ fontSize: 7, color: '#64748b' }}>EAR</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: marColor }}>{mar.toFixed(2)}</div>
              <div style={{ fontSize: 8, color: marColor, fontWeight: 700, textTransform: 'uppercase' }}>{marLabel}</div>
              <div style={{ fontSize: 7, color: '#64748b' }}>MAR</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: isAlert ? '#ef4444' : perclos > 10 ? '#f59e0b' : '#22c55e' }}>
                {perclos.toFixed(0)}%
              </div>
              <div style={{ fontSize: 8, color: isAlert ? '#ef4444' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                PERCLOS
              </div>
              <div style={{ fontSize: 7, color: '#64748b' }}>closed %</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '10px 14px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={13} color={m.color} />
          <span style={{ fontWeight: 700, fontSize: 13, color: m.color, textTransform: 'capitalize' }}>
            {m.label}
          </span>
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>
            Confidence: {conf.toFixed(0)}%
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, color: '#64748b', marginBottom: 2, fontWeight: 600 }}>Eyes Closed</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#ef4444', width: `${Math.min(cc / 90 * 100, 100)}%`, transition: 'width 0.2s' }} />
            </div>
            <div style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>{cc}f / 90f (drowsy)</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, color: '#64748b', marginBottom: 2, fontWeight: 600 }}>Yawn</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#f59e0b', width: `${Math.min(yc / 15 * 100, 100)}%`, transition: 'width 0.2s' }} />
            </div>
            <div style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>{yc}f / 15f (yawn)</div>
          </div>
        </div>
      </div>

      {err && (
        <div style={{ fontSize: 10, color: '#f59e0b', textAlign: 'center', padding: '0 14px 6px' }}>{err}</div>
      )}

      <button onClick={on ? stop : start} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: 10, margin: 12, borderRadius: 8,
        border: '1.5px solid', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        width: 'calc(100% - 24px)',
        background: on ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        color: on ? '#fca5a5' : '#86efac',
        borderColor: on ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
      }}>
        {on ? <Square size={14} /> : <Play size={14} />}
        {on ? 'Stop Monitoring' : 'Start Monitoring'}
      </button>
      <style>{`
        @keyframes pulse {50%{opacity:0.4}}
        @keyframes alert-flash {
          0%,100%{opacity:1}
          50%{opacity:0.85}
        }
      `}</style>
    </div>
  );
}
