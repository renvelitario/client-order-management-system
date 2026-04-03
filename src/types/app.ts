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
  delivery_date: string;
  delivery_status: string;
  delivered_at?: string | null;
  total_amount: number;
  items?: OrderItem[];
}

export interface LocalUser {
  user_id?: number;
  email?: string;
  username?: string;
  acc_type?: string;
  status?: string;
  inactivity_timeout_minutes?: number;
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
