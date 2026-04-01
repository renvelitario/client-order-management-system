import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProductsList from './pages/products/List';
import ProductsAdd from './pages/products/Create';
import CustomersList from './pages/customers/List';
import CustomersAdd from './pages/customers/Create';
import OrdersList from './pages/orders/List';
import OrdersAdd from './pages/orders/Create';
import PurchasesList from './pages/purchases/List';
import PurchasesAdd from './pages/purchases/Create';
import CreateUserAccount from './pages/account/CreateUserAccount';
import ProductsUpdate from './pages/products/Update';
import CustomersUpdate from './pages/customers/Update';
import AccountSettings from './pages/account/AccountSettings';
import AccountSecurity from './pages/account/AccountSecurity';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './hooks/useAuth';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import './styles/base/app.css';

function App() {
  const { isAuthenticated, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="app-loader" role="status" aria-live="polite" aria-label="Loading application">
        <img src="/logo.png" className="app-loader-logo" alt="Order Management System" />
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
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
            <div className="app-shell">
              <Header />
              <main className="app-main">
                <div className="app-content">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </main>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
