import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import api, { invalidateSessionCache } from '../utils/api';
import { devError } from '../utils/devLogger';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/ui/Notification';
import AppIcon from '../components/ui/AppIcon';

import '../styles/pages/login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { authError } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('login-page');
    document.documentElement.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
      document.documentElement.classList.remove('login-page');
    };
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginResponse = await api.post('/auth/login', {
        identifier,
        password,
      });

      const { session } = loginResponse.data;

      if (!session?.access_token) {
        throw new Error('No access token in login response');
      }

      const { error: setSessionError } = await supabase.auth.setSession(session);

      if (setSessionError) {
        throw setSessionError;
      }

      const { data: sessionData, error: getSessionError } = await supabase.auth.getSession();
      if (getSessionError) {
        throw getSessionError;
      }

      if (!sessionData.session?.access_token) {
        throw new Error('Session was not properly set in Supabase client');
      }

      invalidateSessionCache();

      await new Promise(resolve => setTimeout(resolve, 150));

      await api.get('/auth/me');

      navigate('/');
    } catch (err) {
      devError('[LOGIN] Unable to complete login flow.', err);
      const error = err as { response?: { data?: { message?: string; error?: string } } | { message?: string } };
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Login failed.';
      
      setError(
        message.includes('Invalid credentials') || message.includes('invalid credentials')
          ? 'Invalid email, username, phone, or password.'
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo">
        <img src="/logo.png" alt="Logo" />
      </div>

      <h2>FEU Alabang Book Store Inventory Management System</h2>

      <form onSubmit={handleLogin}>
        {/* IDENTIFIER (EMAIL, USERNAME, OR PHONE) */}
        <div className="input-group">
          <AppIcon name="person" />
          <input
            type="text"
            placeholder="Email, username, or phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="input-group">
          <AppIcon name="lock" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <AppIcon
            name={showPassword ? 'visibility_off' : 'visibility'}
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>

        {/* SUBMIT */}
        <input
          type="submit"
          value={loading ? 'Logging in...' : 'Log In'}
          disabled={loading}
        />

        <div className="auth-links">
          <Link to="/forgot-password" className="auth-link">Forgot your password?</Link>
        </div>

        <p className="demo-note">
          Demo account: <strong>admin@admin.com</strong> / <strong>admin</strong>
        </p>

        {/* ERROR */}
        <Notification message={error || authError} type="error" />
      </form>
    </div>
  );
};

export default Login;
