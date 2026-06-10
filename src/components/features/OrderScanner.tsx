import { Html5QrcodeSupportedFormats } from 'html5-qrcode';
import CameraScannerModal from './CameraScannerModal';
import '../../styles/components/order-scanner.css';

const ORDER_ID_REGEX = /(\d{1,12})/;
const parseOrderIdFromValue = (value: unknown): string | null => {
  const normalized = String(value || '').replace(/\s+/g, '').trim();
  const match = normalized.match(ORDER_ID_REGEX);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return match[1];
};

const ORDER_SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.UPC_A,
];

const OrderScanner = ({
  isOpen,
  onClose,
  onDetected,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (orderId: string) => Promise<void> | void;
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <CameraScannerModal
      isOpen={isOpen}
      onClose={onClose}
      onDetected={onDetected}
      scannerIdPrefix="order-scanner"
      classNamePrefix="order-scanner"
      dialogAriaLabel="QR code scanner"
      uploadButtonLabel="Upload QR Image"
      guidanceText="Align the QR code inside the frame."
      secureContextError="Camera access requires a secure context (HTTPS) or localhost. You can still enter an Order ID manually."
      permissionError="Camera permission was blocked. Allow camera access in browser settings, then try again."
      noCameraError="No camera was detected on this device. You can still enter an Order ID manually."
      genericStartError="Unable to start camera scanner on this device. You can still enter an Order ID manually."
      invalidUploadValueError="QR image scanned, but no valid Order ID was found. Please try another image."
      uploadDecodeError="Unable to read a QR code from this image. Try a clearer image or scan live with camera."
      parseDetectedValue={parseOrderIdFromValue}
      supportedFormats={ORDER_SUPPORTED_FORMATS}
      qrbox={(width, height) => {
        const size = Math.floor(Math.min(Math.min(width, height) * 0.52, 300));
        return { width: size, height: size };
      }}
    />
  );
};

export default OrderScanner;
