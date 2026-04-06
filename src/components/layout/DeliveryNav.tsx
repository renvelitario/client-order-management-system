import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import OrderScanner from '../features/OrderScanner';
import AppIcon from '../ui/AppIcon';

const DeliveryNav = () => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();

  const handleScanDetected = (orderId: string) => {
    setScannerOpen(false);
    navigate('/delivery/home', {
      state: {
        scannedOrderId: orderId,
        scannedAt: Date.now(),
      },
    });
  };

  return (
    <>
      <nav className="delivery-nav" aria-label="Delivery navigation">
        <div className="delivery-nav-inner">
          <NavLink
            to="/delivery/home"
            className={({ isActive }) => `delivery-nav-link${isActive ? ' is-active' : ''}`}
          >
            <AppIcon name="home" className="delivery-nav-icon" aria-hidden="true" />
            <span>Home</span>
          </NavLink>

          <button
            type="button"
            className="delivery-nav-scan-link"
            aria-label="Open QR scanner"
            title="QR Scanner"
            onClick={() => setScannerOpen(true)}
          >
            <AppIcon name="qr_code_scanner" aria-hidden="true" />
          </button>

          <NavLink
            to="/delivery/orders"
            className={({ isActive }) => `delivery-nav-link${isActive ? ' is-active' : ''}`}
          >
            <AppIcon name="local_shipping" className="delivery-nav-icon" aria-hidden="true" />
            <span>Deliveries</span>
          </NavLink>
        </div>
      </nav>

      <OrderScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleScanDetected}
      />
    </>
  );
};

export default DeliveryNav;
