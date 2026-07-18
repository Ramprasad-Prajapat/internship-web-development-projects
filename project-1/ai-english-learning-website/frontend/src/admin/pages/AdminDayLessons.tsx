import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { adminLessonService } from "../services/adminLessonService";
import type { AdminDaySummary } from "../types/admin.types";
import { Calendar, PlusCircle, ArrowRight, Eye, Clipboard, CheckCircle, Clock, Info } from "lucide-react";

export default function AdminDayLessons() {
  const [days, setDays] = useState<AdminDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const pasteNotice = location.state && (location.state as any).pasteNotice;

  const loadDays = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminLessonService.getAllDays();
      setDays(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load days");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDays();
  }, []);

  const handleCreateNextDay = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await adminLessonService.addNextDay();
      setSuccess("Next day created successfully.");
      await loadDays();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create next day");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDayContent = async (day?: any) => {
    if (!day) return;
    const { dayNumber } = day;
    const confirm = window.confirm(
      `Are you sure you want to remove complete Day ${dayNumber} content? This will remove all sections of this day.`
    );
    if (!confirm) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await adminLessonService.removeAdminLessonContent(dayNumber);
      setSuccess(`Day ${dayNumber} content removed successfully.`);
      await loadDays();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove day content");
    } finally {
      setActionLoading(false);
    }
  };

  const getDayStatus = (day: AdminDaySummary) => {
    if (day.totalSections === 0) {
      return { label: "Empty", style: "bg-slate-100 text-slate-600 border-slate-200" };
    }
    if (day.publishedSections === 0) {
      return { label: "Draft", style: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { label: "Active", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  const formatLastUpdated = (dateStr?: string) => {
    if (!dateStr || dateStr.trim() === "") return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "N/A";
    }
  };

  const filteredDays = days.filter((day) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      day.dayNumber.toString().includes(query) ||
      day.title.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/admin/dashboard" className="hover:text-indigo-600">Admin CMS</Link>
        <ArrowRight size={12} className="text-slate-400" />
        <span className="text-indigo-600 font-bold">Day Lessons</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" /> Day Lessons Management
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Manage complete day-wise content, edit full raw markdown, or view/edit sections.
          </p>
        </div>
        <button
          onClick={handleCreateNextDay}
          disabled={actionLoading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
        >
          <PlusCircle size={16} /> Add Next Day
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-bold animate-fade-in shadow-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-bold animate-fade-in shadow-sm">
          {error}
        </div>
      )}

      {pasteNotice && (
        <div className="bg-violet-50 border border-violet-200/80 rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-sm">
          <Info size={20} className="text-violet-600 shrink-0" />
          <div className="text-xs">
            <span className="font-extrabold text-violet-900">Select a day to paste content.</span>{" "}
            <span className="text-violet-700 font-semibold">
              Click the "Paste Content" button on any day below to import or update full raw lesson text.
            </span>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by Day Number or Day Title..."
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {loading ? (
        <div className="h-40 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-400 font-semibold text-sm">
          Loading lesson days...
        </div>
      ) : filteredDays.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-4">
          <p className="text-slate-500 font-semibold text-sm">
            {searchQuery ? "No matching lesson days found." : "No day lessons found in database."}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreateNextDay}
              disabled={actionLoading}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold disabled:opacity-50"
            >
              Create Day 1
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDays.map((day) => {
            const status = getDayStatus(day);
            return (
              <div
                key={day.dayNumber}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg border border-indigo-100">
                      Day {day.dayNumber}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border uppercase ${status.style}`}>
                      {status.label}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-800 line-clamp-1">{day.title}</h3>

                  <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Total Sections:</span>
                      <span className="text-slate-800 font-extrabold">{day.totalSections} sections</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Last Updated:</span>
                      <span className="text-slate-800 font-extrabold">{formatLastUpdated((day as any).updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/day-lessons/${day.dayNumber}`}
                      className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2 py-2 rounded-xl text-[11px] font-extrabold transition-colors text-center"
                      title="View all section items for this day"
                    >
                      <Eye size={12} /> View Sections
                    </Link>
                    <Link
                      to={`/admin/day-lessons/${day.dayNumber}`}
                      className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2 py-2 rounded-xl text-[11px] font-extrabold transition-colors text-center"
                      title="Edit section items for this day"
                    >
                      View/Edit Sections
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/day-lessons/${day.dayNumber}/paste?mode=edit`}
                      className="flex-1 flex items-center justify-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 px-2 py-2 rounded-xl text-[11px] font-extrabold transition-colors text-center border border-violet-100"
                      title="Edit full day raw text content"
                    >
                      Edit Full Raw
                    </Link>
                    <Link
                      to={`/admin/day-lessons/${day.dayNumber}/paste?mode=replace`}
                      className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-2 rounded-xl text-[11px] font-extrabold transition-colors text-center border border-indigo-100"
                      title="Paste new raw content to replace all sections"
                    >
                      Replace Raw
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDayContent(day)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-xl text-[11px] font-extrabold transition-colors border border-rose-100/60 disabled:opacity-50"
                    title="Remove all content for this day"
                  >
                    Remove Content
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
