import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleCheck,
  Eye,
  EyeOff,
  FileText,
  House,
  Image,
  Inbox,
  Lock,
  Mail,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  ScanBarcode,
  Search,
  Trash2,
  Truck,
  Undo2,
  User,
  UserPlus,
  X,
  XCircle,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

const LEGACY_ICON_MAP: Record<string, LucideIcon> = {
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  search: Search,
  description: FileText,
  warning: AlertTriangle,
  close: X,
  inbox: Inbox,
  home: House,
  qr_code_scanner: QrCode,
  barcode_scanner: ScanBarcode,
  local_shipping: Truck,
  person: User,
  person_add: UserPlus,
  lock: Lock,
  visibility: Eye,
  visibility_off: EyeOff,
  mail: Mail,
  photo_library: Image,
  first_page: ChevronsLeft,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  last_page: ChevronsRight,
  expand_more: ChevronDown,
  calendar_month: Calendar,
  edit_calendar: CalendarClock,
  cancel: XCircle,
  done_all: CheckCheck,
  report_problem: AlertTriangle,
  restart_alt: RotateCcw,
  undo: Undo2,
  update: RefreshCw,
  dangerous: AlertTriangle,
  task_alt: CircleCheck,
};

type AppIconProps = Omit<LucideProps, 'size'> & {
  name: string;
  size?: number | string;
};

const AppIcon = ({
  name,
  className,
  size = '1em',
  strokeWidth = 2,
  ...rest
}: AppIconProps) => {
  const IconComponent = LEGACY_ICON_MAP[name] ?? Circle;

  return <IconComponent className={['app-icon', className].filter(Boolean).join(' ')} size={size} strokeWidth={strokeWidth} {...rest} />;
};

export default AppIcon;