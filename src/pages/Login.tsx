import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import api, { primeSessionCache } from '../utils/api';
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
  const { applyAuthenticatedSession, authError } = useAuth();
  const navigate = useNavigate();

  const fillDemoCredentials = (email: string, password: string) => {
    setIdentifier(email);
    setPassword(password);
  };

  const handleAdminDemoClick = () => {
    fillDemoCredentials('admin@admin.com', 'Admin1234');
  };

  const handleUserDemoClick = () => {
    fillDemoCredentials('user@user.com', 'User1234');
  };

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

      const { session, local_user: localUser } = loginResponse.data;

      if (!session?.access_token) {
        throw new Error('No access token in login response');
      }

      if (!localUser) {
        throw new Error('No user profile in login response');
      }

      const { error: setSessionError } = await supabase.auth.setSession(session);
      
      if (setSessionError) {
        throw setSessionError;
      }

      primeSessionCache(session);
      applyAuthenticatedSession(session, localUser);
      navigate('/');
    } catch (err) {
      const error = err as {
        code?: string;
        message?: string;
        response?: { data?: { message?: string; error?: string } };
      };
      let message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Login failed.';

      if (!error?.response && (error?.code === 'ERR_NETWORK' || message === 'Network Error')) {
        message = 'Unable to reach the login server. Make sure the backend is running and VITE_API_BASE_URL points to it.';
      }
      
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

      <h2>
        FEU Alabang - Bookstore
        <br />
        Order Management System
      </h2>

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

        {/* ERROR */}
        <Notification message={error || authError} type="error" />
      </form>

      <div className="auth-links">
        <Link to="/forgot-password" className="auth-link">Forgot your password?</Link>
      </div>

      <hr className="demo-separator" />

      <div className="demo-section">
        <h3 className="demo-title">Demo Accounts</h3>
        <div className="demo-buttons">
          <button
            type="button"
            className="demo-btn admin-btn"
            onClick={handleAdminDemoClick}
            title="Fill with admin credentials: admin@admin.com / Admin1234"
          >
            Admin
          </button>
          <button
            type="button"
            className="demo-btn user-btn"
            onClick={handleUserDemoClick}
            title="Fill with user credentials: user@user.com / User1234"
          >
            User
          </button>
        </div>
        <p className="demo-hint">
          Click to fill login form with demo credentials
        </p>
      </div>
    </div>
  );
};

export default Login;
