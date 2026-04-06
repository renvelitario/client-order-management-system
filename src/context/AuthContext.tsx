import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import api from '../utils/api';
import { devError } from '../utils/devLogger';
import { setStoredInactivityDurationMinutes, setStoredSessionTimeoutEnabled } from '../utils/inactivity';
import { AuthContext } from './authContextObject';
import type { LocalUser } from '../types/app';
import { resolveApiErrorMessage } from '../types/app';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadLocalUser = async (nextSession: Session | null) => {
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
        setStoredSessionTimeoutEnabled(Boolean(data.session_timeout_enabled), { notify: false });
        setSession(nextSession);
        setLocalUser(data);
        setAuthError('');
      } catch (err) {
        const message = resolveApiErrorMessage(err, 'Failed to load user profile after login.');

        devError('[AUTH_CONTEXT] Failed to load authenticated user profile.', err);
        await supabase.auth.signOut({ scope: 'local' });
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
    const { data } = await api.get<LocalUser>('/auth/me');
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

