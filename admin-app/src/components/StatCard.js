import React from 'react';

export default function StatCard({ label, value, color = '#4caf50', icon }) {
  return (
    <div style={{ ...styles.card, borderLeft: `3px solid ${color}` }}>
      <div style={styles.top}>
        {icon && <span style={styles.icon}>{icon}</span>}
        <span style={styles.value}>{value}</span>
      </div>
      <span style={styles.label}>{label}</span>
    </div>
  );
}

const styles = {
  card: {
    background: '#1a1a2e',
    borderRadius: 12,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
  },
  top: { display: 'flex', alignItems: 'center', gap: 8 },
  icon: { fontSize: 24 },
  value: { fontSize: 28, fontWeight: 700, color: '#fff' },
  label: { fontSize: 13, color: '#8899aa', marginTop: 4 },
};
