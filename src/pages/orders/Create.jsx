import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/shared/entity-form.css';
import { formatPeso } from '../../utils/currency';
import { getListData } from '../../utils/listResponse';

const OrdersAdd = () => {
  const [formData, setFormData] = useState({
    customer_id: '',
    items_data: [{ product_id: '', quantity: '' }]
  });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const highlightTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products', { params: { page: 1, limit: 100, sort: 'desc' } })
      .then((res) => {
        const rows = getListData(res.data).data;
        const activeProducts = rows.filter((p) => String(p.status).toLowerCase() === 'active');
        setProducts(activeProducts);
      })
      .catch(console.error);

    api.get('/customers', { params: { page: 1, limit: 100, sort: 'desc' } })
      .then((res) => {
        const rows = getListData(res.data).data;
        setCustomers(rows);
        if (rows.length) {
          setFormData((prev) => ({ ...prev, customer_id: String(rows[0].customer_id) }));
        }
      })
      .catch(console.error);
  }, []);

  const handleCustomerChange = (e) => {
    setFormData({ ...formData, customer_id: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    if (field === 'product_id' && value) {
      const duplicateIndex = formData.items_data.findIndex(
        (item, itemIndex) => itemIndex !== index && String(item.product_id) === String(value)
      );

      if (duplicateIndex !== -1) {
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current);
        }

        setHighlightedIndex(duplicateIndex);
        setError('This product is already selected in another order item.');

        const existingBlock = document.getElementById(`item-block-${duplicateIndex}`);
        if (existingBlock) {
          existingBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        highlightTimerRef.current = setTimeout(() => {
          setHighlightedIndex(null);
        }, 1500);

        return;
      }
    }

    const newItems = [...formData.items_data];
    newItems[index][field] = value;
    setFormData({ ...formData, items_data: newItems });
    if (error) {
      setError('');
    }
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
          <div
            key={index}
            id={`item-block-${index}`}
            className={highlightedIndex === index ? 'order-item-block order-item-block-highlight' : 'order-item-block'}
          >
            <label>Product:</label>
            <select 
              value={item.product_id} 
              onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
              required
            >
              <option value="">Select a product</option>
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_id} - {p.product_name} ({formatPeso(p.price)})
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
              <button type="button" onClick={() => removeItem(index)} className="order-item-remove-button">
                Remove Item
              </button>
            )}
          </div>
        ))}
        
        <button type="button" onClick={addItem} className="order-item-add-button">
          Add Another Item
        </button><br />
        
        <input type="submit" value="Create Order" />
        {error && <div className="notification error">{error}</div>}
      </form>
    </div>
  );
};

export default OrdersAdd;
