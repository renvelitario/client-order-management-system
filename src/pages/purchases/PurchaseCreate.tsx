import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/shared/entity-form.css';
import { getListData } from '../../utils/listResponse';
import type { Product } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';

const PurchasesAdd = () => {
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products', { params: { page: 1, limit: 100, sort: 'desc' } })
      .then((res) => {
        const rows = getListData<Product>(res.data).data;
        setProducts(rows);
        if (rows.length) {
          setFormData((prev) => ({ ...prev, product_id: String(rows[0].product_id) }));
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!window.confirm('Are you sure you want to add this purchase?')) {
      return;
    }

    try {
      await api.post('/purchases', formData);
      navigate('/purchases');
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Failed to record purchase'));
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
        {error && <div className="notification error">{error}</div>}
      </form>
    </div>
  );
};

export default PurchasesAdd;
