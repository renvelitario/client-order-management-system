import { useState } from 'react';
import api from '../../utils/api';
import '../../styles/pages/auth/change-password.css';

const AccountSecurity = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
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
      const message = err.response?.data?.error || 'Failed to change password.';
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
              minLength="4"
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
              minLength="4"
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input type="submit" value="Save" />
          </div>

          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default AccountSecurity;