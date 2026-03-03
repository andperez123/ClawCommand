"use client";

import { useState } from "react";
import type { RuleRecord } from "@clawcommand/shared";
import { DetailRow } from "./DetailRow";

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
      <h2 className="section-title mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        Rules ({rules.length})
      </h2>
      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
        {rules.length === 0 ? (
          <div className="px-5 py-4 text-sm text-slate-400 dark:text-slate-500 italic">No rules found</div>
        ) : (
          rules.map((r) => {
            const isOpen = expanded.has(r.id);
            return (
              <div key={r.id}>
                <button
                  onClick={() => toggle(r.id)}
                  className="w-full px-5 py-3.5 flex justify-between items-center text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${r.alwaysApply ? "bg-emerald-500" : "bg-slate-400"}`} />
                      <span className="font-semibold text-slate-900 dark:text-white">{r.name}</span>
                    </div>
                    {r.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 ml-4">{r.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {r.alwaysApply && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">always</span>
                    )}
                    {r.globs && r.globs.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50">
                        {r.globs.length} glob{r.globs.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 space-y-1 border-t border-slate-100 dark:border-slate-800/80 ml-4">
                    {r.sourcePath && (
                      <DetailRow label="Source">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{r.sourcePath}</span>
                      </DetailRow>
                    )}
                    {r.globs && r.globs.length > 0 && (
                      <DetailRow label="Glob Patterns">
                        <div className="flex flex-wrap gap-1.5">
                          {r.globs.map((g) => (
                            <span key={g} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono border border-slate-200/50 dark:border-slate-700/50">{g}</span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {r.content && (
                      <DetailRow label={`Content (${r.content.length} chars)`}>
                        <pre className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono border border-slate-200/50 dark:border-slate-700/50">
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
