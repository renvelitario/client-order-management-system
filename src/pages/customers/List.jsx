import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";
import "../../styles/shared/entity-list.css";

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ show: false, id: null });
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get("/customers");
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  const handleDeleteClick = (id) => {
    setDeleteDialog({ show: true, id });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ show: false, id: null });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ show: false, id: null });
    try {
      await api.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c.customer_id !== id));
      showNotification('Record deleted successfully.', 'success');
    } catch (err) {
      const msg = err.response?.status === 409
        ? 'This record cannot be deleted because it is used in other records.'
        : (err.response?.data?.error || 'Failed to delete record.');
      showNotification(msg, 'error');
    }
  };

  const matchesSearch = (customer) => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return true;

    return [
      String(customer.customer_id),
      customer.name,
      customer.address,
      customer.contact_no,
    ].some((value) => String(value).toLowerCase().includes(term));
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      {deleteDialog.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Delete Customer</h3>
            <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={handleDeleteCancel}>Cancel</button>
              <button className="modal-confirm-delete" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="header-row">
        <h2>Customers</h2>
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
          <Link to="/customers/new" className="create-button">
            <span className="material-icons">add</span>
            Create
          </Link>
        </div>
      </div>

      {notification.message && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

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
              <tr
                key={c.customer_id}
                style={{ display: matchesSearch(c) ? "" : "none" }}
              >
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
              <td colSpan="5">No customers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersList;
