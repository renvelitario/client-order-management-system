import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/shared/entity-form.css';
import Notification from '../../components/ui/Notification';
import { resolveApiErrorMessage } from '../../types/app';

const CustomersAdd = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_no: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      navigate('/customers');
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Failed to add customer'));
    }
  };

  return (
    <div className="add-customer">
      <h2>Add a Customer</h2>
      <Notification message={error} type="error" />
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required /><br />
        <label>Address:</label>
        <textarea name="address" value={formData.address} onChange={handleChange} required></textarea><br />
        <label>Contact No:</label>
        <input type="text" name="contact_no" value={formData.contact_no} onChange={handleChange} required /><br />
        <input type="submit" value="Add Customer" />
      </form>
    </div>
  );
};

export default CustomersAdd;
