import axios from 'axios';
import { supabase } from '../supabaseClient';

const localApiFallback = 'http://localhost:5000/api';
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const apiBaseUrl = configuredApiBaseUrl || (import.meta.env.DEV ? localApiFallback : '');

if (!apiBaseUrl) {
  console.error('[API_CONFIG] Missing VITE_API_BASE_URL in production environment.');
}

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
