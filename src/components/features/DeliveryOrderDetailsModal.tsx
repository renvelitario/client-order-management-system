import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import type { Order } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';
import { DELIVERY_STATUS_LABELS } from '../../types/delivery';
import type { DeliveryStatusKey } from '../../types/delivery';
import { formatDateOnly, formatPeso } from '../../utils/formatters';

type DeliveryOrderDetailsModalProps = {
  isOpen: boolean;
  orderId: number | null;
  onClose: () => void;
  onStatusUpdated: (orderId: number, status: 'delivered' | 'failed') => Promise<void> | void;
};

const DeliveryOrderDetailsModal = ({
  isOpen,
  orderId,
  onClose,
  onStatusUpdated,
}: DeliveryOrderDetailsModalProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      setError('');
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data as Order);
      } catch (fetchError) {
        setOrder(null);
        setError(resolveApiErrorMessage(fetchError, 'Unable to load order details.'));
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [isOpen, orderId]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, saving]);

  const statusLabel = useMemo(() => {
    if (!order) return 'N/A';
    return DELIVERY_STATUS_LABELS[order.delivery_status as DeliveryStatusKey] || order.delivery_status;
  }, [order]);

  const handleStatusChange = async (nextStatus: 'delivered' | 'failed') => {
    if (!order) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.patch(`/orders/${order.order_id}/delivery-status`, { delivery_status: nextStatus });
      await onStatusUpdated(order.order_id, nextStatus);
      onClose();
    } catch (updateError) {
      setError(resolveApiErrorMessage(updateError, 'Unable to update delivery status.'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-box order-items-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-order-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="order-items-modal-header">
          <div className="delivery-modal-title-wrap">
            <h3 id="delivery-order-details-title">Order #{order?.order_id || ''}</h3>
            {order && (
              <span className={`delivery-status-pill status-${order.delivery_status}`}>{statusLabel}</span>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={saving}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {loading ? (
          <p className="order-items-empty">Loading order details...</p>
        ) : order ? (
          <>
            {error && <p className="order-items-empty" role="alert">{error}</p>}

            <div className="order-items-list">
              <table className="order-items-table">
                <tbody>
                  <tr>
                    <td>Customer</td>
                    <td>{order.customer_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Contact</td>
                    <td>{order.contact_no || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Address</td>
                    <td>{order.address || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Order Date</td>
                    <td>{formatDateOnly(order.order_date)}</td>
                  </tr>
                  <tr>
                    <td>Delivery Date</td>
                    <td>{formatDateOnly(order.delivery_date)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {Array.isArray(order.items) && order.items.length > 0 ? (
              <div className="order-items-list">
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Product</th>
                      <th>Unit Price</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => {
                      const unitPrice = Number(item.price || 0);
                      const lineAmount = Number(item.quantity || 0) * unitPrice;

                      return (
                        <tr key={`${item.product_id}-${index}`}>
                          <td>{item.quantity}</td>
                          <td>pc</td>
                          <td>{item.product_name || item.sku || `Product ${item.product_id}`}</td>
                          <td>{formatPeso(unitPrice)}</td>
                          <td>{formatPeso(lineAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="order-items-total">
                      <td colSpan={4} className="total-label">Total Amount</td>
                      <td className="total-amount">{formatPeso(order.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="order-items-empty">No items in this order</p>
            )}

            <div className="entity-modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => void handleStatusChange('failed')}
                disabled={loading || saving || !order}
              >
                Mark as Failed
              </button>
              <button
                type="button"
                className="create-button"
                onClick={() => void handleStatusChange('delivered')}
                disabled={loading || saving || !order}
              >
                Mark as Delivered
              </button>
            </div>
          </>
        ) : (
          <p className="order-items-empty">Order details are unavailable.</p>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default DeliveryOrderDetailsModal;
