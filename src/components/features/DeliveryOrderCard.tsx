import { Link } from 'react-router-dom';
import type { Order } from '../../types/app';
import { formatDateTime } from '../../utils/formatters';
import { DELIVERY_STATUS_LABELS } from '../../types/delivery';
import type { DeliveryStatusKey } from '../../types/delivery';
import '../../styles/components/delivery-order-card.css';

type DeliveryOrderCardProps = {
  order: Order;
};

const DeliveryOrderCard = ({ order }: DeliveryOrderCardProps) => {
  const statusKey = Object.prototype.hasOwnProperty.call(DELIVERY_STATUS_LABELS, order.delivery_status)
    ? (order.delivery_status as DeliveryStatusKey)
    : null;
  const statusLabel = statusKey ? DELIVERY_STATUS_LABELS[statusKey] : order.delivery_status;

  return (
    <article className="delivery-order-summary-card" aria-label={`Order ${order.order_id}`}>
      <header className="delivery-order-summary-head">
        <h3>Order #{order.order_id}</h3>
        <span className={`delivery-status-pill status-${order.delivery_status}`}>{statusLabel}</span>
      </header>

      <div className="delivery-order-summary-grid">
        <div>
          <span>Customer</span>
          <strong>{order.customer_name || 'N/A'}</strong>
        </div>
        <div>
          <span>Contact</span>
          <strong>{order.contact_no || 'N/A'}</strong>
        </div>
        <div className="delivery-order-summary-wide">
          <span>Address</span>
          <strong>{order.address || 'N/A'}</strong>
        </div>
        <div>
          <span>Delivery Date</span>
          <strong>{order.delivery_date ? formatDateTime(order.delivery_date) : 'N/A'}</strong>
        </div>
        <div>
          <span>Total Amount</span>
          <strong>PHP {Number(order.total_amount || 0).toFixed(2)}</strong>
        </div>
      </div>

      <footer className="delivery-order-summary-foot">
        <Link to="/delivery/orders" className="delivery-order-summary-action">
          Open in Deliveries
        </Link>
      </footer>
    </article>
  );
};

export default DeliveryOrderCard;
