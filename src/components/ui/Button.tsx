import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-teal-500 hover:bg-teal-600 text-white shadow-sm",
  secondary: "bg-navy-700 hover:bg-navy-600 text-white shadow-sm",
  ghost: "hover:bg-navy-100 dark:hover:bg-navy-800 text-muted hover:text-navy-900 dark:hover:text-white",
  danger: "bg-error-500 hover:bg-error-600 text-white shadow-sm",
  outline: "border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
