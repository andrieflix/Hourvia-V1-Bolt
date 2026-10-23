import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from "lucide-react";
import { Logo, Button, Input } from "../../components/ui";
import { ThemeSelector } from "../../components/ui/ThemeSelector";
import { useAuth } from "../../contexts/AuthContext";
import { signUpSchema } from "../../lib/validation";

type SignUpFormData = {
  displayName: string;
  email: string;
  password: string;
  organizationName: string;
};

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SignUpFormData>({
    displayName: "", email: "", password: "", organizationName: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = signUpSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignUpFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignUpFormData;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.displayName);
    setSubmitting(false);
    if (error) {
      setFormError(error);
    } else {
      navigate("/app", { replace: true });
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
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <Logo size={48} showText={false} />
            <h1 className="mt-4 text-2xl font-bold" style={{ color: "var(--color-text)" }}>Create your account</h1>
            <p className="mt-2 text-sm text-muted">Start tracking time with Hourvia</p>
          </div>
          <div className="surface rounded-2xl shadow-elevated p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full name"
                type="text"
                placeholder="Jane Smith"
                value={data.displayName}
                onChange={(e) => setData({ ...data, displayName: e.target.value })}
                error={errors.displayName}
                icon={<User className="w-4 h-4" />}
                autoComplete="name"
                disabled={submitting}
              />
              <Input
                label="Organization name"
                type="text"
                placeholder="Acme Inc. or Jane Smith Consulting"
                value={data.organizationName}
                onChange={(e) => setData({ ...data, organizationName: e.target.value })}
                error={errors.organizationName}
                icon={<User className="w-4 h-4" />}
                disabled={submitting}
              />
              <div className="flex items-start gap-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 px-3 py-2 text-xs text-teal-700 dark:text-teal-300">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Your organization will be created after sign-up. You'll be the OWNER.</span>
              </div>
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
                autoComplete="new-password"
                disabled={submitting}
              />
              {formError && (
                <div className="flex items-start gap-2 rounded-lg bg-error-50 dark:bg-error-900/30 px-3 py-2.5 text-sm text-error-700 dark:text-error-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <Button type="submit" fullWidth size="lg" disabled={submitting}>
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link to="/signin" className="text-teal-500 hover:text-teal-600 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
