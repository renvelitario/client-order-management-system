import { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AppIcon from './components/ui/AppIcon';
import RouteLoader from './components/ui/RouteLoader';
import { useAuth } from './hooks/useAuth';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useDemoNotice } from './hooks/useDemoNotice';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { AuthenticatedRoutes, PublicRoutes } from './routes/AppRoutes';
import './styles/base/app.css';

const STARTUP_OVERLAY_FADE_DELAY_MS = 80;
const STARTUP_OVERLAY_HIDE_DELAY_MS = 180;

function App() {
  const [showStartupOverlay, setShowStartupOverlay] = useState(true);
  const [hideStartupOverlay, setHideStartupOverlay] = useState(false);
  const { isAuthenticated, isAdmin, loading, session } = useAuth();
  const { isInitializing } = useAppInitialization(loading);
  const { isDemoNoticeOpen, dismissDemoNotice } = useDemoNotice(session?.access_token);
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
            {isDemoNoticeOpen && (
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
                    <button type="button" className="primary" onClick={dismissDemoNotice}>
                      I Understand
                    </button>
                  </div>
                </div>
              </div>
            )}
            <AppLayout>
              <Suspense fallback={<RouteLoader />}>
                <AuthenticatedRoutes defaultRoute={defaultAuthenticatedRoute} />
              </Suspense>
            </AppLayout>
          </>
        ) : (
          <Suspense fallback={<RouteLoader />}>
            <PublicRoutes />
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
