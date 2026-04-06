import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api from '../../utils/api';
import '../../styles/pages/auth/register.css';
import Notification from '../../components/ui/Notification';
import FilterDropdown from '../../components/ui/FilterDropdown';
import { resolveApiErrorMessage } from '../../types/app';

type AccountType = 'Admin' | 'User';
type AccountStatus = 'Active' | 'Disabled' | 'Suspended';

const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: 'Admin', label: 'Admin' },
  { value: 'User', label: 'User' },
];

const ACCOUNT_STATUS_OPTIONS: Array<{ value: AccountStatus; label: string }> = [
  { value: 'Active', label: 'Active' },
  { value: 'Disabled', label: 'Disabled' },
  { value: 'Suspended', label: 'Suspended' },
];

const CreateUserAccount = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    acc_type: 'User' as AccountType,
    status: 'Active' as AccountStatus,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
          <label id="create-user-account-type-label">Account Type:</label>
          <FilterDropdown
            id="create-user-account-type"
            className="create-user-select filter-inline-dropdown"
            ariaLabelledBy="create-user-account-type-label"
            value={formData.acc_type}
            options={ACCOUNT_TYPE_OPTIONS}
            onChange={(nextValue) => setFormData((previous) => ({ ...previous, acc_type: nextValue }))}
          />
        </div>

        <div className="form-group">
          <label id="create-user-status-label">Status:</label>
          <FilterDropdown
            id="create-user-status"
            className="create-user-select filter-inline-dropdown"
            ariaLabelledBy="create-user-status-label"
            value={formData.status}
            options={ACCOUNT_STATUS_OPTIONS}
            onChange={(nextValue) => setFormData((previous) => ({ ...previous, status: nextValue }))}
          />
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
