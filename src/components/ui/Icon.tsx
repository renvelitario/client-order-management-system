import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  X,
} from 'lucide-react';

export type IconName =
  | 'dashboard'
  | 'analytics'
  | 'products'
  | 'customers'
  | 'orders'
  | 'delivery'
  | 'users'
  | 'settings'
  | 'security'
  | 'menu'
  | 'close'
  | 'logout';

const Icon = ({ name }: { name: IconName }) => {
  const icons = {
    dashboard: LayoutDashboard,
    analytics: BarChart3,
    products: Package,
    customers: Users,
    orders: ShoppingCart,
    delivery: Truck,
    users: Users,
    settings: Settings,
    security: ShieldCheck,
    menu: Menu,
    close: X,
    logout: LogOut,
  };

  const IconComponent = icons[name];

  return <IconComponent aria-hidden="true" />;
};

export default Icon;
