import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import '../../styles/shared/entity-list.css';

const formatOrderDate = (value) => {
  if (!value) return 'N/A';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleString();
};

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
      String(order.customer_id),
      String(order.total_amount),
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
                <td>${Number(o.total_amount || 0).toFixed(2)}</td>
                <td>{formatOrderDate(o.order_date)}</td>
                <td>
                  <button 
                    onClick={() => alert(
                      o.items && o.items.length > 0
                        ? `Order Items:\n${o.items.map(item => `Product #${item.product_id}: ${item.quantity} x $${Number(item.price).toFixed(2)}`).join('\n')}`
                        : 'No items in this order'
                    )}
                    style={{ padding: '5px 10px', marginRight: '5px' }}
                  >
                    View Items
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this order?')) {
                        api.delete(`/orders/${o.order_id}`)
                          .then(() => {
                            setOrders(orders.filter(order => order.order_id !== o.order_id));
                          })
                          .catch(err => console.error(err));
                      }
                    }}
                    style={{ padding: '5px 10px' }}
                  >
                    Delete
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