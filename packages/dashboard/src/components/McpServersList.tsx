"use client";

import type { McpServerRecord } from "@clawcommand/shared";

interface Props {
  servers: McpServerRecord[];
}

export function McpServersList({ servers }: Props) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        MCP Servers ({servers.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {servers.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">None configured</div>
        ) : (
          servers.map((m) => (
            <div key={m.id} className="px-4 py-3 flex justify-between items-center">
              <div className="min-w-0">
                <span className="text-gray-900 dark:text-gray-100">{m.name}</span>
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
