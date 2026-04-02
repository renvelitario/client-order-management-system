import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/shared/entity-form.css';
import { resolveApiErrorMessage } from '../../types/app';

const ProductsAdd = () => {
  const [formData, setFormData] = useState({
    product_name: '',
    quantity: '',
    price: '',
    status: 'active'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      navigate('/products');
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Failed to add product'));
    }
  };

  return (
    <div className="product-container">
      <h2>Add a Product</h2>
      <form onSubmit={handleSubmit}>
        <label>Product Name:</label>
        <input type="text" name="product_name" value={formData.product_name} onChange={handleChange} required /><br />
        <label>Quantity:</label>
        <input type="number" min="0" name="quantity" value={formData.quantity} onChange={handleChange} required /><br />
        <label>Price (PHP):</label>
        <input type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} required /><br />
        <label>Status:</label>
        <select name="status" value={formData.status} onChange={handleChange} required>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select><br />
        <input type="submit" value="Add Product" />
        {error && <div className="notification error">{error}</div>}
      </form>
    </div>
  );
};

export default ProductsAdd;
