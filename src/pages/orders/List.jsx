import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import '../../styles/shared/entity-list.css';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

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
      String(order.product_id),
      String(order.customer_id),
      String(order.quantity),
      String(order.amount),
      String(order.order_date)
    ].some((value) => String(value).toLowerCase().includes(term));
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
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

      <table id="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Product ID</th>
            <th>Customer ID</th>
            <th>Quantity</th>
            <th>Amount</th>
            <th>Order Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map(o => (
              <tr key={o.order_id} style={{ display: matchesSearch(o) ? '' : 'none' }}>
                <td>{o.order_id}</td>
                <td>{o.product_id}</td>
                <td>{o.customer_id}</td>
                <td>{o.quantity}</td>
                <td>{o.amount}</td>
                <td>{o.order_date}</td>
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