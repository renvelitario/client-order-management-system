import type { ChangeEvent, FormEvent } from 'react';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';
import type { Order } from '../../types/app';

type DeliveryAssignmentForm = {
  delivery_date: string;
};

type DeliveryAssignmentModalProps = {
  open: boolean;
  mode: 'assign' | 'reassign';
  order: Order | null;
  formData: DeliveryAssignmentForm;
  error: string;
  isSubmitting: boolean;
  onFieldChange: (field: keyof DeliveryAssignmentForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRequestClose: () => void;
};

const DeliveryAssignmentModal = ({
  open,
  mode,
  order,
  formData,
  error,
  isSubmitting,
  onFieldChange,
  onSubmit,
  onRequestClose,
}: DeliveryAssignmentModalProps) => {
  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFieldChange('delivery_date', event.target.value);
  };

  return (
    <EntityModalShell
      open={open}
      title={mode === 'assign' ? 'Schedule Delivery' : 'Reschedule Delivery'}
      titleId="delivery-assignment-modal-title"
      className="entity-form-modal"
      closeLabel="Close delivery scheduling form"
      onRequestClose={onRequestClose}
    >
      <Notification message={error} type="error" />

      <form className="entity-modal-form" onSubmit={onSubmit}>
        <div className="entity-modal-field">
          <label htmlFor="delivery-assignment-order">Order</label>
          <input
            id="delivery-assignment-order"
            type="text"
            value={order ? `#${order.order_id} - ${order.customer_name || `Customer #${order.customer_id}`}` : ''}
            readOnly
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="delivery-assignment-date">Delivery Date</label>
          <input
            id="delivery-assignment-date"
            type="date"
            value={formData.delivery_date}
            onChange={handleDateChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="entity-modal-actions">
          <button type="button" className="modal-cancel" onClick={onRequestClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="create-button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'assign' ? 'Schedule Delivery' : 'Save Schedule'}
          </button>
        </div>
      </form>
    </EntityModalShell>
  );
};

export default DeliveryAssignmentModal;