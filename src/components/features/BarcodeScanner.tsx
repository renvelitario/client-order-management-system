import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
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

const pickPreferredCameraId = (cameras: Array<{ id: string; label?: string }>): string | null => {
  if (!Array.isArray(cameras) || cameras.length === 0) {
    return null;
  }

  const rearCamera = cameras.find((camera) => /rear|back|environment/i.test(camera.label || ''));
  return (rearCamera || cameras[0]).id;
};

const resolveScannerErrorMessage = (error: unknown): string => {
  if (!window.isSecureContext) {
    return 'Camera access requires HTTPS or localhost. You can still type SKU manually.';
  }

  const typedError = error as { name?: string; message?: string };
  const errorName = String(typedError?.name || '').toLowerCase();
  const message = String(typedError?.message || '').toLowerCase();

  if (errorName.includes('notallowed') || message.includes('permission')) {
    return 'Camera permission was blocked. Allow camera access and try again.';
  }

  if (errorName.includes('notfound') || message.includes('no camera')) {
    return 'No camera was detected on this device.';
  }

  return 'Unable to start barcode scanner on this device.';
};

const BarcodeScanner = ({
  isOpen,
  onClose,
  onDetected,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (sku: string) => Promise<void> | void;
}) => {
  const elementId = useId().replace(/[:]/g, '-');
  const scannerId = useMemo(() => `barcode-scanner-${elementId}`, [elementId]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerHostRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const onCloseRef = useRef(onClose);
  const onDetectedRef = useRef(onDetected);
  const stopScannerRef = useRef<() => Promise<void>>(async () => {});
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

  const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setScannerError('');
    setLoadingCamera(true);

    try {
      await stopScannerRef.current();

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      const decodedText = await scanner.scanFile(file, true);
      const sku = parseSkuFromValue(decodedText);
      if (!sku) {
        setScannerError('Barcode image scanned, but no valid SKU was found.');
        return;
      }

      await onDetectedRef.current?.(sku);
      onCloseRef.current?.();
    } catch {
      setScannerError('Unable to read a barcode from this image.');
    } finally {
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }

      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch {
          // ignore clear errors for upload mode
        }
        scannerRef.current = null;
      }

      setLoadingCamera(false);
    }
  }, [scannerId]);

  useEffect(() => {
    let cancelled = false;

    const loadCameras = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) {
          return;
        }

        const preferredId = pickPreferredCameraId(cameras || []);
        if (preferredId) {
          setSelectedCameraId(preferredId);
        }
      } catch {
        // ignore camera enumeration failures
      }
    };

    loadCameras();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let unmounted = false;

    const stopScanner = async () => {
      if (!scannerRef.current) {
        return;
      }

      try {
        await scannerRef.current.stop();
      } catch {
        // ignore stop errors
      }

      try {
        await scannerRef.current.clear();
      } catch {
        // ignore clear errors
      }

      stopActiveVideoTracks();
      scannerRef.current = null;

      if (!unmounted) {
        setLoadingCamera(false);
      }
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
        if (unmounted || !isOpen) {
          setLoadingCamera(false);
          return;
        }

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
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
          if (started || unmounted || !isOpen) {
            break;
          }

          try {
            await scanner.start(
              config,
              {
                fps: 10,
                qrbox: (w, h) => {
                  const width = Math.floor(Math.min(w * 0.72, 480));
                  const height = Math.floor(Math.min(h * 0.2, 120));
                  return { width, height };
                },
              },
              async (decodedText: string) => {
                const sku = parseSkuFromValue(decodedText);
                if (!sku) {
                  return;
                }

                await stopScanner();
                await onDetectedRef.current?.(sku);
                onCloseRef.current?.();
              },
              () => {
                // ignore frame decode misses
              },
            );
            started = true;
          } catch (err) {
            startError = err;
          }
        }

        if (!started) {
          throw startError || new Error('Unable to start camera.');
        }
      } catch (error) {
        if (!unmounted) {
          setScannerError(resolveScannerErrorMessage(error));
        }
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
  }, [isOpen, scannerId, selectedCameraId, stopActiveVideoTracks]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="barcode-scanner-overlay" role="dialog" aria-modal="true" aria-label="Barcode scanner">
      <button
        ref={closeButtonRef}
        type="button"
        className="barcode-scanner-close"
        onClick={handleClose}
        aria-label="Close scanner"
      >
        <span className="material-icons" aria-hidden="true">close</span>
      </button>

      {loadingCamera && (
        <p className="barcode-scanner-hint" aria-live="polite">Starting camera...</p>
      )}

      {scannerError && (
        <p className="barcode-scanner-error" role="alert">{scannerError}</p>
      )}

      <div className="barcode-scanner-upload-bar">
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="barcode-scanner-upload-input"
          onChange={handleImageUpload}
        />
        <button
          type="button"
          className="barcode-scanner-upload-btn"
          onClick={() => uploadInputRef.current?.click()}
        >
          <span className="material-icons" aria-hidden="true">photo_library</span>
          <span>Upload Barcode</span>
        </button>
      </div>

      <div id={scannerId} ref={scannerHostRef} className="barcode-scanner-view" />

      <div className="barcode-scanner-guide" aria-hidden="true">
        <span className="barcode-scanner-corner barcode-scanner-corner--tl" />
        <span className="barcode-scanner-corner barcode-scanner-corner--tr" />
        <span className="barcode-scanner-corner barcode-scanner-corner--bl" />
        <span className="barcode-scanner-corner barcode-scanner-corner--br" />
        <span className="barcode-scanner-line" />
      </div>

      <p className="barcode-scanner-guidance" aria-live="polite">
        Align the barcode inside the frame.
      </p>
    </div>,
    document.body,
  );
};

export default BarcodeScanner;
