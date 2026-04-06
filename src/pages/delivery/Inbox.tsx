import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import Notification from '../../components/ui/Notification';
import Pagination from '../../components/ui/Pagination';
import type { InboxNotification, PaginatedResponse } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';
import '../../styles/pages/delivery/inbox.css';
import '../../styles/shared/table-ui-pagination.css';

type InboxFilter = 'all' | 'unread';

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const Inbox = () => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const subtitle = useMemo(() => {
    if (isAdmin) {
      return 'Delivery rider updates appear here when orders are delivered, failed, or status-edited.';
    }

    return 'You will be notified when an admin changes an order status.';
  }, [isAdmin]);

  const loadNotifications = useCallback(async ({
    nextFilter,
    nextPage,
    nextPageSize,
    showLoader = true,
  }: {
    nextFilter: InboxFilter;
    nextPage: number;
    nextPageSize: number;
    showLoader?: boolean;
  }) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get<PaginatedResponse<InboxNotification>>('/notifications', {
        params: {
          status: nextFilter,
          page: nextPage,
          limit: nextPageSize,
        },
      });

      setItems(data.data || []);
      setTotalRows(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: resolveApiErrorMessage(error, 'Unable to load inbox notifications.'),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications({ nextFilter: filter, nextPage: page, nextPageSize: pageSize });
  }, [filter, page, pageSize, loadNotifications]);

  const dispatchNotificationChanged = () => {
    window.dispatchEvent(new Event('notifications:changed'));
  };

  const markAsRead = async (notificationId: number) => {
    setBusyId(notificationId);
    setFeedback({ type: '', message: '' });

    try {
      await api.patch(`/notifications/${notificationId}/read`);
      dispatchNotificationChanged();

      if (filter === 'unread') {
        void loadNotifications({ nextFilter: filter, nextPage: page, nextPageSize: pageSize, showLoader: false });
      } else {
        setItems((previous) => previous.map((item) => (
          item.notification_id === notificationId
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item
        )));
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: resolveApiErrorMessage(error, 'Unable to mark notification as read.'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.patch('/notifications/read-all');
      dispatchNotificationChanged();

      if (filter === 'unread') {
        setItems([]);
      } else {
        setItems((previous) => previous.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        })));
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: resolveApiErrorMessage(error, 'Unable to mark all notifications as read.'),
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <section className="container inbox-page" aria-labelledby="delivery-inbox-title">
      <header className="inbox-page-header">
        <div>
          <h1 id="delivery-inbox-title">Inbox</h1>
          <p>{subtitle}</p>
        </div>

        <div className="inbox-page-actions">
          <div className="inbox-filter" role="tablist" aria-label="Filter inbox notifications">
            <button
              type="button"
              className={`inbox-filter-button${filter === 'all' ? ' is-active' : ''}`}
              onClick={() => {
                setPage(1);
                setFilter('all');
              }}
            >
              All
            </button>
            <button
              type="button"
              className={`inbox-filter-button${filter === 'unread' ? ' is-active' : ''}`}
              onClick={() => {
                setPage(1);
                setFilter('unread');
              }}
            >
              Unread
            </button>
          </div>

          <button
            type="button"
            className="inbox-mark-all"
            onClick={() => void markAllAsRead()}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        </div>
      </header>

      <Notification message={feedback.message} type={feedback.type} />

      {loading ? (
        <div className="inbox-empty-state" role="status" aria-live="polite">Loading notifications...</div>
      ) : items.length ? (
        <div className="inbox-list" role="list" aria-label="Notification list">
          {items.map((item) => (
            <article
              key={item.notification_id}
              className={`inbox-item${item.is_read ? '' : ' is-unread'}`}
              role="listitem"
            >
              <div className="inbox-item-main">
                <h2>{item.title}</h2>
                <p>{item.message}</p>
                <span className="inbox-item-time">{formatDateTime(item.created_at)}</span>
              </div>

              {!item.is_read && (
                <button
                  type="button"
                  className="inbox-mark-read"
                  onClick={() => void markAsRead(item.notification_id)}
                  disabled={busyId === item.notification_id}
                >
                  {busyId === item.notification_id ? 'Saving...' : 'Mark as read'}
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="inbox-empty-state">You are all caught up. New updates will appear here.</div>
      )}

      <footer className="inbox-pagination" aria-label="Inbox pagination">
        <Pagination
          currentPage={page}
          totalPages={Math.max(1, totalPages)}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPage(1);
            setPageSize(size);
          }}
          totalRows={totalRows}
        />
      </footer>
    </section>
  );
};

export default Inbox;
