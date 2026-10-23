import { Link } from "react-router-dom";
import { Logo } from "../ui/Logo";
import { ThemeSelector } from "../ui/ThemeSelector";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 surface border-b backdrop-blur-md" style={{ backgroundColor: "color-mix(in srgb, var(--color-surface) 85%, transparent)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted hover:text-teal-500 transition-colors">Home</Link>
            <Link to="/about" className="text-sm font-medium text-muted hover:text-teal-500 transition-colors">About</Link>
            <a href="#features" className="text-sm font-medium text-muted hover:text-teal-500 transition-colors">Features</a>
            <a href="#how-it_works" className="text-sm font-medium text-muted hover:text-teal-500 transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeSelector />
            <Link to="/signin" className="text-sm font-medium text-muted hover:text-teal-500 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
