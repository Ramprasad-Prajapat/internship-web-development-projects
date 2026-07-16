import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import learningService from "../../services/mockLearningService";

/** Top bar: greeting, daily streak and logout button. */
export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    learningService
      .getStreak()
      .then(setStreak)
      .catch(() => setStreak(0));
  }, []);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const firstName = user?.name?.split(" ")[0] ?? "Learner";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/70 px-4 py-3.5 backdrop-blur-md md:px-6 shadow-sm/50">
      <div className="flex items-center gap-3">
        <span className="text-base font-extrabold tracking-tight text-slate-800 lg:hidden">
          English Daily
        </span>
        <span className="hidden text-sm font-medium text-slate-500 lg:block">
          Hi, <span className="font-bold text-slate-800">{firstName}</span> 👋
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span
          title="Your daily streak"
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 shadow-sm/30 select-none"
        >
          <Flame size={14} className="fill-amber-500 stroke-amber-600" />
          <span>{streak} Days Streak</span>
        </span>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-200"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
