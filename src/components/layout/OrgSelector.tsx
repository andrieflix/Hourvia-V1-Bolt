import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, Check, Plus } from "lucide-react";
import { Badge } from "../ui/Badge";
import { useOrganization } from "../../contexts/OrganizationContext";

export function OrgSelector() {
  const { organizations, activeOrganization, switchOrganization, loading } = useOrganization();
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg surface px-3 py-2 text-sm">
        <Building2 className="w-4 h-4 text-muted flex-shrink-0" />
        <span className="text-muted">Loading…</span>
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="flex items-center gap-2 rounded-lg surface px-3 py-2 text-sm">
        <Building2 className="w-4 h-4 text-muted flex-shrink-0" />
        <span className="text-muted">No organization</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg surface px-3 py-2 text-sm font-medium hover:shadow-card transition-shadow max-w-[200px]"
      >
        <Building2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
        <span className="truncate" style={{ color: "var(--color-text)" }}>{activeOrganization.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-11 left-0 w-72 surface rounded-lg shadow-elevated py-1 z-50 animate-scale-in">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-medium text-muted">Organizations</p>
          </div>
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                switchOrganization(org.id);
                setOpen(false);
              }}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-muted" />
                <div className="text-left">
                  <div style={{ color: "var(--color-text)" }}>{org.name}</div>
                  <div className="text-xs text-muted">{org.role}</div>
                </div>
              </div>
              {activeOrganization.id === org.id && <Check className="w-4 h-4 text-teal-500" />}
            </button>
          ))}
          <div className="border-t px-3 py-2">
            <button
              className="flex items-center gap-2 w-full text-sm text-teal-500 hover:text-teal-600 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Plus className="w-4 h-4" /> New organization
            </button>
          </div>
          {organizations.length > 1 && (
            <div className="border-t px-3 py-2">
              <Badge variant="preview">Switching changes your active context</Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
