export type PresetDateRangeKey = 'this_month' | 'previous_month' | 'this_year' | 'all_time';

export const getPresetDateRange = (rangeKey: PresetDateRangeKey): { start: Date | null; end: Date | null } => {
  const now = new Date();

  if (rangeKey === 'all_time') {
    return { start: null, end: null };
  }

  if (rangeKey === 'this_month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  if (rangeKey === 'previous_month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
  };
};

export const getPresetRangeQuery = (rangeKey: PresetDateRangeKey): Record<string, string> => {
  const { start, end } = getPresetDateRange(rangeKey);

  if (!start || !end) {
    return {};
  }

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

export const getPreviousPresetRangeQuery = (rangeKey: PresetDateRangeKey): Record<string, string> | null => {
  const now = new Date();

  if (rangeKey === 'all_time') {
    return null;
  }

  if (rangeKey === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  if (rangeKey === 'previous_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  const previousYear = now.getFullYear() - 1;
  const start = new Date(previousYear, 0, 1, 0, 0, 0, 0);
  const end = new Date(previousYear, 11, 31, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
};