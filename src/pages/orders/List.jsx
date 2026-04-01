import api from '../../utils/api';
import { Link } from 'react-router-dom';
import '../../styles/shared/entity-list.css';
import { formatPeso } from '../../utils/currency';
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import { formatDateTime } from '../../utils/date';
import Pagination from '../../components/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';

const OrdersList = () => {
  const { isAdmin } = useAuth();
  const {
    rows: orders,
    searchInput,
    loading,
    currentPage,
    pageSize,
    totalRows,
    totalPages,
    setCurrentPage,
    handleSearchChange,
    handlePageSizeChange,
    refetch,
  } = usePaginatedList({ endpoint: '/orders', initialSort: 'desc' });
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog((err) => err.response?.data?.error || 'Failed to delete order.');

  
  const pageOrders = orders;

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/orders/${id}`),
      () => refetch(),
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
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Link to="/orders/new" className="create-button">
              <span className="material-icons">add</span>
              Create
            </Link>
          )}
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
          {pageOrders.length > 0 ? (
            pageOrders.map(o => (
              <tr key={o.order_id}>
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        totalRows={totalRows}
      />
    </div>
  );
};

export default OrdersList;