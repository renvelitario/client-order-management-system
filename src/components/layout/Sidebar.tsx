import { NavLink } from 'react-router-dom';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';

type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
};

const adminLinks: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/delivery/orders', label: 'Delivery Orders', icon: 'delivery' },
  { to: '/products', label: 'Products', icon: 'products' },
  { to: '/customers', label: 'Customers', icon: 'customers' },
  { to: '/purchases', label: 'Purchases', icon: 'purchases' },
  { to: '/orders', label: 'Orders', icon: 'orders' },
];

const deliveryLinks: NavItem[] = [
  { to: '/delivery/orders', label: 'Delivery Orders', icon: 'delivery', end: true },
];

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarRef,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarRef: RefObject<HTMLElement>;
}) => {
  const { isAdmin } = useAuth();
  const navLinks = isAdmin ? adminLinks : deliveryLinks;

  return (
    <aside ref={sidebarRef} className={`dashboard-sidebar${isSidebarOpen ? ' is-open' : ''}`}>
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
  );
};

export default Sidebar;
