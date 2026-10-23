import { Link } from "react-router-dom";
import { Logo } from "../ui/Logo";

export function PublicFooter() {
  return (
    <footer className="surface border-t mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted max-w-xs">
              Time tracked. Progress made. Workforce time-tracking for businesses, teams, and consultants.
            </p>
            <p className="mt-2 text-xs text-muted">
              Hourvia by Living IT Solutions
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>Product</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-muted hover:text-teal-500 transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-sm text-muted hover:text-teal-500 transition-colors">About</Link></li>
              <li><Link to="/signup" className="text-sm text-muted hover:text-teal-500 transition-colors">Get started</Link></li>
              <li><Link to="/signin" className="text-sm text-muted hover:text-teal-500 transition-colors">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-muted hover:text-teal-500 transition-colors">About Hourvia</Link></li>
              <li><span className="text-sm text-muted">Living IT Solutions</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">© {new Date().getFullYear()} Living IT Solutions. All rights reserved.</p>
          <p className="text-xs text-muted">Time tracked. Progress made.</p>
        </div>
      </div>
    </footer>
  );
}
