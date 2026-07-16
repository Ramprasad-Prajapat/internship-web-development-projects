import { Link, Navigate, useLocation } from "react-router-dom";
import { Compass, Home, LayoutDashboard } from "lucide-react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

export default function NotFound() {
  const location = useLocation();
  if (location.pathname.includes('daily-lessons')) {
    return <Navigate to="/english-course" replace />;
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/20 px-4 text-center">
      <Card className="max-w-md w-full p-8 border border-slate-100/80 shadow-md flex flex-col items-center">
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100/50 p-4 text-indigo-600 mb-6 animate-pulse">
          <Compass size={40} className="stroke-[1.5px]" />
        </div>

        <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
          Error 404
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-800 tracking-tight">
          Page Not Found
        </h1>
        <p className="mt-2.5 text-sm font-medium text-slate-500 max-w-xs leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" fullWidth className="gap-2">
              <Home size={14} /> Go Home
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button fullWidth className="gap-2">
              <LayoutDashboard size={14} /> Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
