import type { ChangeEvent, FormEvent } from 'react';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';

type CustomerFormData = {
  name: string;
  address: string;
  contact_no: string;
};

type CustomerFormModalProps = {
  open: boolean;
  mode: 'create' | 'update';
  formData: CustomerFormData;
  error: string;
  isSubmitting: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRequestClose: () => void;
};

const CustomerFormModal = ({
  open,
  mode,
  formData,
  error,
  isSubmitting,
  onChange,
  onSubmit,
  onRequestClose,
}: CustomerFormModalProps) => {
  return (
    <EntityModalShell
      open={open}
      title={mode === 'create' ? 'Create Customer' : 'Update Customer'}
      titleId="customer-modal-title"
      className="entity-form-modal"
      closeLabel="Close customer form"
      onRequestClose={onRequestClose}
    >
      <Notification message={error} type="error" />

      <form className="entity-modal-form" onSubmit={onSubmit}>
        <label htmlFor="customer-name">Name:</label>
        <input
          id="customer-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          required
        />

        <label htmlFor="customer-address">Address:</label>
        <textarea
          id="customer-address"
          name="address"
          value={formData.address}
          onChange={onChange}
          required
        />

        <label htmlFor="customer-contact-no">Contact No:</label>
        <input
          id="customer-contact-no"
          type="text"
          name="contact_no"
          value={formData.contact_no}
          onChange={onChange}
          required
        />

        <div className="entity-modal-actions">
          <button type="button" className="modal-cancel" onClick={onRequestClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="create-button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
          </button>
        </div>
      </form>
    </EntityModalShell>
  );
};

export default CustomerFormModal;
