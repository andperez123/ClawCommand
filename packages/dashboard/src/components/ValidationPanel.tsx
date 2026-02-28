"use client";

import type { ValidationResult } from "@clawcommand/shared";

interface Props {
  validation: ValidationResult;
}

const severityStyles: Record<string, string> = {
  error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  info: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function ValidationPanel({ validation }: Props) {
  if (validation.issues.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Validation Issues ({validation.issues.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {validation.issues.map((issue, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start gap-2">
              <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${severityStyles[issue.severity] ?? severityStyles.info}`}>
                {issue.severity}
              </span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{issue.message}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-[3.5rem]">
              {issue.evidence.file}
              {issue.evidence.line != null && `:${issue.evidence.line}`}
              {issue.recommendedFix && (
                <div className="text-indigo-600 dark:text-indigo-400 mt-1">
                  Fix: {issue.recommendedFix}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
