export type DeliveryStatusKey = 'unassigned' | 'scheduled' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled';

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatusKey, string> = {
  unassigned: 'Unassigned',
  scheduled: 'Scheduled',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const DELIVERY_STATUS_OPTIONS: Array<{ value: DeliveryStatusKey; label: string }> = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const DELIVERY_USER_STATUS_OPTIONS: Array<{ value: DeliveryStatusKey; label: string }> = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
];

export const ADMIN_DELIVERY_FILTERS: Array<{ value: DeliveryStatusKey; label: string }> = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];
