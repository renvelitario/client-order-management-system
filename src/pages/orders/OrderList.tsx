import api from '../../utils/api';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import '../../styles/shared/entity-list.css';
import { formatPeso, formatDateOnly } from '../../utils/formatters';
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import Pagination from '../../components/ui/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import { DELIVERY_STATUS_LABELS } from '../../types/delivery';
import type { DeliveryStatusKey } from '../../types/delivery';
import type { ApiError, Order } from '../../types/app';

const OrdersList = () => {
  const { isAdmin } = useAuth();
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
  } = usePaginatedList<Order>({ endpoint: '/orders', initialSort: 'desc' });
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog<number>((err: ApiError) => err.response?.data?.error || 'Failed to delete order.');

  const handleViewOrderItems = (order: Order) => {
    alert(
      order.items && order.items.length > 0
        ? `Order Items:\n${order.items.map((item) => `Product #${item.product_id}: ${item.quantity} x ${formatPeso(item.price || 0)}`).join('\n')}`
        : 'No items in this order',
    );
  };

  const handlePrintReceipt = async (order: Order) => {
    const qrCodeDataUrl = await QRCode.toDataURL(String(order.order_id), {
      width: 180,
      margin: 1,
    });

    const popup = window.open('', '_blank', 'width=420,height=700');
    if (!popup) {
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Receipt #${order.order_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h2 { margin: 0 0 10px; }
            .line { margin: 4px 0; }
            .qr { margin: 16px 0; }
            .footer { margin-top: 14px; font-size: 12px; color: #444; }
          </style>
        </head>
        <body>
          <h2>Order Receipt</h2>
          <div class="line"><strong>Order ID:</strong> ${order.order_id}</div>
          <div class="line"><strong>Customer ID:</strong> ${order.customer_id}</div>
          <div class="line"><strong>Total:</strong> ${formatPeso(order.total_amount || 0)}</div>
          <div class="line"><strong>Status:</strong> ${DELIVERY_STATUS_LABELS[order.delivery_status as DeliveryStatusKey] || 'Pending'}</div>
          <div class="qr"><img src="${qrCodeDataUrl}" alt="Order QR Code" /></div>
          <div class="footer">Scan this QR to quickly open Order #${order.order_id} during delivery.</div>
          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/orders/${id}`),
      () => refetch(),
      { success: 'Order deleted successfully.' },
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container">
      <DeleteConfirmModal
        open={deleteDialog.show}
        title="Delete Order"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <ListPageHeader
        title="Orders"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        action={isAdmin && (
          <Link to="/orders/new" className="create-button">
            <span className="material-icons">add</span>
            Create
          </Link>
        )}
      />

      <Notification message={notification.message} type={notification.type} />

      <table id="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer ID</th>
            <th>Items</th>
            <th>Total Amount</th>
            <th>Order Date</th>
            <th>Delivery Date</th>
            <th>Delivery Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map(o => (
              <tr
                key={o.order_id}
                className="order-row-clickable"
                onClick={() => handleViewOrderItems(o)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleViewOrderItems(o);
                  }
                }}
                aria-label={`View order ${o.order_id} items`}
              >
                <td>
                  <span className="delivery-order-id-chip">#{o.order_id}</span>
                </td>
                <td>{o.customer_id}</td>
                <td>
                  {o.items && o.items.length > 0
                    ? `${o.items.length} item(s)`
                    : 'No items'}
                </td>
                <td>{formatPeso(o.total_amount || 0)}</td>
                <td>{formatDateOnly(o.order_date)}</td>
                <td>{formatDateOnly(o.delivery_date)}</td>
                <td>
                  <span className={`delivery-status-pill status-${o.delivery_status}`}>
                    {DELIVERY_STATUS_LABELS[o.delivery_status as DeliveryStatusKey] || 'Pending'}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/orders/edit?order_id=${o.order_id}`}
                    className="edit-button"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="material-icons">edit</span>
                    <span className="edit-text">Edit</span>
                  </Link>
                  <button
                    className="view-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePrintReceipt(o);
                    }}
                  >
                    <span className="material-icons">qr_code_2</span>
                    <span className="view-text">Receipt</span>
                  </button>
                  {isAdmin && (
                    <button
                      className="delete-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteClick(o.order_id);
                      }}
                    >
                      <span className="material-icons">delete</span>
                      <span className="delete-text">Delete</span>
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={8}>No orders found.</td></tr>
          )}
        </tbody>
      </table>
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

export default OrdersList;
