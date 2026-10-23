import { Timer, CalendarCheck, FileText, Users, FolderKanban, Briefcase, DollarSign, ChartBar as BarChart3, Settings } from "lucide-react";
import { PreviewPage } from "../../components/PreviewPage";

export function TimeTrackerPreview() {
  return (
    <PreviewPage
      title="Time Tracker"
      description="Start and stop timers, log manual entries against projects and clients."
      icon={<Timer className="w-7 h-7 text-teal-500" />}
    />
  );
}

export function AttendancePreview() {
  return (
    <PreviewPage
      title="Attendance"
      description="Track presence and absence with privacy-conscious workforce management."
      icon={<CalendarCheck className="w-7 h-7 text-teal-500" />}
    />
  );
}

export function TimesheetsPreview() {
  return (
    <PreviewPage
      title="Timesheets"
      description="Submit, review, and approve weekly timesheets with a clear workflow."
      icon={<FileText className="w-7 h-7 text-teal-500" />}
    />
  );
}

export function TeamPreview() {
  return (
    <PreviewPage
      title="Team"
      description="Manage members, roles, and permissions across your organization."
      icon={<Users className="w-7 h-7 text-teal-500" />}
    />
  );
}

export function ProjectsPreview() {
  return (
    <PreviewPage
      title="Projects"
      description="Create and manage projects, assign team members, and track progress."
      icon={<FolderKanban className="w-7 h-7 text-teal-500" />}
    />
  );
}

export function ClientsPreview() {
  return (
    <PreviewPage
      title="Clients"
      description="Manage client records, contacts, and billing relationships."
      icon={<Briefcase className="w-7 h-7 text-teal-500" />}
    />
  );
}

export function BillingPreview() {
  return (
    <PreviewPage
      title="Billing"
      description="Track billable hours, manage rate cards, and understand revenue."
      icon={<DollarSign className="w-7 h-7 text-teal-500" />}
    />
  );
}

export function ReportsPreview() {
  return (
    <PreviewPage
      title="Reports"
      description="Visual reports for tracked hours, billable time, and team activity."
      icon={<BarChart3 className="w-7 h-7 text-teal-500" />}
    />
  );
}

export function SettingsPreview() {
  return (
    <PreviewPage
      title="Settings"
      description="Configure your organization, roles, integrations, and preferences."
      icon={<Settings className="w-7 h-7 text-teal-500" />}
    />
  );
}
