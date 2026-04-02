import { useEffect, useMemo, useState } from 'react';

const MIN_LOADER_DURATION_MS = 650;
const MAX_FONT_WAIT_MS = 1500;

const wait = (durationMs: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

const waitForWindowLoad = (): Promise<void> =>
  new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }

    const handleLoad = () => {
      resolve();
    };

    window.addEventListener('load', handleLoad, { once: true });
  });

const waitForFonts = async (): Promise<void> => {
  if (!('fonts' in document)) {
    return;
  }

  const fontSet = document.fonts;
  await Promise.race([
    fontSet.ready.then(() => undefined),
    wait(MAX_FONT_WAIT_MS),
  ]);
};

const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.loading = 'eager';

    const finalize = () => {
      resolve();
    };

    image.onload = finalize;
    image.onerror = finalize;
    image.src = src;

    if (image.complete) {
      finalize();
    }
  });

const waitForStylesToSettle = async (): Promise<void> => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

export const useAppInitialization = (authLoading: boolean) => {
  const [startupTasksReady, setStartupTasksReady] = useState(false);
  const [minimumDelayDone, setMinimumDelayDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const runStartupTasks = async () => {
      await Promise.all([
        waitForWindowLoad(),
        waitForFonts(),
        waitForStylesToSettle(),
        preloadImage('/logo.png'),
        import('../pages/Login'),
      ]);

      if (!cancelled) {
        setStartupTasksReady(true);
      }
    };

    runStartupTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMinimumDelayDone(true);
    }, MIN_LOADER_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const isInitializing = useMemo(
    () => authLoading || !startupTasksReady || !minimumDelayDone,
    [authLoading, minimumDelayDone, startupTasksReady],
  );

  return { isInitializing };
};
