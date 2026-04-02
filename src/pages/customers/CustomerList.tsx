import api from "../../utils/api";
import { Link } from "react-router-dom";
import "../../styles/shared/entity-list.css";
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import Pagination from '../../components/ui/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import type { ApiError, Customer } from '../../types/app';

const CustomersList = () => {
  const { isAdmin } = useAuth();
  const {
    rows: customers,
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
  } = usePaginatedList<Customer>({ endpoint: '/customers', initialSort: 'desc' });
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog<number>((err: ApiError) => {
    if (err.response?.status === 409) {
      return 'This record cannot be deleted because it is used in other records.';
    }
    return err.response?.data?.error || 'Failed to delete record.';
  });

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/customers/${id}`),
      () => refetch(),
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container">
      <DeleteConfirmModal
        open={deleteDialog.show}
        title="Delete Customer"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <ListPageHeader
        title="Customers"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        action={isAdmin && (
          <Link to="/customers/new" className="create-button">
            <span className="material-icons">add</span>
            Create
          </Link>
        )}
      />

      <Notification message={notification.message} type={notification.type} />

      <table id="customers-table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Contact No</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((c) => (
              <tr key={c.customer_id}>
                <td>{c.customer_id}</td>
                <td>{c.name}</td>
                <td>{c.address}</td>
                <td>{c.contact_no}</td>
                <td>
                  <Link
                    to={`/customers/edit?customer_id=${c.customer_id}`}
                    className="edit-button"
                  >
                    <span className="material-icons">edit</span>
                    <span className="edit-text">Edit</span>
                  </Link>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteClick(c.customer_id)}
                  >
                    <span className="material-icons">delete</span>
                    <span className="delete-text">Delete</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No customers found.</td>
            </tr>
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

export default CustomersList;
