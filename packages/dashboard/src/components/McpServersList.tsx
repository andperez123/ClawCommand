"use client";

import { useState } from "react";
import type { McpServerRecord } from "@clawcommand/shared";

interface Props {
  servers: McpServerRecord[];
}

export function McpServersList({ servers }: Props) {
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
        MCP Servers ({servers.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {servers.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">None configured</div>
        ) : (
          servers.map((m) => {
            const isOpen = expanded.has(m.id);
            return (
              <div key={m.id}>
                <button
                  onClick={() => toggle(m.id)}
                  className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-gray-900 dark:text-gray-100">{m.name}</span>
                    {m.transport && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{m.transport}</span>
                    )}
                    {m.toolCount > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                        {m.toolCount} tools
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        m.validConfig
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {m.validConfig ? "valid" : "invalid"}
                    </span>
                    {m.authConfigured && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        auth
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
                    {m.sourcePath && (
                      <DetailRow label="Config Source">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{m.sourcePath}</span>
                      </DetailRow>
                    )}
                    {m.command && (
                      <DetailRow label="Command">
                        <code className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 font-mono">
                          {m.command}{m.args ? " " + m.args.join(" ") : ""}
                        </code>
                      </DetailRow>
                    )}
                    {m.url && (
                      <DetailRow label="URL">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{m.url}</span>
                      </DetailRow>
                    )}
                    {m.envKeys && m.envKeys.length > 0 && (
                      <DetailRow label="Environment Variables">
                        <div className="flex flex-wrap gap-1">
                          {m.envKeys.map((k) => (
                            <span key={k} className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-mono">
                              {k}
                            </span>
                          ))}
                        </div>
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
