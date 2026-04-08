import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import DeliveryOrderCard from '../../components/features/DeliveryOrderCard';
import DeliveryOrderDetailsModal from '../../components/features/DeliveryOrderDetailsModal';
import '../../styles/shared/table-ui-layout-controls.css';
import '../../styles/shared/table-ui-core.css';
import '../../styles/shared/table-ui-actions.css';
import '../../styles/shared/feedback-ui-notification.css';
import '../../styles/shared/table-ui-responsive.css';
import '../../styles/pages/delivery/today-orders.css';
import type { Order } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';

const TodayOrders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    rows: orders,
    searchInput,
    initialLoading,
    handleSearchChange,
    refetch,
  } = usePaginatedList<Order>({ endpoint: '/orders/delivery/today', initialSort: 'desc' });

  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const openOrderFromScannedId = useCallback(async (orderId: string) => {
    const parsedOrderId = Number(orderId);
    if (!Number.isInteger(parsedOrderId) || parsedOrderId < 1) {
      setActiveOrderId(null);
      setNotification({ type: 'error', message: 'Scanned QR code did not contain a valid order ID.' });
      return;
    }

    try {
      const { data } = await api.get(`/orders/${parsedOrderId}`);
      setActiveOrderId(Number((data as Order).order_id || parsedOrderId));
      setNotification({ type: 'success', message: `Order #${parsedOrderId} loaded.` });
    } catch (err) {
      setActiveOrderId(null);
      setNotification({
        type: 'error',
        message: resolveApiErrorMessage(err, 'Only orders that are out for delivery today can be opened.'),
      });
    }
  }, []);

  const handleOrderStatusUpdated = useCallback(async (orderId: number, status: 'out_for_delivery' | 'pending' | 'delivered' | 'failed') => {
    await refetch();
    if (status === 'out_for_delivery') {
      setNotification({ type: 'success', message: `Order #${orderId} reverted to out for delivery.` });
    } else if (status === 'delivered') {
      setNotification({ type: 'success', message: `Order #${orderId} marked as delivered.` });
    } else if (status === 'failed') {
      setNotification({ type: 'success', message: `Order #${orderId} marked as failed.` });
    }
  }, [refetch]);

  useEffect(() => {
    const scannedOrderId = (location.state as { scannedOrderId?: string } | null)?.scannedOrderId;
    if (!scannedOrderId) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      void openOrderFromScannedId(scannedOrderId);
    });
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname, location.search, location.state, navigate, openOrderFromScannedId]);

  return (
    <div className="container delivery-page">

      {/* ── Top controls ── */}
      <ListPageHeader
        kicker="Logistics"
        title="Delivery Orders (Today)"
        subtitle="View today’s delivery orders, including current, completed, and failed deliveries."
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        searchAriaLabel="Search delivery orders"
      />

      <Notification message={notification.message} type={notification.type} />

      {/* ── Orders list ── */}
      {initialLoading ? (
        <PageLoader pageName="Delivery Orders" />
      ) : (
        orders.length ? (
          <div className="delivery-home-card-grid">
            {orders.map((order) => (
              <DeliveryOrderCard key={order.order_id} order={order} onClick={(selected) => setActiveOrderId(selected.order_id)} />
            ))}
          </div>
        ) : (
          <div className="delivery-home-empty">
            <h2>No delivery orders for today</h2>
            <p>Only orders that are currently out for delivery today will appear here.</p>
          </div>
        )
      )}

      <DeliveryOrderDetailsModal
        isOpen={activeOrderId !== null}
        orderId={activeOrderId}
        onClose={() => setActiveOrderId(null)}
        onStatusUpdated={handleOrderStatusUpdated}
        mode="delivery"
        revertStatus="out_for_delivery"
        revertLabel="Undo Changes"
      />
    </div>
  );
};

export default TodayOrders;



