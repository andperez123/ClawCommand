"use client";

import type { ValidationResult } from "@clawcommand/shared";

interface Props {
  validation: ValidationResult;
}

const severityConfig: Record<string, { dot: string; badge: string }> = {
  error: { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50" },
  warning: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50" },
  info: { dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50" },
};

export function ValidationPanel({ validation }: Props) {
  if (validation.issues.length === 0) {
    return (
      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Validation
        </h2>
        <div className="glass-card px-5 py-4 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          All checks passed — no issues found
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        Validation Issues ({validation.issues.length})
      </h2>
      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
        {validation.issues.map((issue, i) => {
          const cfg = severityConfig[issue.severity] ?? severityConfig.info;
          return (
            <div key={i} className="px-5 py-3.5">
              <div className="flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${cfg.badge}`}>{issue.severity}</span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-900 dark:text-slate-100">{issue.message}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
                    {issue.evidence.file}
                    {issue.evidence.line != null && `:${issue.evidence.line}`}
                  </p>
                  {issue.recommendedFix && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">
                      Fix: {issue.recommendedFix}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
