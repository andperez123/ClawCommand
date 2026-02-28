"use client";

import type { RunRecord } from "@clawcommand/shared";
import { formatTimestamp } from "../lib/format";

interface Props {
  runs: RunRecord[];
}

export function RunsHistory({ runs }: Props) {
  if (runs.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Runs / Job History ({runs.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {runs.map((r) => (
          <div key={r.id} className="px-4 py-3 flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">{r.agentId}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {formatTimestamp(r.timestamp)}
              </span>
              {r.errorSignature && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 truncate" title={r.errorSignature}>
                  {r.errorSignature}
                </div>
              )}
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                r.success
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {r.success ? "success" : "failed"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
