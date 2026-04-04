import { NavLink } from 'react-router-dom';

const deliveryLinks = [
  { to: '/delivery/home', label: 'Home', icon: 'home' },
  { to: '/delivery/orders', label: 'Deliveries', icon: 'local_shipping' },
  { to: '/delivery/inbox', label: 'Inbox', icon: 'inbox' },
] as const;

const DeliveryNav = () => {
  return (
    <nav className="delivery-nav" aria-label="Delivery navigation">
      <div className="delivery-nav-inner">
        {deliveryLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `delivery-nav-link${isActive ? ' is-active' : ''}`}
          >
            <span className="material-symbols-outlined delivery-nav-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default DeliveryNav;
