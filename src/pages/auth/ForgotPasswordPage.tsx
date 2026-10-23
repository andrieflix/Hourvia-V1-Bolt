import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Loader2 } from "lucide-react";
import { Logo, Button, Input } from "../../components/ui";
import { ThemeSelector } from "../../components/ui/ThemeSelector";
import { useAuth } from "../../contexts/AuthContext";
import { forgotPasswordSchema } from "../../lib/validation";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(undefined);
    setSubmitting(true);
    const { error: authError } = await resetPassword(email);
    setSubmitting(false);
    if (authError) {
      setError(authError);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted hover:text-teal-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <ThemeSelector />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <Logo size={48} showText={false} />
            <h1 className="mt-4 text-2xl font-bold" style={{ color: "var(--color-text)" }}>Reset your password</h1>
            <p className="mt-2 text-sm text-muted">We'll send you a link to reset your password</p>
          </div>
          <div className="surface rounded-2xl shadow-elevated p-8">
            {submitted ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-4" />
                <p className="text-sm text-muted">
                  If an account exists for <span className="font-medium" style={{ color: "var(--color-text)" }}>{email}</span>,
                  you'll receive a password reset link shortly.
                </p>
                <Link to="/signin" className="mt-6 inline-block">
                  <Button variant="outline">Back to sign in</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  icon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                  disabled={submitting}
                />
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-error-50 dark:bg-error-900/30 px-3 py-2.5 text-sm text-error-700 dark:text-error-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <Button type="submit" fullWidth size="lg" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending reset link…</>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            )}
            {!submitted && (
              <p className="mt-6 text-center text-sm text-muted">
                Remember your password?{" "}
                <Link to="/signin" className="text-teal-500 hover:text-teal-600 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
