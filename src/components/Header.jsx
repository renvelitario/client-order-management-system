import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/components/header.css';

const entityLinks = [
  { to: '/products', label: 'Products' },
  { to: '/customers', label: 'Customers' },
  { to: '/purchases', label: 'Purchases' },
  { to: '/orders', label: 'Orders' },
];

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
      <nav className="navbar-top">
        <div className="container">
          <Link to="/dashboard" className="navbar-brand">
            <img src="/logo.png" className="logo-image" alt="Logo" />
            <span className="logo-text">FEU Alabang Order Management System</span>
          </Link>
        </div>
      </nav>

      <nav className="navbar-bottom">
        <div className="container">
          <ul className="navbar-nav">
            <li><Link to="/dashboard">Home</Link></li>
            {entityLinks.map(({ to, label }) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}

            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown">
                Account ▾<span className="caret"></span>
              </a>
              <ul className="dropdown-menu">
                <li><Link to="/account/users/new">Add User</Link></li>
                <li><Link to="/account/settings">Account Settings</Link></li>
                <li><Link to="/account/security">Security</Link></li>
                <li><a href="#" onClick={handleLogout} className="logout-link">Log Out</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;