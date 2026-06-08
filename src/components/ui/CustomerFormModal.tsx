import type { ChangeEvent, FormEvent } from 'react';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';

type CustomerFormData = {
  student_number: string;
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
        <div className="entity-modal-field">
          <label htmlFor="customer-student-number">Student Number</label>
          <input
            id="customer-student-number"
            type="text"
            name="student_number"
            value={formData.student_number}
            onChange={onChange}
            placeholder="e.g. 2024-00031"
            required
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="customer-name">Name</label>
          <input
            id="customer-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Full name"
            required
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="customer-address">Address</label>
          <textarea
            id="customer-address"
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="Street, city, province"
            required
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="customer-contact-no">Contact No.</label>
          <input
            id="customer-contact-no"
            type="text"
            name="contact_no"
            value={formData.contact_no}
            onChange={onChange}
            placeholder="e.g. 09171234567"
            required
          />
        </div>

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
