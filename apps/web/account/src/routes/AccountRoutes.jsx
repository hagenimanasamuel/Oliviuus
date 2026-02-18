// src/routes/AccountRoutes.jsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AuthForm from '../pages/auth/AuthForm.jsx';
import { useAuth } from '../context/AuthContext'; 

// Lazy load components
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
      <p style={{ margin: 0, fontSize: '0.9rem' }}>Oliviuus Account...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Public Route Component (for auth pages)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  // If user is logged in and tries to access auth page, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function AccountRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Protected route - requires authentication */}
        <Route path="/" element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        } />

        {/* Public route - only accessible when not logged in */}
        <Route path="/auth" element={
          <PublicRoute>
            <AuthForm />
          </PublicRoute>
        } />

        {/* Catch-all route - redirect based on auth status */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}