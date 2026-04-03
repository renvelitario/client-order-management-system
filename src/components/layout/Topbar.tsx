import { useState, useEffect, useRef } from 'react';
import type { Dispatch, MouseEvent, RefObject, SetStateAction } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import Icon from '../ui/Icon';

const Topbar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarToggleRef,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarToggleRef: RefObject<HTMLButtonElement>;
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [fallbackAccount, setFallbackAccount] = useState({ name: 'Account', email: '' });
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { localUser, isAdmin } = useAuth();

  const homePath = isAdmin ? '/dashboard' : '/delivery/orders';
  const accountName = localUser
    ? ((localUser.username || localUser.email || 'Account').trim() || 'Account')
    : fallbackAccount.name;
  const accountEmail = localUser?.email || fallbackAccount.email;

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handleDocumentClick = (event: MouseEvent | globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (accountMenuRef.current && target && !accountMenuRef.current.contains(target)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
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
    if (localUser) return;

    supabase.auth.getUser().then(({ data }) => {
      setFallbackAccount({
        name: data?.user?.email || 'Account',
        email: data?.user?.email || '',
      });
    });
  }, [localUser]);

  const handleLogout = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsAccountMenuOpen(false);
    if (window.confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  return (
    <header className="mobile-shell-bar">
      <button
        ref={sidebarToggleRef}
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
          <div className="top-account-divider" role="separator" />

          <button type="button" className="top-account-item top-account-logout" role="menuitem" onClick={handleLogout}>
            <Icon name="logout" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
