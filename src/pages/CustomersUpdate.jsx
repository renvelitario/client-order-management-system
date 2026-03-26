import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import '../styles/shared/entity-form.css';

const CustomersUpdate = () => {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('cust_id');
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
        setError(err.response?.data?.error || 'Customer not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.put(`/customers/${customerId}`, formData);
      navigate('/cust_list');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update customer.');
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="update-customer-container">
      <h2>Update Customer</h2>

      {error ? (
        <p className="error">{error}</p>
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
