import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import OrderScanner from '../features/OrderScanner';

const DeliveryNav = () => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();

  const handleScanDetected = async (orderId: string) => {
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
            <span className="material-symbols-outlined delivery-nav-icon" aria-hidden="true">home</span>
            <span>Home</span>
          </NavLink>

          <button
            type="button"
            className="delivery-nav-scan-link"
            aria-label="Open QR scanner"
            title="QR Scanner"
            onClick={() => setScannerOpen(true)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
          </button>

          <NavLink
            to="/delivery/orders"
            className={({ isActive }) => `delivery-nav-link${isActive ? ' is-active' : ''}`}
          >
            <span className="material-symbols-outlined delivery-nav-icon" aria-hidden="true">local_shipping</span>
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
