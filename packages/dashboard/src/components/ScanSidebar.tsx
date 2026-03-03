"use client";

import type { ScanSummary } from "../lib/api";
import { timeAgo } from "../lib/format";

type ViewMode = "inventory" | "diff";

interface Props {
  scans: ScanSummary[];
  selectedScanId: string | null;
  viewMode: ViewMode;
  onSelectScan: (id: string) => void;
  onChangeView: (mode: ViewMode) => void;
}

export function ScanSidebar({ scans, selectedScanId, viewMode, onSelectScan, onChangeView }: Props) {
  return (
    <section className="lg:col-span-1">
      <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
        {(["inventory", "diff"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChangeView(mode)}
            className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
              viewMode === mode
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <h2 className="section-title mb-3">Scans</h2>

      {scans.length === 0 ? (
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            No scans yet. Run{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">openclaw-scan --token dev</code>{" "}
            to upload.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {scans.map((s) => (
            <li key={s.scanId}>
              <button
                onClick={() => onSelectScan(s.scanId)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all ${
                  selectedScanId === s.scanId
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-transparent"
                }`}
              >
                <span className="block font-medium truncate">{s.workspacePath.split("/").pop()}</span>
                <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {timeAgo(s.timestamp)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
