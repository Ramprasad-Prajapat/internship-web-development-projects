import { NavLink } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { navItems } from "./navItems";
import { cn } from "../../utils/cn";

/** Desktop-only left sidebar with logo + menu and active-route highlight. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-100 bg-white/80 backdrop-blur-md lg:flex shadow-sm">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-600/10">
          <GraduationCap size={22} />
        </div>
        <div>
          <p className="font-extrabold leading-tight text-slate-800 tracking-tight">English Daily</p>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Small practice, big growth</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border border-transparent",
                isActive
                  ? "bg-indigo-50/80 text-indigo-700 border-indigo-100/50 shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50/60 hover:text-indigo-600",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"
                  )}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-5 text-[11px] font-semibold text-slate-400 border-t border-slate-50 uppercase tracking-wider select-none">
        Free-first · Beginner friendly
      </div>
    </aside>
  );
}

export default Sidebar;
