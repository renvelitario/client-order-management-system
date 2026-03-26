import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import '../styles/shared/entity-form.css';

const PurchasesAdd = () => {
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: ''
  });
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        setProducts(res.data);
        if (res.data.length) {
          setFormData((prev) => ({ ...prev, product_id: String(res.data[0].product_id) }));
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.confirm('Are you sure you want to add this purchase?')) {
      return;
    }

    try {
      await api.post('/purchases', formData);
      navigate('/purchases_list');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record purchase');
    }
  };

  return (
    <div className="purchase-container">
      <h2>Make a Purchase</h2>
      <form onSubmit={handleSubmit}>
        <label>Product ID:</label>
        <select name="product_id" value={formData.product_id} onChange={handleChange} required>
          {products.map(p => (
            <option key={p.product_id} value={p.product_id}>{p.product_id}</option>
          ))}
        </select><br />
        
        <label>Quantity:</label>
        <input type="text" name="quantity" value={formData.quantity} onChange={handleChange} required /><br />
        <input type="submit" value="Add Purchase" />
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default PurchasesAdd;
