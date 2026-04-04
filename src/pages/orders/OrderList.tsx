import api from '../../utils/api';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import '../../styles/shared/entity-list.css';
import { formatPeso, formatDateOnly } from '../../utils/formatters';
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import Pagination from '../../components/ui/Pagination';
import OrderScanner from '../../components/features/OrderScanner';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useListOptions } from '../../hooks/useListOptions';
import { useAuth } from '../../hooks/useAuth';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import OrderFormModal from '../../components/ui/OrderFormModal';
import OrderItemsViewModal from '../../components/ui/OrderItemsViewModal';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import { DELIVERY_STATUS_LABELS } from '../../types/delivery';
import { resolveApiErrorMessage, resolveEntityMutationErrorMessage } from '../../types/app';
import type { DeliveryStatusKey } from '../../types/delivery';
import type { ApiError, Customer, Order, Product } from '../../types/app';

type OrderItemForm = {
  product_id: string;
  quantity: string;
  price: string;
};

type OrderForm = {
  customer_id: string;
  order_date: string;
  delivery_date: string;
  items_data: OrderItemForm[];
};

const emptyOrderItem = (): OrderItemForm => ({ product_id: '', quantity: '', price: '' });
const MIN_ORDER_ROWS = 2;

const ensureMinimumOrderRows = (items: OrderItemForm[]) => {
  const nextItems = [...items];
  while (nextItems.length < MIN_ORDER_ROWS) {
    nextItems.push(emptyOrderItem());
  }
  return nextItems;
};

const isActiveProduct = (product: Product) => String(product.status).toLowerCase() === 'active';

const findFirstEmptyOrderItemIndex = (items: OrderItemForm[]) => items.findIndex(
  (item) => !String(item.product_id).trim() && !String(item.quantity).trim() && !String(item.price).trim(),
);

const emptyOrderForm = (): OrderForm => ({
  customer_id: '',
  order_date: new Date().toISOString().split('T')[0],
  delivery_date: new Date().toISOString().split('T')[0],
  items_data: ensureMinimumOrderRows([emptyOrderItem()]),
});

