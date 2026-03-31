import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import '../../styles/shared/entity-list.css';
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import { formatDateTime } from '../../utils/date';

const PurchasesList = () => {
  const [purchases, setPurchases] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog((err) => err.response?.data?.error || 'Failed to delete record.');

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

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/purchases/${id}`),
      (id) => setPurchases((prev) => prev.filter((p) => p.purchase_id !== id)),
    );
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
      {deleteDialog.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Delete Purchase</h3>
            <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={handleDeleteCancel}>Cancel</button>
              <button className="modal-confirm-delete" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

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
          <Link to="/purchases/new" className="create-button">
            <span className="material-icons">add</span>
            Create
          </Link>
        </div>
      </div>

      {notification.message && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <table id="purchases-table">
        <thead>
          <tr>
            <th>Purchase ID</th>
            <th>Product ID</th>
            <th>Quantity</th>
            <th>Purchase Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.length > 0 ? (
            purchases.map(p => (
              <tr key={p.purchase_id} style={{ display: matchesSearch(p) ? '' : 'none' }}>
                <td>{p.purchase_id}</td>
                <td>{p.product_id}</td>
                <td>{p.quantity}</td>
                <td>{formatDateTime(p.purchase_date)}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteClick(p.purchase_id)}
                  >
                    <span className="material-icons">delete</span>
                    <span className="delete-text">Delete</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5">No purchases found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PurchasesList;