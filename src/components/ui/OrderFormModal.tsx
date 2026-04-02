import type { ChangeEvent, FormEvent } from 'react';
import { useMemo } from 'react';
import Select from 'react-select';
import { formatPeso } from '../../utils/formatters';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';
import type { Customer, Product } from '../../types/app';

type OrderItemForm = {
  product_id: string;
  quantity: string;
};

type OrderForm = {
  customer_id: string;
  delivery_date: string;
  items_data: OrderItemForm[];
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
  onCustomerChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onDeliveryDateChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
  onDeliveryDateChange,
  onItemChange,
  onRemoveItem,
  onSubmit,
  onRequestClose,
}: OrderFormModalProps) => {
  const productOptions = useMemo(
    () => products.map((product) => ({
      value: String(product.product_id),
      label: `${product.product_id} - ${product.product_name}`,
    })),
    [products],
  );

  const getSelectedProductPrice = (productId: string) => {
    const selected = products.find((product) => String(product.product_id) === String(productId));
    return selected ? formatPeso(selected.price) : '';
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

      {isLoading ? (
        <p className="order-modal-loading">Loading order data...</p>
      ) : (
        <form className="entity-modal-form" onSubmit={onSubmit}>
          <label htmlFor="order-customer">Customer ID:</label>
          <select id="order-customer" value={formData.customer_id} onChange={onCustomerChange} required>
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.customer_id} value={customer.customer_id}>{customer.customer_id} - {customer.name}</option>
            ))}
          </select>

          <label htmlFor="order-delivery-date">Delivery Date:</label>
          <input
            id="order-delivery-date"
            type="date"
            value={formData.delivery_date}
            onChange={onDeliveryDateChange}
            required
          />

          <h4>Order Items</h4>
          <div className="order-items-grid" role="group" aria-label="Order items table">
            <div className="order-items-grid-head" aria-hidden="true">
              <span>Qty</span>
              <span>Unit</span>
              <span>Product</span>
              <span>Price</span>
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
                  required
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
                    value={productOptions.find((option) => option.value === String(item.product_id)) || null}
                    onChange={(selectedOption) => onItemChange(index, 'product_id', selectedOption?.value || '')}
                    placeholder="Product"
                    isSearchable
                    isClearable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        minHeight: 40,
                        borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-color)',
                        boxShadow: state.isFocused ? '0 0 0 3px var(--border-focus)' : 'none',
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: '#9ca3af',
                      }),
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 2000,
                      }),
                    }}
                  />
                </div>

                <input
                  type="text"
                  value={getSelectedProductPrice(item.product_id)}
                  placeholder="Price"
                  readOnly
                  aria-label="Price"
                />

                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="order-item-row-remove"
                  disabled={isSubmitting}
                  aria-label={`Remove row ${index + 1}`}
                >
                  x
                </button>
              </div>
            ))}

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
