import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import VideoFeed from '../components/VideoFeed';
import AlertPanel from '../components/AlertPanel';
import { driverAPI } from '../services/api';
import { ScanLine, AlertTriangle, Activity, Shield } from 'lucide-react';

const RC = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

function Gauge({ value, max, label, color, size = 100 }) {
  const r = 40, circ = 2 * Math.PI * r, off = circ - (value / max) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
        <text x="50" y="48" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">
          {value.toFixed(2)}
        </text>
        <text x="50" y="65" textAnchor="middle" fill="#64748b" fontSize="9">{label}</text>
      </svg>
    </div>
  );
}

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

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, []);

  const load = async () => {
    try { const r = await driverAPI.getDashboard(); setData(r.data); } catch (_) { } finally { setLoading(false); }
  };

  const s = data.activeSession;
  const riskColor = RC[s?.riskLevel] || '#22c55e';

  return (
    <div style={{ minHeight: '100vh', background: '#020617' }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.1), transparent), radial-gradient(ellipse 50% 40% at 80% 30%, rgba(99,102,241,0.05), transparent)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 28px 40px' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#64748b', fontSize: 14 }}>Loading...</div>
          ) : (
            <>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <VideoFeed onStatusChange={setLiveStatus} />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
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
    </div>
  );
}
