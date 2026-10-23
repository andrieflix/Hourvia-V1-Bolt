import { Shield, Users, Target, Eye, Layers, Lock } from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Badge } from "../../components/ui";

export function AboutPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <Badge variant="preview" className="mb-4">About</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: "var(--color-text)" }}>
          Hourvia by Living IT Solutions
        </h1>
        <p className="text-xl text-muted leading-relaxed">
          Time tracked. Progress made.
        </p>
      </section>

      <section className="surface border-y">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 mt-1">
              <Target className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text)" }}>Mission</h2>
              <p className="text-base text-muted leading-relaxed">
                Hourvia exists to make workforce time-tracking clear, fair, and privacy-conscious.
                We believe that when people understand where their time goes, they make better
                decisions — individually and as organizations. Our mission is to provide that
                clarity without surveillance theater.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 mt-1">
              <Users className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text)" }}>Intended audiences</h2>
              <ul className="space-y-2 text-base text-muted leading-relaxed">
                <li>• <span style={{ color: "var(--color-text)" }}>Businesses</span> managing employee time, attendance, and project allocation</li>
                <li>• <span style={{ color: "var(--color-text)" }}>Teams and agencies</span> tracking billable hours across clients and projects</li>
                <li>• <span style={{ color: "var(--color-text)" }}>Independent consultants</span> who need professional time tracking for solo practices</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 mt-1">
              <Layers className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text)" }}>Platform capabilities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {capabilities.map((cap) => (
                  <div key={cap} className="surface rounded-lg px-4 py-3 text-sm" style={{ color: "var(--color-text)" }}>
                    {cap}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Shield className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text)" }}>Privacy-conscious workforce management</h2>
              <p className="text-base text-muted leading-relaxed">
                Hourvia is designed with a privacy-first approach. Employee activity monitoring,
                covert tracking, and surveillance features are explicitly outside the initial MVP.
                We believe time tracking should be transparent — employees know what is tracked,
                and organizations get the insights they need without overreach.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-500" />
                <span className="text-sm text-muted">No covert employee monitoring in the MVP</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-500" />
                <span className="text-sm text-muted">Transparent tracking — employees see what is recorded</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

const capabilities = [
  "Organization-scoped time tracking",
  "Role-based access control",
  "Multi-organization membership",
  "Project and client management",
  "Timesheet submission and approval",
  "Attendance tracking",
  "Billable hours and rate cards",
  "Visual reports and analytics",
  "Server-enforced tenant isolation",
  "UTC timestamps and precise durations",
  "Audit-friendly operation records",
  "Light, dark, and system themes",
];
