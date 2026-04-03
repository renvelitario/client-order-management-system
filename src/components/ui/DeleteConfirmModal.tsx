import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type DeleteConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
};

const DeleteConfirmModal = ({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  cancelLabel = 'No, keep it.',
  confirmLabel = 'Yes, delete!',
}: DeleteConfirmModalProps) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-icon-wrap" aria-hidden="true">
          <span className="material-icons modal-warning-icon">warning</span>
        </div>
        <h3 id="delete-confirm-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>{cancelLabel}</button>
          <button className="modal-confirm-delete" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DeleteConfirmModal;
