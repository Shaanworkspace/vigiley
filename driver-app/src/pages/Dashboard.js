import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import VideoFeed from '../components/VideoFeed';
import AlertPanel from '../components/AlertPanel';
import { driverAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayLogs: 0,
    todayDrowsyEvents: 0,
    recentAlerts: [],
    activeSession: null,
    hourlyBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await driverAPI.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error('Dashboard load failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.app}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.main}>
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{stats.todayLogs}</span>
              <span style={styles.statLabel}>Scans Today</span>
            </div>
            <div style={{ ...styles.statCard, borderLeft: '3px solid #ff9800' }}>
              <span style={styles.statValue}>{stats.todayDrowsyEvents}</span>
              <span style={styles.statLabel}>Drowsy Events</span>
            </div>
            <div style={{ ...styles.statCard, borderLeft: '3px solid #00d4ff' }}>
              <span style={styles.statValue}>
                {stats.activeSession ? 'Active' : 'Inactive'}
              </span>
              <span style={styles.statLabel}>Session</span>
            </div>
            {stats.activeSession && (
              <div style={{ ...styles.statCard, borderLeft: '3px solid #9c27b0' }}>
                <span style={styles.statValue}>
                  {stats.activeSession.drowsinessScore?.toFixed(0) || '0'}
                </span>
                <span style={styles.statLabel}>SDS Score</span>
              </div>
            )}
            {stats.activeSession && (
              <div style={{ ...styles.statCard, borderLeft: `3px solid ${
                stats.activeSession.riskLevel === 'critical' ? '#d32f2f' :
                stats.activeSession.riskLevel === 'high' ? '#f44336' :
                stats.activeSession.riskLevel === 'medium' ? '#ff9800' : '#4caf50'
              }` }}>
                <span style={{ ...styles.statValue, fontSize: 20, textTransform: 'capitalize' }}>
                  {stats.activeSession.riskLevel || 'low'}
                </span>
                <span style={styles.statLabel}>Risk Level</span>
              </div>
            )}
          </div>

          <VideoFeed />
        </div>

        <div style={styles.sidebar}>
          <AlertPanel />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#0f0f23',
    color: '#fff',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 20,
    padding: 20,
    maxWidth: 1400,
    margin: '0 auto',
  },
  main: { display: 'flex', flexDirection: 'column', gap: 20 },
  sidebar: {},
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  statCard: {
    background: '#1a1a2e',
    borderRadius: 12,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '3px solid #4caf50',
  },
  statValue: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 13, color: '#8899aa', marginTop: 4 },
};
