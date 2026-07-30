import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import AlertBadge from '../components/AlertBadge';
import { adminAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

const RISK_COLORS = { low: '#4caf50', medium: '#ff9800', high: '#f44336', critical: '#d32f2f' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { liveAlerts } = useSocket();

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (liveAlerts.length > 0 && stats) {
      setStats((prev) => ({
        ...prev,
        totalAlerts: prev.totalAlerts + liveAlerts.length,
        unacknowledgedAlerts: prev.unacknowledgedAlerts + liveAlerts.length,
      }));
    }
  }, [liveAlerts]);

  const loadStats = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={appStyles.app}>
      <Sidebar />
      <div style={appStyles.main}>
        <header style={appStyles.header}>
          <h1 style={appStyles.pageTitle}>Dashboard</h1>
          <AlertBadge />
        </header>

        {loading ? (
          <div style={appStyles.loading}>Loading...</div>
        ) : (
          <>
            <div style={appStyles.statsGrid}>
              <StatCard label="Total Drivers" value={stats?.totalDrivers || 0} color="#4caf50" icon="👥" />
              <StatCard label="Active Drivers" value={stats?.activeDrivers || 0} color="#00d4ff" icon="🟢" />
              <StatCard label="Active Sessions" value={stats?.activeSessions || 0} color="#ff9800" icon="⚡" />
              <StatCard label="Total Alerts" value={stats?.totalAlerts || 0} color="#f44336" icon="🔔" />
            </div>

            <div style={appStyles.row}>
              <div style={appStyles.card}>
                <h3 style={appStyles.cardTitle}>Unacknowledged Alerts</h3>
                <div style={appStyles.bigNumber}>{stats?.unacknowledgedAlerts || 0}</div>
              </div>
              <div style={appStyles.card}>
                <h3 style={appStyles.cardTitle}>Today's Alerts</h3>
                <div style={appStyles.bigNumber}>{stats?.todayAlerts || 0}</div>
              </div>
              <div style={appStyles.card}>
                <h3 style={appStyles.cardTitle}>Avg Session SDS</h3>
                <div style={appStyles.bigNumber}>
                  {stats?.avgSessionSDS?.avgSDS?.toFixed(1) || 0}
                  <span style={{ fontSize: 14, color: '#8899aa', fontWeight: 400, marginLeft: 8 }}>/100</span>
                </div>
              </div>
            </div>

            <div style={appStyles.row}>
              <div style={appStyles.card}>
                <h3 style={appStyles.cardTitle}>Alert Severity Breakdown</h3>
                <div style={appStyles.severityList}>
                  {(stats?.alertsBySeverity || []).map((s) => (
                    <div key={s._id} style={appStyles.severityItem}>
                      <span style={appStyles.severityLabel}>{s._id}</span>
                      <span style={appStyles.severityCount}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={appStyles.card}>
                <h3 style={appStyles.cardTitle}>Active Session Risk Levels</h3>
                <div style={appStyles.severityList}>
                  {(stats?.riskDistribution || []).map((r) => (
                    <div key={r._id} style={appStyles.severityItem}>
                      <span style={{ ...appStyles.severityLabel, color: RISK_COLORS[r._id] || '#fff' }}>
                        {r._id}
                      </span>
                      <span style={appStyles.severityCount}>{r.count}</span>
                    </div>
                  ))}
                  {(!stats?.riskDistribution || stats.riskDistribution.length === 0) && (
                    <span style={{ color: '#8899aa', fontSize: 13 }}>No active sessions</span>
                  )}
                </div>
              </div>

              <div style={appStyles.card}>
                <h3 style={appStyles.cardTitle}>Hourly Alert Trend (Today)</h3>
                <div style={appStyles.hourlyChart}>
                  {(stats?.hourlyAlertTrend || []).map((h) => (
                    <div key={h._id} style={appStyles.hourBar}>
                      <div
                        style={{
                          ...appStyles.hourFill,
                          height: `${Math.min((h.count / Math.max(...(stats.hourlyAlertTrend || []).map((x) => x.count), 1)) * 100, 100)}%`,
                          background: h.count > 5 ? '#f44336' : h.count > 2 ? '#ff9800' : '#4caf50',
                        }}
                      />
                      <span style={appStyles.hourLabel}>{h._id}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {stats?.highRiskDrivers?.length > 0 && (
              <div style={appStyles.card}>
                <h3 style={appStyles.cardTitle}>High Risk Drivers — Active Sessions</h3>
                <div style={appStyles.riskList}>
                  {(stats.highRiskDrivers || []).map((session, i) => (
                    <div key={i} style={appStyles.riskItem}>
                      <span style={appStyles.riskRank}>#{i + 1}</span>
                      <span style={appStyles.riskName}>{session.driver?.name || 'Unknown'}</span>
                      <span style={appStyles.riskVehicle}>{session.driver?.vehicleNumber || 'N/A'}</span>
                      <div style={appStyles.riskScoreBar}>
                        <div
                          style={{
                            ...appStyles.riskScoreFill,
                            width: `${session.drowsinessScore || 0}%`,
                            background: session.riskLevel === 'critical' ? '#d32f2f' : '#f44336',
                          }}
                        />
                      </div>
                      <span style={appStyles.riskScore}>{session.drowsinessScore?.toFixed(1)}%</span>
                      <span
                        style={{
                          ...appStyles.riskBadge,
                          background: RISK_COLORS[session.riskLevel] || '#ff9800',
                        }}
                      >
                        {session.riskLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {liveAlerts.length > 0 && (
              <div style={appStyles.card}>
                <h3 style={appStyles.cardTitle}>Live Alerts</h3>
                <div style={appStyles.liveList}>
                  {liveAlerts.slice(0, 6).map((alert, i) => (
                    <div key={i} style={appStyles.liveItem}>
                      <span style={{ ...appStyles.liveDot, background: RISK_COLORS[alert.severity] || '#ffd700' }} />
                      <span style={{ fontWeight: 600 }}>{alert.driver?.name || 'Driver'}</span>
                      <span style={appStyles.liveType}>{alert.type}</span>
                      {alert.sds && <span style={{ color: '#8899aa', fontSize: 11 }}>SDS: {alert.sds}%</span>}
                      <span style={appStyles.liveTime}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const appStyles = {
  app: { minHeight: '100vh', background: '#0f0f23', color: '#fff', display: 'flex' },
  main: { marginLeft: 240, flex: 1, padding: '24px 32px', overflowY: 'auto', maxHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700 },
  loading: { textAlign: 'center', padding: 60, color: '#8899aa', fontSize: 16 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 20 },
  cardTitle: { fontSize: 14, color: '#8899aa', fontWeight: 600, marginBottom: 12 },
  bigNumber: { fontSize: 42, fontWeight: 700, display: 'flex', alignItems: 'baseline' },
  severityList: { display: 'flex', flexDirection: 'column', gap: 8 },
  severityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  severityLabel: { textTransform: 'capitalize', fontSize: 14 },
  severityCount: { fontSize: 18, fontWeight: 700 },
  hourlyChart: { display: 'flex', gap: 4, height: 120, alignItems: 'flex-end', paddingBottom: 20 },
  hourBar: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  hourFill: { width: '70%', borderRadius: '4px 4px 0 0', transition: 'height 0.5s', minHeight: 4 },
  hourLabel: { fontSize: 9, color: '#8899aa', marginTop: 4 },
  riskList: { display: 'flex', flexDirection: 'column', gap: 8 },
  riskItem: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, padding: '8px 0', borderBottom: '1px solid #2a2a4a' },
  riskRank: { color: '#8899aa', fontWeight: 700, width: 24 },
  riskName: { fontWeight: 600, minWidth: 120 },
  riskVehicle: { color: '#8899aa', minWidth: 100, fontSize: 12 },
  riskScoreBar: { flex: 1, height: 8, background: '#2a2a4a', borderRadius: 4, overflow: 'hidden' },
  riskScoreFill: { height: '100%', borderRadius: 4, transition: 'width 0.5s' },
  riskScore: { minWidth: 50, fontWeight: 600, textAlign: 'right' },
  riskBadge: { padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'capitalize' },
  liveList: { display: 'flex', flexDirection: 'column', gap: 8 },
  liveItem: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '8px 0', borderBottom: '1px solid #2a2a4a' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  liveType: { textTransform: 'capitalize', color: '#8899aa' },
  liveTime: { marginLeft: 'auto', color: '#8899aa', fontSize: 12 },
};
