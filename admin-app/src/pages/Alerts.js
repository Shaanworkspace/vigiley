import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronRight, AlertTriangle, Truck, Clock, Filter } from 'lucide-react';

const SC = { low: '#3b82f6', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const SRV = ['all', 'unacknowledged', 'acknowledged'];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { liveAlerts } = useSocket();
  const navigate = useNavigate();
  const listRef = useRef(null);

  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    if (liveAlerts.length > 0) {
      setAlerts(p => [...liveAlerts, ...p].slice(0, 50));
      if (listRef.current) listRef.current.scrollTop = 0;
    }
  }, [liveAlerts]);

  const load = async () => {
    try {
      const p = {};
      if (filter === 'acknowledged') p.status = 'acknowledged';
      else if (filter === 'unacknowledged') p.status = 'unacknowledged';
      const r = await adminAPI.getAlerts(p);
      setAlerts(r.data.alerts);
    } catch (_) { } finally { setLoading(false); }
  };

  const ack = async (id) => {
    try { await adminAPI.acknowledgeAlert(id); load(); } catch (_) { }
  };

  const sevCount = (s) => alerts.filter(a => a.severity === s).length;

  return (
    <div style={{ minHeight: '100vh', background: '#020617' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(239,68,68,0.08), transparent)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                Alert Center
                <span style={{
                  fontSize: 10, fontWeight: 600, color: '#ef4444',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  padding: '2px 10px', borderRadius: 20,
                }}>{alerts.length} total</span>
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Real-time drowsiness alerts from all drivers</p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Filter size={13} color="#475569" />
              {SRV.map(f => (
                <button key={f} style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: filter === f ? '#fff' : '#64748b',
                  borderColor: filter === f ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  textTransform: 'capitalize',
                }} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>

          {/* Severity Summary */}
          {alerts.length > 0 && (
            <div style={{
              display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
            }}>
              {Object.entries(SC).map(([sev, color]) => (
                <div key={sev} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                  borderRadius: 8, background: `${color}10`, border: `1px solid ${color}25`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                  <span style={{ textTransform: 'capitalize', fontSize: 11, color }}>{sev}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{sevCount(sev)}</span>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(139,92,246,0.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : alerts.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              padding: 60, color: '#475569',
            }}>
              <Bell size={28} color="#334155" />
              <p>No alerts found</p>
            </div>
          ) : (
            <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {alerts.map((a, i) => {
                const sev = a.severity || 'medium';
                const initials = (a.driver?.name || 'DR').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const isNew = i < (liveAlerts?.length || 0);
                return (
                  <div key={a._id} style={{
                    borderRadius: 12, padding: 14,
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${SC[sev]}`,
                    opacity: a.isAcknowledged ? 0.55 : 1,
                    transition: 'all 0.2s',
                    animation: isNew ? 'sf 0.4s cubic-bezier(0.16,1,0.3,1)' : 'none',
                    background: a.isAcknowledged ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                  }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: `${SC[sev]}22`, color: SC[sev],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, marginTop: 2,
                      }}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{a.driver?.name || 'Unknown'}</span>
                            <span style={{
                              padding: '1px 7px', borderRadius: 10, fontSize: 8, fontWeight: 700,
                              color: '#fff', textTransform: 'uppercase', background: SC[sev],
                            }}>{sev}</span>
                            <span style={{ color: '#64748b', fontSize: 12, textTransform: 'capitalize' }}>
                              {a.type?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span style={{ color: '#475569', fontSize: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>
                            <Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                            {new Date(a.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, lineHeight: 1.4 }}>{a.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#475569' }}>
                            {a.driver?.vehicleNumber && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Truck size={10} />{a.driver.vehicleNumber}
                              </span>
                            )}
                            {a.sds && <span>SDS: {a.sds}%</span>}
                            {a.driver?._id && (
                              <span
                                style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#64748b', cursor: 'pointer' }}
                                onClick={() => navigate(`/admin/drivers/${a.driver._id}`)}
                              >View driver <ChevronRight size={10} /></span>
                            )}
                          </div>
                          {!a.isAcknowledged ? (
                            <button style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '5px 12px', borderRadius: 8, border: 'none',
                              background: 'rgba(59,130,246,0.15)', color: '#93c5fd',
                              fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            }} onClick={() => ack(a._id)}>
                              <Check size={12} /> Acknowledge
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Check size={12} /> Acknowledged
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes sf { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
