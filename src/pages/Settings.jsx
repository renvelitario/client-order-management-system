import { useEffect, useState } from 'react';
import api from '../utils/api';
import './css/auth/settings.css';

const Settings = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    acc_type: 'User',
    status: 'Active',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
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
    </div>
  );
};

export default Settings;
