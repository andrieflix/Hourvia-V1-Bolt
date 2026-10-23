import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, Check } from "lucide-react";
import { Badge } from "../ui/Badge";

interface OrgOption {
  id: string;
  name: string;
  role: string;
}

const SYNTHETIC_ORGS: OrgOption[] = [
  { id: "org-1", name: "Acme Studios", role: "OWNER" },
  { id: "org-2", name: "Northwind Consulting", role: "MANAGER" },
];

export function OrgSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OrgOption>(SYNTHETIC_ORGS[0]);
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
        className="flex items-center gap-2 rounded-lg surface px-3 py-2 text-sm font-medium hover:shadow-card transition-shadow max-w-[200px]"
      >
        <Building2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
        <span className="truncate" style={{ color: "var(--color-text)" }}>{selected.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-11 left-0 w-72 surface rounded-lg shadow-elevated py-1 z-50 animate-scale-in">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-medium text-muted">Organizations</p>
          </div>
          {SYNTHETIC_ORGS.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                setSelected(org);
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
              {selected.id === org.id && <Check className="w-4 h-4 text-teal-500" />}
            </button>
          ))}
          <div className="border-t px-3 py-2">
            <Badge variant="preview">Preview — switching is not active</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
