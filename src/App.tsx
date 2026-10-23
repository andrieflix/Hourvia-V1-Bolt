import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LandingPage } from "./pages/public/LandingPage";
import { AboutPage } from "./pages/public/AboutPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/app/DashboardPage";
import {
  TimeTrackerPreview, AttendancePreview, TimesheetsPreview,
  TeamPreview, ProjectsPreview, ClientsPreview,
  BillingPreview, ReportsPreview, SettingsPreview,
} from "./pages/app/PreviewPages";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Auth (UI-only) */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* App shell */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="time-tracker" element={<TimeTrackerPreview />} />
          <Route path="attendance" element={<AttendancePreview />} />
          <Route path="timesheets" element={<TimesheetsPreview />} />
          <Route path="team" element={<TeamPreview />} />
          <Route path="projects" element={<ProjectsPreview />} />
          <Route path="clients" element={<ClientsPreview />} />
          <Route path="billing" element={<BillingPreview />} />
          <Route path="reports" element={<ReportsPreview />} />
          <Route path="settings" element={<SettingsPreview />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
