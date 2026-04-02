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
const ProductsList = lazy(() => import('./pages/products/ProductList'));
const ProductsAdd = lazy(() => import('./pages/products/ProductCreate'));
const CustomersList = lazy(() => import('./pages/customers/CustomerList'));
const CustomersAdd = lazy(() => import('./pages/customers/CustomerCreate'));
const OrdersList = lazy(() => import('./pages/orders/OrderList'));
const OrdersAdd = lazy(() => import('./pages/orders/OrderCreate'));
const DeliveryTodayOrders = lazy(() => import('./pages/delivery/TodayOrders'));
const PurchasesList = lazy(() => import('./pages/purchases/PurchaseList'));
const PurchasesAdd = lazy(() => import('./pages/purchases/PurchaseCreate'));
const CreateUserAccount = lazy(() => import('./pages/account/CreateUserAccount'));
const ProductsUpdate = lazy(() => import('./pages/products/ProductUpdate'));
const CustomersUpdate = lazy(() => import('./pages/customers/CustomerUpdate'));
const AccountSettings = lazy(() => import('./pages/account/AccountSettings'));
const AccountSecurity = lazy(() => import('./pages/account/AccountSecurity'));

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
    }, 0);

    const timeoutId = window.setTimeout(() => {
      setShowStartupOverlay(false);
    }, 280);

    return () => {
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [isInitializing, showStartupOverlay]);

  const defaultAuthenticatedRoute = isAdmin ? '/dashboard' : '/delivery/orders';

  return (
    <Router>
      <div className="App app-boot-content">
        {isAuthenticated ? (
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
                      <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
                      <Route path="/delivery/orders" element={<ProtectedRoute><DeliveryTodayOrders /></ProtectedRoute>} />
                      <Route path="/products" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
                      <Route path="/products/new" element={<AdminRoute><ProductsAdd /></AdminRoute>} />
                      <Route path="/products/edit" element={<AdminRoute><ProductsUpdate /></AdminRoute>} />
                      <Route path="/customers" element={<ProtectedRoute><CustomersList /></ProtectedRoute>} />
                      <Route path="/customers/new" element={<AdminRoute><CustomersAdd /></AdminRoute>} />
                      <Route path="/customers/edit" element={<AdminRoute><CustomersUpdate /></AdminRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
                      <Route path="/orders/new" element={<AdminRoute><OrdersAdd /></AdminRoute>} />
                      <Route path="/purchases" element={<ProtectedRoute><PurchasesList /></ProtectedRoute>} />
                      <Route path="/purchases/new" element={<AdminRoute><PurchasesAdd /></AdminRoute>} />
                      <Route path="/account/users/new" element={<AdminRoute><CreateUserAccount /></AdminRoute>} />
                      <Route path="/account/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                      <Route path="/account/security" element={<ProtectedRoute><AccountSecurity /></ProtectedRoute>} />
                      <Route path="/products_list" element={<Navigate to="/products" replace />} />
                      <Route path="/products_add" element={<Navigate to="/products/new" replace />} />
                      <Route path="/products_update" element={<Navigate to="/products/edit" replace />} />
                      <Route path="/cust_list" element={<Navigate to="/customers" replace />} />
                      <Route path="/cust_add" element={<Navigate to="/customers/new" replace />} />
                      <Route path="/cust_update" element={<Navigate to="/customers/edit" replace />} />
                      <Route path="/orders_list" element={<Navigate to="/orders" replace />} />
                      <Route path="/orders_add" element={<Navigate to="/orders/new" replace />} />
                      <Route path="/purchases_list" element={<Navigate to="/purchases" replace />} />
                      <Route path="/purchases_add" element={<Navigate to="/purchases/new" replace />} />
                      <Route path="*" element={<Navigate to={defaultAuthenticatedRoute} replace />} />
                    </Routes>
                  </Suspense>
            </AppLayout>
          </>
        ) : (
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
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
