import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/api';
import Pagination from '../../components/ui/Pagination';
import OrderScanner from '../../components/features/OrderScanner';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { formatDateOnly, formatDateTime, formatPeso } from '../../utils/formatters';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import DeliveryAssignmentModal from '../../components/ui/DeliveryAssignmentModal';
import DataTable, { DataTableActions, DataTableEmptyState } from '../../components/ui/DataTable';
import FilterDropdown from '../../components/ui/FilterDropdown';
import '../../styles/shared/table-ui-layout-controls.css';
import '../../styles/shared/table-ui-core.css';
import '../../styles/shared/table-ui-actions.css';
import '../../styles/shared/feedback-ui-notification.css';
import '../../styles/shared/modal-ui-base.css';
import '../../styles/shared/form-ui-entity-modal.css';
import '../../styles/shared/table-ui-pagination.css';
import '../../styles/shared/table-ui-responsive.css';
import '../../styles/pages/delivery/admin-delivery.css';
import { ADMIN_DELIVERY_FILTERS, DELIVERY_STATUS_LABELS } from '../../types/delivery';
import type { DeliveryStatusKey } from '../../types/delivery';
import { resolveApiErrorMessage } from '../../types/app';
import type { NotificationState, Order } from '../../types/app';

type DeliveryAssignmentForm = {
  delivery_date: string;
};

type DeliveryDateRangeFilter = 'weekly' | 'monthly' | 'yearly' | 'all_time';

const DELIVERY_DATE_RANGE_OPTIONS: Array<{ value: DeliveryDateRangeFilter; label: string }> = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'all_time', label: 'All Time' },
];

const STATUS_FILTER_OPTIONS = ADMIN_DELIVERY_FILTERS.filter((filter) => filter.value !== 'unassigned');

