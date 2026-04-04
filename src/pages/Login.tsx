import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import api, { invalidateSessionCache } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/ui/Notification';

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
      // Step 1: Login with custom endpoint
      console.log('Step 1: Attempting login with identifier:', identifier);
      const loginResponse = await api.post('/auth/login', {
        identifier,
        password,
      });

      const { session } = loginResponse.data;
      console.log('Step 1: Login successful, received session');

      if (!session?.access_token) {
        throw new Error('No access token in login response');
      }

      // Step 2: Set session in Supabase client
      console.log('Step 2: Setting session in Supabase...');
      console.log('Session object keys:', Object.keys(session));
      console.log('Access token length:', session.access_token?.length);
      
      const { error: setSessionError } = await supabase.auth.setSession(session);
      
      if (setSessionError) {
        console.error('Step 2: Error setting session:', setSessionError);
        throw setSessionError;
      }
      
      // Verify session was actually set
      const { data: sessionData, error: getSessionError } = await supabase.auth.getSession();
      console.log('Step 2: getSession error:', getSessionError);
      console.log('Step 2: Verified session, token exists:', !!sessionData.session?.access_token);
      
      if (!sessionData.session?.access_token) {
        throw new Error('Session was not properly set in Supabase client');
      }
      console.log('Step 2: Session set successfully');

      // Step 3: Invalidate the API client's cached session
      console.log('Step 3: Invalidating session cache...');
      invalidateSessionCache();

      // Small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 150));

      // Step 4: Verify the account is active
      console.log('Step 4: Verifying account status with /auth/me...');
      const meResponse = await api.get('/auth/me');
      console.log('Step 4: Account verification successful, user:', meResponse.data?.username);

      console.log('Login flow complete, navigating to dashboard');
      navigate('/');
    } catch (err) {
      console.error('Login error full trace:', err);
      const error = err as { response?: { data?: { message?: string; error?: string } } | { message?: string } };
      let message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Login failed.';
      
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
          <span className="material-icons">person</span>
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
          <span className="material-icons">lock</span>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="material-icons toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </div>

        {/* SUBMIT */}
        <input
          type="submit"
          value={loading ? 'Logging in...' : 'Log In'}
          disabled={loading}
        />

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
