import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardPage } from "../pages/app/DashboardPage";
import { TimeTrackerPreview } from "../pages/app/PreviewPages";
import { Logo } from "../components/ui/Logo";

function renderWithRouter(initialRoute: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="time-tracker" element={<TimeTrackerPreview />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe("Route rendering", () => {
  it("renders dashboard at /app", () => {
    const { getAllByText } = renderWithRouter("/app");
    expect(getAllByText("Overview").length).toBeGreaterThan(0);
  });

  it("renders time tracker preview at /app/time-tracker", () => {
    const { getAllByText, getByText } = renderWithRouter("/app/time-tracker");
    expect(getAllByText("Time Tracker").length).toBeGreaterThan(0);
    expect(getByText("This section is a preview")).toBeTruthy();
  });

  it("renders synthetic data label on dashboard", () => {
    const { getByText } = renderWithRouter("/app");
    expect(getByText("Synthetic data")).toBeTruthy();
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
