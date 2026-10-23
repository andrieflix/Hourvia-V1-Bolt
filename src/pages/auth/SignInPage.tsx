import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, ArrowLeft, CircleAlert as AlertCircle } from "lucide-react";
import { Logo, Button, Input } from "../../components/ui";
import { ThemeSelector } from "../../components/ui/ThemeSelector";
import { useAuth } from "../../contexts/AuthContext";
import { signInSchema } from "../../lib/validation";

type SignInFormData = {
  email: string;
  password: string;
};

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<SignInFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof SignInFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = signInSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignInFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignInFormData;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setSubmitting(false);
    if (error) {
      setFormError(error);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted hover:text-teal-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <ThemeSelector />
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <Logo size={48} showText={false} />
            <h1 className="mt-4 text-2xl font-bold" style={{ color: "var(--color-text)" }}>Welcome back</h1>
            <p className="mt-2 text-sm text-muted">Sign in to your Hourvia account</p>
          </div>
          <div className="surface rounded-2xl shadow-elevated p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                error={errors.email}
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                disabled={submitting}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                error={errors.password}
                icon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                disabled={submitting}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="checkbox" className="rounded border-navy-300 text-teal-500 focus:ring-teal-400" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-teal-500 hover:text-teal-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              {formError && (
                <div className="flex items-start gap-2 rounded-lg bg-error-50 dark:bg-error-900/30 px-3 py-2.5 text-sm text-error-700 dark:text-error-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <Button type="submit" fullWidth size="lg" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              Don't have an account?{" "}
              <Link to="/signup" className="text-teal-500 hover:text-teal-600 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
