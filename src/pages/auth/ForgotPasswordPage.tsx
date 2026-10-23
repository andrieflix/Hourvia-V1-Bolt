import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from "lucide-react";
import { z } from "zod";
import { Logo, Button, Input } from "../../components/ui";
import { ThemeSelector } from "../../components/ui/ThemeSelector";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = forgotSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(undefined);
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
                <p className="mt-4 text-xs text-muted">
                  Password reset is UI-only until authentication is activated.
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
                />
                <div className="flex items-start gap-2 rounded-lg bg-warning-50 dark:bg-warning-900/30 px-3 py-2.5 text-sm text-warning-700 dark:text-warning-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Password reset is UI-only until authentication is activated.</span>
                </div>
                <Button type="submit" fullWidth size="lg">Send reset link</Button>
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
