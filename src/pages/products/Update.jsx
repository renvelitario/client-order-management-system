import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/shared/entity-form.css';

const ProductsUpdate = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    product_name: '',
    quantity: '',
    price: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Invalid request.');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/products/${productId}`);
        setFormData({
          product_name: data.product_name || '',
          quantity: data.quantity ?? '',
          price: data.price ?? '',
          status: data.status || 'active'
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.put(`/products/${productId}`, formData);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product.');
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="update-product">
      <h2>Update a Product</h2>

      {error ? (
        <p className="error">{error}</p>
      ) : (
        <form onSubmit={handleSubmit} className="update-form">
          <label>Product Name:</label>
          <input type="text" name="product_name" value={formData.product_name} onChange={handleChange} required /><br />

          <label>Quantity:</label>
          <input type="number" min="0" name="quantity" value={formData.quantity} onChange={handleChange} required /><br />

          <label>Price:</label>
          <input type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} required /><br />

          <label>Status:</label>
          <select name="status" value={formData.status} onChange={handleChange} required>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select><br />

          <input type="submit" value="Update" />
        </form>
      )}
    </div>
  );
};

export default ProductsUpdate;
