import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent, FormEvent } from 'react';
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
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onRequestClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onRequestClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onRequestClose}>
      <div
        className="customer-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="customer-form-modal-header">
          <h3 id="customer-modal-title">{mode === 'create' ? 'Create Customer' : 'Update Customer'}</h3>
          <button type="button" className="customer-modal-close" onClick={onRequestClose} aria-label="Close customer form">
            <span className="material-icons">close</span>
          </button>
        </div>

        <Notification message={error} type="error" />

        <form className="customer-modal-form" onSubmit={onSubmit}>
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

          <div className="customer-modal-actions">
            <button type="button" className="modal-cancel" onClick={onRequestClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="create-button" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default CustomerFormModal;
