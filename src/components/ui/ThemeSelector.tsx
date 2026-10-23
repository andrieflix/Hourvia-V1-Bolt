import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

type Theme = "light" | "dark" | "system";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const CurrentIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-4 h-4" style={{ color: "var(--color-text)" }} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-40 surface rounded-lg shadow-elevated py-1 z-50 animate-scale-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTheme(opt.value);
                setOpen(false);
              }}
              className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
              style={{ color: "var(--color-text)" }}
            >
              <div className="flex items-center gap-2.5">
                <opt.icon className="w-4 h-4 text-muted" />
                {opt.label}
              </div>
              {theme === opt.value && <Check className="w-3.5 h-3.5 text-teal-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
