import axios from 'axios';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

const localApiFallback = 'http://localhost:5000/api';
const configuredApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_BACKEND_URL
  || ''
).trim();
const normalizeApiBaseUrl = (value: string): string => {
  if (!value) {
    return '';
  }

  return /\/api\/?$/i.test(value) ? value.replace(/\/$/, '') : `${value.replace(/\/$/, '')}/api`;
};

const apiBaseUrl = normalizeApiBaseUrl(configuredApiBaseUrl) || (import.meta.env.DEV ? localApiFallback : '');

if (!apiBaseUrl) {
  console.error('[API_CONFIG] Missing VITE_API_BASE_URL in production environment.');
}

const api = axios.create({
  baseURL: apiBaseUrl,
});

const SESSION_CACHE_MS = 10_000;
let cachedSessionAt = 0;

let cachedSession: Session | null = null;
let sessionRequestPromise: Promise<Session | null> | null = null;

const getCachedSession = async (): Promise<Session | null> => {
  const now = Date.now();
  if (cachedSession && (now - cachedSessionAt) < SESSION_CACHE_MS) {
    return cachedSession;
  }

  if (!sessionRequestPromise) {
    sessionRequestPromise = supabase.auth.getSession()
      .then(({ data: { session } }) => {
        cachedSession = session || null;
        cachedSessionAt = Date.now();
        return cachedSession;
      })
      .finally(() => {
        sessionRequestPromise = null;
      });
  }

  return sessionRequestPromise;
};

// Exported function to invalidate session cache after login
export const invalidateSessionCache = () => {
  cachedSession = null;
  sessionRequestPromise = null;
  cachedSessionAt = 0;
};

supabase.auth.onAuthStateChange((_event, session) => {
  cachedSession = session || null;
  cachedSessionAt = Date.now();
});

api.interceptors.request.use(async (config) => {
  const session = await getCachedSession();
  config.headers = config.headers || {};
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  // Send client timezone context so the server can resolve "today" in user local time.
  config.headers['X-Client-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  config.headers['X-Client-Utc-Offset-Minutes'] = String(new Date().getTimezoneOffset());

  return config;
});

export default api;
