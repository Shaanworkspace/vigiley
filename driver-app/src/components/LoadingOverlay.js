import React, { useState, useEffect } from 'react';
import { onLoadingChange } from '../services/api';

const PHASES = [
  {
    text: 'Connecting to server',
    dots: 0, nxt: 900, anim: 'spin 0.8s linear infinite',
    border: 'rgba(59,130,246,0.2)', borderTop: '#3b82f6',
    pulse: false, multi: false,
  },
  {
    text: 'Waking up server',
    dots: 1, nxt: 5000, anim: 'spin 1s linear infinite',
    border: 'rgba(59,130,246,0.15)', borderTop: '#60a5fa',
    pulse: true, multi: false,
  },
  {
    text: 'Almost there',
    dots: 2, nxt: 8000, anim: 'spin 1.2s cubic-bezier(0.4,0,0.2,1) infinite',
    border: 'rgba(16,185,129,0.2)', borderTop: '#10b981',
    pulse: true, multi: false,
  },
  {
    text: 'Still waking up',
    dots: 3, nxt: 6000, anim: 'spin 0.6s linear infinite',
    border: 'rgba(245,158,11,0.25)', borderTop: '#f59e0b',
    pulse: true, multi: true,
  },
  {
    text: 'This is taking longer than usual',
    dots: 4, nxt: null, anim: 'spin 0.5s linear infinite',
    border: 'rgba(239,68,68,0.3)', borderTop: '#ef4444',
    pulse: true, multi: true,
  },
];

const MSGS = [
  'Free tier server sleeps after 15 mins of inactivity.',
  'First request wakes it up — takes 20-30 seconds.',
  'Your session will start automatically once ready.',
  'Hang tight, keeping your data safe.',
];

function Dots({ n }) {
  const [d, setD] = useState(0);
  useEffect(() => { const i = setInterval(() => setD(p => (p + 1) % 4), 400); return () => clearInterval(i); }, []);
  const str = '.'.repeat(Math.min(d + 1, n + 1));
  return <>{str}</>;
}

export default function LoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);
  const [dotIdx, setDotIdx] = useState(0);

  useEffect(() => {
    let timers = [];
    const unsub = onLoadingChange((val) => {
      if (val) {
        setVisible(true);
        setPhase(0);
        let ph = 0;
        timers.forEach(t => clearTimeout(t));
        timers = [];
        const advance = () => {
          if (ph < PHASES.length - 1) {
            ph++;
            setPhase(ph);
            const p = PHASES[ph];
            if (p.nxt) timers.push(setTimeout(advance, p.nxt));
          }
        };
        timers.push(setTimeout(advance, 8000));
      } else {
        setVisible(false);
        setPhase(0);
        timers.forEach(t => clearTimeout(t));
      }
    });
    const di = setInterval(() => setDotIdx(i => (i + 1) % MSGS.length), 5000);
    return () => { unsub(); clearInterval(di); timers.forEach(t => clearTimeout(t)); };
  }, []);

  if (!visible) return null;

  const p = PHASES[Math.min(phase, PHASES.length - 1)];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.94)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {p.multi ? (
          <>
            <div style={{
              position: 'absolute', width: 56, height: 56,
              border: '3px solid rgba(239,68,68,0.15)', borderTopColor: '#ef4444',
              borderRadius: '50%', animation: 'spin 0.5s linear infinite',
            }} />
            <div style={{
              position: 'absolute', width: 44, height: 44,
              border: '3px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite reverse',
            }} />
            <div style={{
              width: 32, height: 32,
              border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6',
              borderRadius: '50%', animation: 'spin 1.2s linear infinite',
            }} />
          </>
        ) : p.pulse ? (
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: p.borderTop,
            boxShadow: `0 0 20px ${p.borderTop}22, 0 0 40px ${p.borderTop}11`,
            animation: `${p.anim}, pulse-glow 2s ease-in-out infinite`,
          }} />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: p.borderTop, borderLeftColor: p.borderTop,
            animation: p.anim,
          }} />
        )}
      </div>

      <p style={{
        marginTop: 22, color: '#e2e8f0', fontSize: 16, fontWeight: 600,
        letterSpacing: '0.3px',
        animation: phase >= 2 ? 'fade-shift 2s ease-in-out infinite' : 'none',
      }}>
        {p.text}<Dots n={p.dots} />
      </p>

      <p style={{
        marginTop: 6, color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 320,
        lineHeight: 1.5, transition: 'opacity 0.4s',
      }}>
        {MSGS[dotIdx]}
      </p>

      {phase >= 4 && (
        <p style={{
          marginTop: 18, color: '#ef4444', fontSize: 12, fontWeight: 500,
          animation: 'pulse-warn 1.5s ease-in-out infinite',
        }}>
          Retrying connection...
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes fade-shift {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes pulse-warn {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
