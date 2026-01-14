// src/routes/AccountRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AuthForm from '../pages/Auth/AuthForm.jsx';

// Only import AccountPage for now - others will be added later
const AccountPage = lazy(() => import('../pages/AccountPage.jsx'));

// Simple loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#0a0a0a',
    color: '#fff',
    fontFamily: 'Poppins, sans-serif'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(188, 139, 188, 0.3)',
        borderTop: '3px solid #BC8BBC',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 15px'
      }}></div>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading Oliviuus Account...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

export default function AccountRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Main Account Page */}
        <Route path="/account" element={<AccountPage />} />
        
        {/* Default route redirects to /account */}
        <Route path="/" element={<Navigate to="/account" replace />} />
        <Route path="/auth" element={<AuthForm />} />
        
        {/* Catch-all route redirects to /account */}
        <Route path="*" element={<Navigate to="/account" replace />} />
      </Routes>
    </Suspense>
  );
}