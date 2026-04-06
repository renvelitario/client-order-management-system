import type { Session } from '@supabase/supabase-js';

export interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
  message?: string;
  name?: string;
}

export type NotificationType = 'success' | 'error' | '';

export interface NotificationState {
  message: string;
  type: NotificationType;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface Product {
  product_id: number;
  sku: string | null;
  product_name: string;
  price: number;
  status: string;
}

export interface Customer {
  customer_id: number;
  name: string;
  address: string;
  contact_no: string;
}

export interface OrderItem {
  product_id: number;
  sku?: string;
  quantity: number;
  price?: number;
  product_name?: string;
}

export interface Order {
  order_id: number;
  customer_id: number;
  customer_name?: string;
  address?: string;
  contact_no?: string;
  order_date: string;
  delivery_date: string | null;
  delivery_status: string;
  delivery_user_id?: number | null;
  delivery_user_name?: string | null;
  delivered_at?: string | null;
  delivered_by?: number | null;
  total_amount: number;
  items_count?: number;
  items?: OrderItem[];
  discount?: number;
  delivery_fee?: number;
}

export interface InboxNotification {
  notification_id: number;
  event_type: string;
  title: string;
  message: string;
  order_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationSummary {
  unread: number;
}

export interface UserSummary {
  user_id: number;
  email?: string;
  username: string;
  name?: string;
  acc_type: string;
  status: string;
  inactivity_timeout_minutes?: number;
}

export interface LocalUser {
  user_id?: number;
  email?: string;
  username?: string;
  name?: string;
  acc_type?: string;
  status?: string;
  inactivity_timeout_minutes?: number;
  session_timeout_enabled?: boolean;
}

export interface AuthContextValue {
  session: Session | null;
  localUser: LocalUser | null;
  loading: boolean;
  authError: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeliveryUser: boolean;
  refreshLocalUser: () => Promise<LocalUser>;
}

export const resolveApiErrorMessage = (error: unknown, fallback: string): string => {
  const typedError = error as ApiError;
  return typedError?.response?.data?.error || typedError?.message || fallback;
};

export const resolveEntityMutationErrorMessage = (
  error: unknown,
  mode: 'create' | 'update',
  entityName: string,
): string => {
  const fallback = mode === 'create'
    ? `Failed to add ${entityName}.`
    : `Failed to update ${entityName}.`;

  return resolveApiErrorMessage(error, fallback);
};
