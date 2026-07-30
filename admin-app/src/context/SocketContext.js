import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    if (!user) return;

    const s = connectSocket();
    setSocket(s);

    s.on('connect', () => {
      s.emit('join-admin');
    });

    s.on('alert', (data) => {
      setLiveAlerts((prev) => [data, ...prev].slice(0, 20));
    });

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const clearAlerts = () => setLiveAlerts([]);

  return (
    <SocketContext.Provider value={{ socket, liveAlerts, clearAlerts }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
