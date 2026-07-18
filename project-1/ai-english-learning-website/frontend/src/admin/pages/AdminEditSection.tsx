import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { adminLessonService } from "../services/adminLessonService";
import { ArrowLeft, Save, Eye, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminEditSection() {
  const { dayNumber, sectionHeading, sectionId } = useParams<{
    dayNumber?: string;
    sectionHeading?: string;
    sectionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const dayNum = parseInt(dayNumber || searchParams.get("day") || "1", 10);
  const targetIdOrHeading = decodeURIComponent(sectionId || sectionHeading || "");

  const [heading, setHeading] = useState("");
  const [originalHeading, setOriginalHeading] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"Published" | "Draft">("Published");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const sections = await adminLessonService.getDaySections(dayNum);
      const sec = sections.find(
        (s) => s.id.toLowerCase() === targetIdOrHeading.toLowerCase() || s.heading.toLowerCase() === targetIdOrHeading.toLowerCase()
      );

      if (!sec) {
        navigate(`/admin/day-lessons/${dayNum}`, { replace: true });
        return;
      }

      setHeading(sec.heading);
      setOriginalHeading(sec.heading);
      setContent(sec.content);
      setStatus(sec.status);
      setDescription(sec.description || "");
      setLoading(false);
    };

    load();
  }, [dayNum, targetIdOrHeading, navigate]);

  const handleSave = async () => {
    setErrorMsg(null);
    if (!heading.trim()) {
      setErrorMsg("Section heading cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await adminLessonService.updateSection(
        dayNum,
        originalHeading,
        { heading: heading.trim(), body: content },
        status === "Published" ? "published" : "draft",
        description.trim()
      );
      setOriginalHeading(heading.trim());
      setSaveSuccess(true);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-40 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-400 font-semibold text-sm">
        Loading section editor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/admin/dashboard" className="hover:text-indigo-600">Admin CMS</Link>
        <span>/</span>
        <Link to="/admin/day-lessons" className="hover:text-indigo-600">Day Lessons</Link>
        <span>/</span>
        <Link to={`/admin/day-lessons/${dayNum}`} className="hover:text-indigo-600">Day {dayNum}</Link>
        <span>/</span>
        <span className="text-indigo-600 font-bold">Edit Section</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/admin/day-lessons/${dayNum}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-2"
          >
            <ArrowLeft size={14} /> Back to Day {dayNum} Sections
          </Link>
          <h1 className="text-2xl font-black text-slate-800">Edit Lesson Section</h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Modify section heading, body text, and publishing status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/lessons/day/${dayNum}?section=${encodeURIComponent(heading)}`}
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-colors"
          >
            <Eye size={15} /> Preview Live
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Section"}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-extrabold text-emerald-900">
              Section "{heading}" updated successfully!
            </span>
          </div>
          <Link
            to={`/admin/day-lessons/${dayNum}`}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-colors"
          >
            Back to Sections
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-rose-700">
          <AlertCircle size={18} className="shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Section Heading
              </label>
              <input
                type="text"
                value={heading}
                onChange={(e) => {
                  setHeading(e.target.value);
                  setSaveSuccess(false);
                }}
                className="w-full input-base font-extrabold text-slate-800"
                placeholder="e.g. 1. Warm Up Discussion"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Section Content (Markdown & Bullet Points)
              </label>
              <textarea
                rows={15}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setSaveSuccess(false);
                }}
                className="w-full font-mono text-xs p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed bg-slate-50/50"
                placeholder="Write lesson section explanation, dialogue, or practice notes..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
              Publishing & Metadata
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as any);
                  setSaveSuccess(false);
                }}
                className="w-full input-base font-bold text-slate-700"
              >
                <option value="Published">Published (Visible to learners)</option>
                <option value="Draft">Draft (Hidden in mock database)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Admin Note / Description (Optional)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setSaveSuccess(false);
                }}
                placeholder="Internal notes about this section..."
                className="w-full input-base text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
