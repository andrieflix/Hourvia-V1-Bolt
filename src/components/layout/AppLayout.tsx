import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Breadcrumbs } from "./Breadcrumbs";
import { useOrganization } from "../../contexts/OrganizationContext";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { organizations, loading, error } = useOrganization();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <p className="text-sm text-muted">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            Something went wrong
          </p>
          <p className="text-sm text-muted">
            We couldn't load your organizations. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          collapsed={collapsed}
        />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
