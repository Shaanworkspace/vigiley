import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { adminAPI } from '../services/api';

export default function AlertBadge() {
  const { liveAlerts } = useSocket();
  const [unacknowledged, setUnacknowledged] = useState(0);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setUnacknowledged((prev) => prev + liveAlerts.length);
  }, [liveAlerts]);

  const loadCount = async () => {
    try {
      const res = await adminAPI.getAlerts({ status: 'unacknowledged' });
      setUnacknowledged(res.data.alerts.length);
    } catch (err) {
      // ignore
    }
  };

  if (unacknowledged === 0) return null;

  return (
    <span style={styles.badge}>{unacknowledged > 99 ? '99+' : unacknowledged}</span>
  );
}

const styles = {
  badge: {
    background: '#f44336',
    color: '#fff',
    borderRadius: '50%',
    width: 22,
    height: 22,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    marginLeft: 6,
  },
};
