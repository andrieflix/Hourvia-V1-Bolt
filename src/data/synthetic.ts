import { msFromHours } from "../domain/time";

export interface DashboardStats {
  todayMs: number;
  weekMs: number;
  billableMs: number;
  pendingTimesheets: number;
}

export const SYNTHETIC_STATS: DashboardStats = {
  todayMs: msFromHours(7.7),
  weekMs: msFromHours(38.25),
  billableMs: msFromHours(32),
  pendingTimesheets: 3,
};

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  project: string;
  duration: string;
  time: string;
}

export const SYNTHETIC_ACTIVITY: ActivityItem[] = [
  { id: "1", user: "Jane Smith", action: "tracked time on", project: "Website Redesign", duration: "2h 15m", time: "10 min ago" },
  { id: "2", user: "Mike Chen", action: "submitted timesheet for", project: "Week 43", duration: "40h 00m", time: "1 hour ago" },
  { id: "3", user: "Sarah Lee", action: "started timer on", project: "Mobile App", duration: "running", time: "2 hours ago" },
  { id: "4", user: "Jane Smith", action: "approved timesheet for", project: "Tom Wilson", duration: "38h 30m", time: "3 hours ago" },
  { id: "5", user: "Mike Chen", action: "logged time on", project: "API Integration", duration: "1h 45m", time: "5 hours ago" },
];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  weekHours: string;
  status: "active" | "idle" | "away";
}

export const SYNTHETIC_TEAM: TeamMember[] = [
  { id: "1", name: "Jane Smith", role: "OWNER", weekHours: "38h 15m", status: "active" },
  { id: "2", name: "Mike Chen", role: "ADMIN", weekHours: "40h 00m", status: "active" },
  { id: "3", name: "Sarah Lee", role: "MANAGER", weekHours: "35h 30m", status: "active" },
  { id: "4", name: "Tom Wilson", role: "EMPLOYEE", weekHours: "38h 30m", status: "idle" },
  { id: "5", name: "Lisa Park", role: "CONTRACTOR", weekHours: "22h 00m", status: "away" },
];

export const SYNTHETIC_WEEK_DATA: { day: string; hours: number }[] = [
  { day: "Mon", hours: 7.5 },
  { day: "Tue", hours: 8.0 },
  { day: "Wed", hours: 6.5 },
  { day: "Thu", hours: 8.25 },
  { day: "Fri", hours: 7.0 },
  { day: "Sat", hours: 1.0 },
  { day: "Sun", hours: 0 },
];

export interface QuickCard {
  label: string;
  value: string;
  icon: string;
  path: string;
}

export const SYNTHETIC_QUICK_CARDS: QuickCard[] = [
  { label: "Start timer", value: "Track time now", icon: "Timer", path: "/app/time-tracker" },
  { label: "Submit timesheet", value: "Week 43 ready", icon: "FileText", path: "/app/timesheets" },
  { label: "View reports", value: "Weekly summary", icon: "BarChart3", path: "/app/reports" },
  { label: "Manage team", value: "5 members", icon: "Users", path: "/app/team" },
];
