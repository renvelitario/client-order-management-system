import { useEffect, useState } from 'react';
import api from '../utils/api';
import './css/dashboard.css';

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
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, productsRes, custRes, purchRes, ordersRes, sysUsersRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/products'),
          api.get('/customers'),
          api.get('/purchases'),
          api.get('/orders'),
          api.get('/users').catch(() => ({ data: [] }))
        ]);

        setUser(meRes.data);
        
        const products = productsRes.data;
        setStats({
          totalProducts: products.length,
          lowStockProducts: products.filter(p => p.quantity <= 10).length,
          outOfStockProducts: products.filter(p => p.quantity === 0).length,
          totalCustomers: custRes.data.length,
          totalPurchases: purchRes.data.length,
          totalOrders: ordersRes.data.length
        });
        
        setUsersList(sysUsersRes.data);
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
        
        <h3>User List</h3>
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Email</th>
              <th>Username</th>
              <th>Account Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length > 0 ? (
              usersList.map(u => (
                <tr key={u.user_id} className={u.status.toLowerCase() === 'inactive' ? 'inactive-row' : ''}>
                  <td>{u.user_id}</td>
                  <td>{u.email}</td>
                  <td>{u.username}</td>
                  <td>{u.acc_type}</td>
                  <td>{u.status}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Dashboard;
