import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Notification from '../components/ui/Notification';

import '../styles/pages/login.css';

const MIN_PASSWORD_LENGTH = 8;

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [recoveryReady, setRecoveryReady] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('login-page');
    document.documentElement.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
      document.documentElement.classList.remove('login-page');
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeRecoverySession = async () => {
      const code = new URL(window.location.href).searchParams.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[RESET_PASSWORD] Failed to exchange code for session.', exchangeError);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      if (session) {
        setRecoveryReady(true);
      }
    };

    void initializeRecoverySession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }

      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setRecoveryReady(true);
        setError('');
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!recoveryReady) {
      setError('Reset link is invalid or has expired. Please request a new password reset email.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        throw updateError;
      }

      setSuccessMessage('Password updated successfully. Redirecting to login...');
      setNewPassword('');
      setConfirmPassword('');
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      console.error('[RESET_PASSWORD] Failed to update password.', err);
      setError('Unable to reset password. Please request a new reset link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo">
        <img src="/logo.png" alt="Logo" />
      </div>

      <h2>Create a new password</h2>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <span className="material-icons">lock</span>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </div>

        <div className="input-group">
          <span className="material-icons">lock</span>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </div>

        <input
          type="submit"
          value={loading ? 'Updating password...' : 'Update password'}
          disabled={loading || !recoveryReady}
        />

        {!recoveryReady && (
          <p className="auth-note">
            Waiting for a valid recovery session. If this persists, request a new reset link.
          </p>
        )}

        <div className="auth-links">
          <Link to="/forgot-password" className="auth-link">Request another reset link</Link>
          <Link to="/login" className="auth-link">Back to login</Link>
        </div>

        <Notification message={successMessage} type="success" />
        <Notification message={error} type="error" />
      </form>
    </div>
  );
};

export default ResetPassword;
