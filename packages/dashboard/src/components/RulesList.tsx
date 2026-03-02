"use client";

import { useState } from "react";
import type { RuleRecord } from "@clawcommand/shared";

interface Props {
  rules: RuleRecord[];
}

export function RulesList({ rules }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Rules ({rules.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {rules.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No rules found</div>
        ) : (
          rules.map((r) => {
            const isOpen = expanded.has(r.id);
            return (
              <div key={r.id}>
                <button
                  onClick={() => toggle(r.id)}
                  className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-gray-900 dark:text-gray-100">{r.name}</span>
                    {r.description && (
                      <span className="block text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {r.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.alwaysApply && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        always
                      </span>
                    )}
                    {r.globs && r.globs.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {r.globs.length} glob{r.globs.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800">
                    {r.sourcePath && (
                      <DetailRow label="Source">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{r.sourcePath}</span>
                      </DetailRow>
                    )}
                    {r.globs && r.globs.length > 0 && (
                      <DetailRow label="Glob Patterns">
                        <div className="flex flex-wrap gap-1">
                          {r.globs.map((g) => (
                            <span key={g} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-mono">
                              {g}
                            </span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {r.content && (
                      <DetailRow label={`Content (${r.content.length} chars)`}>
                        <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono">
                          {r.content}
                        </pre>
                      </DetailRow>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pt-3">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
