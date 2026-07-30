import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#020617'}}><div style={{width:28,height:28,border:'3px solid rgba(255,255,255,0.08)',borderTopColor:'#3b82f6',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
