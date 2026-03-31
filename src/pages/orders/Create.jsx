import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/shared/entity-form.css';

const OrdersAdd = () => {
  const [formData, setFormData] = useState({
    customer_id: '',
    items_data: [{ product_id: '', quantity: '' }]
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
      })
      .catch(console.error);

    api.get('/customers')
      .then((res) => {
        setCustomers(res.data);
        if (res.data.length) {
          setFormData((prev) => ({ ...prev, customer_id: String(res.data[0].customer_id) }));
        }
      })
      .catch(console.error);
  }, []);

  const handleCustomerChange = (e) => {
    setFormData({ ...formData, customer_id: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items_data];
    newItems[index][field] = value;
    setFormData({ ...formData, items_data: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items_data: [...formData.items_data, { product_id: '', quantity: '' }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items_data: formData.items_data.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.confirm('Are you sure you want to add this order?')) {
      return;
    }

    try {
      await api.post('/orders', formData);
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add order');
    }
  };

  return (
    <div className="order-container">
      <h2>Make an Order</h2>
      <form onSubmit={handleSubmit}>
        <label>Customer ID:</label>
        <select value={formData.customer_id} onChange={handleCustomerChange} required>
          <option value="">Select a customer</option>
          {customers.map(c => (
            <option key={c.customer_id} value={c.customer_id}>{c.customer_id} - {c.name}</option>
          ))}
        </select><br />
        
        <h3>Order Items</h3>
        {formData.items_data.map((item, index) => (
          <div key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <label>Product:</label>
            <select 
              value={item.product_id} 
              onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
              required
            >
              <option value="">Select a product</option>
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_id} - {p.product_name} (${p.price})
                </option>
              ))}
            </select><br />
            
            <label>Quantity:</label>
            <input 
              type="number" 
              value={item.quantity} 
              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              min="1"
              required
            /><br />
            
            {formData.items_data.length > 1 && (
              <button type="button" onClick={() => removeItem(index)} style={{ marginTop: '10px' }}>
                Remove Item
              </button>
            )}
          </div>
        ))}
        
        <button type="button" onClick={addItem} style={{ marginBottom: '15px' }}>
          Add Another Item
        </button><br />
        
        <input type="submit" value="Create Order" />
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default OrdersAdd;
