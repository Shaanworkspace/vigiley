import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import VideoFeed from '../components/VideoFeed';
import AlertPanel from '../components/AlertPanel';
import { driverAPI } from '../services/api';
import { ScanLine, AlertTriangle, Activity, Shield, Menu, X } from 'lucide-react';

const RC = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '16px 18px', backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({ todayLogs: 0, todayDrowsyEvents: 0, recentAlerts: [], activeSession: null, hourlyBreakdown: [] });
  const [liveStatus, setLiveStatus] = useState('awake');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, []);

  const load = async () => {
    try { const r = await driverAPI.getDashboard(); setData(r.data); } catch (_) { } finally { setLoading(false); }
  };

  const s = data.activeSession;
  const riskColor = RC[s?.riskLevel] || '#22c55e';

  const drawer = (close) => (
    <div className="dash-drawer" style={{
      position: 'fixed', top: 0, bottom: 0, right: 0, width: 'min(360px, 100%)', zIndex: 400,
      background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.06)',
      transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Details</span>
        <button onClick={close} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="adm-grid-2">
          <StatCard icon={ScanLine} label="Scans" value={data.todayLogs} color="#3b82f6" />
          <StatCard icon={AlertTriangle} label="Drowsy" value={data.todayDrowsyEvents} color="#ef4444" />
          <StatCard icon={Activity} label="Session" value={s ? `${Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)}m` : 'Inactive'} sub={s ? `Started ${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''} color={s ? '#22c55e' : '#475569'} />
          <StatCard icon={Shield} label="SDS" value={s ? `${s.drowsinessScore?.toFixed(0) || 0}%` : '—'} sub={s ? `Detections: ${s.detectionCount || 0}` : ''} color={riskColor} />
        </div>
        {data.hourlyBreakdown?.slice(0, 3).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {data.hourlyBreakdown.slice(0, 3).map((h, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Hour {h._id || i + 1}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{h.count || 0}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>events</div>
              </div>
            ))}
          </div>
        )}
        {(data.recentAlerts?.length || 0) > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>Recent Alerts</span>
            {data.recentAlerts.slice(0, 5).map(a => (
              <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${RC[a.severity] || '#64748b'}` }}>
                <AlertTriangle size={13} color={RC[a.severity] || '#64748b'} />
                <span style={{ fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.type?.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#020617' }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.1), transparent), radial-gradient(ellipse 50% 40% at 80% 30%, rgba(99,102,241,0.05), transparent)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div className="dash-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 28px 40px' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#64748b', fontSize: 14 }}>Loading...</div>
          ) : (
            <>
              <div className="dash-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Driver Dashboard</h1>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                    {s ? `Session active — Risk: ${s.riskLevel || 'low'}` : 'No active session'}
                  </p>
                </div>
                {s && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: `${riskColor}12`, border: `1px solid ${riskColor}25`,
                    borderRadius: 20, padding: '6px 16px 6px 12px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: riskColor, textTransform: 'uppercase' }}>
                      {s.riskLevel || 'low'} Risk
                    </span>
                  </div>
                )}
              </div>

              <div className="dash-cam" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <VideoFeed onStatusChange={setLiveStatus} />
              </div>

              <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20, marginTop: 20 }}>
                <StatCard icon={ScanLine} label="Today's Scans" value={data.todayLogs} color="#3b82f6" />
                <StatCard icon={AlertTriangle} label="Drowsy Events" value={data.todayDrowsyEvents} color="#ef4444" />
                <StatCard icon={Activity} label="Session Status"
                  value={s ? `${Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)}m` : 'Inactive'}
                  sub={s ? `Started ${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  color={s ? '#22c55e' : '#475569'} />
                <StatCard icon={Shield} label="SDS Score"
                  value={s ? `${s.drowsinessScore?.toFixed(0) || 0}%` : '—'}
                  sub={s ? `Detections: ${s.detectionCount || 0}` : ''}
                  color={riskColor} />
              </div>

              <div className="dash-alerts" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="dash-hourly" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {data.hourlyBreakdown?.slice(0, 3).map((h, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14, padding: 16, backdropFilter: 'blur(8px)'
                      }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Hour {h._id || i + 1}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{h.count || 0}</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>events</div>
                      </div>
                    ))}
                  </div>
                </div>

                <AlertPanel liveStatus={liveStatus} />
              </div>
            </>
          )}
        </div>
      </div>

      <button className="dash-hamburger" onClick={() => setMenuOpen(true)} style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 300,
        width: 54, height: 54, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 30px rgba(59,130,246,0.4)',
      }}>
        <Menu size={24} />
      </button>

      {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 350, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setMenuOpen(false)} />}
      {drawer(() => setMenuOpen(false))}

      <style>{`
        @media (max-width: 900px) {
          .dash-header { display: none !important; }
          .dash-stats { display: none !important; }
          .dash-alerts .ap-panel { display: none !important; }
          .dash-hourly { display: none !important; }
          .dash-main { padding: 12px !important; }
          .dash-cam { gap: 0 !important; }
          .vf-video { aspect-ratio: auto !important; height: 60vh !important; }
          .dash-alerts { display: block !important; }
          .dash-hamburger { display: flex !important; }
          .vf-extra { display: none !important; }
        }
        @media (min-width: 901px) {
          .dash-hamburger { display: none; }
        }
      `}</style>
    </div>
  );
}
