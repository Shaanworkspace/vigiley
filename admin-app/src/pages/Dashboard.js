import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import AlertBadge from '../components/AlertBadge';
import { adminAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Users, Activity, Bell, Shield, AlertTriangle, Phone, Mail, Truck, IdCard, Clock, ChevronRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RC = {low:'#22c55e',medium:'#f59e0b',high:'#ef4444',critical:'#dc2626'};
const DRV_COLORS = ['#3b82f6','#8b5cf6','#f59e0b'];

function AnimatedValue({ val, suffix='' }) {
  const [d, setD] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    let start = 0;
    const dur = 1200;
    const step = val / (dur / 16);
    const iv = setInterval(() => { start += step; if (start >= val) { setD(val); clearInterval(iv); } else setD(Math.floor(start)); }, 16);
    return () => clearInterval(iv);
  }, [val]);
  return <>{d}{suffix}</>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vis, setVis] = useState(false);
  const { liveAlerts } = useSocket();
  const navigate = useNavigate();
  const lr = useRef(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (liveAlerts.length > 0 && stats) setStats(p => ({ ...p, totalAlerts: p.totalAlerts + liveAlerts.length, unacknowledgedAlerts: p.unacknowledgedAlerts + liveAlerts.length })); }, [liveAlerts]);
  useEffect(() => { if (lr.current) { lr.current.scrollTop = 0; } }, [liveAlerts]);

  const load = async () => {
    try {
      const [s, d] = await Promise.all([adminAPI.getDashboard(), adminAPI.getDrivers()]);
      setStats(s.data);
      setDrivers(d.data.drivers || []);
      setTimeout(() => setVis(true), 100);
    } catch (_) { } finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(139,92,246,0.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#64748b', fontSize: 13 }}>Loading dashboard...</span>
      </div>
    </div>
  );

  const allAlerts = [...(liveAlerts || []), ...(stats?.recentAlerts || [])].slice(0, 20);

  return (
    <div style={{ minHeight: '100vh', background: '#020617', position: 'relative' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.12), transparent), radial-gradient(ellipse 50% 40% at 80% 30%, rgba(59,130,246,0.06), transparent)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                Fleet Dashboard
                <span style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', padding: '2px 10px', borderRadius: 20, letterSpacing: '0.3px' }}>
                  {stats?.activeSessions || 0} active
                </span>
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Real-time fleet safety overview & driver monitoring</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                Live
              </div>
              <AlertBadge />
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Total Drivers', value: stats?.totalDrivers || 0, color: '#3b82f6', icon: Users },
              { label: 'Active Now', value: stats?.activeSessions || 0, color: '#22c55e', icon: Activity },
              { label: 'Total Alerts', value: stats?.totalAlerts || 0, color: '#ef4444', icon: Bell },
              { label: 'Avg SDS', value: stats?.avgSessionSDS?.avgSDS?.toFixed(1) || '0.0', color: '#8b5cf6', icon: Shield },
            ].map((c, i) => (
              <div key={c.label} style={{
                opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s`,
              }}>
                <StatCard label={c.label} value={typeof c.value === 'number' ? <AnimatedValue val={c.value} /> : c.value} color={c.color} icon={c.icon} />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Alert Severity + Risk Levels + Hourly Trend */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { t: 'Alert Severity', data: stats?.alertsBySeverity || [], render: (s) => (
                    <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                      <span style={{ textTransform: 'capitalize', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: RC[s._id] || '#64748b' }} />
                        {s._id}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{s.count}</span>
                    </div>
                  ) },
                  { t: 'Active Risk Levels', data: stats?.riskDistribution || [], render: (r) => (
                    <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                      <span style={{ color: RC[r._id] || '#fff', textTransform: 'capitalize', fontSize: 13, fontWeight: 600 }}>{r._id}</span>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{r.count}</span>
                    </div>
                  ), empty: <span style={{ color: '#475569', fontSize: 13 }}>No active sessions</span> },
                  { t: 'Hourly Alert Trend', isChart: true, render: () => {
                    const trend = stats?.hourlyAlertTrend || [];
                    const mx = Math.max(...trend.map(x => x.count), 1);
                    return (
                      <div style={{ display: 'flex', gap: 3, height: 100, alignItems: 'flex-end', paddingBottom: 18 }}>
                        {trend.map(h => (
                          <div key={h._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{
                              width: '70%', borderRadius: '4px 4px 0 0', transition: 'height 0.4s cubic-bezier(0.16,1,0.3,1)',
                              minHeight: 3, height: `${(h.count / mx) * 100}%`,
                              background: h.count > 3 ? '#ef4444' : h.count > 1 ? '#f59e0b' : '#22c55e',
                            }} />
                            <span style={{ fontSize: 8, color: '#475569', marginTop: 3 }}>{h._id}</span>
                          </div>
                        ))}
                      </div>
                    );
                  } },
                ].map((section, si) => (
                  <div key={si} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14, padding: 20, backdropFilter: 'blur(4px)',
                    opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.25 + si * 0.06}s`,
                  }}>
                    <h3 style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: section.isChart ? 6 : 12 }}>{section.t}</h3>
                    {section.isChart ? section.render() : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {section.data.length > 0 ? section.data.map(section.render) : (section.empty || <span style={{ color: '#475569', fontSize: 13 }}>No data</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* High-Risk Drivers */}
              {stats?.highRiskDrivers?.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, padding: 20, backdropFilter: 'blur(4px)',
                  opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                  transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <AlertTriangle size={15} color="#ef4444" />
                    <h3 style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: 0 }}>High-Risk Drivers</h3>
                    <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, background: 'rgba(239,68,68,0.1)', padding: '1px 8px', borderRadius: 10 }}>{stats.highRiskDrivers.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stats.highRiskDrivers.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
                        padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s',
                      }} onClick={() => navigate(`/admin/drivers/${s.driver?._id}`)}>
                        <span style={{ color: '#475569', fontWeight: 700, width: 22, fontSize: 12 }}>#{i + 1}</span>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${RC[s.riskLevel]}22`, color: RC[s.riskLevel], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                          {s.driver?.name?.charAt(0) || 'D'}
                        </div>
                        <div style={{ minWidth: 130 }}>
                          <span style={{ fontWeight: 600, display: 'block', fontSize: 12 }}>{s.driver?.name || 'Unknown'}</span>
                          <span style={{ color: '#64748b', fontSize: 10 }}>{s.driver?.vehicleNumber || '—'}</span>
                        </div>
                        <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, width: `${s.drowsinessScore || 0}%`, background: s.riskLevel === 'critical' ? '#dc2626' : '#ef4444', transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ minWidth: 35, fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{s.drowsinessScore?.toFixed(0)}%</span>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 600, color: '#fff', textTransform: 'capitalize', background: RC[s.riskLevel] }}>{s.riskLevel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat-style Live Alerts */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, backdropFilter: 'blur(4px)', overflow: 'hidden',
                opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.45s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={15} color="#ef4444" />
                    <h3 style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: 0 }}>Live Alert Feed</h3>
                    <AlertBadge />
                  </div>
                  <span style={{ fontSize: 10, color: '#475569' }}>{allAlerts.length} messages</span>
                </div>
                <div ref={lr} style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 16px' }}>
                  {allAlerts.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '30px 0', color: '#475569' }}>
                      <Bell size={24} color="#334155" />
                      <p style={{ fontSize: 13 }}>No alerts yet — all clear</p>
                    </div>
                  ) : (
                    allAlerts.map((a, i) => {
                      const sev = a.severity || 'medium';
                      const time = new Date(a.timestamp || Date.now());
                      const isNew = i < (liveAlerts?.length || 0);
                      const initials = (a.driver?.name || 'DR').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div key={a._id || i} style={{
                          display: 'flex', gap: 10, padding: '10px 0',
                          borderBottom: i < allAlerts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          animation: isNew ? 'sf 0.4s cubic-bezier(0.16,1,0.3,1)' : 'none',
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: `${RC[sev]}22`, color: RC[sev],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800,
                          }}>{initials}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <span style={{ fontWeight: 700, fontSize: 12 }}>{a.driver?.name || 'Driver'}</span>
                              <span style={{
                                padding: '1px 7px', borderRadius: 10, fontSize: 8, fontWeight: 700,
                                color: '#fff', textTransform: 'uppercase', background: RC[sev],
                              }}>{sev}</span>
                              {a.sds && <span style={{ fontSize: 10, color: '#64748b' }}>{a.sds}% SDS</span>}
                              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                              <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#cbd5e1' }}>{a.type?.replace(/_/g, ' ')}</span>
                              {' — '}{a.message || 'Alert triggered'}
                            </p>
                            {a.driver?.vehicleNumber && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                <Truck size={10} color="#475569" />
                                <span style={{ fontSize: 10, color: '#475569' }}>{a.driver.vehicleNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column — Driver Contact Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '14px 16px', backdropFilter: 'blur(4px)',
                opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} color="#3b82f6" />
                    Contact Drivers
                  </h3>
                  <span style={{ fontSize: 10, color: '#475569' }}>{drivers.length} registered</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {drivers.slice(0, 5).map((d, i) => {
                    const ac = d.activeSession;
                    const rl = d.riskLevel || 'low';
                    return (
                      <div key={d._id} style={{
                        background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 12, cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                      }} onClick={() => navigate(`/admin/drivers/${d._id}`)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: `${DRV_COLORS[i % DRV_COLORS.length]}20`,
                            color: DRV_COLORS[i % DRV_COLORS.length],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700,
                          }}>{d.name?.charAt(0) || 'D'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</span>
                              <span style={{
                                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                background: ac ? '#22c55e' : '#475569',
                                animation: ac ? 'pulse 1.5s infinite' : 'none',
                              }} />
                              {rl !== 'low' && rl !== 'medium' && (
                                <span style={{
                                  padding: '1px 6px', borderRadius: 8, fontSize: 8, fontWeight: 700,
                                  color: '#fff', textTransform: 'uppercase', background: RC[rl],
                                }}>{rl}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={14} color="#475569" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: 11, color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={10} color="#475569" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.email}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={10} color="#475569" />
                            <span>{d.phone || '—'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Truck size={10} color="#475569" />
                            <span>{d.vehicleNumber || '—'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IdCard size={10} color="#475569" />
                            <span>{d.licenseNumber || '—'}</span>
                          </div>
                        </div>
                        {ac && (
                          <div style={{ marginTop: 8, fontSize: 10, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Activity size={10} />
                            <span>SDS {d.currentSDS?.toFixed(0) || 0}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {drivers.length > 5 && (
                  <button onClick={() => navigate('/admin/drivers')} style={{
                    width: '100%', marginTop: 8, padding: '8px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
                    color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>View all {drivers.length} drivers</button>
                )}
              </div>

              {/* Summary Mini Cards */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: 16, backdropFilter: 'blur(4px)',
                opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s`,
              }}>
                <h3 style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 12 }}>Quick Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Unacknowledged Alerts', value: stats?.unacknowledgedAlerts || 0, color: '#ef4444' },
                    { label: "Today's Alerts", value: stats?.todayAlerts || 0, color: '#f59e0b' },
                    { label: 'Completed Sessions', value: stats?.avgSessionSDS?.total || 0, color: '#22c55e' },
                    { label: 'Active Sessions', value: stats?.activeSessions || 0, color: '#3b82f6' },
                  ].map((item, i) => (
                    <div key={item.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '5px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver Login Credentials Card */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: 16, backdropFilter: 'blur(4px)',
                opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Lock size={13} color="#64748b" />
                  <h3 style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: 0 }}>Test Credentials</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { email: 'admin@example.com', pwd: 'admin123', role: 'Admin', color: '#8b5cf6' },
                    { email: 'driver1@example.com', pwd: 'driver123', role: 'Driver 1', color: '#3b82f6' },
                    { email: 'driver2@example.com', pwd: 'driver123', role: 'Driver 2', color: '#8b5cf6' },
                    { email: 'driver3@example.com', pwd: 'driver123', role: 'Driver 3', color: '#f59e0b' },
                  ].map((c, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <span style={{
                        padding: '2px 7px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                        color: '#fff', background: c.color, whiteSpace: 'nowrap',
                      }}>{c.role}</span>
                      <div style={{ flex: 1, fontSize: 11, color: '#94a3b8' }}>
                        <span style={{ color: '#cbd5e1' }}>{c.email}</span>
                        <span style={{ color: '#475569' }}> / {c.pwd}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 50% { opacity: 0.4; } }
        @keyframes sf { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
