"use client";

import type { SkillRecord } from "@clawcommand/shared";

interface Props {
  skills: SkillRecord[];
}

export function SkillsList({ skills }: Props) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Skills ({skills.length})
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {skills.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No skills discovered</div>
        ) : (
          skills.map((s) => (
            <div key={s.id} className="px-4 py-3 flex justify-between items-center">
              <span className="text-gray-900 dark:text-gray-100">{s.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {s.version ?? "no version"}
                </span>
                {s.pinned && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    pinned
                  </span>
                )}
                {!s.pinned && !s.version && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    unpinned
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
