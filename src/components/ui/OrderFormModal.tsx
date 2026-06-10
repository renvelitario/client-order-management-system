import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import BarcodeScanner from '../features/BarcodeScanner';
import { formatPeso } from '../../utils/formatters';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';
import AppIcon from './AppIcon';
import type { Customer, Product } from '../../types/app';

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
  discount?: string;
  delivery_fee?: string;
};

type OrderFormModalProps = {
  open: boolean;
  mode: 'create' | 'update';
  formData: OrderForm;
  error: string;
  isSubmitting: boolean;
  isLoading: boolean;
  highlightedIndex: number | null;
  customers: Customer[];
  products: Product[];
  onCustomerChange: (value: string) => void;
  onOrderDateChange: (value: string) => void;
  onDeliveryDateChange: (value: string) => void;
  onScanProduct: (sku: string) => Promise<void> | void;
  onItemChange: (index: number, field: keyof OrderItemForm | 'discount' | 'delivery_fee', value: string) => void;
  onRemoveItem: (index: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRequestClose: () => void;
};

const OrderFormModal = ({
  open,
  mode,
  formData,
  error,
  isSubmitting,
  isLoading,
  highlightedIndex,
  customers,
  products,
  onCustomerChange,
  onOrderDateChange,
  onDeliveryDateChange,
  onScanProduct,
  onItemChange,
  onRemoveItem,
  onSubmit,
  onRequestClose,
}: OrderFormModalProps) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const scanButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!scannerOpen && scanButtonRef.current) {
      scanButtonRef.current.focus();
    }
  }, [scannerOpen]);

  const customerOptions = useMemo(
    () => customers.map((customer) => ({
      value: String(customer.customer_id),
      label: `${customer.student_number} - ${customer.name}`,
    })),
    [customers],
  );

  const productOptions = useMemo(
    () => products.map((product) => ({
      value: String(product.product_id),
      label: `${product.product_name} - ${product.sku ? `SKU ${product.sku}` : `ID ${product.product_id}`}`,
    })),
    [products],
  );

  const getSelectedProductBasePrice = (productId: string) => {
    const selected = products.find((product) => String(product.product_id) === productId);
    return selected ? String(selected.price) : '';
  };

  const getOrderItemAmount = (quantity: string, price: string) => {
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedQuantity) || !Number.isFinite(parsedPrice)) {
      return '';
    }

    return formatPeso(parsedQuantity * parsedPrice);
  };

  const buildSelectStyles = (fontSize: string, minHeight: number) => ({
    control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
      ...base,
      minHeight,
      fontSize,
      borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-color)',
      background: 'linear-gradient(180deg, #ffffff 0%, #f7faf7 100%)',
      boxShadow: state.isFocused
        ? '0 0 0 3px var(--border-focus)'
        : '0 1px 2px rgba(15, 23, 42, 0.04)',
      borderRadius: 'var(--radius-sm)',
      transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast)',
    }),
    placeholder: (base: Record<string, unknown>) => ({
      ...base,
      color: '#b0bac6',
      fontSize,
    }),
    singleValue: (base: Record<string, unknown>) => ({
      ...base,
      fontSize,
      color: 'var(--text-main)',
    }),
    menu: (base: Record<string, unknown>) => ({
      ...base,
      border: '1px solid rgba(54, 90, 56, 0.2)',
      borderRadius: '12px',
      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 248, 242, 0.98))',
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
      overflow: 'hidden',
      marginTop: 8,
    }),
    menuList: (base: Record<string, unknown>) => ({
      ...base,
      padding: 8,
      display: 'grid',
      gap: 4,
    }),
    option: (
      base: Record<string, unknown>,
      state: { isFocused: boolean; isSelected: boolean },
    ) => ({
      ...base,
      fontSize,
      borderRadius: '10px',
      padding: '10px 12px',
      cursor: 'pointer',
      color: state.isSelected || state.isFocused ? 'var(--primary)' : 'var(--text-main)',
      background: state.isSelected
        ? 'linear-gradient(180deg, rgba(54, 90, 56, 0.18), rgba(54, 90, 56, 0.1))'
        : state.isFocused
          ? 'rgba(54, 90, 56, 0.11)'
          : 'transparent',
      fontWeight: state.isSelected ? 600 : 500,
    }),
    dropdownIndicator: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
      ...base,
      color: state.isFocused ? 'var(--primary)' : 'var(--text-muted)',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    menuPortal: (base: Record<string, unknown>) => ({
      ...base,
      zIndex: 2000,
    }),
  });

  return (
    <EntityModalShell
      open={open}
      title={mode === 'create' ? 'Create Order' : 'Update Order'}
      titleId="order-modal-title"
      className="order-form-modal"
      closeLabel="Close order form"
      onRequestClose={onRequestClose}
    >
      <Notification message={error} type="error" />

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={async (sku) => {
          await onScanProduct(sku);
          setScannerOpen(false);
        }}
      />

      {isLoading ? (
        <p className="order-modal-loading">Loading order data...</p>
      ) : (
        <form className="entity-modal-form" onSubmit={onSubmit}>
          <div className="entity-modal-field">
            <label htmlFor="order-customer">Customer</label>
            <Select
              inputId="order-customer"
              instanceId="order-customer"
              classNamePrefix="order-customer-select"
              options={customerOptions}
              value={customerOptions.find((option) => option.value === String(formData.customer_id)) || null}
              onChange={(selectedOption) => onCustomerChange(selectedOption?.value || '')}
              placeholder="Select a customer"
              isSearchable
              isClearable={false}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              styles={buildSelectStyles('14px', 42)}
            />
          </div>

          <div className="entity-modal-field-group">
            <div className="entity-modal-field">
              <label htmlFor="order-order-date">Order Date</label>
              <input
                id="order-order-date"
                type="date"
                value={formData.order_date}
                onChange={(event) => onOrderDateChange(event.target.value)}
                max={new Date().toISOString().split('T')[0]}
                disabled={mode === 'update'}
                required
              />
            </div>

            <div className="entity-modal-field">
              <label htmlFor="order-delivery-date">Delivery Date</label>
              <input
                id="order-delivery-date"
                type="date"
                value={formData.delivery_date}
                onChange={(event) => onDeliveryDateChange(event.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={mode === 'update'}
                required
              />
            </div>
          </div>

          <div className="entity-modal-field">
            <div className="order-items-section-header">
              <p className="order-items-section-label">Order Items</p>
              <button
                ref={scanButtonRef}
                type="button"
                className="create-button order-scan-button"
                onClick={() => setScannerOpen(true)}
                aria-label="Scan product barcode"
                title="Scan product barcode"
              >
                <AppIcon name="barcode_scanner" aria-hidden="true" />
                Scan Product
              </button>
            </div>
            <div className="order-items-grid" role="group" aria-label="Order items table">
              <div className="order-items-grid-head" aria-hidden="true">
                <span>Qty</span>
                <span>Unit</span>
                <span>Product</span>
                <span>Unit Price</span>
                <span>Amount</span>
                <span></span>
              </div>

              {formData.items_data.map((item, index) => (
                <div
                  key={index}
                  id={`item-block-${index}`}
                  className={highlightedIndex === index ? 'order-item-grid-row order-item-grid-row-highlight' : 'order-item-grid-row'}
                >
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(event) => onItemChange(index, 'quantity', event.target.value)}
                    min="1"
                    placeholder="Qty"
                  />

                  <input
                    type="text"
                    value="pc"
                    placeholder="Unit"
                    readOnly
                    aria-label="Unit"
                  />

                  <div className="order-product-select-wrap">
                    <Select
                      classNamePrefix="order-product-select"
                      options={productOptions}
                      value={productOptions.find((option) => option.value === item.product_id) || null}
                      onChange={(selectedOption) => {
                        const nextProductId = selectedOption?.value || '';
                        onItemChange(index, 'product_id', nextProductId);
                        onItemChange(index, 'price', nextProductId ? getSelectedProductBasePrice(nextProductId) : '');
                      }}
                      placeholder="Product"
                      isSearchable
                      isClearable
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                      styles={buildSelectStyles('13px', 36)}
                    />
                  </div>

                  <input
                    type="number"
                    value={item.price}
                    onChange={(event) => onItemChange(index, 'price', event.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    aria-label="Unit price"
                  />

                  <input
                    type="text"
                    value={getOrderItemAmount(item.quantity, item.price)}
                    placeholder="-"
                    readOnly
                    aria-label="Amount"
                  />

                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="order-item-row-remove"
                    disabled={isSubmitting}
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <AppIcon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="entity-modal-field-group">
            <div className="entity-modal-field">
              <label htmlFor="order-discount">Discount</label>
              <input
                id="order-discount"
                type="number"
                min="0"
                step="0.01"
                value={formData.discount ?? ''}
                onChange={e => onItemChange(-1, 'discount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="entity-modal-field">
              <label htmlFor="order-delivery-fee">Delivery Fee</label>
              <input
                id="order-delivery-fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.delivery_fee ?? ''}
                onChange={e => onItemChange(-1, 'delivery_fee', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="entity-modal-actions">
            <button type="button" className="modal-cancel" onClick={onRequestClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="create-button" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Order' : 'Update Order'}
            </button>
          </div>
        </form>
      )}
    </EntityModalShell>
  );
};

export default OrderFormModal;
