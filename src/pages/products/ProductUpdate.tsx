import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/shared/entity-form.css';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import { resolveApiErrorMessage } from '../../types/app';

const ProductsUpdate = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sku: '',
    product_name: '',
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
          sku: data.sku || '',
          product_name: data.product_name || '',
          price: data.price ?? '',
          status: data.status || 'active'
        });
      } catch (err) {
        setError(resolveApiErrorMessage(err, 'Product not found.'));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      await api.put(`/products/${productId}`, formData);
      navigate('/products');
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Failed to update product.'));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="update-product">
      <h2>Update a Product</h2>

      {error ? (
        <Notification message={error} type="error" />
      ) : (
        <form onSubmit={handleSubmit} className="update-form">
          <label>SKU:</label>
          <input type="text" name="sku" value={formData.sku} onChange={handleChange} required maxLength={32} /><br />

          <label>Product Name:</label>
          <input type="text" name="product_name" value={formData.product_name} onChange={handleChange} required /><br />

          <label>Price (PHP):</label>
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
