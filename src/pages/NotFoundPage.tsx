import { Link } from "react-router-dom";
import { Button, Logo } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Logo size={48} showText={false} className="justify-center" />
        <h1 className="mt-6 text-6xl font-bold text-teal-500">404</h1>
        <p className="mt-4 text-lg text-muted">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="primary" size="lg">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
