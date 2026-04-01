import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import api from '../utils/api';
import { setStoredInactivityDurationMinutes } from '../utils/inactivity';
import { AuthContext } from './authContextObject';

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [localUser, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadLocalUser = async (nextSession) => {
      if (!mounted) {
        return;
      }

      if (!nextSession) {
        setSession(null);
        setLocalUser(null);
        setAuthError('');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (!mounted) {
          return;
        }

        setStoredInactivityDurationMinutes(data.inactivity_timeout_minutes, { notify: false });
        setSession(nextSession);
        setLocalUser(data);
        setAuthError('');
      } catch (err) {
        const apiError = err?.response?.data?.error;
        const networkError = err?.message;
        const message = apiError || networkError || 'Failed to load user profile after login.';

        console.error('[AUTH_CONTEXT] Failed to load authenticated user profile.', err);
        await supabase.auth.signOut();
        if (mounted) {
          setSession(null);
          setLocalUser(null);
          setAuthError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      loadLocalUser(currentSession);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      loadLocalUser(nextSession);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshLocalUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setLocalUser(data);
    return data;
  }, []);

  const value = useMemo(() => ({
    session,
    localUser,
    loading,
    authError,
    isAuthenticated: Boolean(session),
    isAdmin: String(localUser?.acc_type || '').toLowerCase() === 'admin',
    isDeliveryUser: Boolean(session) && String(localUser?.acc_type || '').toLowerCase() !== 'admin',
    refreshLocalUser,
  }), [session, localUser, loading, authError, refreshLocalUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

