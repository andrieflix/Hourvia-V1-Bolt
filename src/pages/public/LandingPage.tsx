import { Link } from "react-router-dom";
import { Clock, Users, ChartBar as BarChart3, FileText, Calendar, DollarSign, ArrowRight, Check, Timer } from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button, Badge } from "../../components/ui";

export function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, #0d9d9d 0%, transparent 40%), radial-gradient(circle at 80% 70%, #3366ff 0%, transparent 40%)"
        }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <Badge variant="preview" className="mb-6">
              <Timer className="w-3 h-3" /> Now in development
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Time tracked.
              <span className="block text-teal-400">Progress made.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-navy-300 max-w-2xl leading-relaxed">
              Hourvia is an organization-first workforce time-tracking platform for businesses,
              teams, agencies, and independent consultants. Track time, manage attendance, and
              gain clarity on where your hours go.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" variant="primary">
                  Get started free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                  Learn more
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-navy-400">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-400" /> Organization-scoped</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-400" /> Role-based access</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-400" /> Privacy-conscious</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
            Everything your team needs to track time
          </h2>
          <p className="mt-4 text-lg text-muted">
            From individual contractors to large organizations, Hourvia scales with your workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how_it_works" className="surface border-y py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
              How Hourvia works
            </h2>
            <p className="mt-4 text-lg text-muted">
              Get up and running in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500 text-white font-bold text-lg mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text)" }}>{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6" style={{ color: "var(--color-text)" }}>
              Built for businesses, teams, and consultants
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Check className="w-5 h-5 text-teal-500" />
                  </div>
                  <span className="text-base" style={{ color: "var(--color-text)" }}>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface rounded-2xl p-8 shadow-elevated">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-sm text-muted">Today</span>
                <span className="text-2xl font-bold text-teal-500">7h 42m</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-sm text-muted">This week</span>
                <span className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>38h 15m</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-sm text-muted">Billable hours</span>
                <span className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>32h 00m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Pending timesheets</span>
                <span className="text-2xl font-bold text-warning-500">3</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-muted italic">Illustrative preview — not real account data.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 to-navy-800" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, #0d9d9d 0%, transparent 50%)"
        }} />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to track your time?
          </h2>
          <p className="mt-4 text-lg text-navy-300">
            Join Hourvia and start tracking time the smart way.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="primary">
                Get started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                Learn about Hourvia
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

const features = [
  { icon: Clock, title: "Time tracking", description: "Start and stop timers, log manual entries, and track time against projects and clients with precision." },
  { icon: Calendar, title: "Attendance", description: "Monitor presence and absence. Built with privacy-conscious workforce management in mind." },
  { icon: FileText, title: "Timesheets", description: "Submit, review, and approve weekly timesheets with a clear approval workflow." },
  { icon: Users, title: "Team management", description: "Organize members by role — owner, admin, manager, employee, contractor — with scoped access." },
  { icon: BarChart3, title: "Reports", description: "Gain insight into tracked hours, billable time, and team activity with visual reports." },
  { icon: DollarSign, title: "Billing", description: "Track billable hours and manage rate cards to understand the financial side of your time." },
];

const steps = [
  { title: "Create your organization", description: "Set up your organization in minutes. Consultants can create single-member orgs for solo tracking." },
  { title: "Invite your team", description: "Add members with roles that match their responsibilities — from owner to contractor." },
  { title: "Track and analyze", description: "Start tracking time, submit timesheets, and review reports to see where your hours go." },
];

const benefits = [
  "Multi-organization support — belong to multiple organizations and switch between them",
  "Role-based access control with server-enforced permissions",
  "Tenant isolation ensuring your organization's data stays yours",
  "Audit-friendly records with UTC timestamps and precise duration tracking",
  "Privacy-conscious by design — no covert employee monitoring in the MVP",
  "Professional reports for billing, payroll prep, and client transparency",
];

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Clock; title: string; description: string }) {
  return (
    <div className="surface rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-teal-50 dark:bg-teal-950 mb-4">
        <Icon className="w-5 h-5 text-teal-500" />
      </div>
      <h3 className="font-semibold text-base mb-2" style={{ color: "var(--color-text)" }}>{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}
