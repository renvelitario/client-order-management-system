import { useEffect, useState } from 'react';
import api from '../utils/api';
import './css/purchases/purchases_list.css';

const PurchasesList = () => {
  const [purchases, setPurchases] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
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
    const term = appliedSearch.trim().toLowerCase();
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
      <h2>Purchases</h2>
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
