import { useState } from 'react';
import api from '../utils/api';
import './css/auth/register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    acc_type: 'User',
    status: 'Active'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.confirm('Are you sure you want to add this account?')) {
      return;
    }

    setError('');
    setSuccess('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await api.post('/auth/register', formData);
      setSuccess('User registered successfully');
      setFormData({
        email: '',
        username: '',
        password: '',
        confirm_password: '',
        acc_type: 'User',
        status: 'Active'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="form-container">
      <h2>Add a New User</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Username:</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Confirm Password:</label>
          <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Account Type:</label>
          <select name="acc_type" value={formData.acc_type} onChange={handleChange}>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>

        <div className="form-group">
          <label>Status:</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="form-group">
          <input type="submit" value="Register" />
        </div>
        
        {error && <p className="error" style={{color: 'red'}}>{error}</p>}
        {success && <p className="success" style={{color: 'green'}}>{success}</p>}
      </form>
    </div>
  );
};

export default Register;
