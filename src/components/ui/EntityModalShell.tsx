import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

type EntityModalShellProps = {
  open: boolean;
  title: string;
  titleId: string;
  className: string;
  closeLabel: string;
  onRequestClose: () => void;
  children: ReactNode;
};

const EntityModalShell = ({
  open,
  title,
  titleId,
  className,
  closeLabel,
  onRequestClose,
  children,
}: EntityModalShellProps) => {
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
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="entity-modal-header">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="entity-modal-close" onClick={onRequestClose} aria-label={closeLabel}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
};

export default EntityModalShell;
