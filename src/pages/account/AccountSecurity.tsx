import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api from '../../utils/api';
import '../../styles/pages/auth/change-password.css';
import Notification from '../../components/ui/Notification';
import { resolveApiErrorMessage } from '../../types/app';

const AccountSecurity = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!window.confirm('Are you sure you want to change your password? This action cannot be undone.')) {
      return;
    }

    try {
      await api.post('/auth/change-password', formData);
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
      window.alert('Password changed successfully.');
    } catch (err) {
      const message = resolveApiErrorMessage(err, 'Failed to change password.');
      setError(message);
      window.alert(message);
    }
  };

  return (
    <div className="settings-container">
      <h2>Security</h2>

      <div className="change-password">
        <h3>Change Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password:</label>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>New Password:</label>
            <input
              type="password"
              name="new_password"
              minLength={8}
              pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
              title="Password must be at least 8 characters and include letters and numbers."
              value={formData.new_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password:</label>
            <input
              type="password"
              name="confirm_password"
              minLength={8}
              pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
              title="Password must be at least 8 characters and include letters and numbers."
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input type="submit" value="Save" />
          </div>

          <Notification message={error} type="error" />
        </form>
      </div>
    </div>
  );
};

export default AccountSecurity;
