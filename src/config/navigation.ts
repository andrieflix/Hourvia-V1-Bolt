import { LayoutDashboard, Timer, CalendarCheck, FileText, Users, FolderKanban, Briefcase, DollarSign, ChartBar as BarChart3, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  preview?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", path: "/app", icon: LayoutDashboard },
  { label: "Time Tracker", path: "/app/time-tracker", icon: Timer, preview: true },
  { label: "Attendance", path: "/app/attendance", icon: CalendarCheck, preview: true },
  { label: "Timesheets", path: "/app/timesheets", icon: FileText, preview: true },
  { label: "Team", path: "/app/team", icon: Users, preview: true },
  { label: "Projects", path: "/app/projects", icon: FolderKanban, preview: true },
  { label: "Clients", path: "/app/clients", icon: Briefcase, preview: true },
  { label: "Billing", path: "/app/billing", icon: DollarSign, preview: true },
  { label: "Reports", path: "/app/reports", icon: BarChart3, preview: true },
  { label: "Settings", path: "/app/settings", icon: Settings, preview: true },
];
