import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import AppIcon from '../ui/AppIcon';

type CameraScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (value: string) => Promise<void> | void;
  scannerIdPrefix: string;
  classNamePrefix: string;
  dialogAriaLabel: string;
  uploadButtonLabel: string;
  guidanceText: string;
  secureContextError: string;
  permissionError: string;
  noCameraError: string;
  genericStartError: string;
  invalidUploadValueError: string;
  uploadDecodeError: string;
  parseDetectedValue: (value: unknown) => string | null;
  supportedFormats: number[];
  qrbox: (width: number, height: number) => { width: number; height: number };
};

const pickPreferredCameraId = (cameras: Array<{ id: string; label?: string }>): string | null => {
  if (!Array.isArray(cameras) || cameras.length === 0) {
    return null;
  }

  const rearCamera = cameras.find((camera) => /rear|back|environment/i.test(camera.label || ''));
  return (rearCamera || cameras[0]).id;
};

const resolveScannerErrorMessage = (
  error: unknown,
  {
    secureContextError,
    permissionError,
    noCameraError,
    genericStartError,
  }: {
    secureContextError: string;
    permissionError: string;
    noCameraError: string;
    genericStartError: string;
  },
): string => {
  if (!window.isSecureContext) {
    return secureContextError;
  }

  const typedError = error as { name?: string; message?: string };
  const errorName = String(typedError?.name || '').toLowerCase();
  const message = String(typedError?.message || '').toLowerCase();

  if (errorName.includes('notallowed') || message.includes('permission')) {
    return permissionError;
  }

  if (errorName.includes('notfound') || message.includes('no camera')) {
    return noCameraError;
  }

  return genericStartError;
};

const CameraScannerModal = ({
  isOpen,
  onClose,
  onDetected,
  scannerIdPrefix,
  classNamePrefix,
  dialogAriaLabel,
  uploadButtonLabel,
  guidanceText,
  secureContextError,
  permissionError,
  noCameraError,
  genericStartError,
  invalidUploadValueError,
  uploadDecodeError,
  parseDetectedValue,
  supportedFormats,
  qrbox,
}: CameraScannerModalProps) => {
  const elementId = useId().replace(/[:]/g, '-');
  const scannerId = useMemo(() => `${scannerIdPrefix}-${elementId}`, [elementId, scannerIdPrefix]);
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
    const host = scannerHostRef.current || document.getElementById(scannerId);
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
  }, [scannerId]);

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

      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: supportedFormats,
        verbose: false,
      });

      scannerRef.current = scanner;

      const decodedText = await scanner.scanFile(file, true);
      const detectedValue = parseDetectedValue(decodedText);

      if (!detectedValue) {
        setScannerError(invalidUploadValueError);
        return;
      }

      await onDetectedRef.current?.(detectedValue);
      onCloseRef.current?.();
    } catch {
      setScannerError(uploadDecodeError);
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
  }, [invalidUploadValueError, parseDetectedValue, scannerId, supportedFormats, uploadDecodeError]);

  useEffect(() => {
    let cancelled = false;

    if (!isOpen) {
      return undefined;
    }

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
  }, [isOpen]);

  useEffect(() => {
    let unmounted = false;

    const stopScannerInstance = async (scanner: Html5Qrcode | null) => {
      stopActiveVideoTracks();

      if (!scanner) {
        return;
      }

      try {
        await scanner.stop();
      } catch {
        // ignore stop errors
      }

      try {
        await scanner.clear();
      } catch {
        // ignore clear errors
      }

      stopActiveVideoTracks();
      const host = scannerHostRef.current || document.getElementById(scannerId);
      if (host) {
        host.replaceChildren();
      }

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    };

    const stopScanner = async () => {
      await stopScannerInstance(scannerRef.current);

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
        const { Html5Qrcode } = await import('html5-qrcode');
        if (unmounted || !isOpen) {
          setLoadingCamera(false);
          return;
        }

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: supportedFormats,
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
                qrbox,
              },
              async (decodedText: string) => {
                const detectedValue = parseDetectedValue(decodedText);
                if (!detectedValue) {
                  return;
                }

                await stopScanner();
                await onDetectedRef.current?.(detectedValue);
                onCloseRef.current?.();
              },
              () => {
                // ignore frame decode misses
              },
            );
            started = true;

            if (unmounted) {
              await stopScannerInstance(scanner);
              break;
            }
          } catch (err) {
            startError = err;
          }
        }

        if (!started) {
          throw startError || new Error('Unable to start camera.');
        }
      } catch (error) {
        if (!unmounted) {
          setScannerError(resolveScannerErrorMessage(error, {
            secureContextError,
            permissionError,
            noCameraError,
            genericStartError,
          }));
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
  }, [
    genericStartError,
    isOpen,
    noCameraError,
    parseDetectedValue,
    permissionError,
    qrbox,
    scannerId,
    secureContextError,
    selectedCameraId,
    stopActiveVideoTracks,
    supportedFormats,
  ]);

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
    <div className={`${classNamePrefix}-overlay`} role="dialog" aria-modal="true" aria-label={dialogAriaLabel}>
      <button
        ref={closeButtonRef}
        type="button"
        className={`${classNamePrefix}-close`}
        onClick={handleClose}
        aria-label="Close scanner"
      >
        <AppIcon name="close" aria-hidden="true" />
      </button>

      {loadingCamera && (
        <p className={`${classNamePrefix}-hint`} aria-live="polite">Starting camera...</p>
      )}

      {scannerError && (
        <p className={`${classNamePrefix}-error`} role="alert">{scannerError}</p>
      )}

      <div className={`${classNamePrefix}-upload-bar`}>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className={`${classNamePrefix}-upload-input`}
          onChange={handleImageUpload}
        />
        <button
          type="button"
          className={`${classNamePrefix}-upload-btn`}
          onClick={() => uploadInputRef.current?.click()}
        >
          <AppIcon name="photo_library" aria-hidden="true" />
          <span>{uploadButtonLabel}</span>
        </button>
      </div>

      <div id={scannerId} ref={scannerHostRef} className={`${classNamePrefix}-view`} />

      <div className={`${classNamePrefix}-guide`} aria-hidden="true">
        <span className={`${classNamePrefix}-corner ${classNamePrefix}-corner--tl`} />
        <span className={`${classNamePrefix}-corner ${classNamePrefix}-corner--tr`} />
        <span className={`${classNamePrefix}-corner ${classNamePrefix}-corner--bl`} />
        <span className={`${classNamePrefix}-corner ${classNamePrefix}-corner--br`} />
        <span className={`${classNamePrefix}-line`} />
      </div>

      <p className={`${classNamePrefix}-guidance`} aria-live="polite">
        {guidanceText}
      </p>
    </div>,
    document.body,
  );
};

export default CameraScannerModal;
