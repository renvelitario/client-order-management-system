import api from "../../utils/api";
import { Link } from "react-router-dom";
import "../../styles/shared/entity-list.css";
import { formatPeso } from "../../utils/formatters";
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import Pagination from '../../components/ui/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import type { ApiError, Product } from '../../types/app';

const ProductsList = () => {
  const { isAdmin } = useAuth();
  const {
    rows: products,
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
  } = usePaginatedList<Product>({ endpoint: '/products', initialSort: 'desc' });
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
      (id) => api.delete(`/products/${id}`),
      () => refetch(),
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container">
      <DeleteConfirmModal
        open={deleteDialog.show}
        title="Delete Product"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <ListPageHeader
        title="Products"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        action={isAdmin && (
          <Link to="/products/new" className="create-button">
            <span className="material-icons">add</span>
            Create
          </Link>
        )}
      />

      <Notification message={notification.message} type={notification.type} />

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
            products.map((p) => (
              <tr
                key={p.product_id}
                className={p.status === "inactive" ? "inactive-row" : ""}
              >
                <td>{p.product_id}</td>
                <td>{p.product_name}</td>
                <td>{p.quantity}</td>
                <td>{formatPeso(p.price)}</td>
                <td>{p.status}</td>
                <td>
                  <Link
                    to={`/products/edit?product_id=${p.product_id}`}
                    className="edit-button"
                  >
                    <span className="material-icons">edit</span>
                    <span className="edit-text">Edit</span>
                  </Link>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteClick(p.product_id)}
                  >
                    <span className="material-icons">delete</span>
                    <span className="delete-text">Delete</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>No products found.</td>
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

export default ProductsList;
