import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute, AdminRoute } from './components/auth/RouteGuards';
import { useAuth } from './hooks/useAuth';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import './styles/base/app.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ProductsList = lazy(() => import('./pages/products/ProductList'));
const CustomersList = lazy(() => import('./pages/customers/CustomerList'));
const OrdersList = lazy(() => import('./pages/orders/OrderList'));
const AdminDelivery = lazy(() => import('./pages/delivery/AdminDelivery'));
const DeliveryTodayOrders = lazy(() => import('./pages/delivery/TodayOrders'));
const UserManagement = lazy(() => import('./pages/users/UserManagement'));
const Analytics = lazy(() => import('./pages/Analytics'));
const CreateUserAccount = lazy(() => import('./pages/account/CreateUserAccount'));
const AccountSettings = lazy(() => import('./pages/account/AccountSettings'));
const AccountSecurity = lazy(() => import('./pages/account/AccountSecurity'));

const STARTUP_OVERLAY_FADE_DELAY_MS = 900;
const STARTUP_OVERLAY_HIDE_DELAY_MS = 1200;

const LEGACY_ROUTE_REDIRECTS = [
  { from: '/products/new', to: '/products' },
  { from: '/products/edit', to: '/products' },
  { from: '/customers/new', to: '/customers' },
  { from: '/customers/edit', to: '/customers' },
  { from: '/orders/new', to: '/orders' },
  { from: '/orders/edit', to: '/orders' },
  { from: '/products_list', to: '/products' },
  { from: '/products_add', to: '/products' },
  { from: '/products_update', to: '/products' },
  { from: '/cust_list', to: '/customers' },
  { from: '/cust_add', to: '/customers' },
  { from: '/cust_update', to: '/customers' },
  { from: '/orders_list', to: '/orders' },
  { from: '/orders_add', to: '/orders' },
  { from: '/orders_update', to: '/orders' },
] as const;

const RouteLoader = () => (
  <div className="app-loader" role="status" aria-live="polite" aria-label="Loading application">
    <img src="/logo.png" className="app-loader-logo" alt="Order Management System" />
  </div>
);

function App() {
  const [showStartupOverlay, setShowStartupOverlay] = useState(true);
  const [hideStartupOverlay, setHideStartupOverlay] = useState(false);
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { isInitializing } = useAppInitialization(loading);
  const {
    warningState,
    minutesRemaining,
    countdownMinutes,
    countdownSeconds,
    inactivityMinutes,
    warningLeadMinutes,
    handleStaySignedIn,
    handleLogoutNow,
  } = useSessionTimeout(isAuthenticated);

  useEffect(() => {
    if (isInitializing || !showStartupOverlay) {
      return undefined;
    }

    const fadeTimeoutId = window.setTimeout(() => {
      setHideStartupOverlay(true);
    }, STARTUP_OVERLAY_FADE_DELAY_MS);

    const timeoutId = window.setTimeout(() => {
      setShowStartupOverlay(false);
    }, STARTUP_OVERLAY_HIDE_DELAY_MS);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [isInitializing, showStartupOverlay]);

  const defaultAuthenticatedRoute = isAdmin ? '/dashboard' : '/delivery/orders';

  return (
    <Router>
      <div className="App app-boot-content">
        {loading ? null : isAuthenticated ? (
          <>
            {warningState.isOpen && (
              <div className="session-warning-backdrop" role="presentation">
                <div
                  className="session-warning-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="session-warning-title"
                >
                  <h2 id="session-warning-title">Session Timeout Warning</h2>
                  <p>You'll be logged out in {Math.min(warningLeadMinutes, minutesRemaining)} minute{Math.min(warningLeadMinutes, minutesRemaining) === 1 ? '' : 's'} due to inactivity.</p>
                  <p className="session-warning-countdown">Time remaining: {countdownMinutes}:{countdownSeconds}</p>
                  <p className="session-warning-detail">Your current inactivity timeout is set to {inactivityMinutes} minutes.</p>
                  <div className="session-warning-actions">
                    <button type="button" className="secondary" onClick={handleLogoutNow}>Log Out Now</button>
                    <button type="button" className="primary" onClick={handleStaySignedIn}>Stay Signed In</button>
                  </div>
                </div>
              </div>
            )}
            <AppLayout>
              <Suspense fallback={<RouteLoader />}>
                    <Routes>
                      <Route path="/" element={<Navigate to={defaultAuthenticatedRoute} replace />} />
                      <Route path="/login" element={<Navigate to={defaultAuthenticatedRoute} replace />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
                      <Route path="/delivery" element={<AdminRoute><AdminDelivery /></AdminRoute>} />
                      <Route path="/delivery/orders" element={<ProtectedRoute><DeliveryTodayOrders /></ProtectedRoute>} />
                      <Route path="/products" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
                      <Route path="/customers" element={<ProtectedRoute><CustomersList /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
                      <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                      <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
                      <Route path="/account/users/new" element={<AdminRoute><CreateUserAccount /></AdminRoute>} />
                      <Route path="/account/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                      <Route path="/account/security" element={<ProtectedRoute><AccountSecurity /></ProtectedRoute>} />
                      {LEGACY_ROUTE_REDIRECTS.map(({ from, to }) => (
                        <Route key={from} path={from} element={<Navigate to={to} replace />} />
                      ))}
                      <Route path="*" element={<Navigate to={defaultAuthenticatedRoute} replace />} />
                    </Routes>
                  </Suspense>
            </AppLayout>
          </>
        ) : (
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        )}

        {showStartupOverlay && (
          <div
            className={`app-startup-overlay ${hideStartupOverlay ? 'app-startup-overlay--hidden' : ''}`}
            role="status"
            aria-live="polite"
            aria-label="Initializing application"
          >
            <RouteLoader />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
