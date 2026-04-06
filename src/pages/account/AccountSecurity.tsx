import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import AccountShell from '../../components/account/AccountShell';
import Notification from '../../components/ui/Notification';
import api from '../../utils/api';
import { resolveApiErrorMessage } from '../../types/app';

type PasswordState = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const calculatePasswordStrength = (value: string): number => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
};

const strengthLabel = (score: number): string => {
  if (score <= 1) return 'Weak';
  if (score === 2) return 'Fair';
  if (score === 3) return 'Strong';
  return 'Very Strong';
};

const AccountSecurity = () => {
  const [passwordState, setPasswordState] = useState<PasswordState>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const score = useMemo(() => calculatePasswordStrength(passwordState.new_password), [passwordState.new_password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (passwordState.new_password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordState.new_password !== passwordState.confirm_password) {
      setError('Password confirmation does not match the new password.');
      return;
    }

    if (passwordState.current_password === passwordState.new_password) {
      setError('New password must be different from your current password.');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/auth/change-password', {
        current_password: passwordState.current_password,
        new_password: passwordState.new_password,
        confirm_password: passwordState.confirm_password,
      });

      setSuccess('Password changed successfully.');
      setPasswordState({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Unable to change password.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AccountShell
      title="Security"
      description="Protect access to your account with updated credentials and stronger password policies."
    >
      <article className="account-card">
        <h2>Change Password</h2>
        <form className="account-form" onSubmit={handleSubmit}>
          <label htmlFor="current-password">Current Password</label>
          <input
            id="current-password"
            type="password"
            value={passwordState.current_password}
            onChange={(event) => setPasswordState((previous) => ({ ...previous, current_password: event.target.value }))}
            required
          />

          <label htmlFor="new-password">New Password</label>
          <input
            id="new-password"
            type="password"
            value={passwordState.new_password}
            onChange={(event) => setPasswordState((previous) => ({ ...previous, new_password: event.target.value }))}
            required
          />

          <div className="account-password-strength" aria-live="polite">
            <span>Password strength: {strengthLabel(score)}</span>
            <div className="account-password-strength-track" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score}>
              <div className="account-password-strength-fill" style={{ width: `${(score / 4) * 100}%` }} />
            </div>
          </div>

          <label htmlFor="confirm-password">Confirm New Password</label>
          <input
            id="confirm-password"
            type="password"
            value={passwordState.confirm_password}
            onChange={(event) => setPasswordState((previous) => ({ ...previous, confirm_password: event.target.value }))}
            required
          />

          <button type="submit" className="create-button" disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <Notification message={success} type="success" />
        <Notification message={error} type="error" />
      </article>

      <article className="account-card account-card--read-only">
        <h2>Security Checklist</h2>
        <ul className="account-checklist">
          <li>Use a unique password that is not reused on other systems.</li>
          <li>Review your session timeout settings in the Sessions tab.</li>
          <li>Log out from shared devices immediately after use.</li>
        </ul>
      </article>
    </AccountShell>
  );
};

export default AccountSecurity;
