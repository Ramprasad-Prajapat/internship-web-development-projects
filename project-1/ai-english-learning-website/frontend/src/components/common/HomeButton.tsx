import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";

interface HomeButtonProps {
  className?: string;
}

/**
 * Reusable "← Home" button.
 *
 * Only visible on public auth pages: /login, /register, and /forgot-password.
 * Auto-hidden on the Home page itself ("/") and all protected logged-in paths.
 */
export function HomeButton({ className }: HomeButtonProps) {
  const { pathname } = useLocation();

  const publicAuthPaths = ["/login", "/register", "/forgot-password"];

  // Show only on specific public auth paths
  if (!publicAuthPaths.includes(pathname)) {
    return null;
  }

  return (
    <Link
      to="/"
      aria-label="Go to Home page"
      className={cn(
        "fixed left-5 top-5 z-50 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1 shadow-lg shadow-indigo-600/25 hover:shadow-xl",
        className
      )}
    >
      <span aria-hidden="true">←</span> Home
    </Link>
  );
}

export default HomeButton;
