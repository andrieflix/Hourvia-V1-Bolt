import { NavLink } from "react-router-dom";
import { Logo } from "../ui/Logo";
import { Badge } from "../ui/Badge";
import { NAV_ITEMS } from "../../config/navigation";
import { X } from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`sidebar-bg fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-16" : "w-64"}`}
      >
        <div className={`flex items-center h-16 border-b border-white/5 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? (
            <Logo size={32} showText={false} />
          ) : (
            <>
              <Logo />
              <button
                onClick={onCloseMobile}
                className="lg:hidden text-navy-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
          <ul className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/app"}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-teal-500/10 text-teal-400"
                          : "text-navy-300 hover:bg-white/5 hover:text-white"
                      } ${collapsed ? "justify-center" : ""}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && (
                      <span className="flex items-center gap-2 flex-1">
                        {item.label}
                        {item.preview && (
                          <Badge variant="preview" className="text-[10px] px-1.5 py-0">
                            Preview
                          </Badge>
                        )}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {!collapsed && (
          <div className="border-t border-white/5 p-4">
            <p className="text-xs text-navy-400">Hourvia v0.1.0</p>
            <p className="text-xs text-navy-500 mt-1">Time tracked. Progress made.</p>
          </div>
        )}
      </aside>
    </>
  );
}
