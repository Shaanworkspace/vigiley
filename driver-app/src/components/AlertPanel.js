import React, { useState, useEffect, useRef } from 'react';
import { alertAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCircle, Clock, AlertTriangle, ShieldCheck, Siren, Volume2 } from 'lucide-react';
import { startAlarm, stopAlarm } from '../utils/alarm';

const SV = { critical: { bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' }, high: { bg: 'rgba(234,88,12,0.1)', dot: '#ea580c' }, medium: { bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' }, low: { bg: 'rgba(59,130,246,0.08)', dot: '#3b82f6' } };
const COUNTDOWN_SECONDS = 5;
const ACCEPT_SECONDS = 5;
const ALARM_ESCALATE_SECONDS = 10;

export default function AlertPanel({ liveStatus }) {
  const [alerts, setAlerts] = useState([]);
  const [flash, setFlash] = useState(null);
  const [phase, setPhase] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const { warnings } = useSocket();
  const prevWarnLen = useRef(0);
  const queue = useRef([]);
  const flashRef = useRef(null);
  const phaseRef = useRef(null);
  const timerRef = useRef(null);
  const seenIds = useRef(new Set());

  useEffect(() => { load(); return () => { if (timerRef.current) clearInterval(timerRef.current); stopAlarm(); }; }, []);

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

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const cancelIfRecovered = (status) => {
    if (!flashRef.current) return;
    if (phaseRef.current !== 'countdown') return;
    if (!status) return;
    const recovered = ['awake', 'heavy_eyelids', 'mouth_open'].includes(status);
    if (recovered) {
      const a = flashRef.current;
      stopTimer();
      stopAlarm();
      ack(a._id);
      flashRef.current = null;
      setFlash(null);
      setPhase(null);
      setRemaining(0);
      if (queue.current.length > 0) showNext();
    }
  };

  useEffect(() => {
    cancelIfRecovered(liveStatus);
    // eslint-disable-next-line
  }, [liveStatus]);

  const showNext = () => {
    const next = queue.current.shift();
    if (!next) return;
    flashRef.current = next;
    setFlash(next);
    phaseRef.current = 'countdown';
    setPhase('countdown');
    startPhase();
  };

  const escalateToAdmin = () => {
    alertAPI.escalateAlert(flashRef.current._id).catch(() => { });
    load();
  };

  const startPhase = () => {
    const dur = phaseRef.current === 'countdown' ? COUNTDOWN_SECONDS : phaseRef.current === 'accept' ? ACCEPT_SECONDS : ALARM_ESCALATE_SECONDS;
    setRemaining(dur);
    const start = Date.now();
    stopTimer();
    timerRef.current = setInterval(() => {
      const left = dur - (Date.now() - start) / 1000;
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) {
        stopTimer();
        if (phaseRef.current === 'countdown') {
          phaseRef.current = 'accept';
          setPhase('accept');
          startPhase();
        } else if (phaseRef.current === 'accept') {
          startAlarm();
          phaseRef.current = 'alarm';
          setPhase('alarm');
          startPhase();
        } else {
          escalateToAdmin();
        }
      }
    }, 100);
  };

  const handleAccept = (a) => {
    stopTimer();
    stopAlarm();
    ack(a._id);
    dismiss();
  };

  const dismiss = () => {
    stopAlarm();
    flashRef.current = null;
    setFlash(null);
    setPhase(null);
    if (queue.current.length > 0) showNext();
  };

  const p = alerts.filter(a => !a.isAcknowledged && !a.isEscalated);
  const v = (flash?.severity && SV[flash.severity]) || SV.low;

  return (
    <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={15} color="#64748b" /><span style={{ fontSize: 14, fontWeight: 600 }}>Alerts</span></div>
        {p.length > 0 && <span style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 10 }}>{p.length}</span>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.length === 0 && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '40px 20px' }}><CheckCircle size={22} color="#334155" /><p style={{ fontSize: 13, color: '#475569' }}>All clear — no alerts</p></div>}
        {alerts.map(a => {
          const av = SV[a.severity] || SV.low;
          return (
            <div key={a._id} style={{
              borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10,
              background: a.isAcknowledged ? 'rgba(255,255,255,0.02)' : av.bg,
              opacity: a.isAcknowledged ? 0.5 : 1, transition: 'opacity 0.2s',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: av.dot, marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{a.type.replace('_', ' ')}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: av.dot }}>{a.severity}</span>
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

      {flash && phase === 'countdown' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: v.dot,
            marginBottom: 18, animation: 'fp 0.8s ease-in-out infinite',
          }}>Alert in {Math.ceil(remaining)}s</div>
          <div style={{
            fontSize: 96, fontWeight: 900, color: '#fff', lineHeight: 1,
            textShadow: `0 0 40px ${v.dot}, 0 0 90px ${v.dot}55`,
          }}>{Math.ceil(remaining)}</div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 16, textAlign: 'center' }}>
            {flash.type?.replace(/_/g, ' ')} detected — open your eyes or accept the alert
          </div>
          <div style={{ marginTop: 24, width: 220, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: v.dot, borderRadius: 3,
              width: `${(remaining / COUNTDOWN_SECONDS) * 100}%`,
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      )}

      {flash && phase === 'accept' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            width: '100%', maxWidth: 440, borderRadius: 20,
            background: '#0f172a', border: `1px solid ${v.dot}55`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 60px ${v.dot}22`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '28px 28px 22px', textAlign: 'center',
              background: `linear-gradient(180deg, ${v.dot}14, transparent)`,
            }}>
              <div style={{
                width: 72, height: 72, margin: '0 auto 14px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${v.dot}1f`,
                animation: 'fp 0.8s ease-in-out infinite',
              }}>
                {flash.severity === 'critical' || flash.severity === 'high'
                  ? <Siren size={34} color={v.dot} />
                  : <AlertTriangle size={34} color={v.dot} />}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: v.dot }}>{flash.severity} alert</div>
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
                  background: `${v.dot}14`,
                  border: `1px solid ${v.dot}33`,
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{Math.ceil(remaining)}</span>
                  <span style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>sec</span>
                </div>
              </div>
              <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: v.dot,
                  transition: 'width 0.1s linear',
                  width: `${(remaining / ACCEPT_SECONDS) * 100}%`,
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {flash && phase === 'alarm' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'linear-gradient(135deg, rgba(127,29,29,0.95), rgba(2,6,23,0.98))',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{
              width: 110, height: 110, margin: '0 auto 22px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(239,68,68,0.25)',
              border: '2px solid rgba(248,113,113,0.6)',
              animation: 'fp 0.7s ease-in-out infinite',
            }}>
              <Volume2 size={52} color="#f87171" />
            </div>
            <div style={{
              fontSize: 46, fontWeight: 900, color: '#fecaca', lineHeight: 1.1,
              letterSpacing: '2px', textTransform: 'uppercase',
              textShadow: '0 0 40px rgba(248,113,113,0.8)',
              animation: 'fp 0.7s ease-in-out infinite',
              marginBottom: 10,
            }}>ALERT!</div>
            <div style={{ fontSize: 15, color: '#fca5a5', marginBottom: 26, fontWeight: 600 }}>
              {remaining > 0
                ? `Admin alert in ${Math.ceil(remaining)}s — press ACCEPT to stop the alarm`
                : 'Alert sent to admin — press ACCEPT to stop the alarm'}
            </div>
            <button onClick={() => handleAccept(flash)} style={{
              width: '100%', padding: '18px 0', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff',
              fontSize: 20, fontWeight: 800, cursor: 'pointer', letterSpacing: '1px',
              boxShadow: '0 10px 40px rgba(239,68,68,0.5)',
              animation: 'fp 0.7s ease-in-out infinite',
            }}>ACCEPT</button>
            <div style={{ marginTop: 14, fontSize: 12, color: '#7f1d1d' }}>{flash.type?.replace(/_/g, ' ')} — {flash.message}</div>
          </div>
        </div>
      )}

      <style>{`@keyframes fp { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }`}</style>
    </div>
  );
}
