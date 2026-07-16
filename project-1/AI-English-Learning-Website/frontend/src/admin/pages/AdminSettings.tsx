import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminLessonService } from "../services/adminLessonService";
import { ArrowRight, Settings, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function AdminSettings() {
  const [importJson, setImportJson] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live JSON validation
  useEffect(() => {
    if (!importJson.trim()) {
      setJsonError(null);
      return;
    }
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.version || !parsed.lessons) {
        setJsonError("Missing required backup fields: 'version' or 'lessons'");
      } else {
        setJsonError(null);
      }
    } catch (e: any) {
      setJsonError(`Invalid JSON format: ${e.message}`);
    }
  }, [importJson]);

  const handleExport = async () => {
    setIsExporting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const dataStr = await adminLessonService.exportMockData();
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const exportFileDefaultName = `admin-cms-backup-${dateStr}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccessMsg("Database exported successfully!");
    } catch (err: any) {
      setErrorMsg(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      fileReader.readAsText(file, "UTF-8");
      fileReader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setImportJson(event.target.result);
        }
      };
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!importJson.trim()) {
      setErrorMsg("Please upload a backup file or paste JSON data.");
      return;
    }
    if (jsonError) {
      setErrorMsg(`Cannot import: ${jsonError}`);
      return;
    }

    const confirm = window.confirm("This will replace current database lessons. Continue?");
    if (!confirm) return;

    try {
      setIsImporting(true);
      await adminLessonService.importMockData(importJson);
      setSuccessMsg("Backup imported successfully!");
      setImportJson("");
      setFileName("");
    } catch (err: any) {
      setErrorMsg(`Import failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const input = window.prompt("CRITICAL WARNING: This action is permanent and deletes all custom day lessons. Type RESET to continue.");
    if (input !== "RESET") {
      if (input !== null) {
        setErrorMsg("Reset cancelled: verification text did not match 'RESET'.");
      }
      return;
    }

    try {
      setIsResetting(true);
      await adminLessonService.resetMockData();
      setSuccessMsg("Database reset successfully! Reloading page...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(`Reset failed: ${err.message}`);
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/admin/dashboard" className="hover:text-indigo-600">Admin CMS</Link>
        <ArrowRight size={12} className="text-slate-400" />
        <span className="text-indigo-600 font-bold">Settings & Backup</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Settings className="text-indigo-600" /> Settings & Backup
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Export backups, restore data, and reset mock storage databases safely.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-4 flex items-center gap-3 text-xs font-semibold text-emerald-800 animate-fade-in shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-xs font-semibold text-rose-800 animate-fade-in shadow-sm">
          <XCircle size={18} className="text-rose-600 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export & Reset Panel */}
        <div className="space-y-6">
          {/* Export Card */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Download size={18} className="text-indigo-600" /> Export Database
            </h2>
            <p className="text-xs text-slate-550 font-semibold leading-relaxed">
              Export all your daily lessons, raw text structure, and custom section metadata (status, descriptions) to a JSON backup file. Keep this file safe to restore your state later.
            </p>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-black uppercase text-indigo-600 transition-colors"
            >
              <Download size={14} /> {isExporting ? "Exporting..." : "Export Backup File"}
            </button>
          </div>

          {/* Reset Card */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw size={18} className="text-rose-500" /> Reset Database
            </h2>
            <p className="text-xs text-slate-550 font-semibold leading-relaxed">
              Resets your lessons collection and deletes all custom administrative work. The lesson schedule will revert to the default seed days (Days 1–5).
            </p>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-rose-700">
              <AlertTriangle className="shrink-0 mt-0.5" size={14} />
              <span className="text-[11px] font-bold leading-normal">
                This action is permanent and cannot be undone. Always export a backup file first.
              </span>
            </div>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-4 py-2 border border-rose-200 hover:bg-rose-50 disabled:opacity-50 rounded-xl text-xs font-black uppercase text-rose-600 transition-colors"
            >
              <RefreshCw size={14} className={isResetting ? "animate-spin" : ""} /> {isResetting ? "Resetting..." : "Reset Database"}
            </button>
          </div>
        </div>

        {/* Import Database Card */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Upload size={18} className="text-indigo-600" /> Import Backup
          </h2>
          <p className="text-xs text-slate-555 font-semibold leading-relaxed">
            Select a previously exported JSON backup file, or paste raw JSON below to restore lessons and configurations.
          </p>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Upload Backup File</label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 border border-slate-200 rounded-xl p-1 bg-slate-50/50"
              />
              {fileName && (
                <div className="text-[10px] font-bold text-slate-500">
                  Selected: <span className="text-indigo-600">{fileName}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Or Paste Raw Backup JSON</label>
              <textarea
                rows={8}
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                placeholder='{"lessons": [...], "meta": {...}}'
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed bg-slate-50/20"
              />
              {jsonError && (
                <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                  <XCircle size={10} /> {jsonError}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isImporting || !importJson.trim() || !!jsonError}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase transition-colors"
              >
                <Upload size={14} /> {isImporting ? "Importing..." : "Import Backup Data"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
