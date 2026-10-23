import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, LogOut, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.email ? user.email.split("@")[0] : "User");
  const email = user?.email ?? "";

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 px-2 py-1.5 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold">
          {getInitials(displayName)}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{displayName}</div>
          <div className="text-xs text-muted truncate max-w-[140px]">{email}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 surface rounded-lg shadow-elevated py-1 z-50 animate-scale-in">
          <div className="px-3 py-2 border-b">
            <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>{displayName}</div>
            <div className="text-xs text-muted truncate">{email}</div>
          </div>
          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
            style={{ color: "var(--color-text)" }}
          >
            <User className="w-4 h-4 text-muted" /> Profile
          </button>
          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
            style={{ color: "var(--color-text)" }}
            onClick={() => { setOpen(false); navigate("/app/settings"); }}
          >
            <SettingsIcon className="w-4 h-4 text-muted" /> Settings
          </button>
          <div className="border-t" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors text-error-500"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
