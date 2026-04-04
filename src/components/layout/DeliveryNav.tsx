import { NavLink } from 'react-router-dom';

const DeliveryNav = () => {
  return (
    <nav className="delivery-nav" aria-label="Delivery navigation">
      <div className="delivery-nav-inner">
        <NavLink
          to="/delivery/home"
          className={({ isActive }) => `delivery-nav-link${isActive ? ' is-active' : ''}`}
        >
          <span className="material-symbols-outlined delivery-nav-icon" aria-hidden="true">home</span>
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/delivery/orders"
          className="delivery-nav-scan-link"
          aria-label="Open QR scanner"
          title="QR Scanner"
        >
          <span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
        </NavLink>

        <NavLink
          to="/delivery/orders"
          className={({ isActive }) => `delivery-nav-link${isActive ? ' is-active' : ''}`}
        >
          <span className="material-symbols-outlined delivery-nav-icon" aria-hidden="true">local_shipping</span>
          <span>Deliveries</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default DeliveryNav;
