import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import '../styles/components/header.css';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/products', label: 'Products', icon: 'products' },
  { to: '/customers', label: 'Customers', icon: 'customers' },
  { to: '/purchases', label: 'Purchases', icon: 'purchases' },
  { to: '/orders', label: 'Orders', icon: 'orders' },
];

const deliveryLinks = [
  { to: '/delivery/orders', label: 'Delivery Orders', icon: 'delivery', end: true },
];

const Icon = ({ name }) => {
  const icons = {
    dashboard: (
      <>
        <path d="M4 4h7v7H4z" />
        <path d="M13 4h7v4h-7z" />
        <path d="M13 10h7v10h-7z" />
        <path d="M4 13h7v7H4z" />
      </>
    ),
    products: (
      <>
        <path d="M12 3 4 7v10l8 4 8-4V7z" />
        <path d="M4 7l8 4 8-4" />
        <path d="M12 11v10" />
      </>
    ),
    customers: (
      <>
        <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M5 19a4 4 0 0 1 8 0" />
        <path d="M16 10a2.5 2.5 0 1 0 0-5" />
        <path d="M15 19a4 4 0 0 1 4-3.5" />
      </>
    ),
    purchases: (
      <>
        <path d="M4 6h15l-1.2 8.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.7L4.8 4.8A1 1 0 0 0 3.8 4H2" />
        <path d="M9 20a1 1 0 1 0 0 .01" />
        <path d="M17 20a1 1 0 1 0 0 .01" />
      </>
    ),
    orders: (
      <>
        <path d="M7 4h10l3 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z" />
        <path d="M7 4v4h10V4" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </>
    ),
    delivery: (
      <>
        <path d="M3 7h12v7H3z" />
        <path d="M15 10h3l3 3v1h-6z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
    users: (
      <>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    settings: (
      <>
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.12-1.58 1.7 1.7 0 0 0-1.78.36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c0 .7.42 1.33 1.06 1.6.16.07.33.1.5.1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03Z" />
      </>
    ),
    security: (
      <>
        <path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z" />
        <path d="m9.5 12 1.7 1.7 3.3-3.4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v2" />
        <path d="M15 12H3" />
        <path d="m6 9-3 3 3 3" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
};

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [fallbackAccount, setFallbackAccount] = useState({ name: 'Account', email: '' });
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();
  const { localUser, isAdmin } = useAuth();
  const navLinks = isAdmin ? adminLinks : deliveryLinks;
  const homePath = isAdmin ? '/dashboard' : '/delivery/orders';
  const accountName = localUser
    ? ((localUser.username || localUser.email || 'Account').trim() || 'Account')
    : fallbackAccount.name;
  const accountEmail = localUser?.email || fallbackAccount.email;

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handleDocumentClick = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (localUser) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setFallbackAccount({
        name: data?.user?.email || 'Account',
        email: data?.user?.email || '',
      });
    });
  }, [localUser]);

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsAccountMenuOpen(false);
    if (window.confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  return (
    <>
      <div
        className={`sidebar-backdrop${isSidebarOpen ? ' is-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      <header className="mobile-shell-bar">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setIsSidebarOpen((current) => !current)}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <Icon name={isSidebarOpen ? 'close' : 'menu'} />
        </button>

        <Link to={homePath} className="mobile-shell-brand">
          <img src="/logo.png" className="logo-image" alt="Logo" />
          <div className="mobile-shell-brand-copy">
            <strong>Order Management System</strong>
            <span>Operations workspace</span>
          </div>
        </Link>

        <div className="topbar-spacer" />

        <div className="top-account-menu" ref={accountMenuRef}>
          <button
            type="button"
            className="top-account-trigger"
            onClick={() => setIsAccountMenuOpen((current) => !current)}
            aria-expanded={isAccountMenuOpen}
            aria-haspopup="menu"
            aria-label="Open account menu"
          >
            <span className="top-account-avatar" aria-hidden="true">
              {accountName.slice(0, 1).toUpperCase()}
            </span>
            <span className="top-account-name">{accountName}</span>
          </button>

          <div className={`top-account-dropdown${isAccountMenuOpen ? ' is-open' : ''}`} role="menu">
            <div className="top-account-summary">
              <strong>{accountName}</strong>
              <span>{accountEmail || 'No email available'}</span>
            </div>

            <div className="top-account-divider" role="separator" />

            <NavLink
              to="/account/settings"
              className={({ isActive }) => `top-account-item${isActive ? ' is-active' : ''}`}
              role="menuitem"
              onClick={() => setIsAccountMenuOpen(false)}
            >
              <Icon name="settings" />
              <span>Account Settings</span>
            </NavLink>
            <NavLink
              to="/account/security"
              className={({ isActive }) => `top-account-item${isActive ? ' is-active' : ''}`}
              role="menuitem"
              onClick={() => setIsAccountMenuOpen(false)}
            >
              <Icon name="security" />
              <span>Security</span>
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/account/users/new"
                className={({ isActive }) => `top-account-item${isActive ? ' is-active' : ''}`}
                role="menuitem"
                onClick={() => setIsAccountMenuOpen(false)}
              >
                <Icon name="users" />
                <span>Add User</span>
              </NavLink>
            )}

            <div className="top-account-divider" role="separator" />

            <button type="button" className="top-account-item top-account-logout" role="menuitem" onClick={handleLogout}>
              <Icon name="logout" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <aside className={`dashboard-sidebar${isSidebarOpen ? ' is-open' : ''}`}>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <div className="sidebar-section">
            {navLinks.map(({ to, label, icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="sidebar-link-icon"><Icon name={icon} /></span>
                <span className="sidebar-link-label">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

      </aside>
    </>
  );
};

export default Header;