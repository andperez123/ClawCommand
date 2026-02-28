"use client";

import type { ScanSummary } from "../lib/api";
import { formatTimestamp } from "../lib/format";

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
      <div className="flex gap-2 mb-3">
        {(["inventory", "diff"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChangeView(mode)}
            className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
              viewMode === mode
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Scans
      </h2>
      {scans.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No scans yet. Run{" "}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">openclaw-scan --token dev</code>{" "}
          to upload.
        </p>
      ) : (
        <ul className="space-y-2">
          {scans.map((s) => (
            <li key={s.scanId}>
              <button
                onClick={() => onSelectScan(s.scanId)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedScanId === s.scanId
                    ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100"
                    : "hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
                }`}
              >
                <span className="block font-medium truncate">{s.workspacePath}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(s.timestamp)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
