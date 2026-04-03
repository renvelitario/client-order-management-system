import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import api from '../../utils/api';
import Pagination from '../../components/ui/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { formatDateOnly, formatDateTime, formatPeso } from '../../utils/formatters';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import DeliveryAssignmentModal from '../../components/ui/DeliveryAssignmentModal';
import '../../styles/shared/entity-list.css';
import '../../styles/pages/delivery/admin-delivery.css';
import { ADMIN_DELIVERY_FILTERS, DELIVERY_STATUS_LABELS } from '../../types/delivery';
import type { DeliveryStatusKey } from '../../types/delivery';
import { resolveApiErrorMessage } from '../../types/app';
import type { NotificationState, Order } from '../../types/app';

type DeliveryAssignmentForm = {
  delivery_date: string;
};

const toLocalDateInputValue = (value?: string | Date | null) => {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AdminDelivery = () => {
  const [activeFilter, setActiveFilter] = useState<DeliveryStatusKey>('pending');
  const [notification, setNotification] = useState<NotificationState>({ message: '', type: '' });
  const [assignmentError, setAssignmentError] = useState('');
  const [isAssignmentSubmitting, setIsAssignmentSubmitting] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'assign' | 'reassign'>('assign');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<DeliveryAssignmentForm>({
    delivery_date: toLocalDateInputValue(),
  });
  const listParams = useMemo(() => ({ delivery_status: activeFilter }), [activeFilter]);
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
  } = usePaginatedList<Order>({ endpoint: '/orders/delivery/admin', initialSort: 'desc', params: listParams });

  const changeFilter = (nextFilter: DeliveryStatusKey) => {
    setActiveFilter(nextFilter);
    setCurrentPage(1);
  };

  const openAssignmentModal = (order: Order, mode: 'assign' | 'reassign') => {
    setAssignmentMode(mode);
    setSelectedOrder(order);
    setAssignmentError('');
    setAssignmentForm({
      delivery_date: order.delivery_date ? toLocalDateInputValue(order.delivery_date) : toLocalDateInputValue(),
    });
    setIsAssignmentModalOpen(true);
  };

  const closeAssignmentModal = () => {
    if (isAssignmentSubmitting) {
      return;
    }

    setIsAssignmentModalOpen(false);
    setSelectedOrder(null);
    setAssignmentError('');
  };

  const handleAssignmentFieldChange = (field: keyof DeliveryAssignmentForm, value: string) => {
    setAssignmentForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (assignmentError) {
      setAssignmentError('');
    }
  };

  const handleAssignmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedOrder) {
      return;
    }

    setIsAssignmentSubmitting(true);
    setAssignmentError('');

    try {
      await api.patch(`/orders/${selectedOrder.order_id}/delivery-assignment`, {
        delivery_date: assignmentForm.delivery_date,
      });

      await refetch();
      setNotification({
        type: 'success',
        message: `Order #${selectedOrder.order_id} ${assignmentMode === 'assign' ? 'set to pending' : 'rescheduled as pending'} successfully.`,
      });
      setIsAssignmentModalOpen(false);
      setSelectedOrder(null);
      setAssignmentError('');
    } catch (error) {
      setAssignmentError(resolveApiErrorMessage(error, 'Unable to save delivery assignment.'));
    } finally {
      setIsAssignmentSubmitting(false);
    }
  };

  const updateStatus = async (order: Order, nextStatus: DeliveryStatusKey, successMessage: string) => {
    try {
      await api.patch(`/orders/${order.order_id}/delivery-status`, { delivery_status: nextStatus });
      await refetch();
      setNotification({ type: 'success', message: successMessage });
    } catch (error) {
      setNotification({
        type: 'error',
        message: resolveApiErrorMessage(error, `Unable to update delivery status for order #${order.order_id}.`),
      });
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) {
      return;
    }

    await updateStatus(cancelTarget, 'cancelled', `Order #${cancelTarget.order_id} cancelled.`);
    setCancelTarget(null);
  };

  const renderActions = (order: Order) => {
    if (order.delivery_status === 'unassigned') {
      return (
        <button type="button" className="edit-button" onClick={() => openAssignmentModal(order, 'assign')}>
          <span className="material-icons">calendar_month</span>
          <span className="edit-text">Schedule</span>
        </button>
      );
    }

    if (order.delivery_status === 'pending') {
      return (
        <div className="delivery-admin-actions">
          <button type="button" className="edit-button" onClick={() => openAssignmentModal(order, 'reassign')}>
            <span className="material-icons">edit_calendar</span>
            <span className="edit-text">Reschedule</span>
          </button>
          <button
            type="button"
            className="view-button"
            onClick={() => updateStatus(order, 'out_for_delivery', `Order #${order.order_id} moved out for delivery.`)}
          >
            <span className="material-icons">local_shipping</span>
            <span className="view-text">Start</span>
          </button>
          <button type="button" className="delete-button" onClick={() => setCancelTarget(order)}>
            <span className="material-icons">cancel</span>
            <span className="delete-text">Cancel</span>
          </button>
        </div>
      );
    }

    if (order.delivery_status === 'out_for_delivery') {
      return (
        <div className="delivery-admin-actions">
          <button
            type="button"
            className="edit-button"
            onClick={() => updateStatus(order, 'delivered', `Order #${order.order_id} marked delivered.`)}
          >
            <span className="material-icons">done_all</span>
            <span className="edit-text">Delivered</span>
          </button>
          <button
            type="button"
            className="delete-button"
            onClick={() => updateStatus(order, 'failed', `Order #${order.order_id} marked failed.`)}
          >
            <span className="material-icons">report_problem</span>
            <span className="delete-text">Failed</span>
          </button>
        </div>
      );
    }

    if (order.delivery_status === 'failed') {
      return (
        <div className="delivery-admin-actions">
          <button type="button" className="edit-button" onClick={() => openAssignmentModal(order, 'reassign')}>
            <span className="material-icons">restart_alt</span>
            <span className="edit-text">Reschedule</span>
          </button>
          <button type="button" className="delete-button" onClick={() => setCancelTarget(order)}>
            <span className="material-icons">cancel</span>
            <span className="delete-text">Cancel</span>
          </button>
        </div>
      );
    }

    return <span className="delivery-admin-actions-empty">No actions</span>;
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container delivery-admin-page">
      <DeleteConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel Order"
        message={cancelTarget ? `Are you sure you want to cancel order #${cancelTarget.order_id}?` : ''}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancel()}
      />

      <DeliveryAssignmentModal
        open={isAssignmentModalOpen}
        mode={assignmentMode}
        order={selectedOrder}
        formData={assignmentForm}
        error={assignmentError}
        isSubmitting={isAssignmentSubmitting}
        onFieldChange={handleAssignmentFieldChange}
        onSubmit={handleAssignmentSubmit}
        onRequestClose={closeAssignmentModal}
      />

      <ListPageHeader
        title="Delivery Management"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        searchAriaLabel="Search delivery orders"
      />

      <div className="delivery-filter-tabs" role="tablist" aria-label="Filter delivery orders by status">
        {ADMIN_DELIVERY_FILTERS.filter((f) => f.value !== 'unassigned').map((filter) => {
          const isActive = filter.value === activeFilter;

          return (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`delivery-filter-tab${isActive ? ' is-active' : ''}`}
              onClick={() => changeFilter(filter.value)}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <Notification message={notification.message} type={notification.type} />

      <div className="delivery-admin-table-wrap">
        <table aria-label="Delivery management orders">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Delivery Date</th>
              <th scope="col">Items</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length ? (
              orders.map((order) => (
                <tr key={order.order_id}>
                  <td>
                    <div className="delivery-admin-order-cell">
                      <span className="delivery-order-id-chip">#{order.order_id}</span>
                      <span className="delivery-admin-order-meta">{formatDateOnly(order.order_date)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="delivery-admin-customer-cell">
                      <strong>{order.customer_name || `Customer #${order.customer_id}`}</strong>
                      <span>{order.address || 'No address'}</span>
                      <span>{order.contact_no || 'No contact'}</span>
                    </div>
                  </td>
                  <td>{formatDateOnly(order.delivery_date)}</td>
                  <td>{order.items_count || 0}</td>
                  <td>{formatPeso(order.total_amount || 0)}</td>
                  <td>
                    <span className={`delivery-status-pill status-${order.delivery_status}`}>
                      {DELIVERY_STATUS_LABELS[order.delivery_status as DeliveryStatusKey] || order.delivery_status}
                    </span>
                    {order.delivered_at && (
                      <div className="delivery-admin-status-meta">
                        {formatDateTime(order.delivered_at)}
                      </div>
                    )}
                  </td>
                  <td>{renderActions(order)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No orders found for the selected delivery status.</td>
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

export default AdminDelivery;