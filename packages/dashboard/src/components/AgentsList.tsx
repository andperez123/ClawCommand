"use client";

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
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Agents ({agents.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {agents.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No agents discovered</div>
        ) : (
          agents.map((a) => (
            <div key={a.id} className="px-4 py-3 flex justify-between items-center">
              <div className="min-w-0">
                <span className="font-medium text-gray-900 dark:text-gray-100">{a.name}</span>
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
