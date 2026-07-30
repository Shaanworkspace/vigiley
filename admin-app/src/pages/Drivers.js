import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { adminAPI } from '../services/api';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminAPI
      .getDrivers()
      .then((res) => setDrivers(res.data.drivers))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.app}>
      <Sidebar />
      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>Drivers</h1>
          <span style={styles.count}>{drivers.length} registered</span>
        </header>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : drivers.length === 0 ? (
          <div style={styles.empty}>
            <p>No drivers registered yet</p>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={styles.colName}>Name</span>
              <span style={styles.colEmail}>Email</span>
              <span style={styles.colPhone}>Phone</span>
              <span style={styles.colVehicle}>Vehicle</span>
              <span style={styles.colStatus}>Status</span>
              <span style={styles.colAction}>Action</span>
            </div>
            {drivers.map((driver) => (
              <div key={driver._id} style={styles.tableRow}>
                <span style={styles.colName}>{driver.name}</span>
                <span style={styles.colEmail}>{driver.email}</span>
                <span style={styles.colPhone}>{driver.phone || '-'}</span>
                <span style={styles.colVehicle}>{driver.vehicleNumber || '-'}</span>
                <span style={styles.colStatus}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: driver.isActive ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                      color: driver.isActive ? '#4caf50' : '#f44336',
                    }}
                  >
                    {driver.isActive ? 'Active' : 'Inactive'}
                  </span>
                </span>
                <span style={styles.colAction}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => navigate(`/admin/drivers/${driver._id}`)}
                  >
                    View
                  </button>
                </span>
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
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700 },
  count: { color: '#8899aa', fontSize: 14 },
  loading: { textAlign: 'center', padding: 60, color: '#8899aa' },
  empty: { textAlign: 'center', padding: 60, color: '#8899aa', fontSize: 16 },
  table: {
    background: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    padding: '14px 20px',
    background: '#16213e',
    fontSize: 12,
    fontWeight: 600,
    color: '#8899aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    display: 'flex',
    padding: '14px 20px',
    borderBottom: '1px solid #2a2a4a',
    fontSize: 14,
    alignItems: 'center',
  },
  colName: { flex: 2 },
  colEmail: { flex: 2 },
  colPhone: { flex: 1.5 },
  colVehicle: { flex: 1.5 },
  colStatus: { flex: 1 },
  colAction: { flex: 0.8 },
  statusBadge: { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  viewBtn: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: 6,
    background: 'rgba(0,212,255,0.15)',
    color: '#00d4ff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
};
