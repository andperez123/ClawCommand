"use client";

import { useState } from "react";
import type { AgentRecord } from "@clawcommand/shared";

interface Props {
  agents: AgentRecord[];
}

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  stale: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  unknown: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
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
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Agents ({agents.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {agents.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No agents discovered</div>
        ) : (
          agents.map((a) => {
            const isOpen = expanded.has(a.id);
            return (
              <div key={a.id}>
                <button
                  onClick={() => toggle(a.id)}
                  className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{a.name}</span>
                    {a.description && (
                      <span className="block text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {a.description}
                      </span>
                    )}
                    {a.sourcePath && (
                      <span className="block text-xs text-gray-400 dark:text-gray-500 truncate" title={a.sourcePath}>
                        {a.sourcePath}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor[a.status] ?? statusColor.unknown}`}>
                      {a.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{a.skillCount} skills</span>
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
                    {a.sections && a.sections.length > 0 && (
                      <DetailRow label="Sections">
                        <div className="flex flex-wrap gap-1">
                          {a.sections.map((s) => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {a.skills && a.skills.length > 0 && (
                      <DetailRow label="Skills">
                        <div className="flex flex-wrap gap-1">
                          {a.skills.map((s) => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {a.mcpDependencies.length > 0 && (
                      <DetailRow label="MCP Dependencies">
                        <div className="flex flex-wrap gap-1">
                          {a.mcpDependencies.map((m) => (
                            <span key={m} className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              {m}
                            </span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                    {a.instructions && (
                      <DetailRow label={`Instructions (${a.instructions.length} chars)`}>
                        <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono">
                          {a.instructions}
                        </pre>
                      </DetailRow>
                    )}
                    {a.config && Object.keys(a.config).length > 0 && (
                      <DetailRow label="Config">
                        <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-3 max-h-48 overflow-auto whitespace-pre-wrap font-mono">
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pt-3">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
