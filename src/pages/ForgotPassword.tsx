import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Notification from '../components/ui/Notification';

import '../styles/pages/login.css';

const SUCCESS_MESSAGE = 'If the email exists, a reset link has been sent.';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.body.classList.add('login-page');
    document.documentElement.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
      document.documentElement.classList.remove('login-page');
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

      if (resetError) {
        throw resetError;
      }

      // Avoid account enumeration by showing a generic success message.
      setSuccessMessage(SUCCESS_MESSAGE);
      setEmail('');
    } catch (err) {
      console.error('[FORGOT_PASSWORD] Failed to request reset email.', err);
      setError('Unable to send password reset email right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo">
        <img src="/logo.png" alt="Logo" />
      </div>

      <h2>Reset your password</h2>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <span className="material-icons">mail</span>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <input
          type="submit"
          value={loading ? 'Sending reset link...' : 'Send reset link'}
          disabled={loading}
        />

        <p className="auth-note">
          Enter the email associated with your account and we&apos;ll send reset instructions.
        </p>

        <div className="auth-links">
          <Link to="/login" className="auth-link">Back to login</Link>
        </div>

        <Notification message={successMessage} type="success" />
        <Notification message={error} type="error" />
      </form>
    </div>
  );
};

export default ForgotPassword;
