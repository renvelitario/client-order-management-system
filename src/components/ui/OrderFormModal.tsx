import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import BarcodeScanner from '../features/BarcodeScanner';
import { formatPeso } from '../../utils/formatters';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';
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
  onItemChange: (index: number, field: keyof OrderItemForm, value: string) => void;
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
      label: `${customer.customer_id} - ${customer.name}`,
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
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 42,
                  fontSize: '14px',
                  borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-color)',
                  boxShadow: state.isFocused ? '0 0 0 3px var(--border-focus)' : 'none',
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#b0bac6',
                  fontSize: '14px',
                }),
                singleValue: (base) => ({
                  ...base,
                  fontSize: '14px',
                  color: 'var(--text-main)',
                }),
                option: (base) => ({
                  ...base,
                  fontSize: '14px',
                }),
                menuPortal: (base) => ({
                  ...base,
                  zIndex: 2000,
                }),
              }}
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
                <span className="material-symbols-outlined" aria-hidden="true">barcode_scanner</span>
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
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: 36,
                          fontSize: '13px',
                          borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-color)',
                          boxShadow: state.isFocused ? '0 0 0 3px var(--border-focus)' : 'none',
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#b0bac6',
                          fontSize: '13px',
                        }),
                        singleValue: (base) => ({
                          ...base,
                          fontSize: '13px',
                        }),
                        option: (base) => ({
                          ...base,
                          fontSize: '13px',
                        }),
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 2000,
                        }),
                      }}
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
                    placeholder="—"
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
                    <span className="material-icons" style={{ fontSize: '16px' }}>close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount and Delivery Fee fields */}
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
