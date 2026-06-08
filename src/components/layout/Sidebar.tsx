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
  { to: '/customers', label: 'Customers', icon: 'customers' },
  { to: '/products', label: 'Products', icon: 'products' },
  { to: '/orders', label: 'Orders', icon: 'orders' },
  { to: '/delivery', label: 'Delivery', icon: 'delivery' },
  { to: '/users', label: 'User Management', icon: 'users' },
];

const deliveryLinks: NavItem[] = [
  { to: '/delivery/orders', label: "Today's Delivery", icon: 'delivery', end: true },
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
  const shouldRenderDividerAfter = (index: number) => isAdmin && (index === 0 || index === 2 || index === 4);

  return (
    <aside ref={sidebarRef} className={`dashboard-sidebar${isSidebarOpen ? ' is-open' : ''}`}>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <div className="sidebar-section">
          {navLinks.map(({ to, label, icon, end }, index) => (
            <div key={to} className="sidebar-nav-item">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="sidebar-link-icon"><Icon name={icon} /></span>
                <span className="sidebar-link-label">{label}</span>
              </NavLink>
              {shouldRenderDividerAfter(index) && <div className="sidebar-divider" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
