import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "preview";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200",
  success: "bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300",
  warning: "bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300",
  error: "bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300",
  info: "bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300",
  preview: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