const toLocalDateInputValue = (value?: string | Date | null) => {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AdminDelivery = () => {
  const [activeFilter, setActiveFilter] = useState<DeliveryStatusKey>('pending');
  const [dateRangeFilter, setDateRangeFilter] = useState<DeliveryDateRangeFilter>('all_time');
  const [notification, setNotification] = useState<NotificationState>({ message: '', type: '' });
  const [assignmentError, setAssignmentError] = useState('');
  const [isAssignmentSubmitting, setIsAssignmentSubmitting] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'assign' | 'reassign'>('assign');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [revertTarget, setRevertTarget] = useState<Order | null>(null);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<DeliveryAssignmentForm>({
    delivery_date: toLocalDateInputValue(),
  });
  const searchScanButtonRef = useRef<HTMLButtonElement | null>(null);
  const listParams = useMemo(() => ({
    delivery_status: activeFilter,
    date_range: dateRangeFilter,
  }), [activeFilter, dateRangeFilter]);
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
  } = usePaginatedList<Order>({ endpoint: '/orders/delivery/admin', initialSort: 'desc', params: listParams });

  useEffect(() => {
    if (!isSearchScannerOpen && searchScanButtonRef.current) {
      searchScanButtonRef.current.focus();
    }
  }, [isSearchScannerOpen]);

  const changeFilter = (nextFilter: DeliveryStatusKey) => {
    setActiveFilter(nextFilter);
    setCurrentPage(1);
  };

  const changeDateRangeFilter = (nextRange: DeliveryDateRangeFilter) => {
    setDateRangeFilter(nextRange);
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

  const confirmRevert = async () => {
    if (!revertTarget) {
      return;
    }

    await updateStatus(revertTarget, 'out_for_delivery', `Order #${revertTarget.order_id} reverted to out for delivery.`);
    setRevertTarget(null);
  };

  const handleSearchScanDetected = (orderId: string) => {
    handleSearchChange(orderId);
    setIsSearchScannerOpen(false);
  };

  const renderActions = (order: Order) => {
    if (order.delivery_status === 'unassigned') {
      return (
        <DataTableActions className="delivery-admin-actions">
          <button type="button" className="edit-button" onClick={() => openAssignmentModal(order, 'assign')}>
            <span className="material-icons">calendar_month</span>
            <span className="edit-text">Schedule</span>
          </button>
        </DataTableActions>
      );
    }

    if (order.delivery_status === 'pending') {
      return (
        <DataTableActions className="delivery-admin-actions">
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
        </DataTableActions>
      );
    }

    if (order.delivery_status === 'out_for_delivery') {
      return (
        <DataTableActions className="delivery-admin-actions">
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
        </DataTableActions>
      );
    }

    if (order.delivery_status === 'failed') {
      return (
        <DataTableActions className="delivery-admin-actions">
          <button type="button" className="edit-button" onClick={() => openAssignmentModal(order, 'reassign')}>
            <span className="material-icons">restart_alt</span>
            <span className="edit-text">Reschedule</span>
          </button>
          <button type="button" className="delete-button" onClick={() => setCancelTarget(order)}>
            <span className="material-icons">cancel</span>
            <span className="delete-text">Cancel</span>
          </button>
        </DataTableActions>
      );
    }

    if (order.delivery_status === 'delivered') {
      return (
        <DataTableActions className="delivery-admin-actions">
          <button type="button" className="edit-button" onClick={() => setRevertTarget(order)}>
            <span className="material-icons">undo</span>
            <span className="edit-text">Revert</span>
          </button>
        </DataTableActions>
      );
    }

    return <span className="delivery-admin-actions-empty">No actions</span>;
  };

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <div className="container delivery-admin-page">
      <DeleteConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel Order"
        message={cancelTarget ? `Are you sure you want to cancel order #${cancelTarget.order_id}?` : ''}
        cancelLabel="No, keep it."
        confirmLabel="Yes, cancel order."
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancel()}
      />

      <DeleteConfirmModal
        open={Boolean(revertTarget)}
        title="Revert Delivery Status"
        message={revertTarget ? `Order #${revertTarget.order_id} was marked delivered by mistake? This will revert it back to out for delivery.` : ''}
        cancelLabel="No, keep it."
        confirmLabel="Yes, revert it."
        onCancel={() => setRevertTarget(null)}
        onConfirm={() => void confirmRevert()}
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

      <OrderScanner
        isOpen={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onDetected={handleSearchScanDetected}
      />

      <ListPageHeader
        title="Delivery Management"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        searchAriaLabel="Search delivery orders"
        searchTrailingAction={(
          <>
            <span className="search-input-divider" aria-hidden="true" />
            <button
              ref={searchScanButtonRef}
              type="button"
              className="search-input-action"
              onClick={() => setIsSearchScannerOpen(true)}
              aria-label="Scan QR code to search delivery orders"
              title="Scan QR code"
            >
              <span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
            </button>
          </>
        )}
      />

      <div className="delivery-filter-bar">
        <div className="delivery-filter-tabs" role="tablist" aria-label="Filter delivery orders by status">
          {STATUS_FILTER_OPTIONS.map((filter) => {
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

        <div className="delivery-filter-selects" aria-label="Mobile delivery filters">
          <div className="delivery-status-filter filter-inline-control">
            <label id="delivery-status-filter-mobile-label" className="filter-inline-label">Status</label>
            <FilterDropdown
              id="delivery-status-filter-mobile"
              className="delivery-status-dropdown filter-inline-dropdown"
              ariaLabelledBy="delivery-status-filter-mobile-label"
              value={activeFilter}
              options={STATUS_FILTER_OPTIONS}
              onChange={changeFilter}
            />
          </div>

          <div className="delivery-date-range-filter delivery-date-range-filter--mobile filter-inline-control">
            <label id="delivery-date-range-mobile-label" className="filter-inline-label">Date Range</label>
            <FilterDropdown
              id="delivery-date-range-mobile"
              className="delivery-date-range-dropdown filter-inline-dropdown"
              ariaLabelledBy="delivery-date-range-mobile-label"
              value={dateRangeFilter}
              options={DELIVERY_DATE_RANGE_OPTIONS}
              onChange={changeDateRangeFilter}
            />
          </div>
        </div>

        <div className="delivery-date-range-filter delivery-date-range-filter--desktop filter-inline-control">
          <label id="delivery-date-range-label" className="filter-inline-label">Date Range</label>
          <FilterDropdown
            id="delivery-date-range"
            className="delivery-date-range-dropdown filter-inline-dropdown"
            ariaLabelledBy="delivery-date-range-label"
            value={dateRangeFilter}
            options={DELIVERY_DATE_RANGE_OPTIONS}
            onChange={changeDateRangeFilter}
          />
        </div>
      </div>

      <Notification message={notification.message} type={notification.type} />

      <DataTable wrapperClassName="delivery-admin-table-wrap" ariaLabel="Delivery management orders">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Delivery Date</th>
              <th scope="col" className="table-col-number">Items</th>
              <th scope="col" className="table-col-number">Amount</th>
              <th scope="col">Status</th>
              <th scope="col" className="table-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length ? (
              orders.map((order) => (
                <tr key={order.order_id}>
                  <td>
                    <span className="delivery-order-id-chip">#{order.order_id}</span>
                  </td>
                  <td>
                    <div className="delivery-admin-customer-cell">
                      <strong>{order.customer_name || `Customer #${order.customer_id}`}</strong>
                      <span>{order.address || 'No address'}</span>
                      <span>{order.contact_no || 'No contact'}</span>
                    </div>
                  </td>
                  <td>{formatDateOnly(order.delivery_date)}</td>
                  <td className="table-col-number">{order.items_count || 0}</td>
                  <td className="table-col-number">{formatPeso(order.total_amount || 0)}</td>
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
                  <td className="table-col-actions">{renderActions(order)}</td>
                </tr>
              ))
            ) : (
              <DataTableEmptyState colSpan={7} message="No orders found for the selected delivery status." />
            )}
          </tbody>
      </DataTable>

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


