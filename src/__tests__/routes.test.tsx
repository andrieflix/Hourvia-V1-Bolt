import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import { OrganizationProvider } from "../contexts/OrganizationContext";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardPage } from "../pages/app/DashboardPage";
import { TimeTrackerPreview } from "../pages/app/PreviewPages";
import { Logo } from "../components/ui/Logo";

vi.mock("../lib/supabase", () => {
  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  };
  return {
    supabase: {
      auth: mockAuth,
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    },
  };
});

function renderWithProviders(initialRoute: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <OrganizationProvider>
            <Routes>
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="time-tracker" element={<TimeTrackerPreview />} />
              </Route>
              <Route path="/onboarding" element={<div>Onboarding</div>} />
              <Route path="/signin" element={<div>Sign in</div>} />
            </Routes>
          </OrganizationProvider>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe("Route rendering", () => {
  it("renders onboarding page when no organizations (tables not yet created)", async () => {
    const { container } = renderWithProviders("/app");
    await waitFor(() => {
      expect(container.textContent).toContain("Onboarding");
    });
  });

  it("redirects to onboarding from time-tracker when no orgs", async () => {
    const { container } = renderWithProviders("/app/time-tracker");
    await waitFor(() => {
      expect(container.textContent).toContain("Onboarding");
    });
  });
});

describe("Logo", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ThemeProvider>
        <Logo />
      </ThemeProvider>
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
