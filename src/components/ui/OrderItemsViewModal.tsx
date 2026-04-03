import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatPeso } from '../../utils/formatters';
import type { Order } from '../../types/app';

type OrderItemsViewModalProps = {
  open: boolean;
  order: Order | null;
  onClose: () => void;
};

const OrderItemsViewModal = ({
  open,
  order,
  onClose,
}: OrderItemsViewModalProps) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open || !order) {
    return null;
  }

  const items = order.items || [];
  const hasItems = items.length > 0;
  const totalAmount = hasItems
    ? items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0)
    : 0;

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-box order-items-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-items-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="order-items-modal-header">
          <h3 id="order-items-title">Order #{order.order_id} Items</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {hasItems ? (
          <div className="order-items-list">
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product_name || `Product #${item.product_id}`}</td>
                    <td>{item.sku || '—'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPeso(item.price || 0)}</td>
                    <td>{formatPeso((item.quantity || 0) * (item.price || 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="order-items-total">
                  <td colSpan={4} className="total-label">Total</td>
                  <td className="total-amount">{formatPeso(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="order-items-empty">No items in this order</p>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default OrderItemsViewModal;
