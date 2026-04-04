import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { getListData } from '../../utils/listResponse';
import type { Order, NotificationState } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import DeliveryOrderCard from '../../components/features/DeliveryOrderCard';
import DeliveryOrderDetailsModal from '../../components/features/DeliveryOrderDetailsModal';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/shared/modal-ui-base.css';
import '../../styles/shared/modal-ui-order-items.css';
import '../../styles/shared/form-ui-entity-modal.css';
import '../../styles/shared/table-ui-layout-controls.css';
import '../../styles/shared/table-ui-core.css';
import '../../styles/pages/delivery/home.css';

const HOME_REFRESH_INTERVAL_MS = 10000;

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { localUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({ type: '', message: '' });
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const displayName = (localUser?.username || localUser?.name || localUser?.email || 'User').trim() || 'User';

  const fetchTodayOrders = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/orders/delivery/today', {
        params: {
          page: 1,
          limit: 50,
          sort: 'desc',
        },
      });

      const listResult = getListData<Order>(data);
      setOrders(listResult.data);
      setNotification({ type: '', message: '' });
    } catch (error) {
      if (showLoader) {
        setOrders([]);
        setNotification({
          type: 'error',
          message: resolveApiErrorMessage(error, 'Unable to load your delivery home orders.'),
        });
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchTodayOrders(true);
  }, [fetchTodayOrders]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchTodayOrders(false);
      }
    };

    const intervalId = window.setInterval(refreshIfVisible, HOME_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [fetchTodayOrders]);

  const outForDeliveryOrders = useMemo(
    () => orders.filter((order) => order.delivery_status === 'out_for_delivery'),
    [orders],
  );

  const handleOrderStatusUpdated = useCallback(
    async (orderId: number, status: 'delivered' | 'failed') => {
      await fetchTodayOrders();
      const statusMessage = status === 'delivered' ? 'delivered' : 'marked as failed';
      setNotification({ type: 'success', message: `Order #${orderId} ${statusMessage}.` });
    },
    [fetchTodayOrders],
  );

  useEffect(() => {
    const scannedOrderId = (location.state as { scannedOrderId?: string } | null)?.scannedOrderId;
    if (!scannedOrderId) {
      return;
    }

    const parsedOrderId = Number(scannedOrderId);
    if (Number.isInteger(parsedOrderId) && parsedOrderId > 0) {
      setActiveOrderId(parsedOrderId);
    } else {
      setNotification({ type: 'error', message: 'Scanned QR code did not contain a valid order ID.' });
    }

    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  if (loading) {
    return <PageLoader message="Loading your delivery home..." />;
  }

  return (
    <section className="container delivery-home-page" aria-labelledby="delivery-home-title">
      <header className="delivery-home-header">
        <h1 id="delivery-home-title">Welcome, {displayName}</h1>
        <p>Orders currently marked as out for delivery.</p>
      </header>

      <Notification message={notification.message} type={notification.type} />

      {outForDeliveryOrders.length > 0 ? (
        <div className="delivery-home-card-grid">
          {outForDeliveryOrders.map((order) => (
            <DeliveryOrderCard key={order.order_id} order={order} onClick={() => setActiveOrderId(order.order_id)} />
          ))}
        </div>
      ) : (
        <div className="delivery-home-empty">
          <h2>No active out-for-delivery orders</h2>
          <p>Once an order is marked as out for delivery, it will appear here.</p>
        </div>
      )}

      <DeliveryOrderDetailsModal
        isOpen={activeOrderId !== null}
        orderId={activeOrderId}
        onClose={() => setActiveOrderId(null)}
        onStatusUpdated={handleOrderStatusUpdated}
      />
    </section>
  );
};

export default Home;
