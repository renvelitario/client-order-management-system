import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute, AdminRoute } from './components/auth/RouteGuards';
import AppIcon from './components/ui/AppIcon';
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
const DeliveryHome = lazy(() => import('./pages/delivery/Home'));
const DeliveryTodayOrders = lazy(() => import('./pages/delivery/TodayOrders'));
const DeliveryInbox = lazy(() => import('./pages/delivery/Inbox'));
const UserManagement = lazy(() => import('./pages/users/UserManagement'));
const CreateUserAccount = lazy(() => import('./pages/account/CreateUserAccount'));
const AccountProfileOverview = lazy(() => import('./pages/account/AccountProfileOverview'));
const AccountSecurity = lazy(() => import('./pages/account/AccountSecurity'));
const AccountSessions = lazy(() => import('./pages/account/AccountSessions'));
const NotFound = lazy(() => import('./pages/NotFoundPage'));

const STARTUP_OVERLAY_FADE_DELAY_MS = 80;
const STARTUP_OVERLAY_HIDE_DELAY_MS = 180;
const DEMO_NOTICE_SESSION_KEY = 'demoNoticeSeenForAccessToken';

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
  { from: '/account/settings', to: '/account/profile' },
  { from: '/account/password', to: '/account/security' },
  { from: '/account/sessions', to: '/account/session' },
] as const;

const RouteLoader = () => (
  <div className="app-loader" role="status" aria-live="polite" aria-label="Loading application">
    <img src="/logo.png" className="app-loader-logo" alt="Order Management System" />
  </div>
);

function App() {
  const [showStartupOverlay, setShowStartupOverlay] = useState(true);
  const [hideStartupOverlay, setHideStartupOverlay] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  const { isAuthenticated, isAdmin, loading, session } = useAuth();
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

  useEffect(() => {
    if (!isAuthenticated || !session?.access_token) {
      setShowDemoNotice(false);
      return;
    }

    const noticeSessionId = session.access_token.slice(-24);
    if (sessionStorage.getItem(DEMO_NOTICE_SESSION_KEY) === noticeSessionId) {
      return;
    }

    sessionStorage.setItem(DEMO_NOTICE_SESSION_KEY, noticeSessionId);
    setShowDemoNotice(true);
  }, [isAuthenticated, session?.access_token]);

  const defaultAuthenticatedRoute = isAdmin ? '/dashboard' : '/delivery/home';

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
            {showDemoNotice && (
              <div className="demo-notice-backdrop" role="presentation">
                <div
                  className="demo-notice-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="demo-notice-title"
                  aria-describedby="demo-notice-description"
                >
                  <div className="demo-notice-icon-wrap" aria-hidden="true">
                    <AppIcon name="warning" className="demo-notice-icon" />
                  </div>
                  <div className="demo-notice-content">
                    <p className="demo-notice-kicker">Demo Version</p>
                    <h2 id="demo-notice-title">This project is running with demo data.</h2>
                    <p id="demo-notice-description">
                      You can explore every feature and make changes freely. Demo products, students, orders, delivery data, and inbox notifications are refreshed every hour, so edits made here are temporary.
                    </p>
                  </div>
                  <div className="demo-notice-actions">
                    <button type="button" className="primary" onClick={() => setShowDemoNotice(false)}>
                      I Understand
                    </button>
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
                      <Route path="/delivery/home" element={<ProtectedRoute><DeliveryHome /></ProtectedRoute>} />
                      <Route path="/delivery/orders" element={<ProtectedRoute><DeliveryTodayOrders /></ProtectedRoute>} />
                      <Route path="/delivery/inbox" element={<ProtectedRoute><DeliveryInbox /></ProtectedRoute>} />
                      <Route path="/products" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
                      <Route path="/customers" element={<ProtectedRoute><CustomersList /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
                      <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                      <Route path="/account/users/new" element={<AdminRoute><CreateUserAccount /></AdminRoute>} />
                      <Route path="/account/profile" element={<ProtectedRoute><AccountProfileOverview /></ProtectedRoute>} />
                      <Route path="/account/security" element={<ProtectedRoute><AccountSecurity /></ProtectedRoute>} />
                      <Route path="/account/session" element={<ProtectedRoute><AccountSessions /></ProtectedRoute>} />
                      {LEGACY_ROUTE_REDIRECTS.map(({ from, to }) => (
                        <Route key={from} path={from} element={<Navigate to={to} replace />} />
                      ))}
                      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
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
