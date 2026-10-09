import { Ionicons } from '@expo/vector-icons';
// One file per icon: the package index pulls in every Lucide icon (~2000 modules).
import Apple from 'lucide-react-native/icons/apple';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Banknote from 'lucide-react-native/icons/banknote';
import Bell from 'lucide-react-native/icons/bell';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Camera from 'lucide-react-native/icons/camera';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import Check from 'lucide-react-native/icons/check';
import CheckCheck from 'lucide-react-native/icons/check-check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Copy from 'lucide-react-native/icons/copy';
import CircleHelp from 'lucide-react-native/icons/circle-question-mark';
import CreditCard from 'lucide-react-native/icons/credit-card';
import Droplet from 'lucide-react-native/icons/droplet';
import ExternalLink from 'lucide-react-native/icons/external-link';
import FileText from 'lucide-react-native/icons/file-text';
import Flag from 'lucide-react-native/icons/flag';
import Footprints from 'lucide-react-native/icons/footprints';
import GitBranch from 'lucide-react-native/icons/git-branch';
import Globe from 'lucide-react-native/icons/globe';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import House from 'lucide-react-native/icons/house';
import Images from 'lucide-react-native/icons/images';
import KeyRound from 'lucide-react-native/icons/key-round';
import Languages from 'lucide-react-native/icons/languages';
import Layers from 'lucide-react-native/icons/layers';
import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import Library from 'lucide-react-native/icons/library';
import ListPlus from 'lucide-react-native/icons/list-plus';
import List from 'lucide-react-native/icons/list';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import Moon from 'lucide-react-native/icons/moon';
import Plus from 'lucide-react-native/icons/plus';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Repeat from 'lucide-react-native/icons/repeat';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import Shield from 'lucide-react-native/icons/shield';
import Smartphone from 'lucide-react-native/icons/smartphone';
import SquareCheckBig from 'lucide-react-native/icons/square-check-big';
import Sun from 'lucide-react-native/icons/sun';
import Tags from 'lucide-react-native/icons/tags';
import Trash2 from 'lucide-react-native/icons/trash';
import User from 'lucide-react-native/icons/user';
import UtensilsCrossed from 'lucide-react-native/icons/utensils-crossed';
import Wallet from 'lucide-react-native/icons/wallet';
import X from 'lucide-react-native/icons/x';
import type { LucideIcon } from 'lucide-react-native';

/** Call sites keep the Ionicons names; the ones below render the website's Lucide icons. */
export type AppIconName = keyof typeof Ionicons.glyphMap;

const LUCIDE: Partial<Record<AppIconName, LucideIcon>> = {
  add: Plus,
  'arrow-forward': ArrowRight,
  calendar: CalendarDays,
  'calendar-outline': CalendarDays,
  'camera-outline': Camera,
  card: CreditCard,
  'card-outline': CreditCard,
  cash: Banknote,
  'cash-outline': Banknote,
  checkbox: SquareCheckBig,
  'checkbox-outline': SquareCheckBig,
  checkmark: Check,
  'checkmark-done-outline': CheckCheck,
  'chevron-back': ChevronLeft,
  'chevron-down': ChevronDown,
  'chevron-forward': ChevronRight,
  close: X,
  'copy-outline': Copy,
  'document-text-outline': FileText,
  flag: Flag,
  'flag-outline': Flag,
  'footsteps-outline': Footprints,
  'git-branch-outline': GitBranch,
  'globe-outline': Globe,
  grid: LayoutGrid,
  'grid-outline': LayoutGrid,
  'help-circle-outline': CircleHelp,
  home: House,
  'home-outline': House,
  images: Images,
  'images-outline': Images,
  'key-outline': KeyRound,
  layers: Layers,
  'layers-outline': Layers,
  'language-outline': Languages,
  'library-outline': Library,
  list: List,
  'list-outline': ListPlus,
  'lock-closed-outline': Lock,
  'log-out-outline': LogOut,
  'mail-outline': Mail,
  'moon-outline': Moon,
  notifications: Bell,
  'notifications-outline': Bell,
  nutrition: Apple,
  'nutrition-outline': Apple,
  'open-outline': ExternalLink,
  'person-outline': User,
  'phone-portrait-outline': Smartphone,
  'pricetags-outline': Tags,
  'repeat-outline': Repeat,
  'restaurant-outline': UtensilsCrossed,
  'school-outline': GraduationCap,
  search: Search,
  settings: Settings,
  'settings-outline': Settings,
  'shield-outline': Shield,
  'stats-chart-outline': ChartColumn,
  'sunny-outline': Sun,
  'sync-outline': RefreshCw,
  'trash-outline': Trash2,
  'wallet-outline': Wallet,
  water: Droplet,
  'water-outline': Droplet,
};

type AppIconProps = {
  name: AppIconName;
  color: string;
  size?: number;
};

export function AppIcon({ name, color, size = 22 }: AppIconProps) {
  const Lucide = LUCIDE[name];
  if (!Lucide) return <Ionicons name={name} size={size} color={color} />;
  // Lucide has no filled set: a filled Ionicons name (active tab) gets a heavier stroke instead.
  const filled = !name.endsWith('-outline') && `${name}-outline` in LUCIDE;
  return <Lucide color={color} size={size} strokeWidth={filled ? 2.4 : 1.8} />;
}