const OrdersList = () => {
  const { isAdmin } = useAuth();
  const customers = useListOptions<Customer>({ endpoint: '/customers' });
  const products = useListOptions<Product>({ endpoint: '/products', filter: isActiveProduct });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);
  const [formData, setFormData] = useState<OrderForm>(emptyOrderForm);
  const [modalError, setModalError] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);
  const [pageNotification, setPageNotification] = useState({ message: '', type: 'success' });
  const [isOrderItemsModalOpen, setIsOrderItemsModalOpen] = useState(false);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState<Order | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchScanButtonRef = useRef<HTMLButtonElement | null>(null);
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
  } = usePaginatedList<Order>({ endpoint: '/orders', initialSort: 'desc' });
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog<number>((err: ApiError) => err.response?.data?.error || 'Failed to delete order.');

  useEffect(() => {
    if (!isSearchScannerOpen && searchScanButtonRef.current) {
      searchScanButtonRef.current.focus();
    }
  }, [isSearchScannerOpen]);

  useEffect(() => {
    if (!customers.length || !isModalOpen) {
      return;
    }

    if (modalMode === 'create') {
      setFormData((previous) => {
        if (previous.customer_id) {
          return previous;
        }

        return {
          ...previous,
          customer_id: String(customers[0].customer_id),
        };
      });
    }
  }, [customers, isModalOpen, modalMode]);

  const handleViewOrderItems = (order: Order) => {
    setSelectedOrderForItems(order);
    setIsOrderItemsModalOpen(true);
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

  const handleSearchScanDetected = (orderId: string) => {
    handleSearchChange(orderId);
    setIsSearchScannerOpen(false);
  };

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/orders/${id}`),
      () => refetch(),
      { success: 'Order deleted successfully.' },
    );
  };

  const resetOrderModalState = useCallback(() => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }

    setIsModalOpen(false);
    setModalMode('create');
    setActiveOrderId(null);
    setIsLoadingModalData(false);
    setFormData(emptyOrderForm());
    setModalError('');
    setHighlightedIndex(null);
  }, []);

  const closeOrderModal = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetOrderModalState();
  }, [isSubmitting, resetOrderModalState]);

  const openCreateModal = () => {
    setPageNotification({ message: '', type: 'success' });
    setModalMode('create');
    setActiveOrderId(null);
    setIsLoadingModalData(false);
    setModalError('');
    setHighlightedIndex(null);
    setFormData(emptyOrderForm());
    setIsModalOpen(true);
  };

  const openUpdateModal = async (orderId: number) => {
    setPageNotification({ message: '', type: 'success' });
    setModalMode('update');
    setActiveOrderId(orderId);
    setModalError('');
    setHighlightedIndex(null);
    setIsLoadingModalData(true);
    setIsModalOpen(true);

    try {
      const { data } = await api.get<Order>(`/orders/${orderId}`);
      const items = (data.items || []).map((item) => ({
        product_id: String(item.product_id || ''),
        quantity: String(item.quantity),
        price: item.price != null ? String(item.price) : '',
      }));

      setFormData({
        customer_id: String(data.customer_id || ''),
        order_date: data.order_date ? data.order_date.toString().split('T')[0] : new Date().toISOString().split('T')[0],
        delivery_date: data.delivery_date ? data.delivery_date.toString().split('T')[0] : new Date().toISOString().split('T')[0],
        items_data: ensureMinimumOrderRows(items.length ? [...items, emptyOrderItem()] : [emptyOrderItem()]),
      });
    } catch (err) {
      setModalError(resolveApiErrorMessage(err, 'Order not found.'));
    } finally {
      setIsLoadingModalData(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    setFormData((previous) => ({
      ...previous,
      customer_id: value,
    }));
  };

  const handleOrderDateChange = (value: string) => {
    setFormData((previous) => ({
      ...previous,
      order_date: value,
    }));
  };

  const handleDeliveryDateChange = (value: string) => {
    setFormData((previous) => ({
      ...previous,
      delivery_date: value,
    }));
  };

  const handleScanProduct = (sku: string) => {
    const normalizedSku = String(sku).trim().toUpperCase();
    const matchedProduct = products.find((product) => String(product.sku || '').trim().toUpperCase() === normalizedSku);

    if (!matchedProduct) {
      setModalError(`No active product found for SKU ${normalizedSku}.`);
      return;
    }

    const duplicateIndex = formData.items_data.findIndex(
      (item) => String(item.product_id) === String(matchedProduct.product_id),
    );

    if (duplicateIndex !== -1) {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }

      setHighlightedIndex(duplicateIndex);
      setModalError(`${matchedProduct.product_name} is already in this order.`);

      const existingBlock = document.getElementById(`item-block-${duplicateIndex}`);
      if (existingBlock) {
        existingBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      highlightTimerRef.current = setTimeout(() => {
        setHighlightedIndex(null);
      }, 1500);
      return;
    }

    setFormData((previous) => {
      const nextItems = [...previous.items_data];
      const nextItem = {
        product_id: String(matchedProduct.product_id),
        quantity: '1',
        price: String(matchedProduct.price),
      };
      const emptyRowIndex = findFirstEmptyOrderItemIndex(nextItems);

      if (emptyRowIndex !== -1) {
        nextItems[emptyRowIndex] = nextItem;
      } else {
        nextItems.push(nextItem, emptyOrderItem());
      }

      const hasDraftRow = nextItems.some((item) => !String(item.product_id).trim());
      if (!hasDraftRow) {
        nextItems.push(emptyOrderItem());
      }

      return {
        ...previous,
        items_data: nextItems,
      };
    });

    setModalError('');
  };

  const handleItemChange = (index: number, field: keyof OrderItemForm, value: string) => {
    if (field === 'product_id' && value) {
      const duplicateIndex = formData.items_data.findIndex(
        (item, itemIndex) => itemIndex !== index && String(item.product_id) === String(value),
      );

      if (duplicateIndex !== -1) {
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current);
        }

        setHighlightedIndex(duplicateIndex);
        setModalError('This product is already selected in another order item.');

        const existingBlock = document.getElementById(`item-block-${duplicateIndex}`);
        if (existingBlock) {
          existingBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        highlightTimerRef.current = setTimeout(() => {
          setHighlightedIndex(null);
        }, 1500);

        return;
      }
    }

    setFormData((previous) => {
      const newItems = [...previous.items_data];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      if (field === 'product_id' && value) {
        const hasOtherDraftRow = newItems.some(
          (item, itemIndex) => itemIndex !== index && !String(item.product_id).trim(),
        );

        if (!hasOtherDraftRow) {
          newItems.push(emptyOrderItem());
        }
      }

      return {
        ...previous,
        items_data: newItems,
      };
    });

    if (modalError) {
      setModalError('');
    }
  };

  const removeItem = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      items_data: ensureMinimumOrderRows(
        previous.items_data.filter((_, itemIndex) => itemIndex !== index),
      ),
    }));
  };

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    const hasIncompleteItem = formData.items_data.some((item) => {
      const hasAnyValue = String(item.product_id).trim() || String(item.quantity).trim() || String(item.price).trim();
      const hasAllValues = String(item.product_id).trim() && String(item.quantity).trim() && String(item.price).trim();
      return Boolean(hasAnyValue && !hasAllValues);
    });

    if (hasIncompleteItem) {
      setModalError('Complete or clear any partially filled order item rows before submitting.');
      setIsSubmitting(false);
      return;
    }

    const sanitizedItems = formData.items_data.filter(
      (item) => String(item.product_id).trim() && String(item.quantity).trim() && String(item.price).trim(),
    );

    if (!sanitizedItems.length) {
      setModalError('Add at least one order item before submitting.');
      setIsSubmitting(false);
      return;
    }

    const hasInvalidPrice = sanitizedItems.some((item) => !Number.isFinite(Number(item.price)) || Number(item.price) < 0);
    if (hasInvalidPrice) {
      setModalError('Each order item must have a valid unit price.');
      setIsSubmitting(false);
      return;
    }

    const hasInvalidQuantity = sanitizedItems.some((item) => !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0);
    if (hasInvalidQuantity) {
      setModalError('Each order item must have a valid quantity greater than 0.');
      setIsSubmitting(false);
      return;
    }

    const payload: OrderForm = {
      ...formData,
      items_data: sanitizedItems,
    };

    try {
      if (modalMode === 'create') {
        if (!window.confirm('Are you sure you want to add this order?')) {
          return;
        }

        await api.post('/orders', payload);
        setPageNotification({ message: 'Order created successfully.', type: 'success' });
      } else {
        if (!activeOrderId) {
          throw new Error('Missing order id for update.');
        }

        if (!window.confirm('Are you sure you want to update this order?')) {
          return;
        }

        await api.put(`/orders/${activeOrderId}`, payload);
        setPageNotification({ message: 'Order updated successfully.', type: 'success' });
      }

      await refetch();
      resetOrderModalState();
    } catch (err) {
      setModalError(resolveEntityMutationErrorMessage(err, modalMode, 'order'));
      setPageNotification({ message: '', type: 'success' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderModal = (
    <OrderFormModal
      open={isAdmin && isModalOpen}
      mode={modalMode}
      formData={formData}
      error={modalError}
      isSubmitting={isSubmitting}
      isLoading={isLoadingModalData}
      highlightedIndex={highlightedIndex}
      customers={customers}
      products={products}
      onCustomerChange={handleCustomerChange}
      onOrderDateChange={handleOrderDateChange}
      onDeliveryDateChange={handleDeliveryDateChange}
      onScanProduct={handleScanProduct}
      onItemChange={handleItemChange}
      onRemoveItem={removeItem}
      onSubmit={handleModalSubmit}
      onRequestClose={closeOrderModal}
    />
  );

  if (initialLoading) return <PageLoader />;

  return (
    <div className="container">
      <DeleteConfirmModal
        open={deleteDialog.show}
        title="Delete Order"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <OrderItemsViewModal
        open={isOrderItemsModalOpen}
        order={selectedOrderForItems}
        onClose={() => setIsOrderItemsModalOpen(false)}
      />

      <OrderScanner
        isOpen={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onDetected={handleSearchScanDetected}
      />

      <ListPageHeader
        title="Orders"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        searchAriaLabel="Search orders"
        searchTrailingAction={(
          <>
            <span className="search-input-divider" aria-hidden="true" />
            <button
              ref={searchScanButtonRef}
              type="button"
              className="search-input-action"
              onClick={() => setIsSearchScannerOpen(true)}
              aria-label="Scan QR code to search orders"
              title="Scan QR code"
            >
              <span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
            </button>
          </>
        )}
        action={isAdmin && (
          <button type="button" className="create-button" onClick={openCreateModal}>
            <span className="material-icons">add</span>
            Create
          </button>
        )}
      />

      <Notification message={pageNotification.message} type={pageNotification.type} />
      <Notification message={notification.message} type={notification.type} />
      {orderModal}

      <table id="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Order Date</th>
            <th>Delivery Date</th>
            <th>Status</th>
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
                <td>{o.customer_name || `Customer #${o.customer_id}`}</td>
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
                  <div className="table-row-actions">
                    <button
                      className="edit-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void openUpdateModal(o.order_id);
                      }}
                    >
                      <span className="material-icons">edit</span>
                      <span className="edit-text">Edit</span>
                    </button>
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
                  </div>
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
