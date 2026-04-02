// Currency formatting
const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPeso = (value: number | string | null | undefined): string => {
  const amount = Number(value);
  return pesoFormatter.format(Number.isFinite(amount) ? amount : 0);
};

// Date formatting
export const formatDateTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return 'N/A';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleString();
};

export const formatDateOnly = (value: string | number | Date | null | undefined): string => {
  if (!value) return 'N/A';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleDateString();
};
