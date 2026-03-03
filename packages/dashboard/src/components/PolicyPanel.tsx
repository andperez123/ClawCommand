"use client";

import type { PolicyResult } from "@clawcommand/shared";

interface Props {
  policy: PolicyResult;
}

const severityConfig: Record<string, { badge: string }> = {
  critical: { badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50" },
  high: { badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50" },
  medium: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50" },
  low: { badge: "bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50" },
};

export function PolicyPanel({ policy }: Props) {
  if (policy.violations.length === 0) {
    return (
      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          Policy Compliance
        </h2>
        <div className="glass-card px-5 py-4 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          All policies satisfied — {policy.passedRules}/{policy.totalRules} rules passed
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
        Policy Violations ({policy.violations.length})
      </h2>
      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
        {policy.violations.map((v, i) => {
          const cfg = severityConfig[v.severity] ?? severityConfig.low;
          return (
            <div key={i} className="px-5 py-3.5">
              <div className="flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${cfg.badge}`}>{v.severity}</span>
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{v.ruleName}</span>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5">{v.message}</p>
                  {v.recommendedFix && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">
                      Fix: {v.recommendedFix}
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
