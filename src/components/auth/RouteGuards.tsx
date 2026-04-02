import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loader" role="status" aria-live="polite">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return <div className="app-loader" role="status" aria-live="polite">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/delivery/orders" replace />;
  }

  return children;
};
