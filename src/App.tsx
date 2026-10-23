import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { LandingPage } from "./pages/public/LandingPage";
import { AboutPage } from "./pages/public/AboutPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/app/DashboardPage";
import { OnboardingPage } from "./pages/app/OnboardingPage";
import {
  TimeTrackerPreview, AttendancePreview, TimesheetsPreview,
  TeamPreview, ProjectsPreview, ClientsPreview,
  BillingPreview, ReportsPreview, SettingsPreview,
} from "./pages/app/PreviewPages";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Auth — redirect to app if already signed in */}
          <Route path="/signin" element={
            <PublicOnlyRoute><SignInPage /></PublicOnlyRoute>
          } />
          <Route path="/signup" element={
            <PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>
          } />

          {/* Onboarding — authenticated users without organizations */}
          <Route path="/onboarding" element={
            <ProtectedRoute><OnboardingPage /></ProtectedRoute>
          } />

          {/* App shell — protected + org provider */}
          <Route path="/app" element={
            <ProtectedRoute>
              <OrganizationProvider>
                <AppLayout />
              </OrganizationProvider>
            </ProtectedRoute>
          }>
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
      </AuthProvider>
    </ThemeProvider>
  );
}
