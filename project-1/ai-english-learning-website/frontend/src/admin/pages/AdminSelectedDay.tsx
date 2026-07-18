import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { adminLessonService } from "../services/adminLessonService";
import type { AdminSectionDetail } from "../types/admin.types";
import { ArrowLeft, Clipboard, Edit3, CheckCircle, Clock, Eye, Trash2, AlertTriangle, PlusCircle, X } from "lucide-react";

export default function AdminSelectedDay() {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const navigate = useNavigate();
  const dayNum = parseInt(dayNumber || "1", 10);

  const [sections, setSections] = useState<AdminSectionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [heading, setHeading] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState("Published");

  const loadSections = async () => {
    setLoading(true);
    const days = await adminLessonService.getAllDays();
    const dayExists = days.some((d) => d.dayNumber === dayNum);
    if (!dayExists) {
      navigate("/admin/day-lessons", { replace: true });
      return;
    }
    const data = await adminLessonService.getDaySections(dayNum);
    setSections(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSections();
  }, [dayNum]);

  const handleToggleStatus = async (sec: AdminSectionDetail) => {
    const nextStatus = sec.status === "Published" ? "Draft" : "Published";
    await adminLessonService.updateSectionStatus(dayNum, sec.id, nextStatus);
    await loadSections();
  };

  const handleDeleteSection = async (sec: AdminSectionDetail) => {
    if (!window.confirm(`Are you sure you want to delete "${sec.heading}"?`)) return;
    await adminLessonService.deleteSection(dayNum, sec.id);
    await loadSections();
  };

  const handleClearDayContent = async () => {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to delete ALL sections for Day ${dayNum}? This action cannot be undone.`)) return;
    await adminLessonService.clearDayContent(dayNum);
    await loadSections();
  };

  const handleAddSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim()) {
      setError("Section heading is required");
      return;
    }
    if (!content.trim()) {
      setError("Section content is required");
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await adminLessonService.addSection(dayNum, { heading, content, category, status });
      setSuccess("Section added successfully!");
      setHeading("");
      setContent("");
      setCategory("general");
      setStatus("Published");
      setIsModalOpen(false);
      await loadSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add section");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/admin/dashboard" className="hover:text-indigo-600">Admin CMS</Link>
        <span>/</span>
        <Link to="/admin/day-lessons" className="hover:text-indigo-600">Day Lessons</Link>
        <span>/</span>
        <span className="text-indigo-600 font-bold">Day {dayNum}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/day-lessons"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-2"
          >
            <ArrowLeft size={14} /> Back to All Days
          </Link>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            Day {dayNum} Sections
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Review parsed sections, update headings, or change publishing state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/10 transition-all w-fit"
          >
            <PlusCircle size={16} /> Add New Section
          </button>
          {sections.length > 0 && (
            <button
              onClick={handleClearDayContent}
              className="flex items-center gap-1.5 bg-white border-2 border-rose-100 hover:border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-extrabold transition-all w-fit"
            >
              <AlertTriangle size={15} /> Clear Day Content
            </button>
          )}
          <Link
            to={`/admin/day-lessons/${dayNum}/paste`}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-violet-600/10 transition-all w-fit"
          >
            <Clipboard size={16} /> Paste Day Content
          </Link>
        </div>
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

      {loading ? (
        <div className="h-40 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-400 font-semibold text-sm">
          Loading sections for Day {dayNum}...
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-4">
          <p className="text-slate-500 font-semibold text-sm">No sections found. Click Add New Section to create one.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold"
            >
              <PlusCircle size={16} /> Add New Section
            </button>
            <Link
              to={`/admin/day-lessons/${dayNum}/paste`}
              className="inline-flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold"
            >
              <Clipboard size={16} /> Paste Raw Lesson Content
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec, idx) => (
            <div
              key={sec.id || idx}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md uppercase">
                    Section {idx + 1}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(sec)}
                    className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border transition-all ${
                      sec.status === "Published"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    {sec.status === "Published" ? (
                      <>
                        <CheckCircle size={12} /> Published
                      </>
                    ) : (
                      <>
                        <Clock size={12} /> Draft
                      </>
                    )}
                  </button>
                </div>

                <h3 className="text-base font-extrabold text-slate-800">{sec.heading}</h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">{sec.content}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Link
                  to={`/lessons/day/${dayNum}?section=${encodeURIComponent(sec.heading)}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Eye size={14} /> Preview
                </Link>
                <Link
                  to={`/admin/sections/${encodeURIComponent(sec.id)}/edit?day=${dayNum}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-xl text-xs font-extrabold transition-colors"
                >
                  <Edit3 size={14} /> Edit Section
                </Link>
                <button
                  onClick={() => handleDeleteSection(sec)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-rose-100 hover:border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-colors"
                  title="Delete Section"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in animate-duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-800">Add New Section to Day {dayNum}</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Define the heading, content type, and content detail for this section.
              </p>
            </div>

            <form onSubmit={handleAddSectionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Section Heading / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grammar: Prepositions of Place"
                  className="input-base"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Section Type / Category
                  </label>
                  <select
                    className="input-base"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="vocabulary">Vocabulary</option>
                    <option value="grammar">Grammar</option>
                    <option value="speaking">Speaking</option>
                    <option value="practice">Practice</option>
                    <option value="homework">Homework</option>
                    <option value="self-check">Self-check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Publish Status
                  </label>
                  <select
                    className="input-base font-bold text-slate-700 bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="Published">Published (Visible to learners)</option>
                    <option value="Draft">Draft (Hidden from learners)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Section Content *
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste or write the lesson markdown/text content..."
                  className="input-base resize-none font-semibold text-slate-700"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              <div className="flex items-center gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-extrabold hover:bg-slate-50 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/10 transition-colors disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
