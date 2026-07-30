import React, { useState, useEffect } from 'react';
import { onLoadingChange } from '../services/api';

export default function LoadingOverlay() {
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const unsub = onLoadingChange((val) => {
      setLoading(val);
      if (val) {
        const timer = setTimeout(() => setSlow(true), 8000);
        return () => clearTimeout(timer);
      }
      setSlow(false);
    });
    return unsub;
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: 48, height: 48, border: '3px solid rgba(59,130,246,0.2)',
        borderTopColor: '#3b82f6', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ marginTop: 20, color: '#94a3b8', fontSize: 15 }}>
        {slow ? 'Server is waking up... Please wait' : 'Loading...'}
      </p>
      {slow && (
        <p style={{ marginTop: 8, color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
          Free tier server sleeping due to inactivity.<br />Waking up now (takes 20-30 seconds).
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
