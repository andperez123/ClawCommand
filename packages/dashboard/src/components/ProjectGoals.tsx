"use client";

import type { ProjectMeta } from "@clawcommand/shared";

interface Props {
  meta: ProjectMeta;
}

export function ProjectGoals({ meta }: Props) {
  if (!meta.goals || meta.goals.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
        </svg>
        Project Goals
      </h3>
      <ul className="space-y-2">
        {meta.goals.map((goal, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500 shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{goal}</span>
          </li>
        ))}
      </ul>
      {meta.scripts && Object.keys(meta.scripts).length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="section-title">Available Scripts</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.keys(meta.scripts).map((s) => (
              <code key={s} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                {s}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
