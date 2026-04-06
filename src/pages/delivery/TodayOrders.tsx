import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Pagination from '../../components/ui/Pagination';
import OrderScanner from '../../components/features/OrderScanner';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { formatDateTime } from '../../utils/formatters';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import FilterDropdown from '../../components/ui/FilterDropdown';
import DataTable, { DataTableEmptyState } from '../../components/ui/DataTable';
import AppIcon from '../../components/ui/AppIcon';
import '../../styles/shared/table-ui-layout-controls.css';
import '../../styles/shared/table-ui-core.css';
import '../../styles/shared/table-ui-actions.css';
import '../../styles/shared/feedback-ui-notification.css';
import '../../styles/shared/table-ui-pagination.css';
import '../../styles/shared/table-ui-responsive.css';
import '../../styles/pages/delivery/today-orders.css';
import { DELIVERY_STATUS_LABELS, DELIVERY_USER_STATUS_OPTIONS } from '../../types/delivery';
import type { DeliveryStatusKey } from '../../types/delivery';
import type { Order } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';

const TodayOrders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    rows: orders,
    searchInput,
    loading,
    initialLoading,
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

  const handleScanDetected = async (orderId: string) => {
    handleSearchChange(orderId);
    setScannerOpen(false);

    const parsedOrderId = Number(orderId);
    if (!Number.isInteger(parsedOrderId) || parsedOrderId < 1) {
      setSelectedOrder(null);
      setNotification({ type: 'error', message: 'Scanned QR code did not contain a valid order ID.' });
      return;
    }

    try {
      const { data } = await api.get(`/orders/${parsedOrderId}`);
      selectOrder(data);
      setNotification({ type: 'success', message: `Order #${parsedOrderId} loaded.` });
    } catch (err) {
      setSelectedOrder(null);
      setNotification({
        type: 'error',
        message: resolveApiErrorMessage(err, 'Scanned order was not found.'),
      });
    }
  };

  useEffect(() => {
    const scannedOrderId = (location.state as { scannedOrderId?: string } | null)?.scannedOrderId;
    if (!scannedOrderId) {
      return;
    }

    void handleScanDetected(scannedOrderId);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  return (
    <div className="container delivery-page">

      {/* ── Top controls ── */}
      <ListPageHeader
        kicker="Logistics"
        title="Delivery Orders (Today)"
        subtitle="Monitor and update today’s active delivery workload in real time."
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        searchAriaLabel="Search delivery orders"
        searchTrailingAction={(
          <>
            <span className="search-input-divider" aria-hidden="true" />
            <button
              ref={scanButtonRef}
              type="button"
              className="search-input-action"
              onClick={() => setScannerOpen(true)}
              aria-label="Scan QR code to search today's delivery orders"
              title="Scan QR code"
            >
              <AppIcon name="qr_code_scanner" aria-hidden="true" />
            </button>
          </>
        )}
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
              <AppIcon name="cancel" aria-hidden="true" />
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
              <FilterDropdown
                id="delivery-status-picker"
                className="delivery-status-select filter-inline-dropdown"
                value={selectedOrderStatus || selectedOrder.delivery_status}
                options={DELIVERY_USER_STATUS_OPTIONS}
                onChange={(nextStatus) =>
                  setStatusDrafts((prev) => ({
                    ...prev,
                    [selectedOrder.order_id]: nextStatus,
                  }))
                }
                aria-label="Change delivery status"
              />
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
                <AppIcon name="update" aria-hidden="true" />
                <span>Update</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Orders table ── */}
      {initialLoading ? (
        <PageLoader pageName="Delivery Orders" />
      ) : (
      <DataTable wrapperClassName="delivery-table-wrap" ariaLabel="Today's delivery orders">
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
                      <span className="table-id-chip">#{order.order_id}</span>
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
              <DataTableEmptyState colSpan={5} message="No delivery orders pending for today." />
            )}
          </tbody>
      </DataTable>
      )}

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



