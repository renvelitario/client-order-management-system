import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import BarcodeScanner from '../features/BarcodeScanner';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';

type ProductFormData = {
  sku: string;
  product_name: string;
  price: string;
  status: string;
};

type ProductFormModalProps = {
  open: boolean;
  mode: 'create' | 'update';
  formData: ProductFormData;
  error: string;
  isSubmitting: boolean;
  onScanSku: (sku: string) => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRequestClose: () => void;
};

const ProductFormModal = ({
  open,
  mode,
  formData,
  error,
  isSubmitting,
  onScanSku,
  onChange,
  onSubmit,
  onRequestClose,
}: ProductFormModalProps) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const scanButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!scannerOpen && scanButtonRef.current) {
      scanButtonRef.current.focus();
    }
  }, [scannerOpen]);

  return (
    <EntityModalShell
      open={open}
      title={mode === 'create' ? 'Create Product' : 'Update Product'}
      titleId="product-modal-title"
      className="entity-form-modal"
      closeLabel="Close product form"
      onRequestClose={onRequestClose}
    >
      <Notification message={error} type="error" />

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(sku) => {
          onScanSku(sku);
          setScannerOpen(false);
        }}
      />

      <form className="entity-modal-form" onSubmit={onSubmit}>
        <div className="entity-modal-field">
          <label htmlFor="product-sku">SKU <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '11px' }}>(optional)</span></label>
          <div className="sku-input-row">
            <input
              id="product-sku"
              type="text"
              name="sku"
              value={formData.sku}
              onChange={onChange}
              placeholder="Leave blank if not assigned"
              maxLength={32}
            />
            {mode === 'create' && (
              <button
                ref={scanButtonRef}
                type="button"
                className="create-button sku-scan-button"
                onClick={() => setScannerOpen(true)}
                aria-label="Scan barcode"
                title="Scan barcode"
              >
                <span className="material-symbols-outlined" aria-hidden="true">barcode_scanner</span>
              </button>
            )}
          </div>
        </div>

        <div className="entity-modal-field">
          <label htmlFor="product-name">Product Name</label>
          <input
            id="product-name"
            type="text"
            name="product_name"
            value={formData.product_name}
            onChange={onChange}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="product-price">Price (PHP)</label>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={onChange}
            placeholder="0.00"
            required
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="product-status">Status</label>
          <select
            id="product-status"
            name="status"
            value={formData.status}
            onChange={onChange}
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="entity-modal-actions">
          <button type="button" className="modal-cancel" onClick={onRequestClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="create-button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
          </button>
        </div>
      </form>
    </EntityModalShell>
  );
};

export default ProductFormModal;
