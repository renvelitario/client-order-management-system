import type { Order } from '../../types/app';
import { DELIVERY_STATUS_LABELS } from '../../types/delivery';
import type { DeliveryStatusKey } from '../../types/delivery';
import '../../styles/components/delivery-order-card.css';

type DeliveryOrderCardProps = {
  order: Order;
  onClick: (order: Order) => void;
};

const DeliveryOrderCard = ({ order, onClick }: DeliveryOrderCardProps) => {
  const statusKey = Object.prototype.hasOwnProperty.call(DELIVERY_STATUS_LABELS, order.delivery_status)
    ? (order.delivery_status as DeliveryStatusKey)
    : null;
  const statusLabel = statusKey ? DELIVERY_STATUS_LABELS[statusKey] : order.delivery_status;

  return (
    <article
      className="delivery-order-summary-card"
      aria-label={`Order ${order.order_id}`}
      role="button"
      tabIndex={0}
      onClick={() => onClick(order)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(order);
        }
      }}
    >
      <header className="delivery-order-summary-head">
        <h3>Order #{order.order_id}</h3>
        <span className={`delivery-status-pill status-${order.delivery_status}`}>{statusLabel}</span>
      </header>

      <div className="delivery-order-summary-grid">
        <div className="delivery-order-field delivery-order-field-customer">
          <span>Customer</span>
          <strong>{order.customer_name || 'N/A'}</strong>
        </div>
        <div className="delivery-order-field delivery-order-field-address">
          <span>Address</span>
          <strong>{order.address || 'N/A'}</strong>
        </div>
        <div className="delivery-order-field delivery-order-field-contact">
          <span>Contact</span>
          <strong>{order.contact_no || 'N/A'}</strong>
        </div>
      </div>
    </article>
  );
};

export default DeliveryOrderCard;
