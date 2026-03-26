import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import '../styles/shared/entity-list.css';

const PurchasesList = () => {
  const [purchases, setPurchases] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data } = await api.get('/purchases');
      setPurchases(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const matchesSearch = (purchase) => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return true;

    return [
      String(purchase.purchase_id),
      String(purchase.product_id),
      String(purchase.quantity),
      String(purchase.purchase_date)
    ].some((value) => String(value).toLowerCase().includes(term));
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="header-row">
        <h2>Purchases</h2>
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Link to="/purchases_add" className="create-button">
            <span className="material-icons">add</span>
            Create
          </Link>
        </div>
      </div>

      <table id="purchases-table">
        <thead>
          <tr>
            <th>Purchase ID</th>
            <th>Product ID</th>
            <th>Quantity</th>
            <th>Purchase Date</th>
          </tr>
        </thead>
        <tbody>
          {purchases.length > 0 ? (
            purchases.map(p => (
              <tr key={p.purchase_id} style={{ display: matchesSearch(p) ? '' : 'none' }}>
                <td>{p.purchase_id}</td>
                <td>{p.product_id}</td>
                <td>{p.quantity}</td>
                <td>{p.purchase_date}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="4">No purchases found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PurchasesList;