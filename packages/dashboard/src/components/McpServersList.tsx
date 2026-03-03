"use client";

import { useState } from "react";
import type { McpServerRecord } from "@clawcommand/shared";
import { DetailRow } from "./DetailRow";

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
      <h2 className="section-title mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
        </svg>
        MCP Servers ({servers.length})
      </h2>
      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
        {servers.length === 0 ? (
          <div className="px-5 py-4 text-sm text-slate-400 dark:text-slate-500 italic">None configured</div>
        ) : (
          servers.map((m) => {
            const isOpen = expanded.has(m.id);
            return (
              <div key={m.id}>
                <button
                  onClick={() => toggle(m.id)}
                  className="w-full px-5 py-3.5 flex justify-between items-center text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${m.validConfig ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                      {m.transport && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{m.transport}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {m.toolCount > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">{m.toolCount} tools</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${
                      m.validConfig
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50"
                    }`}>
                      {m.validConfig ? "valid" : "invalid"}
                    </span>
                    {m.authConfigured && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50">auth</span>
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
                    {m.sourcePath && (
                      <DetailRow label="Config Source">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{m.sourcePath}</span>
                      </DetailRow>
                    )}
                    {m.command && (
                      <DetailRow label="Command">
                        <code className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 rounded-md px-2.5 py-1 font-mono inline-block border border-slate-200/50 dark:border-slate-700/50">
                          {m.command}{m.args ? " " + m.args.join(" ") : ""}
                        </code>
                      </DetailRow>
                    )}
                    {m.url && (
                      <DetailRow label="URL">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{m.url}</span>
                      </DetailRow>
                    )}
                    {m.envKeys && m.envKeys.length > 0 && (
                      <DetailRow label="Environment Variables">
                        <div className="flex flex-wrap gap-1.5">
                          {m.envKeys.map((k) => (
                            <span key={k} className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-mono border border-amber-200/50 dark:border-amber-800/50">{k}</span>
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
