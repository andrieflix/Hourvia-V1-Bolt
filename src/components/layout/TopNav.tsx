import { Menu, Search, PanelLeftClose, PanelLeft } from "lucide-react";
import { ThemeSelector } from "../ui/ThemeSelector";
import { OrgSelector } from "./OrgSelector";
import { UserMenu } from "./UserMenu";

interface TopNavProps {
  onToggleMobile: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}

export function TopNav({ onToggleMobile, onToggleCollapse, collapsed }: TopNavProps) {
  return (
    <header className="sticky top-0 z-20 surface border-b h-16 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
        >
          <Menu className="w-5 h-5" style={{ color: "var(--color-text)" }} />
        </button>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
        >
          {collapsed ? <PanelLeft className="w-5 h-5" style={{ color: "var(--color-text)" }} /> : <PanelLeftClose className="w-5 h-5" style={{ color: "var(--color-text)" }} />}
        </button>
        <OrgSelector />
      </div>

      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-transparent pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            style={{ color: "var(--color-text)" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeSelector />
        <UserMenu />
      </div>
    </header>
  );
}
