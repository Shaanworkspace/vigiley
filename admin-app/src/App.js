import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingOverlay from './components/LoadingOverlay';

const g = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.adm-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.adm-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.adm-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.adm-layout{display:grid;grid-template-columns:1fr 340px;gap:20px}
.adm-container{max-width:1360px;margin:0 auto;padding:20px 24px 40px}
.adm-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;backdrop-filter:blur(4px)}
.adm-hwrap{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.adm-toasts{position:fixed;top:80px;right:24px;z-index:200;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.adm-table{display:flex;gap:16px;padding:10px 20px;border-bottom:1px solid rgba(255,255,255,0.04);align-items:center;font-size:12px}
@media(max-width:1100px){
  .adm-grid-4{grid-template-columns:repeat(2,1fr)}
  .adm-grid-3{grid-template-columns:1fr}
  .adm-layout{grid-template-columns:1fr}
  .adm-nav-labels{display:none}
}
@media(max-width:768px){
  .adm-grid-2{grid-template-columns:1fr}
  .adm-container{padding:16px 14px 32px}
  .adm-toasts{top:64px;right:10px;left:10px}
  .adm-toasts>div{min-width:0;max-width:none;width:100%}
  .adm-hwrap{flex-direction:column;align-items:flex-start}
  .adm-nav-labels{display:none}
  .adm-nav-user{display:none}
  .adm-navbar{padding:8px 8px 0 !important}
  .adm-navbar nav{padding:6px 10px !important}
  .adm-profile-head{flex-direction:column;align-items:flex-start}
  .adm-profile-sds{align-self:stretch}
  .adm-scroll-x{overflow-x:auto}
  .adm-table{min-width:640px}
}
@media(max-width:480px){
  .adm-grid-4{grid-template-columns:1fr}
  .adm-hwrap .adm-search{width:100%}
}`;

export default function App() {
  return (
    <>
      <style>{g}</style>
      <LoadingOverlay />
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/drivers" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
              <Route path="/admin/drivers/:id" element={<ProtectedRoute><DriverDetail /></ProtectedRoute>} />
              <Route path="/admin/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
