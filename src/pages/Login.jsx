import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

import './css/form.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/dashboard');
    } catch (err) {
      setError(
        err.message.includes('Invalid login credentials')
          ? 'Invalid email or password.'
          : err.message
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

        {/* ERROR */}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default Login;