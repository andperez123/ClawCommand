"use client";

import type { RunRecord } from "@clawcommand/shared";
import { timeAgo } from "../lib/format";

interface Props {
  runs: RunRecord[];
}

export function RunsHistory({ runs }: Props) {
  if (runs.length === 0) return null;

  const succeeded = runs.filter((r) => r.success).length;
  const failed = runs.length - succeeded;

  return (
    <div>
      <h2 className="section-title mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
        </svg>
        Run History ({runs.length})
        <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">
          {succeeded} passed, {failed} failed
        </span>
      </h2>
      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
        {runs.map((r) => (
          <div key={r.id} className="px-5 py-3 flex items-start gap-3">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${r.success ? "bg-emerald-500" : "bg-rose-500"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{r.agentId}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(r.timestamp)}</span>
              </div>
              {r.summary && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.summary}</p>
              )}
              {r.errorSignature && (
                <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5 truncate font-mono" title={r.errorSignature}>
                  {r.errorSignature}
                </p>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-md border shrink-0 ${
              r.success
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50"
                : "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50"
            }`}>
              {r.success ? "passed" : "failed"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
