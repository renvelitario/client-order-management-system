import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

const ORDER_ID_REGEX = /(\d{1,12})/;
const SCAN_BOX_RATIO = 0.68;
const SCAN_BOX_MAX_SIZE = 420;

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

const pickPreferredCameraId = (cameras) => {
  if (!Array.isArray(cameras) || cameras.length === 0) {
    return null;
  }

  const rearCamera = cameras.find((camera) => /rear|back|environment/i.test(camera.label || ''));
  return (rearCamera || cameras[0]).id;
};

const resolveScannerErrorMessage = (error) => {
  if (!window.isSecureContext) {
    return 'Camera access requires a secure context (HTTPS) or localhost. You can still enter an Order ID manually.';
  }

  const errorName = String(error?.name || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  if (errorName.includes('notallowed') || message.includes('permission')) {
    return 'Camera permission was blocked. Allow camera access in browser settings, then try again.';
  }

  if (errorName.includes('notfound') || message.includes('no camera')) {
    return 'No camera was detected on this device. You can still enter an Order ID manually.';
  }

  return 'Unable to start camera scanner on this device. You can still enter an Order ID manually.';
};

// isOpen  — controls visibility; scanner starts when true, stops when false
// onClose — called after a successful scan or when the user dismisses
const OrderScanner = ({ isOpen, onClose, onDetected }) => {
  const elementId = useId().replace(/[:]/g, '-');
  const scannerId = useMemo(() => `order-scanner-${elementId}`, [elementId]);
  const scannerRef = useRef(null);
  const scannerHostRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const onDetectedRef = useRef(onDetected);
  const stopScannerRef = useRef(async () => {});
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [selectedCameraId, setSelectedCameraId] = useState('');

  useEffect(() => {
    onCloseRef.current = onClose;
    onDetectedRef.current = onDetected;
  }, [onClose, onDetected]);

  const stopActiveVideoTracks = useCallback(() => {
    const host = scannerHostRef.current;
    if (!host) {
      return;
    }

    const videoElements = host.querySelectorAll('video');
    videoElements.forEach((videoElement) => {
      const mediaStream = videoElement.srcObject;
      if (mediaStream instanceof MediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      videoElement.srcObject = null;
    });
  }, []);

  const handleClose = useCallback(async () => {
    await stopScannerRef.current();
    onCloseRef.current?.();
  }, []);

  // Enumerate cameras once on mount so we can prefer the rear camera
  useEffect(() => {
    let cancelled = false;

    const loadCameras = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;

        const preferredId = pickPreferredCameraId(cameras || []);
        if (preferredId) setSelectedCameraId(preferredId);
      } catch {
        // Ignore enumeration failures; start configs will try fallbacks.
      }
    };

    loadCameras();
    return () => { cancelled = true; };
  }, []);

  // Start the scanner whenever the overlay opens; stop on close / unmount
  useEffect(() => {
    let unmounted = false;

    const stopScanner = async () => {
      if (!scannerRef.current) return;
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
      try { await scannerRef.current.clear(); } catch { /* ignore */ }
      stopActiveVideoTracks();
      scannerRef.current = null;
      if (!unmounted) setLoadingCamera(false);
    };

    stopScannerRef.current = stopScanner;

    if (!isOpen) {
      stopScanner();
      return undefined;
    }

    setScannerError('');
    setLoadingCamera(true);

    const startScanner = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (unmounted || !isOpen) { setLoadingCamera(false); return; }

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
        scannerRef.current = scanner;

        const startConfigs = [
          ...(selectedCameraId ? [{ deviceId: { exact: selectedCameraId } }] : []),
          { facingMode: { exact: 'environment' } },
          { facingMode: 'environment' },
          { facingMode: 'user' },
        ];

        let started = false;
        let startError = null;

        for (const config of startConfigs) {
          if (started || unmounted || !isOpen) break;

          try {
            await scanner.start(
              config,
              {
                fps: 10,
                // qrbox matches the visible guide box for intuitive alignment.
                qrbox: (w, h) => {
                  const size = Math.floor(Math.min(Math.min(w, h) * SCAN_BOX_RATIO, SCAN_BOX_MAX_SIZE));
                  return { width: size, height: size };
                },
              },
              async (decodedText) => {
                const orderId = parseOrderIdFromValue(decodedText);
                if (!orderId) return;
                await stopScanner();
                await onDetectedRef.current?.(orderId);
                onCloseRef.current?.();
              },
              () => { /* ignore per-frame decode misses */ },
            );
            started = true;
          } catch (err) {
            startError = err;
          }
        }

        if (!started) throw startError || new Error('Unable to start camera.');
      } catch (error) {
        if (!unmounted) setScannerError(resolveScannerErrorMessage(error));
      } finally {
        if (!unmounted) setLoadingCamera(false);
      }
    };

    startScanner();

    return () => {
      unmounted = true;
      stopScanner();
    };
  }, [isOpen, scannerId, selectedCameraId, stopActiveVideoTracks]);

  // Auto-focus the close button when the overlay opens (accessibility)
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Escape key dismisses the overlay
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fs-scanner-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="QR code scanner"
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="fs-scanner-close"
        onClick={handleClose}
        aria-label="Close scanner"
      >
        <span className="material-icons" aria-hidden="true">close</span>
      </button>

      {loadingCamera && (
        <p className="fs-scanner-hint" aria-live="polite">Starting camera…</p>
      )}

      {scannerError && (
        <p className="fs-scanner-error" role="alert">{scannerError}</p>
      )}

      <div id={scannerId} ref={scannerHostRef} className="fs-scanner-view" />
      <div className="fs-scanner-guide" aria-hidden="true" />
    </div>,
    document.body,
  );
};

export default OrderScanner;
