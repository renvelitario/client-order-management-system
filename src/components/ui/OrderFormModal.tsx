import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
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
  const [openProductMenuIndex, setOpenProductMenuIndex] = useState<number | null>(null);
  const [productQueriesByRow, setProductQueriesByRow] = useState<Record<number, string>>({});

  const resolveProductIdFromInput = (inputValue: string) => {
    const normalized = inputValue.trim();
    if (!normalized) {
      return '';
    }

    const exactOption = products.find(
      (product) => `${product.product_id} - ${product.product_name}`.toLowerCase() === normalized.toLowerCase(),
    );
    if (exactOption) {
      return String(exactOption.product_id);
    }

    const numericId = Number(normalized);
    if (Number.isInteger(numericId)) {
      const matchById = products.find((product) => product.product_id === numericId);
      if (matchById) {
        return String(matchById.product_id);
      }
    }

    return '';
  };

  const handleProductInputChange = (index: number, inputValue: string) => {
    setProductQueriesByRow((previous) => ({
      ...previous,
      [index]: inputValue,
    }));

    onItemChange(index, 'product_id', resolveProductIdFromInput(inputValue));
  };

  const handleProductInputFocus = (index: number) => {
    setOpenProductMenuIndex(index);
  };

  const handleProductInputBlur = () => {
    window.setTimeout(() => setOpenProductMenuIndex(null), 120);
  };

  const getRowProductQuery = (index: number, productId: string) => {
    const fromTyping = productQueriesByRow[index];
    if (typeof fromTyping === 'string') {
      return fromTyping;
    }

    return getSelectedProductLabel(productId);
  };

  const getFilteredProducts = (index: number, productId: string) => {
    const query = getRowProductQuery(index, productId).trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const label = `${product.product_id} - ${product.product_name}`.toLowerCase();
      return label.includes(query);
    });
  };

  const handleProductOptionSelect = (index: number, product: Product) => {
    const label = `${product.product_id} - ${product.product_name}`;
    setProductQueriesByRow((previous) => ({
      ...previous,
      [index]: label,
    }));

    onItemChange(index, 'product_id', String(product.product_id));
    setOpenProductMenuIndex(null);
  };

  const getSelectedProductLabel = (productId: string) => {
    const selected = products.find((product) => String(product.product_id) === String(productId));
    return selected ? `${selected.product_id} - ${selected.product_name}` : '';
  };

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

                <div className="order-product-combobox">
                  <input
                    type="text"
                    className={`order-item-product-input${item.product_id ? '' : ' is-empty'}`}
                    value={getRowProductQuery(index, item.product_id)}
                    onChange={(event) => handleProductInputChange(index, event.target.value)}
                    onFocus={() => handleProductInputFocus(index)}
                    onBlur={handleProductInputBlur}
                    placeholder="Product"
                    required
                    aria-label="Product"
                    autoComplete="off"
                  />

                  {openProductMenuIndex === index && (
                    <div className="order-product-dropdown" role="listbox" aria-label="Product options">
                      {getFilteredProducts(index, item.product_id).slice(0, 40).map((product) => (
                        <button
                          key={product.product_id}
                          type="button"
                          className="order-product-option"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleProductOptionSelect(index, product);
                          }}
                        >
                          {product.product_id} - {product.product_name}
                        </button>
                      ))}

                      {getFilteredProducts(index, item.product_id).length === 0 && (
                        <div className="order-product-empty">No matching products.</div>
                      )}
                    </div>
                  )}
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
