import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import AccountShell from '../../components/account/AccountShell';
import Notification from '../../components/ui/Notification';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { resolveApiErrorMessage } from '../../types/app';

type ProfileFormState = {
  email: string;
  username: string;
  password: string;
};

const AccountProfileOverview = () => {
  const { localUser, refreshLocalUser } = useAuth();
  const [formState, setFormState] = useState<ProfileFormState>({ email: '', username: '', password: '' });
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormState((previous) => ({
      ...previous,
      email: localUser?.email || '',
      username: localUser?.username || '',
    }));
  }, [localUser?.email, localUser?.username]);

  const hasIdentityChanges =
    formState.email.trim() !== (localUser?.email || '')
    || formState.username.trim() !== (localUser?.username || '');

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!hasIdentityChanges) {
      setSaveError('No profile changes detected.');
      return;
    }

    if (!formState.password.trim()) {
      setSaveError('Current password is required to confirm profile changes.');
      return;
    }

    try {
      setIsSaving(true);
      await api.put('/auth/profile', {
        email: formState.email.trim(),
        username: formState.username.trim(),
        password: formState.password,
      });
      await refreshLocalUser();
      setFormState((previous) => ({ ...previous, password: '' }));
      setSaveSuccess('Profile updated successfully.');
    } catch (error) {
      setSaveError(resolveApiErrorMessage(error, 'Unable to update profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AccountShell
      title="Profile"
      description="Manage your account identity and contact details used throughout operations."
    >
      <article className="account-card">
        <h2>Identity</h2>
        <form className="account-form" onSubmit={handleSaveProfile}>
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            value={formState.email}
            onChange={(event) => setFormState((previous) => ({ ...previous, email: event.target.value }))}
            required
          />

          <label htmlFor="profile-username">Username</label>
          <input
            id="profile-username"
            type="text"
            value={formState.username}
            onChange={(event) => setFormState((previous) => ({ ...previous, username: event.target.value }))}
            required
          />

          <label htmlFor="profile-password">Current Password (confirmation)</label>
          <input
            id="profile-password"
            type="password"
            value={formState.password}
            onChange={(event) => setFormState((previous) => ({ ...previous, password: event.target.value }))}
            required
          />

          <button type="submit" className="create-button" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
        <Notification message={saveSuccess} type="success" />
        <Notification message={saveError} type="error" />
      </article>

      <article className="account-card account-card--read-only">
        <h2>Account Snapshot</h2>
        <dl className="account-kv-list">
          <div><dt>Full Name</dt><dd>{localUser?.name || 'Not set'}</dd></div>
          <div><dt>Role</dt><dd>{localUser?.acc_type || 'User'}</dd></div>
          <div><dt>Status</dt><dd>{localUser?.status || 'Active'}</dd></div>
          <div><dt>User ID</dt><dd>{localUser?.user_id ? `#${localUser.user_id}` : 'N/A'}</dd></div>
        </dl>
      </article>
    </AccountShell>
  );
};

export default AccountProfileOverview;
