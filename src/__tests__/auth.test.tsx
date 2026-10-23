import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute";
import { SignInPage } from "../pages/auth/SignInPage";

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

function renderWithProviders(initialRoute: string, routes: React.ReactElement) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>{routes}</AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Protected routes", () => {
  it("redirects to /signin when unauthenticated", async () => {
    const { container } = renderWithProviders(
      "/app",
      <Routes>
        <Route path="/app" element={
          <ProtectedRoute><div>Protected content</div></ProtectedRoute>
        } />
        <Route path="/signin" element={<div>Sign in page</div>} />
      </Routes>
    );
    await waitFor(() => {
      expect(container.textContent).toContain("Sign in page");
    });
    expect(container.textContent).not.toContain("Protected content");
  });

  it("shows loading state initially", () => {
    const { container } = renderWithProviders(
      "/app",
      <Routes>
        <Route path="/app" element={
          <ProtectedRoute><div>Protected content</div></ProtectedRoute>
        } />
        <Route path="/signin" element={<div>Sign in page</div>} />
      </Routes>
    );
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });
});

describe("PublicOnlyRoute", () => {
  it("renders auth page when unauthenticated after loading", async () => {
    const { container } = renderWithProviders(
      "/signin",
      <Routes>
        <Route path="/signin" element={
          <PublicOnlyRoute><div>Sign in page</div></PublicOnlyRoute>
        } />
        <Route path="/app" element={<div>App page</div>} />
      </Routes>
    );
    await waitFor(() => {
      expect(container.textContent).toContain("Sign in page");
    });
  });
});

describe("Auth validation schemas", () => {
  it("signInSchema rejects invalid email", async () => {
    const { signInSchema } = await import("../lib/validation");
    const result = signInSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("signInSchema rejects short password", async () => {
    const { signInSchema } = await import("../lib/validation");
    const result = signInSchema.safeParse({ email: "test@example.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("signInSchema accepts valid input", async () => {
    const { signInSchema } = await import("../lib/validation");
    const result = signInSchema.safeParse({ email: "test@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("signUpSchema rejects short display name", async () => {
    const { signUpSchema } = await import("../lib/validation");
    const result = signUpSchema.safeParse({
      displayName: "A",
      email: "test@example.com",
      password: "password123",
      organizationName: "Acme Inc",
    });
    expect(result.success).toBe(false);
  });

  it("signUpSchema rejects short org name", async () => {
    const { signUpSchema } = await import("../lib/validation");
    const result = signUpSchema.safeParse({
      displayName: "Jane Smith",
      email: "test@example.com",
      password: "password123",
      organizationName: "A",
    });
    expect(result.success).toBe(false);
  });

  it("signUpSchema accepts valid input", async () => {
    const { signUpSchema } = await import("../lib/validation");
    const result = signUpSchema.safeParse({
      displayName: "Jane Smith",
      email: "test@example.com",
      password: "password123",
      organizationName: "Acme Inc",
    });
    expect(result.success).toBe(true);
  });

  it("forgotPasswordSchema rejects invalid email", async () => {
    const { forgotPasswordSchema } = await import("../lib/validation");
    const result = forgotPasswordSchema.safeParse({ email: "invalid" });
    expect(result.success).toBe(false);
  });

  it("forgotPasswordSchema accepts valid email", async () => {
    const { forgotPasswordSchema } = await import("../lib/validation");
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });
});

describe("SignInPage renders", () => {
  it("renders the sign-in form", async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      "/signin",
      <Routes>
        <Route path="/signin" element={
          <PublicOnlyRoute><SignInPage /></PublicOnlyRoute>
        } />
        <Route path="/app" element={<div>App</div>} />
      </Routes>
    );
    await waitFor(() => {
      expect(getByText("Welcome back")).toBeTruthy();
    });
    expect(getByPlaceholderText("you@company.com")).toBeTruthy();
  });
});
