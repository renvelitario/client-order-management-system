import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/api';
import Pagination from '../../components/ui/Pagination';
import OrderScanner from '../../components/features/OrderScanner';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { formatDateTime } from '../../utils/formatters';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import '../../styles/shared/entity-list.css';
import '../../styles/pages/delivery/today-orders.css';
import { DELIVERY_STATUS_LABELS, DELIVERY_USER_STATUS_OPTIONS } from '../../types/delivery';
import type { DeliveryStatusKey } from '../../types/delivery';
import type { Order } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';

const TodayOrders = () => {
  const {
    rows: orders,
    searchInput,
    loading,
    currentPage,
    pageSize,
    totalRows,
    totalPages,
    setCurrentPage,
    handleSearchChange,
    handlePageSizeChange,
    refetch,
  } = usePaginatedList<Order>({ endpoint: '/orders/delivery/today', initialSort: 'desc' });

  const [statusDrafts, setStatusDrafts] = useState<Record<number, DeliveryStatusKey>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [scannerOpen, setScannerOpen] = useState(false);
  const scanButtonRef = useRef<HTMLButtonElement | null>(null);

  // Return focus to scan button when scanner overlay closes
  useEffect(() => {
    if (!scannerOpen && scanButtonRef.current) {
      scanButtonRef.current.focus();
    }
  }, [scannerOpen]);

  const selectedOrderStatus = useMemo(() => {
    if (!selectedOrder) return null;
    return statusDrafts[selectedOrder.order_id] || (selectedOrder.delivery_status as DeliveryStatusKey);
  }, [selectedOrder, statusDrafts]);

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    setStatusDrafts((prev) => ({ ...prev, [order.order_id]: order.delivery_status as DeliveryStatusKey }));
  };

  const updateStatus = async (orderId: number, nextStatus: DeliveryStatusKey) => {
    try {
      await api.patch(`/orders/${orderId}/delivery-status`, { delivery_status: nextStatus });

      setStatusDrafts((prev) => ({ ...prev, [orderId]: nextStatus }));

      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            delivery_status: nextStatus,
            delivered_at: nextStatus === 'delivered' ? new Date().toISOString() : null,
          };
        });
      }

      await refetch();
      setNotification({ type: 'success', message: `Order #${orderId} status updated.` });
    } catch (err) {
      setNotification({
        type: 'error',
        message: resolveApiErrorMessage(err, `Unable to update status for order #${orderId}.`),
      });
    }
  };

  const handleScanDetected = async (orderId: number) => {
    setScannerOpen(false);
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      selectOrder(data);
      setNotification({ type: 'success', message: `Order #${orderId} loaded.` });
    } catch (err) {
      setSelectedOrder(null);
      setNotification({
        type: 'error',
        message: resolveApiErrorMessage(err, 'Scanned order was not found.'),
      });
    }
  };

  if (loading) {
    return <PageLoader message="Loading..." />;
  }

  return (
    <div className="container delivery-page">

      {/* ── Top controls ── */}
      <ListPageHeader
        title="Delivery Orders (Today)"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        searchAriaLabel="Search delivery orders"
        action={
          <button
            ref={scanButtonRef}
            type="button"
            className="create-button scan-qr-button"
            onClick={() => setScannerOpen(true)}
            aria-label="Open QR scanner"
            title="Scan QR code"
          >
            <span className="material-icons" aria-hidden="true">qr_code_scanner</span>
            <span>Scan QR</span>
          </button>
        }
      />

      {/* Fullscreen scanner overlay — renders via portal over everything */}
      <OrderScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleScanDetected}
      />

      <Notification message={notification.message} type={notification.type} />

      {/* ── Selected order panel ── */}
      {selectedOrder && (
        <section className="delivery-selected-order" aria-label="Selected delivery order">
          <div className="delivery-selected-header">
            <h3>Order #{selectedOrder.order_id}</h3>
            <button
              type="button"
              className="delivery-panel-close"
              onClick={() => setSelectedOrder(null)}
              aria-label="Dismiss selected order"
            >
              <span className="material-icons" aria-hidden="true">cancel</span>
            </button>
          </div>
          <div className="delivery-order-card">
            <div className="delivery-order-grid">
              <div className="delivery-detail-item">
                <span className="delivery-detail-label">Customer</span>
                <span className="delivery-detail-value">{selectedOrder.customer_name || 'N/A'}</span>
              </div>
              <div className="delivery-detail-item">
                <span className="delivery-detail-label">Address</span>
                <span className="delivery-detail-value">{selectedOrder.address || 'N/A'}</span>
              </div>
              <div className="delivery-detail-item">
                <span className="delivery-detail-label">Contact</span>
                <span className="delivery-detail-value">{selectedOrder.contact_no || 'N/A'}</span>
              </div>
              <div className="delivery-detail-item">
                <span className="delivery-detail-label">Status</span>
                <span className={`delivery-status-pill status-${selectedOrder.delivery_status}`}>
                  {DELIVERY_STATUS_LABELS[selectedOrder.delivery_status as DeliveryStatusKey] || selectedOrder.delivery_status}
                </span>
              </div>
            </div>
            <div className="delivery-status-actions">
              <select
                value={selectedOrderStatus || selectedOrder.delivery_status}
                onChange={(event) =>
                  setStatusDrafts((prev) => ({
                    ...prev,
                    [selectedOrder.order_id]: event.target.value as DeliveryStatusKey,
                  }))
                }
                aria-label="Change delivery status"
              >
                {DELIVERY_USER_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="delivery-status-update-btn"
                onClick={() =>
                  updateStatus(
                    selectedOrder.order_id,
                    selectedOrderStatus || (selectedOrder.delivery_status as DeliveryStatusKey),
                  )
                }
              >
                <span className="material-icons" aria-hidden="true">update</span>
                <span>Update</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Orders table ── */}
      <div className="delivery-table-wrap">
        <table aria-label="Today's delivery orders">
          <thead>
            <tr>
              <th scope="col">Order ID</th>
              <th scope="col">Customer</th>
              <th scope="col">Address</th>
              <th scope="col">Contact</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length ? (
              orders.map((order) => {
                const isSelected = selectedOrder?.order_id === order.order_id;

                return (
                  <tr
                    key={order.order_id}
                    className={`delivery-row-clickable${isSelected ? ' delivery-row-selected' : ''}`}
                    onClick={() => selectOrder(order)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectOrder(order);
                      }
                    }}
                    aria-label={`Open order ${order.order_id}`}
                  >
                    <td>
                      <span className="delivery-order-id-chip">#{order.order_id}</span>
                    </td>
                    <td>{order.customer_name || 'N/A'}</td>
                    <td>{order.address || 'N/A'}</td>
                    <td>{order.contact_no || 'N/A'}</td>
                    <td>
                      <span className={`delivery-status-pill status-${order.delivery_status}`}>
                        {DELIVERY_STATUS_LABELS[order.delivery_status as DeliveryStatusKey] || order.delivery_status}
                      </span>
                      {order.delivered_at && (
                        <div className="delivery-meta">
                          At {formatDateTime(order.delivered_at)}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>No delivery orders pending for today.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        totalRows={totalRows}
      />
    </div>
  );
};

export default TodayOrders;
