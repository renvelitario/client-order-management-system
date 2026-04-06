import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../ui/PageLoader';

const AuthLoadingFallback = () => (
  <PageLoader className="app-loader" pageName="Application" />
);

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return <AuthLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/delivery/home" replace />;
  }

  return children;
};
