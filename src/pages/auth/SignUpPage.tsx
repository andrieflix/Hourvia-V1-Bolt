import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, CircleAlert as AlertCircle } from "lucide-react";
import { z } from "zod";
import { Logo, Button, Input } from "../../components/ui";
import { ThemeSelector } from "../../components/ui/ThemeSelector";

const signUpSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpPage() {
  const [data, setData] = useState<SignUpFormData>({
    displayName: "", email: "", password: "", organizationName: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
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
    setFormError("Authentication is not yet activated. This is a UI preview only.");
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
              />
              <Input
                label="Organization name"
                type="text"
                placeholder="Acme Inc. or Jane Smith Consulting"
                value={data.organizationName}
                onChange={(e) => setData({ ...data, organizationName: e.target.value })}
                error={errors.organizationName}
                icon={<User className="w-4 h-4" />}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                error={errors.email}
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
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
              />
              {formError && (
                <div className="flex items-start gap-2 rounded-lg bg-warning-50 dark:bg-warning-900/30 px-3 py-2.5 text-sm text-warning-700 dark:text-warning-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <Button type="submit" fullWidth size="lg">Create account</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link to="/signin" className="text-teal-500 hover:text-teal-600 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            Authentication is UI-only until the Bolt authentication integration is reviewed and activated.
          </p>
        </div>
      </div>
    </div>
  );
}
