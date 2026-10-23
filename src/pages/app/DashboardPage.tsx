import { Link } from "react-router-dom";
import { Clock, Calendar, DollarSign, FileText, ArrowRight, Timer, ChartBar as BarChart3, Users, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardBody, Badge } from "../../components/ui";
import {
  SYNTHETIC_STATS, SYNTHETIC_ACTIVITY, SYNTHETIC_TEAM,
  SYNTHETIC_WEEK_DATA, SYNTHETIC_QUICK_CARDS
} from "../../data/synthetic";
import { formatHoursDecimal } from "../../domain/time";
import { useAuth } from "../../contexts/AuthContext";
import { useOrganization } from "../../contexts/OrganizationContext";

export function DashboardPage() {
  const { user } = useAuth();
  const { activeOrganization } = useOrganization();
  const maxHours = Math.max(...SYNTHETIC_WEEK_DATA.map((d) => d.hours));

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.email ? user.email.split("@")[0] : "there");
  const orgName = activeOrganization?.name ?? "your organization";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Overview</h1>
            <Badge variant="preview">Synthetic data</Badge>
          </div>
          <p className="text-sm text-muted mt-0.5">Welcome back, {displayName}. Here's your week at a glance in {orgName}.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's tracked time"
          value={formatHoursDecimal(SYNTHETIC_STATS.todayMs)}
          icon={<Clock className="w-5 h-5" />}
          color="teal"
        />
        <StatCard
          label="Weekly tracked hours"
          value={formatHoursDecimal(SYNTHETIC_STATS.weekMs)}
          icon={<Calendar className="w-5 h-5" />}
          color="accent"
          trend="+12% vs last week"
        />
        <StatCard
          label="Billable hours"
          value={formatHoursDecimal(SYNTHETIC_STATS.billableMs)}
          icon={<DollarSign className="w-5 h-5" />}
          color="success"
          trend="84% billable"
        />
        <StatCard
          label="Pending timesheets"
          value={String(SYNTHETIC_STATS.pendingTimesheets)}
          icon={<FileText className="w-5 h-5" />}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly activity chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly activity" subtitle="Hours tracked per day" />
          <CardBody>
            <div className="flex items-end justify-between gap-3 h-48 mt-4">
              {SYNTHETIC_WEEK_DATA.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-medium text-muted">
                    {d.hours > 0 ? d.hours.toFixed(1) : ""}
                  </div>
                  <div className="w-full flex items-end h-32">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 transition-all duration-300 hover:from-teal-500 hover:to-teal-300"
                      style={{ height: `${(d.hours / maxHours) * 100}%`, minHeight: d.hours > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <span className="text-xs text-muted">{d.day}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Team overview */}
        <Card>
          <CardHeader
            title="Team overview"
            subtitle="5 members"
            action={<Badge variant="preview">Preview</Badge>}
          />
          <CardBody className="space-y-3">
            {SYNTHETIC_TEAM.slice(0, 4).map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-navy-200 dark:bg-navy-700 flex items-center justify-center text-xs font-semibold text-navy-600 dark:text-navy-200">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>{member.name}</div>
                  <div className="text-xs text-muted">{member.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{member.weekHours}</div>
                  <div className={`text-xs ${member.status === "active" ? "text-success-500" : member.status === "idle" ? "text-warning-500" : "text-muted"}`}>
                    {member.status}
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" subtitle="Latest team time entries" />
          <CardBody className="space-y-1">
            {SYNTHETIC_ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center text-xs font-semibold text-muted">
                  {item.user.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--color-text)" }}>
                    <span className="font-medium">{item.user}</span>{" "}
                    <span className="text-muted">{item.action}</span>{" "}
                    <span className="font-medium">{item.project}</span>
                  </p>
                  <p className="text-xs text-muted mt-0.5">{item.time}</p>
                </div>
                <Badge variant={item.duration === "running" ? "success" : "default"}>
                  {item.duration}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Quick navigation */}
        <Card>
          <CardHeader title="Quick actions" subtitle="Jump to a section" />
          <CardBody className="space-y-2">
            {SYNTHETIC_QUICK_CARDS.map((card) => (
              <Link
                key={card.path}
                to={card.path}
                className="flex items-center justify-between rounded-lg p-3 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center">
                    {card.icon === "Timer" && <Timer className="w-4 h-4 text-teal-500" />}
                    {card.icon === "FileText" && <FileText className="w-4 h-4 text-teal-500" />}
                    {card.icon === "BarChart3" && <BarChart3 className="w-4 h-4 text-teal-500" />}
                    {card.icon === "Users" && <Users className="w-4 h-4 text-teal-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{card.label}</div>
                    <div className="text-xs text-muted">{card.value}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-teal-500 transition-colors" />
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <p className="text-xs text-muted text-center pt-4">
        All data shown is synthetic demonstration data — not real account records.
      </p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "teal" | "accent" | "success" | "warning";
  trend?: string;
}

function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    teal: "bg-teal-50 dark:bg-teal-950 text-teal-500",
    accent: "bg-accent-50 dark:bg-accent-950 text-accent-500",
    success: "bg-success-50 dark:bg-success-950 text-success-500",
    warning: "bg-warning-50 dark:bg-warning-950 text-warning-500",
  };

  return (
    <Card hoverable className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-success-500">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{value}</div>
      <div className="text-sm text-muted mt-1">{label}</div>
    </Card>
  );
}
