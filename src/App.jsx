import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import api from './utils/api';
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
import './styles/base/app.css';
import {
  getInactivityLimitMs,
  getStoredInactivityDurationMinutes,
  INACTIVITY_DURATION_STORAGE_KEY,
  getWarningLeadMs,
  LAST_ACTIVITY_STORAGE_KEY,
  setStoredInactivityDurationMinutes,
  WARNING_LEAD_MINUTES,
} from './utils/inactivity';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warningState, setWarningState] = useState({ isOpen: false, secondsRemaining: 0 });
  const logoutTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    const clearScheduledTimers = () => {
      window.clearTimeout(logoutTimeoutRef.current);
      window.clearTimeout(warningTimeoutRef.current);
      window.clearInterval(countdownIntervalRef.current);
      logoutTimeoutRef.current = null;
      warningTimeoutRef.current = null;
      countdownIntervalRef.current = null;
    };

    const closeWarning = () => {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setWarningState({ isOpen: false, secondsRemaining: 0 });
    };

    if (!session) {
      clearScheduledTimers();
      closeWarning();
      localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
      return undefined;
    }

    let logoutInProgress = false;

    const startWarningCountdown = (expiresAt) => {
      const updateCountdown = () => {
        const secondsRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        setWarningState({ isOpen: true, secondsRemaining });

        if (secondsRemaining === 0) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };

      closeWarning();
      updateCountdown();
      countdownIntervalRef.current = window.setInterval(updateCountdown, 1000);
    };

    const scheduleLogout = (lastActivityAt) => {
      clearScheduledTimers();
      closeWarning();

      const inactivityLimitMs = getInactivityLimitMs();
      const warningLeadMs = getWarningLeadMs();
      const expiresAt = lastActivityAt + inactivityLimitMs;
      const remainingTime = Math.max(0, expiresAt - Date.now());
      const warningDelay = Math.max(0, expiresAt - warningLeadMs - Date.now());

      if (remainingTime <= warningLeadMs) {
        startWarningCountdown(expiresAt);
      } else {
        warningTimeoutRef.current = window.setTimeout(() => {
          startWarningCountdown(expiresAt);
        }, warningDelay);
      }

      logoutTimeoutRef.current = window.setTimeout(async () => {
        if (logoutInProgress) return;

        logoutInProgress = true;
        closeWarning();
        localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
        await supabase.auth.signOut();
      }, remainingTime);
    };

    const syncInactivityTimer = () => {
      const storedValue = Number(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY));
      const lastActivityAt = Number.isFinite(storedValue) && storedValue > 0
        ? storedValue
        : Date.now();

      if (!localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY)) {
        localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(lastActivityAt));
      }

      scheduleLogout(lastActivityAt);
    };

    const recordActivity = () => {
      const now = Date.now();
      localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
      scheduleLogout(now);
    };

    const handleStorage = (event) => {
      if (event.key === LAST_ACTIVITY_STORAGE_KEY) {
        if (!event.newValue) {
          clearScheduledTimers();
          closeWarning();
          return;
        }

        const lastActivityAt = Number(event.newValue);
        if (Number.isFinite(lastActivityAt) && lastActivityAt > 0) {
          scheduleLogout(lastActivityAt);
        }
      }

      if (event.key === INACTIVITY_DURATION_STORAGE_KEY) {
        syncInactivityTimer();
      }
    };

    const handleConfigChange = () => {
      syncInactivityTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncInactivityTimer();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, true);
    });
    window.addEventListener('focus', syncInactivityTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('inactivityconfigchange', handleConfigChange);

    syncInactivityTimer();

    return () => {
      clearScheduledTimers();
      closeWarning();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity, true);
      });
      window.removeEventListener('focus', syncInactivityTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('inactivityconfigchange', handleConfigChange);
    };
  }, [session]);

  const handleStaySignedIn = () => {
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
    setWarningState({ isOpen: false, secondsRemaining: 0 });
  };

  const handleLogoutNow = async () => {
    localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
    setWarningState({ isOpen: false, secondsRemaining: 0 });
    await supabase.auth.signOut();
  };

  const minutesRemaining = Math.ceil(warningState.secondsRemaining / 60);
  const countdownMinutes = String(Math.floor(warningState.secondsRemaining / 60)).padStart(2, '0');
  const countdownSeconds = String(warningState.secondsRemaining % 60).padStart(2, '0');

  useEffect(() => {
    let mounted = true;

    const validateSession = async (nextSession) => {
      if (!mounted) return;
      if (!nextSession) {
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setStoredInactivityDurationMinutes(data.inactivity_timeout_minutes, { notify: false });
        if (mounted) setSession(nextSession);
      } catch {
        await supabase.auth.signOut();
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      validateSession(currentSession);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      validateSession(nextSession);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

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
        {session ? (
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
                  <p>You'll be logged out in {Math.min(WARNING_LEAD_MINUTES, minutesRemaining)} minute{Math.min(WARNING_LEAD_MINUTES, minutesRemaining) === 1 ? '' : 's'} due to inactivity.</p>
                  <p className="session-warning-countdown">Time remaining: {countdownMinutes}:{countdownSeconds}</p>
                  <p className="session-warning-detail">Your current inactivity timeout is set to {getStoredInactivityDurationMinutes()} minutes.</p>
                  <div className="session-warning-actions">
                    <button type="button" className="secondary" onClick={handleLogoutNow}>Log Out Now</button>
                    <button type="button" className="primary" onClick={handleStaySignedIn}>Stay Signed In</button>
                  </div>
                </div>
              </div>
            )}
            <Header />
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<ProductsList />} />
              <Route path="/products/new" element={<ProductsAdd />} />
              <Route path="/products/edit" element={<ProductsUpdate />} />
              <Route path="/customers" element={<CustomersList />} />
              <Route path="/customers/new" element={<CustomersAdd />} />
              <Route path="/customers/edit" element={<CustomersUpdate />} />
              <Route path="/orders" element={<OrdersList />} />
              <Route path="/orders/new" element={<OrdersAdd />} />
              <Route path="/purchases" element={<PurchasesList />} />
              <Route path="/purchases/new" element={<PurchasesAdd />} />
              <Route path="/account/users/new" element={<CreateUserAccount />} />
              <Route path="/account/settings" element={<AccountSettings />} />
              <Route path="/account/security" element={<AccountSecurity />} />
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
