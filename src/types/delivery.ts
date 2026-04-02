export type DeliveryStatusKey = 'pending' | 'out_for_delivery' | 'delivered' | 'failed_delivery';

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatusKey, string> = {
  pending: 'Pending',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed_delivery: 'Failed Delivery',
};

export const DELIVERY_STATUS_OPTIONS: Array<{ value: DeliveryStatusKey; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed_delivery', label: 'Failed Delivery' },
];
