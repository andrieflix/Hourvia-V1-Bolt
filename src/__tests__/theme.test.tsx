import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("Theme behavior", () => {
  it("defaults to system theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("system");
  });

  it("resolves to light or dark", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(["light", "dark"]).toContain(result.current.resolvedTheme);
  });

  it("can switch to dark theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setTheme("dark");
    });
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("can switch to light theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setTheme("light");
    });
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setTheme("dark");
    });
    expect(localStorage.getItem("hourvia-theme")).toBe("dark");
  });
});
