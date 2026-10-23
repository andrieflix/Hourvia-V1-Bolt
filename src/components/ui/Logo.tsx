interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 32, showText = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
        <rect width="64" height="64" rx="14" fill="#0d1521" />
        <circle cx="32" cy="32" r="20" stroke="#0d9d9d" strokeWidth="3.5" fill="none" />
        <path d="M32 20v12l8 5" stroke="#0d9d9d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="2.5" fill="#0d9d9d" />
      </svg>
      {showText && (
        <span className="font-bold text-lg tracking-tight" style={{ color: "var(--color-text)" }}>
          Hourvia
        </span>
      )}
    </div>
  );
}
