import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/shared/entity-form.css';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import { resolveApiErrorMessage } from '../../types/app';

const CustomersUpdate = () => {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_no: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        setError('Invalid request.');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/customers/${customerId}`);
        setFormData({
          name: data.name || '',
          address: data.address || '',
          contact_no: data.contact_no || ''
        });
      } catch (err) {
        setError(resolveApiErrorMessage(err, 'Customer not found.'));
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      await api.put(`/customers/${customerId}`, formData);
      navigate('/customers');
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Failed to update customer.'));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="update-customer-container">
      <h2>Update Customer</h2>

      {error ? (
        <Notification message={error} type="error" />
      ) : (
        <form onSubmit={handleSubmit} className="update-customer-form">
          <div className="form-group">
            <label>Name:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Address:</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Contact No:</label>
            <input type="text" name="contact_no" value={formData.contact_no} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <input type="submit" value="Update" />
          </div>
        </form>
      )}
    </div>
  );
};

export default CustomersUpdate;
