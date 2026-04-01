import { useEffect, useId, useMemo, useRef, useState } from 'react';

const ORDER_ID_REGEX = /(\d{1,12})/;

const parseOrderIdFromValue = (value) => {
  const trimmed = String(value || '').trim();
  const match = trimmed.match(ORDER_ID_REGEX);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
};

const OrderScanner = ({ onDetected }) => {
  const elementId = useId().replace(/[:]/g, '-');
  const scannerId = useMemo(() => `order-scanner-${elementId}`, [elementId]);
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    let unmounted = false;

    const stopScanner = async () => {
      if (!scannerRef.current) {
        return;
      }

      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors to avoid breaking cleanup.
      }

      try {
        await scannerRef.current.clear();
      } catch {
        // Ignore clear errors during cleanup.
      }

      scannerRef.current = null;
      if (!unmounted) {
        setLoadingCamera(false);
      }
    };

    const startScanner = async () => {
      if (!isScanning) {
        await stopScanner();
        return;
      }

      setScannerError('');
      setLoadingCamera(true);

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (unmounted || !isScanning) {
          setLoadingCamera(false);
          return;
        }

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: undefined,
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
          },
          async (decodedText) => {
            const orderId = parseOrderIdFromValue(decodedText);
            if (!orderId) {
              return;
            }

            await onDetected(orderId);
            setIsScanning(false);
          },
          () => {
            // Ignore continuous decode errors while camera is active.
          }
        );
      } catch {
        setScannerError('Unable to start camera scanner on this device. You can still enter an Order ID manually.');
      } finally {
        if (!unmounted) {
          setLoadingCamera(false);
        }
      }
    };

    startScanner();

    return () => {
      unmounted = true;
      stopScanner();
    };
  }, [isScanning, onDetected, scannerId]);

  const handleManualSubmit = async (event) => {
    event.preventDefault();

    const parsedOrderId = parseOrderIdFromValue(manualInput);
    if (!parsedOrderId) {
      setScannerError('Enter a valid Order ID.');
      return;
    }

    setScannerError('');
    await onDetected(parsedOrderId);
    setManualInput('');
  };

  return (
    <section className="delivery-scanner-card" aria-label="Order scanner">
      <div className="delivery-scanner-header">
        <h3>Scan Receipt QR / Barcode</h3>
        <button
          type="button"
          className="scanner-toggle"
          onClick={() => setIsScanning((value) => !value)}
        >
          {isScanning ? 'Stop Scanner' : 'Start Scanner'}
        </button>
      </div>

      {isScanning && (
        <div className="scanner-preview-shell">
          <div id={scannerId} className="scanner-preview" />
          {loadingCamera && <p className="scanner-help">Starting camera...</p>}
        </div>
      )}

      {!isScanning && <p className="scanner-help">Use the scanner or type an Order ID manually.</p>}

      <form className="scanner-manual-form" onSubmit={handleManualSubmit}>
        <input
          type="text"
          value={manualInput}
          onChange={(event) => setManualInput(event.target.value)}
          placeholder="Enter Order ID"
          inputMode="numeric"
          aria-label="Manual order lookup"
        />
        <button type="submit">Find Order</button>
      </form>

      {scannerError && <p className="scanner-error">{scannerError}</p>}
    </section>
  );
};

export default OrderScanner;
