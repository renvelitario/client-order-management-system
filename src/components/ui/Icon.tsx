import {
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
