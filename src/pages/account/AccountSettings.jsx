import { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  DEFAULT_INACTIVITY_MINUTES,
  MAX_INACTIVITY_MINUTES,
  MIN_INACTIVITY_MINUTES,
  setStoredInactivityDurationMinutes,
  getStoredInactivityDurationMinutes,
  WARNING_LEAD_MINUTES,
} from '../../utils/inactivity';
import '../../styles/pages/auth/settings.css';

const AccountSettings = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    acc_type: 'User',
    status: 'Active',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_INACTIVITY_MINUTES);
  const [timeoutMessage, setTimeoutMessage] = useState('');

  useEffect(() => {
    setTimeoutMinutes(getStoredInactivityDurationMinutes());

    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const savedTimeout = setStoredInactivityDurationMinutes(data.inactivity_timeout_minutes, { notify: false });
        setTimeoutMinutes(savedTimeout);
        setFormData((prev) => ({
          ...prev,
          email: data.email || '',
          username: data.username || '',
          acc_type: data.acc_type || 'User',
          status: data.status || 'Active'
        }));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load account details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTimeoutChange = (e) => {
    setTimeoutMinutes(e.target.value);
    setTimeoutMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.put('/auth/profile', formData);
      setFormData({ ...formData, password: '' });
      window.alert('Account details updated successfully.');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update account details.';
      setError(message);
      window.alert(message);
    }
  };

  const handleTimeoutSubmit = async (e) => {
    e.preventDefault();
    setTimeoutMessage('');

    const nextMinutes = Number(timeoutMinutes);
    if (!Number.isFinite(nextMinutes)) {
      setTimeoutMessage('Enter a valid number of minutes.');
      return;
    }

    try {
      const { data } = await api.put('/auth/session-timeout', {
        inactivity_timeout_minutes: nextMinutes,
      });
      const savedMinutes = setStoredInactivityDurationMinutes(data.inactivity_timeout_minutes);
      setTimeoutMinutes(savedMinutes);
      setTimeoutMessage(`Inactivity logout is now set to ${savedMinutes} minutes. Warning appears ${WARNING_LEAD_MINUTES} minutes before logout.`);
    } catch (err) {
      setTimeoutMessage(err.response?.data?.error || 'Failed to update inactivity timeout.');
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="settings-container">
      <h2>Account Settings</h2>

      <div className="edit-account">
        <h3>Edit Account Details</h3>
        <form id="updateForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Username:</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Account Type:</label>
            <select name="acc_type" value={formData.acc_type} onChange={handleChange} required>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status:</label>
            <select name="status" value={formData.status} onChange={handleChange} required>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <label>Enter Password for Confirmation:</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <input type="submit" value="Save" />
          </div>

          {error && <p className="error">{error}</p>}
        </form>
      </div>

      <div className="edit-account session-settings">
        <h3>Session Timeout</h3>
        <form onSubmit={handleTimeoutSubmit}>
          <div className="form-group">
            <label>Auto logout after inactivity (minutes):</label>
            <input
              type="number"
              min={MIN_INACTIVITY_MINUTES}
              max={MAX_INACTIVITY_MINUTES}
              step="1"
              value={timeoutMinutes}
              onChange={handleTimeoutChange}
              required
            />
          </div>

          <p className="settings-help">
            Choose a value between {MIN_INACTIVITY_MINUTES} and {MAX_INACTIVITY_MINUTES} minutes. The warning modal appears {WARNING_LEAD_MINUTES} minutes before logout.
          </p>

          <div className="form-group">
            <input type="submit" value="Update Timeout" />
          </div>

          {timeoutMessage && <p className="settings-message">{timeoutMessage}</p>}
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;