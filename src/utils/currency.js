const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPeso = (value) => {
  const amount = Number(value);
  return pesoFormatter.format(Number.isFinite(amount) ? amount : 0);
};
