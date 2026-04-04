import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api from '../../utils/api';
import '../../styles/pages/auth/register.css';
import Notification from '../../components/ui/Notification';
import { resolveApiErrorMessage } from '../../types/app';

const CreateUserAccount = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    acc_type: 'User',
    status: 'Active'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
        name: '',
        phone_number: '',
        password: '',
        confirm_password: '',
        acc_type: 'User',
        status: 'Active'
      });
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Registration failed'));
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
          <label>Full Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Phone Number:</label>
          <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+1 (555) 000-0000" />
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
            <option value="Disabled">Disabled</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="form-group">
          <input type="submit" value="Register" />
        </div>

        {error && <Notification message={error} type="error" />}
        {success && <Notification message={success} type="success" />}
      </form>
    </div>
  );
};

export default CreateUserAccount;
