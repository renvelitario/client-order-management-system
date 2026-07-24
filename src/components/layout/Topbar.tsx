import { useState, useEffect, useRef } from 'react';
import type { Dispatch, MouseEvent, RefObject, SetStateAction } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import AppIcon from '../ui/AppIcon';
import Icon from '../ui/Icon';

const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

const Topbar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarToggleRef,
  showSidebarToggle,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarToggleRef: RefObject<HTMLButtonElement>;
  showSidebarToggle: boolean;
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [fallbackAccount, setFallbackAccount] = useState({ name: 'Account', email: '' });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { localUser, isAdmin } = useAuth();

  const homePath = isAdmin ? '/dashboard' : '/delivery/home';
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

  useEffect(() => {
    let isMounted = true;

    const loadUnreadSummary = async () => {
      try {
        const { data } = await api.get('/notifications/summary');
        if (isMounted) {
          setUnreadNotifications(Number(data?.unread || 0));
        }
      } catch {
        if (isMounted) {
          setUnreadNotifications(0);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadUnreadSummary();
      }
    };

    const handleNotificationChange = () => {
      void loadUnreadSummary();
    };

    void loadUnreadSummary();
    const intervalId = window.setInterval(() => {
      void loadUnreadSummary();
    }, NOTIFICATION_POLL_INTERVAL_MS);

    window.addEventListener('notifications:changed', handleNotificationChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('notifications:changed', handleNotificationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleLogout = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsAccountMenuOpen(false);
    if (window.confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut({ scope: 'local' });
      navigate('/login');
    }
  };

  return (
    <header className="mobile-shell-bar">
      {showSidebarToggle && (
        <button
          ref={sidebarToggleRef}
          type="button"
          className="sidebar-toggle"
          onClick={() => setIsSidebarOpen((current) => !current)}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <Icon name={isSidebarOpen ? 'close' : 'menu'} />
        </button>
      )}

      <Link to={homePath} className="mobile-shell-brand">
        <img src="/logo.png" className="logo-image" alt="Fulfilltify logo" />
      </Link>

      <div className="topbar-spacer" />

      <NavLink
        to="/delivery/inbox"
        className={({ isActive }) => `top-inbox-link${isActive ? ' is-active' : ''}`}
        aria-label="Open inbox"
        title="Inbox"
      >
        <AppIcon name="inbox" aria-hidden="true" />
        {unreadNotifications > 0 && (
          <span className="top-inbox-badge" aria-label={`${unreadNotifications} unread notifications`}>
            {unreadNotifications > 99 ? '99' : unreadNotifications}
          </span>
        )}
      </NavLink>

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
            to="/account/profile"
            className={({ isActive }) => `top-account-item${isActive ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => setIsAccountMenuOpen(false)}
          >
            <AppIcon name="person" />
            <span>Profile</span>
          </NavLink>

          <NavLink
            to="/account/security"
            className={({ isActive }) => `top-account-item${isActive ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => setIsAccountMenuOpen(false)}
          >
            <AppIcon name="lock" />
            <span>Security</span>
          </NavLink>

          <NavLink
            to="/account/session"
            className={({ isActive }) => `top-account-item${isActive ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => setIsAccountMenuOpen(false)}
          >
            <AppIcon name="update" />
            <span>Sessions</span>
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
