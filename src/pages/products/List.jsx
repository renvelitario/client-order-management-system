import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";
import "../../styles/shared/entity-list.css";
import { formatPeso } from "../../utils/currency";
import { useDeleteDialog } from '../../hooks/useDeleteDialog';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog((err) => {
    if (err.response?.status === 409) {
      return 'This record cannot be deleted because it is used in other records.';
    }
    return err.response?.data?.error || 'Failed to delete record.';
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/products/${id}`),
      (id) => setProducts((prev) => prev.filter((p) => p.product_id !== id)),
    );
  };

  const matchesSearch = (product) => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return true;

    return [
      String(product.product_id),
      product.product_name,
      String(product.quantity),
      String(product.price),
      product.status,
    ].some((value) => String(value).toLowerCase().includes(term));
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      {deleteDialog.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={handleDeleteCancel}>Cancel</button>
              <button className="modal-confirm-delete" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="header-row">
        <h2>Products</h2>
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
          <Link to="/products/new" className="create-button">
            <span className="material-icons">add</span>
            Create
          </Link>
        </div>
      </div>

      {notification.message && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

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
                style={{ display: matchesSearch(p) ? "" : "none" }}
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
              <td colSpan="6">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsList;
