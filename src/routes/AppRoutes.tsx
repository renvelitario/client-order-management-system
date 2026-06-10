import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, ProtectedRoute } from '../components/auth/RouteGuards';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Login = lazy(() => import('../pages/Login'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const ProductsList = lazy(() => import('../pages/products/ProductList'));
const CustomersList = lazy(() => import('../pages/customers/CustomerList'));
const OrdersList = lazy(() => import('../pages/orders/OrderList'));
const AdminDelivery = lazy(() => import('../pages/delivery/AdminDelivery'));
const DeliveryHome = lazy(() => import('../pages/delivery/Home'));
const DeliveryTodayOrders = lazy(() => import('../pages/delivery/TodayOrders'));
const DeliveryInbox = lazy(() => import('../pages/delivery/Inbox'));
const UserManagement = lazy(() => import('../pages/users/UserManagement'));
const CreateUserAccount = lazy(() => import('../pages/account/CreateUserAccount'));
const AccountProfileOverview = lazy(() => import('../pages/account/AccountProfileOverview'));
const AccountSecurity = lazy(() => import('../pages/account/AccountSecurity'));
const AccountSessions = lazy(() => import('../pages/account/AccountSessions'));
const NotFound = lazy(() => import('../pages/NotFound'));

const LEGACY_ROUTE_REDIRECTS = [
  { from: '/products/new', to: '/products' },
  { from: '/products/edit', to: '/products' },
  { from: '/customers/new', to: '/customers' },
  { from: '/customers/edit', to: '/customers' },
  { from: '/orders/new', to: '/orders' },
  { from: '/orders/edit', to: '/orders' },
  { from: '/products_list', to: '/products' },
  { from: '/products_add', to: '/products' },
  { from: '/products_update', to: '/products' },
  { from: '/cust_list', to: '/customers' },
  { from: '/cust_add', to: '/customers' },
  { from: '/cust_update', to: '/customers' },
  { from: '/orders_list', to: '/orders' },
  { from: '/orders_add', to: '/orders' },
  { from: '/orders_update', to: '/orders' },
  { from: '/account/settings', to: '/account/profile' },
  { from: '/account/password', to: '/account/security' },
  { from: '/account/sessions', to: '/account/session' },
] as const;

export const AuthenticatedRoutes = ({ defaultRoute }: { defaultRoute: string }) => (
  <Routes>
    <Route path="/" element={<Navigate to={defaultRoute} replace />} />
    <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
    <Route path="/delivery" element={<AdminRoute><AdminDelivery /></AdminRoute>} />
    <Route path="/delivery/home" element={<ProtectedRoute><DeliveryHome /></ProtectedRoute>} />
    <Route path="/delivery/orders" element={<ProtectedRoute><DeliveryTodayOrders /></ProtectedRoute>} />
    <Route path="/delivery/inbox" element={<ProtectedRoute><DeliveryInbox /></ProtectedRoute>} />
    <Route path="/products" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
    <Route path="/customers" element={<ProtectedRoute><CustomersList /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
    <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
    <Route path="/account/users/new" element={<AdminRoute><CreateUserAccount /></AdminRoute>} />
    <Route path="/account/profile" element={<ProtectedRoute><AccountProfileOverview /></ProtectedRoute>} />
    <Route path="/account/security" element={<ProtectedRoute><AccountSecurity /></ProtectedRoute>} />
    <Route path="/account/session" element={<ProtectedRoute><AccountSessions /></ProtectedRoute>} />
    {LEGACY_ROUTE_REDIRECTS.map(({ from, to }) => (
      <Route key={from} path={from} element={<Navigate to={to} replace />} />
    ))}
    <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
  </Routes>
);

export const PublicRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);
