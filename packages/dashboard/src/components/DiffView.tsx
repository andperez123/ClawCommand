"use client";

import type { ScanDiff } from "@clawcommand/shared";
import type { ScanSummary } from "../lib/api";
import { formatTimestamp } from "../lib/format";

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
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Compare Scans
      </h2>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Scan A (older)</label>
          <select
            value={diffScanA}
            onChange={(e) => onChangeScanA(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm"
          >
            <option value="">Select scan...</option>
            {scans.map((s) => (
              <option key={s.scanId} value={s.scanId}>
                {s.workspacePath} — {formatTimestamp(s.timestamp)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Scan B (newer)</label>
          <select
            value={diffScanB}
            onChange={(e) => onChangeScanB(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm"
          >
            <option value="">Select scan...</option>
            {scans.map((s) => (
              <option key={s.scanId} value={s.scanId}>
                {s.workspacePath} — {formatTimestamp(s.timestamp)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onCompare}
          disabled={!diffScanA || !diffScanB || loading}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>
      {diff && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
            {formatTimestamp(diff.timestampA)} → {formatTimestamp(diff.timestampB)}
          </div>
          {(
            [
              ["Agents", diff.changes.agents],
              ["Skills", diff.changes.skills],
              ["MCP Servers", diff.changes.mcpServers],
            ] as const
          ).map(([label, ch]) => (
            <div key={label} className="px-4 py-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-600 dark:text-green-400 font-medium">+{ch.added.length} added</span>
                  {ch.added.length > 0 && (
                    <ul className="mt-1 text-gray-600 dark:text-gray-400">
                      {ch.added.map((n) => <li key={n}>+ {n}</li>)}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="text-red-600 dark:text-red-400 font-medium">-{ch.removed.length} removed</span>
                  {ch.removed.length > 0 && (
                    <ul className="mt-1 text-gray-600 dark:text-gray-400">
                      {ch.removed.map((n) => <li key={n}>- {n}</li>)}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">~{ch.modified.length} modified</span>
                  {ch.modified.length > 0 && (
                    <ul className="mt-1 text-gray-600 dark:text-gray-400">
                      {ch.modified.map((n) => <li key={n}>~ {n}</li>)}
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
