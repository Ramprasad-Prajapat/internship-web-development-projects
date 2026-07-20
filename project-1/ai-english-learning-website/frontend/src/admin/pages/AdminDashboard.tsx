import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminLessonService } from "../services/adminLessonService";
import { LayoutDashboard, Calendar, FileText, CheckCircle, Clock, Settings, ArrowRight, Clipboard } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalDays: number;
    totalSections: number;
    publishedSections: number;
    draftSections: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setError(null);
      try {
        const fetched = await adminLessonService.getDashboardStats();
        setStats(fetched);
      } catch (e) {
        console.error('Failed to load dashboard stats', e);
        setStats(null);
        setError('Failed to load dashboard statistics. Please try again.');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span>Admin CMS</span>
        <ArrowRight size={12} className="text-slate-400" />
        <span className="text-indigo-600 font-bold">Dashboard</span>
      </div>

      {error ? (
        <div className="h-28 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-800 font-semibold text-sm">
          {error}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Days</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.totalDays}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-violet-50 text-violet-600 rounded-xl">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Sections</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.totalSections}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Published</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.publishedSections}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Drafts</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.draftSections}</h3>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-28 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-400 font-semibold text-sm">
          Loading dashboard statistics...
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <Link
            to="/admin/day-lessons"
            className="p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group"
          >
            <div className="space-y-2.5">
              <div className="text-indigo-600 p-3 bg-indigo-50 rounded-xl w-fit">
                <Calendar size={22} />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Manage Day Lessons
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Browse all day-wise lessons, view section breakdown, edit headings, or add new days to the course.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 mt-4">
              Open Day Lessons <ArrowRight size={14} />
            </div>
          </Link>

          <Link
            to="/admin/day-lessons"
            state={{ pasteNotice: true }}
            className="p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group"
          >
            <div className="space-y-2.5">
              <div className="text-violet-600 p-3 bg-violet-50 rounded-xl w-fit">
                <Clipboard size={22} />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-violet-600 transition-colors">
                Paste Day Content
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Import raw lesson text day-wise. Automatically detect headings and preview cards before saving.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-violet-600 mt-4">
              Select Day to Paste <ArrowRight size={14} />
            </div>
          </Link>

          <Link
            to="/admin/settings"
            className="p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group"
          >
            <div className="space-y-2.5">
              <div className="text-slate-600 p-3 bg-slate-100 rounded-xl w-fit">
                <Settings size={22} />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-slate-700 transition-colors">
                Settings / Backup
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Export mock database JSON backups, import stored backups, or safely restore default seed data.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 mt-4">
              Open Settings <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
