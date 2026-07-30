import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { adminAPI } from '../services/api';

const RISK_COLORS = { low: '#4caf50', medium: '#ff9800', high: '#f44336', critical: '#d32f2f' };

export default function DriverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getDriverDetail(id)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const driver = data?.driver;
  const activeSession = data?.activeSession;

  const statusCounts = {};
  (data?.stats || []).forEach((s) => { statusCounts[s._id] = s.count; });

  return (
    <div style={styles.app}>
      <Sidebar />
      <div style={styles.main}>
        <header style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/admin/drivers')}>
            ← Back
          </button>
          <h1 style={styles.pageTitle}>Driver Details</h1>
        </header>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : !driver ? (
          <div style={styles.loading}>Driver not found</div>
        ) : (
          <>
            <div style={styles.profileCard}>
              <div style={styles.avatar}>{driver.name?.charAt(0) || 'D'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h2 style={styles.driverName}>{driver.name}</h2>
                  {activeSession && (
                    <span style={{ ...styles.riskBadge, background: RISK_COLORS[activeSession.riskLevel] || '#ff9800' }}>
                      {activeSession.riskLevel}
                    </span>
                  )}
                </div>
                <p style={styles.driverEmail}>{driver.email}</p>
                <div style={styles.meta}>
                  <span>📞 {driver.phone || 'N/A'}</span>
                  <span>🚗 {driver.vehicleNumber || 'N/A'}</span>
                  <span>📄 {driver.licenseNumber || 'N/A'}</span>
                </div>
              </div>
              {activeSession && (
                <div style={styles.sdsGauge}>
                  <div style={styles.sdsValue}>{activeSession.drowsinessScore?.toFixed(0)}</div>
                  <div style={styles.sdsLabel}>SDS</div>
                </div>
              )}
            </div>

            <div style={styles.statsGrid}>
              <StatCard label="Normal" value={statusCounts.normal || 0} color="#4caf50" />
              <StatCard label="Yawning" value={statusCounts.yawning || 0} color="#ff9800" />
              <StatCard label="Eyes Closed" value={statusCounts.eyes_closed || 0} color="#f44336" />
              <StatCard label="Drowsy" value={statusCounts.drowsy || 0} color="#d32f2f" />
            </div>

            {activeSession && (
              <div style={styles.row}>
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Active Session</h3>
                  <div style={styles.sessionInfo}>
                    <div style={styles.sessionItem}>
                      <span style={styles.sessionLabel}>Started</span>
                      <span>{new Date(activeSession.startTime).toLocaleString()}</span>
                    </div>
                    <div style={styles.sessionItem}>
                      <span style={styles.sessionLabel}>Duration</span>
                      <span>{Math.floor((Date.now() - new Date(activeSession.startTime)) / 60000)} min</span>
                    </div>
                    <div style={styles.sessionItem}>
                      <span style={styles.sessionLabel}>Detections</span>
                      <span>{activeSession.detectionCount || 0}</span>
                    </div>
                  </div>
                </div>
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Alert Summary</h3>
                  <div style={styles.sessionInfo}>
                    <div style={styles.sessionItem}>
                      <span style={styles.sessionLabel}>Total</span>
                      <span style={{ fontWeight: 700 }}>{activeSession.totalAlerts || 0}</span>
                    </div>
                    <div style={styles.sessionItem}>
                      <span style={styles.sessionLabel}>Critical</span>
                      <span style={{ color: '#d32f2f', fontWeight: 700 }}>{activeSession.criticalAlerts || 0}</span>
                    </div>
                    <div style={styles.sessionItem}>
                      <span style={styles.sessionLabel}>High</span>
                      <span style={{ color: '#f44336', fontWeight: 700 }}>{activeSession.highAlerts || 0}</span>
                    </div>
                  </div>
                </div>
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Drowsiness Score (SDS)</h3>
                  <div style={styles.sdsBar}>
                    <div
                      style={{
                        ...styles.sdsFill,
                        width: `${activeSession.drowsinessScore || 0}%`,
                        background:
                          (activeSession.drowsinessScore || 0) > 80
                            ? '#d32f2f'
                            : (activeSession.drowsinessScore || 0) > 60
                              ? '#f44336'
                              : (activeSession.drowsinessScore || 0) > 35
                                ? '#ff9800'
                                : '#4caf50',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ color: '#8899aa', fontSize: 12 }}>Peak: {activeSession.peakDrowsinessScore?.toFixed(1) || 0}%</span>
                    <span style={{ fontWeight: 700 }}>{activeSession.drowsinessScore?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {data?.sdsTrend?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>SDS Trend (Last 50 samples)</h3>
                <div style={styles.trendChart}>
                  {data.sdsTrend.map((point, i) => {
                    const maxSDS = Math.max(...data.sdsTrend.map((p) => p.score), 1);
                    return (
                      <div
                        key={i}
                        style={{
                          ...styles.trendBar,
                          height: `${(point.score / maxSDS) * 100}%`,
                          background:
                            point.score > 80 ? '#d32f2f' :
                            point.score > 60 ? '#f44336' :
                            point.score > 35 ? '#ff9800' : '#4caf50',
                          opacity: 0.7 + 0.3 * (i / data.sdsTrend.length),
                        }}
                        title={`SDS: ${point.score}%`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Recent Alerts</h3>
              {data?.recentAlerts?.length === 0 ? (
                <p style={styles.emptyText}>No alerts</p>
              ) : (
                <div style={styles.alertList}>
                  {(data?.recentAlerts || []).slice(0, 10).map((alert) => (
                    <div key={alert._id} style={styles.alertItem}>
                      <span style={{ ...styles.alertSeverity, background: RISK_COLORS[alert.severity] || '#ffd700' }}>
                        {alert.severity}
                      </span>
                      <span style={styles.alertType}>{alert.type}</span>
                      <span style={styles.alertMsg}>{alert.message}</span>
                      <span style={styles.alertTime}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data?.sessionHistory?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Session History (Last 10)</h3>
                <div style={styles.table}>
                  <div style={styles.tableHeader}>
                    <span>Date</span>
                    <span>Duration</span>
                    <span>Avg SDS</span>
                    <span>Risk</span>
                    <span>Alerts</span>
                  </div>
                  {data.sessionHistory.slice(0, 10).map((s) => (
                    <div key={s._id} style={styles.tableRow}>
                      <span style={{ fontSize: 12 }}>{new Date(s.startTime).toLocaleDateString()}</span>
                      <span>{s.duration ? `${Math.floor(s.duration / 60)}m` : '-'}</span>
                      <span>{s.drowsinessScore?.toFixed(1)}%</span>
                      <span>
                        <span style={{ ...styles.riskBadgeSmall, background: RISK_COLORS[s.riskLevel] || '#4caf50' }}>
                          {s.riskLevel || 'low'}
                        </span>
                      </span>
                      <span>{s.totalAlerts || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#0f0f23', color: '#fff', display: 'flex' },
  main: { marginLeft: 240, flex: 1, padding: '24px 32px', overflowY: 'auto', maxHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { padding: '8px 16px', border: '1px solid #2a2a4a', borderRadius: 6, background: 'transparent', color: '#8899aa', cursor: 'pointer', fontSize: 13 },
  pageTitle: { fontSize: 24, fontWeight: 700 },
  loading: { textAlign: 'center', padding: 60, color: '#8899aa' },
  profileCard: { background: '#1a1a2e', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 },
  avatar: { width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #0080ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 },
  driverName: { fontSize: 22, fontWeight: 700 },
  driverEmail: { color: '#8899aa', fontSize: 14, marginBottom: 8 },
  meta: { display: 'flex', gap: 20, fontSize: 13, color: '#8899aa' },
  riskBadge: { padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'capitalize' },
  riskBadgeSmall: { padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'capitalize' },
  sdsGauge: { textAlign: 'center', padding: '12px 20px', background: '#16213e', borderRadius: 12 },
  sdsValue: { fontSize: 36, fontWeight: 700 },
  sdsLabel: { fontSize: 11, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12 },
  sessionInfo: { display: 'flex', flexDirection: 'column', gap: 8 },
  sessionItem: { display: 'flex', justifyContent: 'space-between', fontSize: 13 },
  sessionLabel: { color: '#8899aa' },
  sdsBar: { width: '100%', height: 16, background: '#2a2a4a', borderRadius: 8, overflow: 'hidden' },
  sdsFill: { height: '100%', borderRadius: 8, transition: 'width 0.5s' },
  trendChart: { display: 'flex', gap: 2, height: 120, alignItems: 'flex-end' },
  trendBar: { flex: 1, borderRadius: '2px 2px 0 0', transition: 'height 0.3s', minHeight: 2 },
  emptyText: { color: '#8899aa', textAlign: 'center', padding: 20 },
  alertList: { display: 'flex', flexDirection: 'column', gap: 8 },
  alertItem: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, padding: '10px 0', borderBottom: '1px solid #2a2a4a' },
  alertSeverity: { padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'capitalize' },
  alertType: { textTransform: 'capitalize', fontWeight: 600, minWidth: 80 },
  alertMsg: { color: '#8899aa', flex: 1 },
  alertTime: { color: '#8899aa', fontSize: 12 },
  table: { fontSize: 13 },
  tableHeader: { display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid #2a2a4a', color: '#8899aa', fontWeight: 600, fontSize: 12 },
  tableRow: { display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #2a2a4a', alignItems: 'center' },
};
