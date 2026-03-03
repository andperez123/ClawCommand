"use client";

import { useState } from "react";
import type { AgentRecord } from "@clawcommand/shared";
import { DetailRow } from "./DetailRow";

interface Props {
  agents: AgentRecord[];
}

const statusStyles: Record<string, { dot: string; badge: string }> = {
  active: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50" },
  stale: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50" },
  error: { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50" },
  unknown: { dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50" },
};

export function AgentsList({ agents }: Props) {
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
        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        Agents ({agents.length})
      </h2>
      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
        {agents.length === 0 ? (
          <div className="px-5 py-4 text-sm text-slate-400 dark:text-slate-500 italic">No agents discovered</div>
        ) : (
          agents.map((a) => {
            const isOpen = expanded.has(a.id);
            const s = statusStyles[a.status] ?? statusStyles.unknown;
            return (
              <div key={a.id}>
                <button
                  onClick={() => toggle(a.id)}
                  className="w-full px-5 py-3.5 flex justify-between items-center text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="font-semibold text-slate-900 dark:text-white">{a.name}</span>
                    </div>
                    {a.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 ml-4">{a.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${s.badge}`}>{a.status}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{a.skillCount} skills</span>
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
                    {a.sourcePath && (
                      <DetailRow label="Source">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{a.sourcePath}</span>
                      </DetailRow>
                    )}
                    {a.sections && a.sections.length > 0 && (
                      <DetailRow label="Sections">
                        <div className="flex flex-wrap gap-1.5">
                          {a.sections.map((sec) => (
                            <span key={sec} className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">{sec}</span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {a.skills && a.skills.length > 0 && (
                      <DetailRow label="Skills">
                        <div className="flex flex-wrap gap-1.5">
                          {a.skills.map((sk) => (
                            <span key={sk} className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">{sk}</span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {a.mcpDependencies.length > 0 && (
                      <DetailRow label="MCP Dependencies">
                        <div className="flex flex-wrap gap-1.5">
                          {a.mcpDependencies.map((m) => (
                            <span key={m} className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">{m}</span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {a.instructions && (
                      <DetailRow label={`Instructions (${a.instructions.length} chars)`}>
                        <pre className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono border border-slate-200/50 dark:border-slate-700/50">
                          {a.instructions}
                        </pre>
                      </DetailRow>
                    )}
                    {a.config && Object.keys(a.config).length > 0 && (
                      <DetailRow label="Config">
                        <pre className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 rounded-lg p-3 max-h-48 overflow-auto whitespace-pre-wrap font-mono border border-slate-200/50 dark:border-slate-700/50">
                          {JSON.stringify(a.config, null, 2)}
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
