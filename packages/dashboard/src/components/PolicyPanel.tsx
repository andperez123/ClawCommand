"use client";

import type { PolicyResult } from "@clawcommand/shared";

interface Props {
  policy: PolicyResult;
}

const severityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function PolicyPanel({ policy }: Props) {
  if (policy.violations.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Policy Violations ({policy.violations.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {policy.violations.map((v, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start gap-2">
              <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${severityStyles[v.severity] ?? severityStyles.low}`}>
                {v.severity}
              </span>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{v.ruleName}</span>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{v.message}</p>
                {v.recommendedFix && (
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    Fix: {v.recommendedFix}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
