import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { adminAPI } from '../services/api';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReportSummary(dateRange);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    normal: '#4caf50',
    yawning: '#ff9800',
    eyes_closed: '#f44336',
    drowsy: '#d32f2f',
    distracted: '#ff5722',
  };

  return (
    <div style={styles.app}>
      <Sidebar />
      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>Reports</h1>
        </header>

        <div style={styles.filterBar}>
          <div style={styles.field}>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              style={styles.dateInput}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              style={styles.dateInput}
            />
          </div>
          <button style={styles.applyBtn} onClick={loadReport}>
            Apply
          </button>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : !report ? (
          <div style={styles.empty}>No data available</div>
        ) : (
          <>
            <div style={styles.row}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Status Distribution</h3>
                <div style={styles.barChart}>
                  {(report.statusDistribution || []).map((item) => {
                    const total = report.statusDistribution.reduce((acc, s) => acc + s.count, 0);
                    const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={item._id} style={styles.barRow}>
                        <span style={styles.barLabel}>{item._id.replace('_', ' ')}</span>
                        <div style={styles.barTrack}>
                          <div
                            style={{
                              ...styles.barFill,
                              width: `${pct}%`,
                              background: statusColors[item._id] || '#4caf50',
                            }}
                          />
                        </div>
                        <span style={styles.barCount}>{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Hourly Drowsiness Trend</h3>
                <div style={styles.hourlyChart}>
                  {(report.hourlyTrend || []).map((h) => (
                    <div key={h._id} style={styles.hourBar}>
                      <div
                        style={{
                          ...styles.hourFill,
                          height: `${Math.min((h.drowsy / (h.total || 1)) * 100, 100)}%`,
                          background: h.drowsy > 0 ? '#f44336' : '#2a2a4a',
                        }}
                      />
                      <span style={styles.hourLabel}>{h._id}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Alert Severity Breakdown</h3>
              <div style={styles.severityGrid}>
                {(report.alertsBySeverity || []).map((s) => (
                  <div key={s._id} style={styles.severityItem}>
                    <span style={{ ...styles.severityLabel, color: statusColors[s._id] || '#fff' }}>
                      {s._id}
                    </span>
                    <span style={styles.severityCount}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {report.topDrivers?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Top Drivers by Drowsy Events</h3>
                <div style={styles.driverList}>
                  {report.topDrivers.map((d, i) => (
                    <div key={i} style={styles.driverRow}>
                      <span style={styles.rank}>#{i + 1}</span>
                      <span style={styles.driverName}>{d.name}</span>
                      <span style={styles.driverEmail}>{d.email}</span>
                      <span style={styles.driverEvents}>{d.drowsyEvents} events</span>
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
  header: { marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700 },
  filterBar: { display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, color: '#8899aa', fontWeight: 500 },
  dateInput: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #2a2a4a',
    background: '#16213e',
    color: '#fff',
    fontSize: 14,
  },
  applyBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: 8,
    background: '#00d4ff',
    color: '#000',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
  },
  loading: { textAlign: 'center', padding: 60, color: '#8899aa' },
  empty: { textAlign: 'center', padding: 60, color: '#8899aa' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  card: {
    background: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  barChart: { display: 'flex', flexDirection: 'column', gap: 10 },
  barRow: { display: 'flex', alignItems: 'center', gap: 12 },
  barLabel: { minWidth: 100, fontSize: 13, textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 20, background: '#2a2a4a', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.5s', minWidth: 4 },
  barCount: { minWidth: 40, textAlign: 'right', fontSize: 14, fontWeight: 600 },
  hourlyChart: {
    display: 'flex',
    gap: 4,
    height: 160,
    alignItems: 'flex-end',
    paddingBottom: 20,
    position: 'relative',
  },
  hourBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  hourFill: { width: '70%', borderRadius: '4px 4px 0 0', transition: 'height 0.5s', minHeight: 4 },
  hourLabel: { fontSize: 10, color: '#8899aa', marginTop: 4 },
  severityGrid: { display: 'flex', gap: 16 },
  severityItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, padding: 12, background: '#16213e', borderRadius: 8 },
  severityLabel: { textTransform: 'capitalize', fontSize: 14, fontWeight: 600 },
  severityCount: { fontSize: 28, fontWeight: 700 },
  driverList: { display: 'flex', flexDirection: 'column', gap: 8 },
  driverRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid #2a2a4a', fontSize: 14 },
  rank: { color: '#8899aa', fontWeight: 700, width: 30 },
  driverName: { fontWeight: 600, flex: 1 },
  driverEmail: { color: '#8899aa', flex: 1 },
  driverEvents: { color: '#f44336', fontWeight: 600 },
};
