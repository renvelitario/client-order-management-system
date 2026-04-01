import api from '../../utils/api';
import { Link } from 'react-router-dom';
import '../../styles/shared/entity-list.css';
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import { formatDateTime } from '../../utils/date';
import Pagination from '../../components/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';

const PurchasesList = () => {
  const { isAdmin } = useAuth();
  const {
    rows: purchases,
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
  } = usePaginatedList({ endpoint: '/purchases', initialSort: 'desc' });
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog((err) => err.response?.data?.error || 'Failed to delete record.');

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/purchases/${id}`),
      () => refetch(),
    );
  };

  const pagePurchases = purchases;

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <DeleteConfirmModal
        open={deleteDialog.show}
        title="Delete Purchase"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <div className="header-row">
        <h2>Purchases</h2>
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
            <Link to="/purchases/new" className="create-button">
              <span className="material-icons">add</span>
              Create
            </Link>
          )}
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
          {pagePurchases.length > 0 ? (
            pagePurchases.map(p => (
              <tr key={p.purchase_id}>
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

export default PurchasesList;