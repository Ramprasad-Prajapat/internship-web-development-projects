import {
  BookOpen,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Full menu shown in the desktop sidebar. */
export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/modules", label: "Modules", icon: BookOpen },
  { to: "/history", label: "History", icon: History },
  { to: "/reports", label: "Reports", icon: FileSpreadsheet },
  { to: "/profile", label: "Profile", icon: User },
];
