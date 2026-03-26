import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import '../styles/shared/entity-form.css';

const OrdersAdd = () => {
  const [formData, setFormData] = useState({
    product_id: '',
    customer_id: '',
    quantity: ''
  });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        const activeProducts = res.data.filter((p) => String(p.status).toLowerCase() === 'active');
        setProducts(activeProducts);
        if (activeProducts.length) {
          setFormData((prev) => ({ ...prev, product_id: String(activeProducts[0].product_id) }));
        }
      })
      .catch(console.error);

    api.get('/customers')
      .then((res) => {
        setCustomers(res.data);
        if (res.data.length) {
          setFormData((prev) => ({ ...prev, customer_id: String(res.data[0].cust_id) }));
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.confirm('Are you sure you want to add this order?')) {
      return;
    }

    try {
      await api.post('/orders', formData);
      navigate('/orders_list');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add order');
    }
  };

  return (
    <div className="order-container">
      <h2>Make an Order</h2>
      <form onSubmit={handleSubmit}>
        <label>Product ID:</label>
        <select name="product_id" value={formData.product_id} onChange={handleChange} required>
          {products.map(p => (
            <option key={p.product_id} value={p.product_id}>{p.product_id}</option>
          ))}
        </select><br />
        
        <label>Customer ID:</label>
        <select name="customer_id" value={formData.customer_id} onChange={handleChange} required>
          {customers.map(c => (
            <option key={c.cust_id} value={c.cust_id}>{c.cust_id}</option>
          ))}
        </select><br />
        
        <label>Quantity:</label>
        <input type="text" name="quantity" value={formData.quantity} onChange={handleChange} required /><br />
        <input type="submit" value="Add Order" />
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default OrdersAdd;
