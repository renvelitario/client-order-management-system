import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/components/header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  return (
    <>
      <nav role="navigation" className="navbar navbar-top">
        <div className="container">
          <div className="navbar-header">
            <Link to="/dashboard" className="navbar-brand">
              <img src="/logo.png" className="logo-image" alt="Logo" />
              <span className="logo-text">Order Management System</span>
            </Link>
          </div>
        </div>
      </nav>

      <nav role="navigation" className="navbar navbar-bottom">
        <div className="container">
          <ul className="nav navbar-nav">
            <li><Link to="/dashboard">Home</Link></li>
            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown">Products<span className="caret"></span></a>
              <ul className="dropdown-menu">
                <li><Link to="/products_list">Product List</Link></li>
                <li><Link to="/products_add">Add a New Product</Link></li>
              </ul>
            </li>
            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown">Customers<span className="caret"></span></a>
              <ul className="dropdown-menu">
                <li><Link to="/cust_list">Customer List</Link></li>
                <li><Link to="/cust_add">Add a New Customer</Link></li>
              </ul>
            </li>
            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown">Purchases<span className="caret"></span></a>
              <ul className="dropdown-menu">
                <li><Link to="/purchases_list">Purchase List</Link></li>
                <li><Link to="/purchases">Make a Purchase</Link></li>
              </ul>
            </li>
            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown">Orders<span className="caret"></span></a>
              <ul className="dropdown-menu">
                <li><Link to="/orders_list">Order List</Link></li>
                <li><Link to="/orders">Make an Order</Link></li>
              </ul>
            </li>
            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown">Account<span className="caret"></span></a>
              <ul className="dropdown-menu">
                <li><Link to="/register">Add User</Link></li>
                <li><Link to="/settings">Account Settings</Link></li>
                <li><Link to="/change_pass">Security</Link></li>
                <li><a href="#" onClick={handleLogout}>Log Out</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;
