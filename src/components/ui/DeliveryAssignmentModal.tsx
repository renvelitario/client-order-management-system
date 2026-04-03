import type { ChangeEvent, FormEvent } from 'react';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';
import type { Order, UserSummary } from '../../types/app';

type DeliveryAssignmentForm = {
  delivery_date: string;
  delivery_user_id: string;
};

type DeliveryAssignmentModalProps = {
  open: boolean;
  mode: 'assign' | 'reassign';
  order: Order | null;
  formData: DeliveryAssignmentForm;
  deliveryUsers: UserSummary[];
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
  deliveryUsers,
  error,
  isSubmitting,
  onFieldChange,
  onSubmit,
  onRequestClose,
}: DeliveryAssignmentModalProps) => {
  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFieldChange('delivery_user_id', event.target.value);
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFieldChange('delivery_date', event.target.value);
  };

  return (
    <EntityModalShell
      open={open}
      title={mode === 'assign' ? 'Assign Delivery' : 'Reassign Delivery'}
      titleId="delivery-assignment-modal-title"
      className="entity-form-modal"
      closeLabel="Close delivery assignment form"
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
            required
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="delivery-assignment-user">Delivery User</label>
          <select
            id="delivery-assignment-user"
            value={formData.delivery_user_id}
            onChange={handleSelectChange}
            required
          >
            <option value="">Select delivery user</option>
            {deliveryUsers.map((user) => (
              <option key={user.user_id} value={String(user.user_id)}>
                {user.username}
              </option>
            ))}
          </select>
        </div>

        <div className="entity-modal-actions">
          <button type="button" className="modal-cancel" onClick={onRequestClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="create-button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'assign' ? 'Assign Delivery' : 'Save Reassignment'}
          </button>
        </div>
      </form>
    </EntityModalShell>
  );
};

export default DeliveryAssignmentModal;