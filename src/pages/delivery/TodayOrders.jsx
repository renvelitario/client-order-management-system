import { useCallback, useMemo, useState } from 'react';
import api from '../../utils/api';
import Pagination from '../../components/Pagination';
import OrderScanner from '../../components/OrderScanner';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { formatDateTime } from '../../utils/date';
import '../../styles/pages/delivery/today-orders.css';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed_delivery', label: 'Failed Delivery' },
];

const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, status) => {
  acc[status.value] = status.label;
  return acc;
}, {});

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
  } = usePaginatedList({ endpoint: '/orders/delivery/today', initialSort: 'desc' });

  const [statusDrafts, setStatusDrafts] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const resolvedStatus = useCallback((order) => statusDrafts[order.order_id] || order.delivery_status, [statusDrafts]);

  const selectedOrderStatus = useMemo(() => {
    if (!selectedOrder) {
      return null;
    }

    return statusDrafts[selectedOrder.order_id] || selectedOrder.delivery_status;
  }, [selectedOrder, statusDrafts]);

  const updateStatus = async (orderId, nextStatus) => {
    try {
      await api.patch(`/orders/${orderId}/delivery-status`, {
        delivery_status: nextStatus,
      });

      setStatusDrafts((prev) => ({
        ...prev,
        [orderId]: nextStatus,
      }));

      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            delivery_status: nextStatus,
            delivered_at: nextStatus === 'delivered' ? new Date().toISOString() : null,
          };
        });
      }

      await refetch();

      setNotification({ type: 'success', message: 'Delivery status updated.' });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Unable to update delivery status.',
      });
    }
  };

  const handleScanDetected = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setSelectedOrder(data);
      setStatusDrafts((prev) => ({
        ...prev,
        [orderId]: data.delivery_status,
      }));
      setNotification({ type: 'success', message: `Order #${orderId} loaded.` });
    } catch (err) {
      setSelectedOrder(null);
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Scanned order was not found.',
      });
    }
  };

  return (
    <div className="container delivery-page">
      <div className="header-row">
        <h2>Delivery Orders (Today)</h2>
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Search order, customer, address..."
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      {notification.message && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <div className="delivery-layout">
        <OrderScanner onDetected={handleScanDetected} />

        <section className="delivery-selected-order" aria-label="Selected delivery order">
          <h3>Scanned / Selected Order</h3>
          {!selectedOrder && <p>Scan a QR/barcode or use manual lookup to open an order.</p>}

          {selectedOrder && (
            <div className="delivery-order-card">
              <p><strong>Order ID:</strong> {selectedOrder.order_id}</p>
              <p><strong>Customer:</strong> {selectedOrder.customer_name || 'N/A'}</p>
              <p><strong>Address:</strong> {selectedOrder.address || 'N/A'}</p>
              <p><strong>Contact:</strong> {selectedOrder.contact_no || 'N/A'}</p>
              <p><strong>Status:</strong> {STATUS_LABELS[selectedOrder.delivery_status] || selectedOrder.delivery_status}</p>

              <div className="delivery-status-actions">
                <select
                  value={selectedOrderStatus || selectedOrder.delivery_status}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setStatusDrafts((prev) => ({
                      ...prev,
                      [selectedOrder.order_id]: nextValue,
                    }));
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => updateStatus(selectedOrder.order_id, selectedOrderStatus || selectedOrder.delivery_status)}
                >
                  Update Status
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {loading ? (
        <p>Loading delivery orders...</p>
      ) : (
        <div className="delivery-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Contact Number</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => {
                  const activeStatus = resolvedStatus(order);

                  return (
                    <tr key={order.order_id}>
                      <td>{order.order_id}</td>
                      <td>{order.customer_name || 'N/A'}</td>
                      <td>{order.address || 'N/A'}</td>
                      <td>{order.contact_no || 'N/A'}</td>
                      <td>
                        <span className={`delivery-status-pill status-${activeStatus}`}>
                          {STATUS_LABELS[activeStatus] || activeStatus}
                        </span>
                        {order.delivered_at && (
                          <div className="delivery-meta">At {formatDateTime(order.delivered_at)}</div>
                        )}
                      </td>
                      <td>
                        <div className="delivery-status-actions">
                          <select
                            value={activeStatus}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setStatusDrafts((prev) => ({
                                ...prev,
                                [order.order_id]: nextValue,
                              }));
                            }}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => updateStatus(order.order_id, activeStatus)}
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">No delivery orders scheduled for today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
