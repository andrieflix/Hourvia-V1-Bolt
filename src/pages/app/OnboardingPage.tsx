import { Building2, Plus, AlertCircle } from "lucide-react";
import { Logo, Button, Card, Badge } from "../../components/ui";
import { ThemeSelector } from "../../components/ui/ThemeSelector";
import { useAuth } from "../../contexts/AuthContext";

export function OnboardingPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Logo />
        <ThemeSelector />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 mb-4">
              <Building2 className="w-8 h-8 text-teal-500" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              Welcome to Hourvia
            </h1>
            <p className="mt-2 text-sm text-muted">
              {user?.email ? `Signed in as ${user.email}` : "You're signed in"}
            </p>
          </div>
          <Card className="p-8">
            <div className="flex flex-col items-center text-center">
              <Badge variant="preview" className="mb-4">Schema pending approval</Badge>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                Organization setup is almost ready
              </h2>
              <p className="text-sm text-muted leading-relaxed max-w-sm">
                The database schema for organizations and memberships is designed but pending
                operator approval. Once approved, you'll be able to create your first organization
                and start tracking time.
              </p>
              <div className="mt-6 flex items-start gap-2 rounded-lg bg-warning-50 dark:bg-warning-900/30 px-3 py-2.5 text-sm text-warning-700 dark:text-warning-300 text-left max-w-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Organization creation requires the approved database schema. No live organization
                  mutations are active yet.
                </span>
              </div>
              <div className="mt-6 w-full space-y-3">
                <Button fullWidth size="lg" disabled>
                  <Plus className="w-4 h-4" /> Create organization
                </Button>
                <Button fullWidth variant="outline" onClick={() => signOut()}>
                  Sign out
                </Button>
              </div>
            </div>
          </Card>
          <p className="mt-4 text-center text-xs text-muted">
            Hourvia by Living IT Solutions — Time tracked. Progress made.
          </p>
        </div>
      </div>
    </div>
  );
}
