export const LAST_ACTIVITY_STORAGE_KEY = 'lastActivityAt';
export const INACTIVITY_DURATION_STORAGE_KEY = 'inactivityDurationMinutes';
export const DEFAULT_INACTIVITY_MINUTES = 60;
export const MIN_INACTIVITY_MINUTES = 10;
export const MAX_INACTIVITY_MINUTES = 480;
export const WARNING_LEAD_MINUTES = 5;

const clampDurationMinutes = (minutes: number | string | null | undefined): number => {
  const parsedMinutes = Number(minutes);

  if (!Number.isFinite(parsedMinutes)) {
    return DEFAULT_INACTIVITY_MINUTES;
  }

  return Math.min(MAX_INACTIVITY_MINUTES, Math.max(MIN_INACTIVITY_MINUTES, Math.round(parsedMinutes)));
};

export const getStoredInactivityDurationMinutes = () => {
  const storedMinutes = localStorage.getItem(INACTIVITY_DURATION_STORAGE_KEY);
  return clampDurationMinutes(storedMinutes);
};

export const setStoredInactivityDurationMinutes = (
  minutes: number | string | null | undefined,
  { notify = true }: { notify?: boolean } = {},
): number => {
  const nextMinutes = clampDurationMinutes(minutes);
  localStorage.setItem(INACTIVITY_DURATION_STORAGE_KEY, String(nextMinutes));
  if (notify) {
    window.dispatchEvent(new CustomEvent('inactivityconfigchange', { detail: { minutes: nextMinutes } }));
  }
  return nextMinutes;
};

export const getInactivityLimitMs = () => getStoredInactivityDurationMinutes() * 60 * 1000;
export const getWarningLeadMs = () => WARNING_LEAD_MINUTES * 60 * 1000;