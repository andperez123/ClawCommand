"use client";

import type { ScanDiff } from "@clawcommand/shared";
import type { ScanSummary } from "../lib/api";
import { timeAgo } from "../lib/format";

interface Props {
  scans: ScanSummary[];
  diffScanA: string;
  diffScanB: string;
  diff: ScanDiff | null;
  loading: boolean;
  onChangeScanA: (id: string) => void;
  onChangeScanB: (id: string) => void;
  onCompare: () => void;
}

export function DiffView({ scans, diffScanA, diffScanB, diff, loading, onChangeScanA, onChangeScanB, onCompare }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="section-title flex items-center gap-2">
        <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        Compare Scans
      </h2>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Scan A (older)</label>
          <select
            value={diffScanA}
            onChange={(e) => onChangeScanA(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          >
            <option value="">Select scan...</option>
            {scans.map((s) => (
              <option key={s.scanId} value={s.scanId}>
                {s.workspacePath.split("/").pop()} — {timeAgo(s.timestamp)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Scan B (newer)</label>
          <select
            value={diffScanB}
            onChange={(e) => onChangeScanB(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          >
            <option value="">Select scan...</option>
            {scans.map((s) => (
              <option key={s.scanId} value={s.scanId}>
                {s.workspacePath.split("/").pop()} — {timeAgo(s.timestamp)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onCompare}
          disabled={!diffScanA || !diffScanB || loading}
          className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>

      {diff && (
        <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
          <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>{timeAgo(diff.timestampA)}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <span>{timeAgo(diff.timestampB)}</span>
          </div>
          {(
            [
              ["Agents", diff.changes.agents],
              ["Skills", diff.changes.skills],
              ["MCP Servers", diff.changes.mcpServers],
            ] as const
          ).map(([label, ch]) => (
            <div key={label} className="px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{label}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{ch.added.length} added</span>
                  {ch.added.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-slate-600 dark:text-slate-400 text-xs">
                      {ch.added.map((n) => <li key={n} className="flex items-center gap-1"><span className="text-emerald-500">+</span> {n}</li>)}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">-{ch.removed.length} removed</span>
                  {ch.removed.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-slate-600 dark:text-slate-400 text-xs">
                      {ch.removed.map((n) => <li key={n} className="flex items-center gap-1"><span className="text-rose-500">-</span> {n}</li>)}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">~{ch.modified.length} modified</span>
                  {ch.modified.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-slate-600 dark:text-slate-400 text-xs">
                      {ch.modified.map((n) => <li key={n} className="flex items-center gap-1"><span className="text-amber-500">~</span> {n}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
