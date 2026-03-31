import { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/pages/dashboard.css';

const RECENT_ORDERS_LIMIT = 5;

const formatOrderDate = (value) => {
  if (!value) return 'N/A';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleString();
};

const Dashboard = () => {
  const [user, setUser] = useState({});
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalCustomers: 0,
    totalPurchases: 0,
    totalOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, productsRes, custRes, purchRes, ordersRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/products'),
          api.get('/customers'),
          api.get('/purchases'),
          api.get('/orders')
        ]);

        setUser(meRes.data);
        
        const products = productsRes.data;
        const customers = custRes.data;
        const orders = ordersRes.data;

        const productNameById = new Map(products.map((product) => [String(product.product_id), product.product_name]));
        const customerNameById = new Map(customers.map((customer) => [Number(customer.customer_id), customer.name]));

        setStats({
          totalProducts: products.length,
          lowStockProducts: products.filter(p => p.quantity <= 10).length,
          outOfStockProducts: products.filter(p => p.quantity === 0).length,
          totalCustomers: customers.length,
          totalPurchases: purchRes.data.length,
          totalOrders: orders.length
        });

        const latestOrders = [...orders]
          .sort((left, right) => new Date(right.order_date) - new Date(left.order_date))
          .slice(0, RECENT_ORDERS_LIMIT)
          .map((order) => {
            // Get product names from order items
            const productNames = order.items
              ? order.items.map(item => productNameById.get(String(item.product_id)) || `Product #${item.product_id}`).join(', ')
              : 'N/A';
            
            return {
              ...order,
              product_name: productNames,
              customer_name: customerNameById.get(Number(order.customer_id)) || `Customer #${order.customer_id}`,
            };
          });

        setRecentOrders(latestOrders);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <>
      <div className="container">
        <h2>Welcome, {user.username || 'User'}!</h2>
        <p>Email: {user.email}</p>
        <p>Account Type: {user.acc_type}</p>
        <p>Status: {user.status}</p>
        <hr />
        
        <h2>Dashboard</h2>
        
        <div className="row-container">
          <div className="statistic-box">
            <h4>Total Products</h4>
            <p>{stats.totalProducts}</p>
          </div>
          <div className="statistic-box">
            <h4>Low Stock Products</h4>
            <p>{stats.lowStockProducts}</p>
          </div>
          <div className="statistic-box">
            <h4>Out of Stock Products</h4>
            <p>{stats.outOfStockProducts}</p>
          </div>
        </div>
        
        <div className="row-container">
          <div className="statistic-box">
            <h4>Total Customers</h4>
            <p>{stats.totalCustomers}</p>
          </div>
          <div className="statistic-box">
            <h4>Total Purchases</h4>
            <p>{stats.totalPurchases}</p>
          </div>
          <div className="statistic-box">
            <h4>Total Orders</h4>
            <p>{stats.totalOrders}</p>
          </div>
        </div>
        
        <hr />
        
        <h3>Recent Orders</h3>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Quantity</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.product_name}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.quantity}</td>
                  <td>{formatOrderDate(order.order_date)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5">No recent orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Dashboard;
