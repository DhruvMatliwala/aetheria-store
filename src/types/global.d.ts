declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  export const Shield: LucideIcon;
  export const Zap: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Clock: LucideIcon;
  export const Globe: LucideIcon;
  export const HeadphonesIcon: LucideIcon;
  export const Gamepad2: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Check: LucideIcon;
  export const Star: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Wallet: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Mail: LucideIcon;
  export const Phone: LucideIcon;
  export const Copy: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Upload: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Package: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Receipt: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const X: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Send: LucideIcon;
  export const Lock: LucideIcon;
  export const Key: LucideIcon;
  export const Users: LucideIcon;
  export const BookOpen: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const FileText: LucideIcon;
  export const Bell: LucideIcon;
  export const Flame: LucideIcon;
  export const UserCheck: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Grid: LucideIcon;
  export const Search: LucideIcon;
  export const Moon: LucideIcon;
  export const Calendar: LucideIcon;
  export const Settings: LucideIcon;
  export const Headphones: LucideIcon;
  export const Database: LucideIcon;
  export const Percent: LucideIcon;
  export const Plus: LucideIcon;
  export const Tag: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const XCircle: LucideIcon;
  export const Activity: LucideIcon;
  export const Menu: LucideIcon;
  export const LogOut: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Radar: LucideIcon;
  export const Radio: LucideIcon;
  export const Crosshair: LucideIcon;
  export const Sliders: LucideIcon;
  export const User: LucideIcon;
  export const Terminal: LucideIcon;
}
