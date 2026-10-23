import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "../../config/navigation";

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs: { label: string; path: string }[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const navItem = NAV_ITEMS.find((item) => item.path === currentPath);
    if (navItem) {
      crumbs.push({ label: navItem.label, path: navItem.path });
    } else if (segment === "app") {
      crumbs.push({ label: "Overview", path: "/app" });
    } else {
      crumbs.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1), path: currentPath });
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <div key={crumb.path} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-muted">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-muted hover:text-teal-500 transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
