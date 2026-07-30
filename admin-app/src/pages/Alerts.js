import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { adminAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { liveAlerts } = useSocket();

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  useEffect(() => {
    if (liveAlerts.length > 0) {
      setAlerts((prev) => [...liveAlerts, ...prev].slice(0, 50));
    }
  }, [liveAlerts]);

  const loadAlerts = async () => {
    try {
      const params = {};
      if (filter === 'acknowledged') params.status = 'acknowledged';
      else if (filter === 'unacknowledged') params.status = 'unacknowledged';
      const res = await adminAPI.getAlerts(params);
      setAlerts(res.data.alerts);
    } catch (err) {
      console.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await adminAPI.acknowledgeAlert(id);
      loadAlerts();
    } catch (err) {
      console.error('Failed to acknowledge');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#ffd700',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f',
    };
    return colors[severity] || '#ffd700';
  };

  return (
    <div style={styles.app}>
      <Sidebar />
      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>Alerts</h1>
          <div style={styles.filters}>
            {['all', 'unacknowledged', 'acknowledged'].map((f) => (
              <button
                key={f}
                style={{
                  ...styles.filterBtn,
                  background: filter === f ? '#00d4ff' : 'transparent',
                  color: filter === f ? '#000' : '#8899aa',
                  borderColor: filter === f ? '#00d4ff' : '#2a2a4a',
                }}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : alerts.length === 0 ? (
          <div style={styles.empty}>No alerts found</div>
        ) : (
          <div style={styles.list}>
            {alerts.map((alert) => (
              <div
                key={alert._id}
                style={{
                  ...styles.alertCard,
                  borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                  opacity: alert.isAcknowledged ? 0.5 : 1,
                }}
              >
                <div style={styles.alertTop}>
                  <div style={styles.alertLeft}>
                    <span style={styles.alertDriver}>{alert.driver?.name || 'Unknown'}</span>
                    <span style={styles.alertType}>{alert.type}</span>
                    <span
                      style={{
                        ...styles.severityBadge,
                        background: getSeverityColor(alert.severity),
                      }}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <span style={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                <p style={styles.alertMsg}>{alert.message}</p>
                <div style={styles.alertBottom}>
                  <span style={styles.vehicleInfo}>
                    🚗 {alert.driver?.vehicleNumber || 'N/A'}
                  </span>
                  {!alert.isAcknowledged && (
                    <button
                      style={styles.ackBtn}
                      onClick={() => handleAcknowledge(alert._id)}
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.isAcknowledged && (
                    <span style={styles.acknowledged}>✓ Acknowledged</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#0f0f23', color: '#fff', display: 'flex' },
  main: { marginLeft: 240, flex: 1, padding: '24px 32px', overflowY: 'auto', maxHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  pageTitle: { fontSize: 24, fontWeight: 700 },
  filters: { display: 'flex', gap: 8 },
  filterBtn: {
    padding: '6px 16px',
    border: '1px solid',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  loading: { textAlign: 'center', padding: 60, color: '#8899aa' },
  empty: { textAlign: 'center', padding: 60, color: '#8899aa', fontSize: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  alertCard: {
    background: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    transition: 'opacity 0.3s',
  },
  alertTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  alertDriver: { fontWeight: 700, fontSize: 15 },
  alertType: { textTransform: 'capitalize', color: '#8899aa', fontSize: 13 },
  severityBadge: { padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff' },
  alertTime: { color: '#8899aa', fontSize: 12 },
  alertMsg: { fontSize: 13, color: '#ccc', marginBottom: 10 },
  alertBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  vehicleInfo: { fontSize: 12, color: '#8899aa' },
  ackBtn: {
    padding: '6px 18px',
    border: 'none',
    borderRadius: 6,
    background: '#00d4ff',
    color: '#000',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  acknowledged: { fontSize: 13, color: '#4caf50', fontWeight: 600 },
};
