import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import '../styles/shared/entity-list.css';

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const matchesSearch = (customer) => {
    const term = appliedSearch.trim().toLowerCase();
    if (!term) return true;

    return [
      String(customer.cust_id),
      customer.name,
      customer.address,
      customer.contact_no
    ].some((value) => String(value).toLowerCase().includes(term));
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2>Customers</h2>
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
            customers.map(c => (
              <tr key={c.cust_id} style={{ display: matchesSearch(c) ? '' : 'none' }}>
                <td>{c.cust_id}</td>
                <td>{c.name}</td>
                <td>{c.address}</td>
                <td>{c.contact_no}</td>
                <td>
                  <Link to={`/cust_update?cust_id=${c.cust_id}`} className="edit-button">Edit</Link>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5">No customers found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersList;
