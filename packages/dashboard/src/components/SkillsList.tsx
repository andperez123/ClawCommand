"use client";

import { useState } from "react";
import type { SkillRecord } from "@clawcommand/shared";
import { DetailRow } from "./DetailRow";

interface Props {
  skills: SkillRecord[];
}

export function SkillsList({ skills }: Props) {
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
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        </svg>
        Skills ({skills.length})
      </h2>
      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
        {skills.length === 0 ? (
          <div className="px-5 py-4 text-sm text-slate-400 dark:text-slate-500 italic">No skills discovered</div>
        ) : (
          skills.map((s) => {
            const isOpen = expanded.has(s.id);
            return (
              <div key={s.id}>
                <button
                  onClick={() => toggle(s.id)}
                  className="w-full px-5 py-3.5 flex justify-between items-center text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.pinned ? "bg-emerald-500" : "bg-amber-400"}`} />
                      <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 ml-4">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{s.version ?? "—"}</span>
                    {s.pinned ? (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">pinned</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">unpinned</span>
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
                    {s.sourcePath && (
                      <DetailRow label="Source">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{s.sourcePath}</span>
                      </DetailRow>
                    )}
                    {s.files && s.files.length > 0 && (
                      <DetailRow label={`Files (${s.files.length})`}>
                        <div className="flex flex-wrap gap-1.5">
                          {s.files.map((f) => (
                            <span key={f} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono border border-slate-200/50 dark:border-slate-700/50">{f}</span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {s.instructions && (
                      <DetailRow label={`Instructions (${s.instructions.length} chars)`}>
                        <pre className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono border border-slate-200/50 dark:border-slate-700/50">
                          {s.instructions}
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
