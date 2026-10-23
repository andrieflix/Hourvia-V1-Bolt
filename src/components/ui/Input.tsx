import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${icon ? "pl-10" : ""} ${error ? "border-error-400" : "border-navy-200 dark:border-navy-700"} bg-transparent ${className}`}
            style={{ color: "var(--color-text)" }}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
