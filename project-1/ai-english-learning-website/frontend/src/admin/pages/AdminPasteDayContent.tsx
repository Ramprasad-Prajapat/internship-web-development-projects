import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { adminLessonService } from "../services/adminLessonService";
import { ArrowLeft, Save, Eye, Clipboard, CheckCircle2, AlertTriangle, Trash2, XCircle } from "lucide-react";

interface EditableSection {
  heading: string;
  body: string;
  category: string;
}

export default function AdminPasteDayContent() {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") || "replace"; // "edit" or "replace"
  const dayNum = parseInt(dayNumber || "1", 10);

  const [title, setTitle] = useState(`Day ${dayNum}`);
  const [rawText, setRawText] = useState("");
  const [parsedSections, setParsedSections] = useState<EditableSection[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [hasExistingContent, setHasExistingContent] = useState(false);
  const [saveMode, setSaveMode] = useState<"replace" | "append">("replace");

  useEffect(() => {
    adminLessonService.getAllDays().then((days) => {
      const existing = days.find((d) => d.dayNumber === dayNum);
      if (!existing && days.length > 0 && dayNum > Math.max(...days.map((d) => d.dayNumber)) + 1) {
        navigate("/admin/day-lessons", { replace: true });
        return;
      }
      if (existing) {
        setTitle(existing.title);
        setHasExistingContent(existing.totalSections > 0);
      }
    });

    if (modeParam === "edit") {
      adminLessonService.getAdminLessonByDay(dayNum).then((data) => {
        if (data && data.rawContent) {
          setRawText(data.rawContent);
        }
      }).catch((err) => {
        console.error("Failed to load raw content", err);
      });
    }
  }, [dayNum, navigate, modeParam]);

  const handlePreview = async () => {
    if (!rawText.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const sections = await adminLessonService.previewDayContent(dayNum, rawText);
      const normalized = (sections || []).map((s: any) => ({
        heading: s.heading || s.title || "",
        body: s.body || s.content || "",
        category: s.category || "general"
      }));
      setParsedSections(normalized);
      setIsPreview(true);
      setSavedSuccess(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to preview section content");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePreviewSection = (indexToRemove: number) => {
    setParsedSections(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearPreview = () => {
    setParsedSections([]);
    setIsPreview(false);
  };

  const handleClearPastedContent = () => {
    setRawText("");
    setParsedSections([]);
    setIsPreview(false);
    setSavedSuccess(false);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (parsedSections.length === 0) return;

    if (hasExistingContent && saveMode === "replace") {
      const confirm = window.confirm("This will replace existing sections for this day. Continue?");
      if (!confirm) return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await adminLessonService.importDayContent(dayNum, {
        title,
        rawContent: rawText,
        mode: saveMode,
        sections: parsedSections
      });
      setSaving(false);
      setSavedSuccess(true);
      setHasExistingContent(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to save day sections content");
      setSaving(false);
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
        <Link to={`/admin/day-lessons/${dayNum}`} className="hover:text-indigo-600">Day {dayNum}</Link>
        <span>/</span>
        <span className="text-violet-600 font-bold">Paste Content</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/admin/day-lessons/${dayNum}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-2"
          >
            <ArrowLeft size={14} /> Back to Day {dayNum} Sections
          </Link>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            Paste Day {dayNum} Content
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Paste raw Markdown or formatted lesson text below. Headings will automatically split into sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {rawText.trim() && !isPreview && (
             <button
              onClick={handleClearPastedContent}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-extrabold transition-all"
             >
               Clear Pasted Content
             </button>
          )}

          {isPreview ? (
            <>
              <button
                onClick={handleClearPreview}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold transition-colors"
              >
                Clear Preview
              </button>
              <button
                onClick={() => setIsPreview(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-colors"
              >
                Back to Paste
              </button>
            </>
          ) : (
            <button
              onClick={handlePreview}
              disabled={!rawText.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-extrabold transition-colors disabled:opacity-50"
            >
              <Eye size={15} /> {saving ? "Analyzing..." : "Preview Sections"}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !isPreview || parsedSections.length === 0}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-violet-600/10 transition-all disabled:opacity-50"
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Day Content"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-xs font-semibold text-rose-800 animate-fade-in shadow-sm">
          <XCircle size={18} className="text-rose-600 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {hasExistingContent && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-start md:items-center gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5 md:mt-0" />
            <div className="text-xs">
              <span className="font-extrabold text-amber-900">This day already has content.</span>{" "}
              <span className="text-amber-700 font-semibold">
                Choose Replace or Append before saving.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-amber-100">
            <button
              onClick={() => setSaveMode("replace")}
              className={`px-4 py-1.5 text-[11px] font-extrabold rounded-md transition-all ${
                saveMode === "replace" ? "bg-amber-100 text-amber-800" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Replace Existing
            </button>
            <button
              onClick={() => setSaveMode("append")}
              className={`px-4 py-1.5 text-[11px] font-extrabold rounded-md transition-all ${
                saveMode === "append" ? "bg-amber-100 text-amber-800" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Append (Update/Add)
            </button>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold text-emerald-900">Saved successfully!</span>{" "}
              <span className="text-emerald-700 font-semibold">
                {parsedSections.length} sections processed. You can edit any section from the Day Sections page.
              </span>
            </div>
          </div>
          <Link
            to={`/admin/day-lessons/${dayNum}`}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-colors"
          >
            View Sections
          </Link>
        </div>
      )}

      {/* Title Input */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Day Lesson Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Day 1: Mastering Small Talk & Greetings"
          className="w-full input-base font-extrabold text-slate-800"
        />
      </div>

      {/* Editor vs Preview */}
      {!isPreview ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clipboard size={14} className="text-violet-600" /> Raw Lesson Text (Markdown Supported)
            </label>
            <span className="text-[11px] font-bold text-slate-400">
              Paste fresh content. Headings will automatically split into sections.
            </span>
          </div>
          <textarea
            rows={16}
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setSavedSuccess(false);
            }}
            placeholder="### 1. Warm Up Discussion&#10;&#10;Welcome to Day 1! Today we will practice common greetings...&#10;&#10;### 2. Vocabulary Mastery&#10;&#10;* Hello / Hi&#10;* How are you doing?&#10;"
            className="w-full font-mono text-xs p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed bg-slate-50/50"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Preview ({parsedSections.length} Sections Detected)
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              Review, edit, and remove unwanted sections before saving.
            </span>
          </div>

          {parsedSections.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 font-semibold text-sm">
              No sections to preview.
            </div>
          ) : (
            parsedSections.map((sec, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 relative group">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-black rounded-md uppercase border border-violet-100">
                    Section {idx + 1}
                  </span>
                  <button
                    onClick={() => handleRemovePreviewSection(idx)}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Section Title / Heading</label>
                    <input
                      type="text"
                      value={sec.heading}
                      onChange={(e) => {
                        const val = e.target.value;
                        setParsedSections(prev => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], heading: val };
                          return updated;
                        });
                      }}
                      className="w-full text-sm font-extrabold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category / Type</label>
                    <select
                      value={sec.category || "general"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setParsedSections(prev => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], category: val };
                          return updated;
                        });
                      }}
                      className="w-full text-sm font-extrabold text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="general">General / Introduction</option>
                      <option value="vocabulary">Vocabulary</option>
                      <option value="grammar">Grammar</option>
                      <option value="speaking">Speaking Practice</option>
                      <option value="practice">Practice</option>
                      <option value="homework">Homework</option>
                      <option value="self-check">Self Check</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Section Content</label>
                  <textarea
                    rows={6}
                    value={sec.body}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParsedSections(prev => {
                        const updated = [...prev];
                        updated[idx] = { ...updated[idx], body: val };
                        return updated;
                      });
                    }}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed bg-slate-50/50"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
