import React, { useState, useEffect, useRef } from 'react';
import { alertAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const SV = { critical: { bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' }, high: { bg: 'rgba(234,88,12,0.1)', dot: '#ea580c' }, medium: { bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' }, low: { bg: 'rgba(59,130,246,0.08)', dot: '#3b82f6' } };

export default function AlertPanel() {
  const [alerts, setAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const { warnings } = useSocket();
  const prevWarnLen = useRef(0);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (warnings.length > prevWarnLen.current) {
      const newW = warnings.slice(0, warnings.length - prevWarnLen.current);
      newW.forEach((w, i) => {
        const id = Date.now() + i;
        setToasts(p => [...p, { ...w, _tid: id }]);
        setTimeout(() => {
          setToasts(p => p.filter(t => t._tid !== id));
          load();
        }, 4000);
      });
    }
    prevWarnLen.current = warnings.length;
  }, [warnings]);

  const load = async () => {
    try { const r = await alertAPI.getAlerts(); setAlerts((r.data.alerts || []).slice(0, 5)); } catch (_) { }
  };
  const ack = async (id) => {
    try { await alertAPI.acknowledgeAlert(id); load(); } catch (_) { }
  };
  const p = alerts.filter(a => !a.isAcknowledged);

  return (
    <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
      {/* Toast notifications */}
      {/* Toast flash notifications */}
      <div style={{ position: 'absolute', top: -12, left: 0, right: 0, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px', pointerEvents: 'none' }}>
        {toasts.map(t => {
          const v = SV[t.severity] || SV.low;
          const dismiss = () => {
            setToasts(p => p.filter(x => x._tid !== t._tid));
            if (t.alertId) ack(t.alertId);
            load();
          };
          return (
            <div key={t._tid} style={{
              background: '#0f172a', border: `1px solid ${v.dot}44`, borderLeft: `3px solid ${v.dot}`,
              borderRadius: 10, padding: '10px 12px', boxShadow: `0 6px 24px rgba(0,0,0,0.5)`,
              animation: 'tf 0.35s cubic-bezier(0.16,1,0.3,1), tfOut 0.3s ease-in 3.7s forwards',
              pointerEvents: 'auto',
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <AlertTriangle size={14} color={v.dot} style={{ marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>{t.type?.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', padding: '1px 7px', borderRadius: 8, background: v.dot, textTransform: 'uppercase' }}>{t.severity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{t.message}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{
                      flex: 1, padding: '5px 0', borderRadius: 8, border: 'none',
                      background: 'rgba(34,197,94,0.15)', color: '#86efac',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }} onClick={dismiss}>✓ Accept</button>
                    <button style={{
                      flex: 1, padding: '5px 0', borderRadius: 8, border: 'none',
                      background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }} onClick={dismiss}>✗ Reject</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={15} color="#64748b" /><span style={{ fontSize: 14, fontWeight: 600 }}>Alerts</span></div>
        {p.length > 0 && <span style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 10 }}>{p.length}</span>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.length === 0 && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '40px 20px' }}><CheckCircle size={22} color="#334155" /><p style={{ fontSize: 13, color: '#475569' }}>All clear — no alerts</p></div>}
        {alerts.map(a => {
          const v = SV[a.severity] || SV.low;
          return (
            <div key={a._id} style={{
              borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10,
              background: a.isAcknowledged ? 'rgba(255,255,255,0.02)' : v.bg,
              opacity: a.isAcknowledged ? 0.5 : 1, transition: 'opacity 0.2s',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: v.dot, marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{a.type.replace('_', ' ')}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: v.dot }}>{a.severity}</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, lineHeight: 1.4 }}>{a.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {!a.isAcknowledged && <button style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }} onClick={() => ack(a._id)}>Dismiss</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes tf { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes tfOut { to { opacity: 0; transform: translateY(-10px) scale(0.95); } }`}</style>
    </div>
  );
}
