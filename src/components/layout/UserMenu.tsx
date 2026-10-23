import { useState, useRef, useEffect } from "react";
import { ChevronDown, User, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Badge } from "../ui/Badge";

export function UserMenu() {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 px-2 py-1.5 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold">
          JS
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Jane Smith</div>
          <div className="text-xs text-muted">jane@acme.co</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 surface rounded-lg shadow-elevated py-1 z-50 animate-scale-in">
          <div className="px-3 py-2 border-b">
            <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Jane Smith</div>
            <div className="text-xs text-muted">jane@acme.co</div>
            <div className="mt-1.5">
              <Badge variant="preview">Preview</Badge>
            </div>
          </div>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors" style={{ color: "var(--color-text)" }}>
            <User className="w-4 h-4 text-muted" /> Profile
          </button>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors" style={{ color: "var(--color-text)" }}>
            <SettingsIcon className="w-4 h-4 text-muted" /> Settings
          </button>
          <div className="border-t" />
          <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors text-error-500">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
