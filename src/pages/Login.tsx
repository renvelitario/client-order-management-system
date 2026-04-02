import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

import '../styles/pages/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/');
    } catch (err) {
      const error = err as { message?: string };
      const message = error?.message || 'Login failed.';
      setError(
        message.includes('Invalid login credentials')
          ? 'Invalid email or password.'
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
        {/* EMAIL */}
        <div className="input-group">
          <span className="material-icons">email</span>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        {error && <div className="notification error">{error}</div>}
        {!error && authError && <div className="notification error">{authError}</div>}
      </form>
    </div>
  );
};

export default Login;
