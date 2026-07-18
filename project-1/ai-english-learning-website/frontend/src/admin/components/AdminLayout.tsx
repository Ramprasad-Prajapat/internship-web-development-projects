import React from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, Calendar, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/day-lessons", label: "Day Lessons", icon: Calendar },
    { to: "/admin/settings", label: "Settings / Backup", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-sm fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
          <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-600/10">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="font-extrabold leading-tight text-slate-800 tracking-tight">Admin CMS</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Content Manager</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-indigo-50/90 text-indigo-700 shadow-sm border border-indigo-100/60 font-extrabold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3 text-xs">
            <p className="font-bold text-slate-700">Mock Mode Active</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Backend Pending</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="lg:hidden font-extrabold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-indigo-600" size={20} /> Admin CMS
            </span>
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                Admin Area
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Hi, {user?.name || "Admin"}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 rounded-md">
                Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition-all"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {/* Mobile Nav Bar */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex overflow-x-auto gap-2">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
