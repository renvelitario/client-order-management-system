import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/shared/entity-form.css';
import { formatPeso } from '../../utils/formatters';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import { useListOptions } from '../../hooks/useListOptions';
import type { Customer, Order, Product } from '../../types/app';
import { resolveApiErrorMessage } from '../../types/app';

type OrderItemForm = {
  product_id: string;
  quantity: string;
};

type OrderForm = {
  customer_id: string;
  delivery_date: string;
  items_data: OrderItemForm[];
};

const toLocalDateInputValue = (value?: string | Date | null) => {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isActiveProduct = (product: Product) => String(product.status).toLowerCase() === 'active';

const OrderUpdate = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const navigate = useNavigate();

  const products = useListOptions<Product>({ endpoint: '/products', filter: isActiveProduct });
  const customers = useListOptions<Customer>({ endpoint: '/customers' });

  const [formData, setFormData] = useState<OrderForm>({
    customer_id: '',
    delivery_date: toLocalDateInputValue(),
    items_data: [{ product_id: '', quantity: '' }],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Invalid request.');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get<Order>(`/orders/${orderId}`);
        const orderItems = (data.items || []).map((item) => ({
          product_id: String(item.product_id),
          quantity: String(item.quantity),
        }));

        setFormData({
          customer_id: String(data.customer_id || ''),
          delivery_date: toLocalDateInputValue(data.delivery_date),
          items_data: orderItems.length ? orderItems : [{ product_id: '', quantity: '' }],
        });
      } catch (err) {
        setError(resolveApiErrorMessage(err, 'Order not found.'));
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!customers.length) {
      return;
    }

    setFormData((prev) => {
      if (prev.customer_id) {
        return prev;
      }

      return {
        ...prev,
        customer_id: String(customers[0].customer_id),
      };
    });
  }, [customers]);

  const handleCustomerChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, customer_id: e.target.value });
  };

  const handleDeliveryDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, delivery_date: e.target.value });
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
        setError('This product is already selected in another order item.');

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

    const newItems = [...formData.items_data];
    newItems[index][field] = value;
    setFormData({ ...formData, items_data: newItems });
    if (error) {
      setError('');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items_data: [...formData.items_data, { product_id: '', quantity: '' }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items_data: formData.items_data.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!orderId) {
      setError('Invalid request.');
      return;
    }

    if (!window.confirm('Are you sure you want to update this order?')) {
      return;
    }

    try {
      await api.put(`/orders/${orderId}`, formData);
      navigate('/orders');
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Failed to update order.'));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="order-container">
      <h2>Update Order</h2>
      <form onSubmit={handleSubmit}>
        <label>Customer ID:</label>
        <select value={formData.customer_id} onChange={handleCustomerChange} required>
          <option value="">Select a customer</option>
          {customers.map((c) => (
            <option key={c.customer_id} value={c.customer_id}>{c.customer_id} - {c.name}</option>
          ))}
        </select><br />

        <label>Delivery Date:</label>
        <input
          type="date"
          value={formData.delivery_date}
          onChange={handleDeliveryDateChange}
          required
        /><br />

        <h3>Order Items</h3>
        {formData.items_data.map((item, index) => (
          <div
            key={index}
            id={`item-block-${index}`}
            className={highlightedIndex === index ? 'order-item-block order-item-block-highlight' : 'order-item-block'}
          >
            <label>Product:</label>
            <select
              value={item.product_id}
              onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
              required
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_id} - {p.product_name} ({formatPeso(p.price)})
                </option>
              ))}
            </select><br />

            <label>Quantity:</label>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              min="1"
              required
            /><br />

            {formData.items_data.length > 1 && (
              <button type="button" onClick={() => removeItem(index)} className="order-item-remove-button">
                Remove Item
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addItem} className="order-item-add-button">
          Add Another Item
        </button><br />

        <input type="submit" value="Update Order" />
        <Notification message={error} type="error" />
      </form>
    </div>
  );
};

export default OrderUpdate;
