import React, { useState, useEffect } from 'react';
import { onLoadingChange } from '../services/api';

export default function LoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    const unsub = onLoadingChange((val) => {
      if (val) {
        setVisible(true);
        setElapsed(0);
        const start = Date.now();
        interval = setInterval(() => setElapsed(Date.now() - start), 1000);
      } else {
        setVisible(false);
        setElapsed(0);
        clearInterval(interval);
      }
    });
    return () => { unsub(); clearInterval(interval); };
  }, []);

  if (!visible) return null;

  const phase = elapsed < 8000 ? 0 : elapsed < 68000 ? 1 : 2;
  const sec = Math.floor(elapsed / 1000);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.94)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase === 2 ? (
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
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: phase === 0 ? '#3b82f6' : '#60a5fa',
            boxShadow: phase === 1 ? '0 0 20px rgba(96,165,250,0.15), 0 0 40px rgba(96,165,250,0.08)' : 'none',
            animation: `spin ${phase === 0 ? '0.8s' : '1s'} linear infinite, ${phase === 1 ? 'pulse-glow 2s ease-in-out infinite' : 'none'}`,
          }} />
        )}
      </div>

      <p style={{ marginTop: 22, color: '#e2e8f0', fontSize: 16, fontWeight: 600 }}>
        {phase === 0 ? 'Loading...' : phase === 1 ? 'Server is waking up...' : `Still waking up... (${sec}s)`}
      </p>

      <p style={{
        marginTop: 8, color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 340,
        lineHeight: 1.5,
      }}>
        {phase === 0
          ? 'Free tier servers spin down after 15 minutes of inactivity.'
          : phase === 1
            ? 'Render spins free services back up within about a minute.'
            : 'This is taking unusually long. The server may still be starting up.'}
      </p>

      {phase >= 1 && (
        <div style={{
          marginTop: 20, width: 200, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2, background: phase === 2 ? '#ef4444' : '#3b82f6',
            width: `${Math.min((elapsed - 8000) / 60000 * 100, 100)}%`,
            transition: 'width 1s linear',
          }} />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
