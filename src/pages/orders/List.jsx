import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import '../../styles/shared/entity-list.css';
import { formatPeso } from '../../utils/currency';
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import { formatDateTime } from '../../utils/date';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog((err) => err.response?.data?.error || 'Failed to delete order.');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const matchesSearch = (order) => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return true;

    return [
      String(order.order_id),
      String(order.customer_id),
      String(order.total_amount),
      String(order.order_date)
    ].some((value) => String(value).toLowerCase().includes(term));
  };

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/orders/${id}`),
      (id) => setOrders((prev) => prev.filter((order) => order.order_id !== id)),
      { success: 'Order deleted successfully.' },
    );
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      {deleteDialog.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Delete Order</h3>
            <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={handleDeleteCancel}>Cancel</button>
              <button className="modal-confirm-delete" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="header-row">
        <h2>Orders</h2>
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
          <Link to="/orders/new" className="create-button">
            <span className="material-icons">add</span>
            Create
          </Link>
        </div>
      </div>

      {notification.message && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <table id="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer ID</th>
            <th>Items</th>
            <th>Total Amount</th>
            <th>Order Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map(o => (
              <tr key={o.order_id} style={{ display: matchesSearch(o) ? '' : 'none' }}>
                <td>{o.order_id}</td>
                <td>{o.customer_id}</td>
                <td>
                  {o.items && o.items.length > 0
                    ? `${o.items.length} item(s)`
                    : 'No items'}
                </td>
                <td>{formatPeso(o.total_amount || 0)}</td>
                <td>{formatDateTime(o.order_date)}</td>
                <td>
                  <button
                    className="view-button"
                    onClick={() => alert(
                      o.items && o.items.length > 0
                        ? `Order Items:\n${o.items.map(item => `Product #${item.product_id}: ${item.quantity} x ${formatPeso(item.price)}`).join('\n')}`
                        : 'No items in this order'
                    )}
                  >
                    <span className="material-icons">visibility</span>
                    <span className="view-text">View Items</span>
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteClick(o.order_id)}
                  >
                    <span className="material-icons">delete</span>
                    <span className="delete-text">Delete</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6">No orders found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersList;