import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import { Users, Search, Mail, Phone, Truck, IdCard, Activity, ChevronRight, AlertTriangle } from 'lucide-react';

const RC = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    adminAPI.getDrivers().then(r => setDrivers(r.data.drivers)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const f = drivers.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search) ||
    d.licenseNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#020617' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.1), transparent)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Drivers</h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{drivers.length} registered • {drivers.filter(d => d.activeSession).length} active now</p>
            </div>
            <div style={{ position: 'relative', maxWidth: 280, width: '100%' }}>
              <Search size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                color: '#fff', fontSize: 13, outline: 'none',
              }} placeholder="Search by name, email, vehicle..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14 }} onClick={() => setSearch('')}>×</button>}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(139,92,246,0.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : f.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 60, color: '#475569' }}>
              <Users size={28} color="#334155" />
              <p>{search ? 'No drivers match your search' : 'No drivers registered yet'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {f.map((d, i) => {
                const rl = d.riskLevel || 'low';
                return (
                  <div key={d._id} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14, padding: 18, backdropFilter: 'blur(4px)',
                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    borderLeft: `3px solid ${d.activeSession ? (RC[rl] || '#22c55e') : 'rgba(255,255,255,0.1)'}`,
                  }} onClick={() => navigate(`/admin/drivers/${d._id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: `${COLORS[i % COLORS.length]}20`,
                        color: COLORS[i % COLORS.length],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700,
                      }}>{d.name?.charAt(0) || 'D'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</span>
                          {rl !== 'low' && rl !== 'medium' && (
                            <span style={{
                              padding: '1px 6px', borderRadius: 8, fontSize: 8, fontWeight: 700,
                              color: '#fff', textTransform: 'uppercase', background: RC[rl],
                            }}>{rl}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: d.activeSession ? '#22c55e' : '#475569',
                            animation: d.activeSession ? 'pulse 1.5s infinite' : 'none',
                          }} />
                          <span style={{ fontSize: 11, color: d.activeSession ? '#22c55e' : '#64748b', fontWeight: 500 }}>
                            {d.activeSession ? 'Active' : 'Offline'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#475569" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                        <Mail size={12} color="#64748b" />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                        <Phone size={12} color="#64748b" />
                        <span>{d.phone || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                        <Truck size={12} color="#64748b" />
                        <span>{d.vehicleNumber || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                        <IdCard size={12} color="#64748b" />
                        <span>{d.licenseNumber || '—'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {d.activeSession ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Activity size={12} color="#22c55e" />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>SDS: {d.currentSDS?.toFixed(0) || 0}%</span>
                        </div>
                      ) : <span />}
                      {d.unacknowledgedAlerts > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 11, fontWeight: 600 }}>
                          <AlertTriangle size={11} />
                          <span>{d.unacknowledgedAlerts} alert{d.unacknowledgedAlerts > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <span style={{ fontSize: 10, color: '#475569' }}>View →</span>
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
        @keyframes pulse { 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
