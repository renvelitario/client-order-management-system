import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  getInactivityLimitMs,
  getStoredInactivityDurationMinutes,
  INACTIVITY_DURATION_STORAGE_KEY,
  getWarningLeadMs,
  LAST_ACTIVITY_STORAGE_KEY,
  WARNING_LEAD_MINUTES,
} from '../utils/inactivity';

export const useSessionTimeout = (isAuthenticated: boolean) => {
  const [warningState, setWarningState] = useState({ isOpen: false, secondsRemaining: 0 });
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityWriteAtRef = useRef(0);

  useEffect(() => {
    const clearScheduledTimers = () => {
      if (logoutTimeoutRef.current !== null) {
        clearTimeout(logoutTimeoutRef.current);
      }
      if (warningTimeoutRef.current !== null) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
      }
      logoutTimeoutRef.current = null;
      warningTimeoutRef.current = null;
      countdownIntervalRef.current = null;
    };

    const closeWarning = () => {
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = null;
      setWarningState({ isOpen: false, secondsRemaining: 0 });
    };

    if (!isAuthenticated) {
      clearScheduledTimers();
      closeWarning();
      lastActivityWriteAtRef.current = 0;
      localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
      return undefined;
    }

    let logoutInProgress = false;

    const startWarningCountdown = (expiresAt: number) => {
      const updateCountdown = () => {
        const secondsRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        setWarningState({ isOpen: true, secondsRemaining });

        if (secondsRemaining === 0) {
          if (countdownIntervalRef.current !== null) {
            clearInterval(countdownIntervalRef.current);
          }
          countdownIntervalRef.current = null;
        }
      };

      closeWarning();
      updateCountdown();
      countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    };

    const scheduleLogout = (lastActivityAt: number) => {
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
        warningTimeoutRef.current = setTimeout(() => {
          startWarningCountdown(expiresAt);
        }, warningDelay);
      }

      logoutTimeoutRef.current = setTimeout(async () => {
        if (logoutInProgress) return;

        logoutInProgress = true;
        closeWarning();
        localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
        await supabase.auth.signOut({ scope: 'local' });
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
      if ((now - lastActivityWriteAtRef.current) < 500) {
        return;
      }

      lastActivityWriteAtRef.current = now;
      localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
      scheduleLogout(now);
    };

    const handleStorage = (event: StorageEvent) => {
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
  }, [isAuthenticated]);

  const handleStaySignedIn = () => {
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
    setWarningState({ isOpen: false, secondsRemaining: 0 });
  };

  const handleLogoutNow = async () => {
    localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
    setWarningState({ isOpen: false, secondsRemaining: 0 });
    await supabase.auth.signOut({ scope: 'local' });
  };

  const minutesRemaining = Math.ceil(warningState.secondsRemaining / 60);
  const countdownMinutes = String(Math.floor(warningState.secondsRemaining / 60)).padStart(2, '0');
  const countdownSeconds = String(warningState.secondsRemaining % 60).padStart(2, '0');

  return {
    warningState,
    minutesRemaining,
    countdownMinutes,
    countdownSeconds,
    inactivityMinutes: getStoredInactivityDurationMinutes(),
    warningLeadMinutes: WARNING_LEAD_MINUTES,
    handleStaySignedIn,
    handleLogoutNow,
  };
};
