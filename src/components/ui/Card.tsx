import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = "", onClick, hoverable = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`surface rounded-xl shadow-card ${hoverable ? "transition-shadow hover:shadow-card-hover cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between px-5 pt-5 ${className}`}>
      <div>
        <h3 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
