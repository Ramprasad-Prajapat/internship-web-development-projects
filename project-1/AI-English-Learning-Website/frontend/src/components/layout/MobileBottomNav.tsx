import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BookOpen,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  User,
} from "lucide-react";
import { cn } from "../../utils/cn";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/modules", label: "Modules", icon: BookOpen },
  { to: "/history", label: "History", icon: History },
  { to: "/reports", label: "Reports", icon: FileSpreadsheet },
  { to: "/profile", label: "Profile", icon: User },
];

/**
 * Mobile-only bottom navigation bar. Tabs keep a minimum width and the bar
 * scrolls horizontally if they don't all fit, so adding modules never cramps
 * the labels and every destination stays reachable on phones.
 */
export function MobileBottomNav() {
  const navRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Keep the active tab visible when it would otherwise sit off-screen
  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    active?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden shadow-[0_-6px_20px_rgba(15,23,42,0.04)] border-t border-slate-100">
      <nav
        ref={navRef}
        aria-label="Primary"
        className="flex overflow-x-auto bg-white/90 pb-3 pt-1 backdrop-blur-lg [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex min-w-[4.25rem] flex-1 shrink-0 flex-col items-center gap-0.5 py-1.5 px-0.5 text-[10px] font-semibold transition-all duration-200",
                isActive ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-indigo-500",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 h-0.5 w-6 rounded-full bg-indigo-600" />
                )}
                <Icon size={17} className={cn("transition-transform duration-200", isActive ? "scale-110 stroke-[2.5px]" : "scale-100")} />
                <span className="truncate max-w-[4rem] tracking-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {/* Right-edge fade hints that the bar scrolls when tabs overflow. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/90 to-transparent" />
    </div>
  );
}

export default MobileBottomNav;
