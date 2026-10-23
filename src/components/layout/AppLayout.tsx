import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
