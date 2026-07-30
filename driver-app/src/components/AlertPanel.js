import React, { useState, useEffect } from 'react';
import { alertAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function AlertPanel() {
  const [alerts, setAlerts] = useState([]);
  const { warnings } = useSocket();

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (warnings.length > 0) {
      loadAlerts();
    }
  }, [warnings]);

  const loadAlerts = async () => {
    try {
      const res = await alertAPI.getAlerts();
      setAlerts(res.data.alerts);
    } catch (err) {
      console.error('Failed to load alerts');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await alertAPI.acknowledgeAlert(id);
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

  const unacknowledged = alerts.filter((a) => !a.isAcknowledged);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Alerts & Warnings</h3>
        {unacknowledged.length > 0 && (
          <span style={styles.badge}>{unacknowledged.length}</span>
        )}
      </div>
      <div style={styles.list}>
        {alerts.length === 0 && (
          <p style={styles.empty}>No alerts yet</p>
        )}
        {alerts.map((alert) => (
          <div
            key={alert._id}
            style={{
              ...styles.alertItem,
              borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
              opacity: alert.isAcknowledged ? 0.5 : 1,
            }}
          >
            <div style={styles.alertHeader}>
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
            <p style={styles.alertMsg}>{alert.message}</p>
            <div style={styles.alertFooter}>
              <span style={styles.time}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
              {!alert.isAcknowledged && (
                <button
                  style={styles.ackBtn}
                  onClick={() => handleAcknowledge(alert._id)}
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 600,
  },
  badge: {
    background: '#f44336',
    borderRadius: '50%',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
  },
  list: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  empty: { textAlign: 'center', opacity: 0.5, padding: 40 },
  alertItem: {
    background: '#16213e',
    borderRadius: 8,
    padding: 12,
    transition: 'opacity 0.3s',
  },
  alertHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  alertType: { fontWeight: 600, textTransform: 'capitalize' },
  severityBadge: {
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
  },
  alertMsg: { fontSize: 13, opacity: 0.9, marginBottom: 8 },
  alertFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, opacity: 0.5 },
  ackBtn: {
    padding: '4px 14px',
    border: 'none',
    borderRadius: 6,
    background: '#00d4ff',
    color: '#000',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
