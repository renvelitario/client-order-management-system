import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import './css/products/products_list.css';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const matchesSearch = (product) => {
    const term = appliedSearch.trim().toLowerCase();
    if (!term) return true;

    return [
      String(product.product_id),
      product.product_name,
      String(product.quantity),
      String(product.price),
      product.status
    ].some((value) => String(value).toLowerCase().includes(term));
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2>Products</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="button" className="search-button" onClick={() => setAppliedSearch(searchInput)}>
          Search
        </button>
      </div>
      <table id="products-table">
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map(p => (
              <tr
                key={p.product_id}
                className={p.status === 'inactive' ? 'inactive-row' : ''}
                style={{ display: matchesSearch(p) ? '' : 'none' }}
              >
                <td>{p.product_id}</td>
                <td>{p.product_name}</td>
                <td>{p.quantity}</td>
                <td>{Number(p.price).toFixed(2)}</td>
                <td>{p.status}</td>
                <td>
                  <Link to={`/products_update?product_id=${p.product_id}`} className="edit-button">Edit</Link>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6">No products found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsList;
