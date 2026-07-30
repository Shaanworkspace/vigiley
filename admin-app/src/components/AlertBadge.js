import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function AlertBadge() {
  const { liveAlerts } = useSocket();
  if (liveAlerts.length === 0) return null;
  return <span style={{background:'#ef4444',color:'#fff',fontSize:9,fontWeight:700,padding:'1px 7px',borderRadius:10,marginLeft:6,lineHeight:'16px'}}>{liveAlerts.length > 99 ? '99+' : liveAlerts.length}</span>;
}
