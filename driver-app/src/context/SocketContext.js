import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (!user) return;

    const s = connectSocket();
    setSocket(s);

    s.on('connect', () => {
      s.emit('join-driver', user._id);
    });

    s.on('warning', (data) => {
      setWarnings((prev) => [data, ...prev].slice(0, 5));
    });

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const clearWarnings = () => setWarnings([]);

  return (
    <SocketContext.Provider value={{ socket, warnings, clearWarnings }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
