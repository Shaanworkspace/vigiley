import React, { useState, useEffect, useRef } from 'react';
import { alertAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCircle, Clock, AlertTriangle, ShieldCheck, Siren } from 'lucide-react';

const SV = { critical: { bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' }, high: { bg: 'rgba(234,88,12,0.1)', dot: '#ea580c' }, medium: { bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' }, low: { bg: 'rgba(59,130,246,0.08)', dot: '#3b82f6' } };
const FLASH_SECONDS = 5;

export default function AlertPanel() {
  const [alerts, setAlerts] = useState([]);
  const [flash, setFlash] = useState(null);
  const [remaining, setRemaining] = useState(FLASH_SECONDS);
  const { warnings } = useSocket();
  const prevWarnLen = useRef(0);
  const queue = useRef([]);
  const flashRef = useRef(null);
  const timerRef = useRef(null);
  const seenIds = useRef(new Set());

  useEffect(() => { load(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  useEffect(() => {
    if (warnings.length > prevWarnLen.current) {
      const newW = warnings.slice(0, warnings.length - prevWarnLen.current);
      newW.forEach(w => {
        if (w._id && !seenIds.current.has(w._id)) {
          seenIds.current.add(w._id);
          queue.current.push(w);
        }
      });
      if (!flashRef.current && queue.current.length > 0) showNext();
    }
    prevWarnLen.current = warnings.length;
    // eslint-disable-next-line
  }, [warnings]);

  const load = async () => {
    try { const r = await alertAPI.getAlerts(); setAlerts((r.data.alerts || []).slice(0, 5)); } catch (_) { }
  };
  const ack = async (id) => {
    try { await alertAPI.acknowledgeAlert(id); load(); } catch (_) { }
  };

  const showNext = () => {
    const next = queue.current.shift();
    if (!next) return;
    flashRef.current = next;
    setFlash(next);
    setRemaining(FLASH_SECONDS);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const left = FLASH_SECONDS - (Date.now() - start) / 1000;
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        handleEscalate(next);
      }
    }, 100);
  };

  const handleAccept = (a) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    ack(a._id);
    dismiss();
  };

  const handleEscalate = (a) => {
    alertAPI.escalateAlert(a._id).catch(() => { });
    load();
    dismiss();
  };

  const dismiss = () => {
    flashRef.current = null;
    setFlash(null);
    if (queue.current.length > 0) showNext();
  };

  const p = alerts.filter(a => !a.isAcknowledged && !a.isEscalated);

  return (
    <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
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
                  {a.isEscalated && <span style={{ fontSize: 9, fontWeight: 700, color: '#fb923c', background: 'rgba(251,146,60,0.12)', padding: '1px 6px', borderRadius: 8 }}>Escalated</span>}
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, lineHeight: 1.4 }}>{a.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {!a.isAcknowledged && !a.isEscalated && <button style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }} onClick={() => ack(a._id)}>Dismiss</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {flash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            width: '100%', maxWidth: 440, borderRadius: 20,
            background: '#0f172a', border: `1px solid ${(SV[flash.severity] || SV.low).dot}55`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 60px ${(SV[flash.severity] || SV.low).dot}22`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '28px 28px 22px', textAlign: 'center',
              background: `linear-gradient(180deg, ${(SV[flash.severity] || SV.low).dot}14, transparent)`,
            }}>
              <div style={{
                width: 72, height: 72, margin: '0 auto 14px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${(SV[flash.severity] || SV.low).dot}1f`,
                animation: 'fp 0.8s ease-in-out infinite',
              }}>
                {flash.severity === 'critical' || flash.severity === 'high'
                  ? <Siren size={34} color={(SV[flash.severity] || SV.low).dot} />
                  : <AlertTriangle size={34} color={(SV[flash.severity] || SV.low).dot} />}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: (SV[flash.severity] || SV.low).dot }}>{flash.severity} alert</div>
              <h2 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 800, textTransform: 'capitalize' }}>{flash.type?.replace(/_/g, ' ')}</h2>
              <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>{flash.message}</p>
            </div>
            <div style={{ padding: '0 28px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {remaining > 0
                    ? `Alert auto-sends to admin in ${Math.ceil(remaining)}s if not accepted`
                    : 'Escalating to admin…'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleAccept(flash)} style={{
                  flex: 1, padding: '15px 0', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
                  fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(34,197,94,0.35)',
                  transition: 'transform 0.15s, opacity 0.2s',
                  opacity: remaining > 0 ? 1 : 0.4,
                }}>Accept</button>
                <div style={{
                  width: 58, height: 58, borderRadius: 14, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: `${(SV[flash.severity] || SV.low).dot}14`,
                  border: `1px solid ${(SV[flash.severity] || SV.low).dot}33`,
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{Math.ceil(remaining)}</span>
                  <span style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>sec</span>
                </div>
              </div>
              <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: (SV[flash.severity] || SV.low).dot,
                  transition: 'width 0.1s linear',
                  width: `${(remaining / FLASH_SECONDS) * 100}%`,
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fp { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }`}</style>
    </div>
  );
}
