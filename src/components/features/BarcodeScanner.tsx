import { Html5QrcodeSupportedFormats } from 'html5-qrcode';
import CameraScannerModal from './CameraScannerModal';
import '../../styles/components/barcode-scanner.css';

const BARCODE_VALUE_REGEX = /([A-Z0-9]{8,32})/i;

const parseSkuFromValue = (value: unknown): string | null => {
  const normalized = String(value || '').replace(/\s+/g, '').toUpperCase();
  const match = normalized.match(BARCODE_VALUE_REGEX);
  if (!match) {
    return null;
  }

  return match[1];
};

const BARCODE_SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
];

const BarcodeScanner = ({
  isOpen,
  onClose,
  onDetected,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (sku: string) => Promise<void> | void;
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <CameraScannerModal
      isOpen={isOpen}
      onClose={onClose}
      onDetected={onDetected}
      scannerIdPrefix="barcode-scanner"
      classNamePrefix="barcode-scanner"
      dialogAriaLabel="Barcode scanner"
      uploadButtonLabel="Upload Barcode"
      guidanceText="Align the barcode inside the frame."
      secureContextError="Camera access requires HTTPS or localhost. You can still type SKU manually."
      permissionError="Camera permission was blocked. Allow camera access and try again."
      noCameraError="No camera was detected on this device."
      genericStartError="Unable to start barcode scanner on this device."
      invalidUploadValueError="Barcode image scanned, but no valid SKU was found."
      uploadDecodeError="Unable to read a barcode from this image."
      parseDetectedValue={parseSkuFromValue}
      supportedFormats={BARCODE_SUPPORTED_FORMATS}
      qrbox={(width, height) => ({
        width: Math.floor(Math.min(width * 0.62, 380)),
        height: Math.floor(Math.min(height * 0.16, 100)),
      })}
    />
  );
};

export default BarcodeScanner;
