import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { getListData } from '../../utils/listResponse';
import type { Order, NotificationState } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import DeliveryOrderCard from '../../components/features/DeliveryOrderCard';
import '../../styles/shared/table-ui-core.css';
import '../../styles/pages/delivery/home.css';

const Home = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({ type: '', message: '' });

  const fetchTodayOrders = useCallback(async () => {
    setLoading(true);

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
      setOrders([]);
      setNotification({
        type: 'error',
        message: resolveApiErrorMessage(error, 'Unable to load your delivery home orders.'),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTodayOrders();
  }, [fetchTodayOrders]);

  const assignedOrders = useMemo(
    () => orders.filter((order) => order.delivery_status === 'out_for_delivery'),
    [orders],
  );

  if (loading) {
    return <PageLoader message="Loading your delivery home..." />;
  }

  return (
    <section className="container delivery-home-page" aria-labelledby="delivery-home-title">
      <header className="delivery-home-header">
        <h1 id="delivery-home-title">Delivery Home</h1>
        <p>Orders currently assigned and out for delivery.</p>
      </header>

      <Notification message={notification.message} type={notification.type} />

      {assignedOrders.length > 0 ? (
        <div className="delivery-home-card-grid">
          {assignedOrders.map((order) => (
            <DeliveryOrderCard key={order.order_id} order={order} />
          ))}
        </div>
      ) : (
        <div className="delivery-home-empty">
          <h2>No active out-for-delivery orders</h2>
          <p>Once an order is assigned and marked as out for delivery, it will appear here.</p>
        </div>
      )}
    </section>
  );
};

export default Home;
