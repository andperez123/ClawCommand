"use client";

import type { WorkspaceFile, AuditCategory } from "@clawcommand/shared";

interface Props {
  files: WorkspaceFile[];
}

const categoryColors: Record<AuditCategory, string> = {
  identity: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/50",
  operations: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/50",
  memory: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50",
  health: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50",
  config: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WorkspaceFiles({ files }: Props) {
  const grouped = new Map<AuditCategory, WorkspaceFile[]>();
  for (const f of files) {
    const list = grouped.get(f.category) ?? [];
    list.push(f);
    grouped.set(f.category, list);
  }

  const categoryOrder: AuditCategory[] = ["identity", "operations", "memory", "health", "config"];

  return (
    <div>
      <h2 className="section-title mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
        Workspace Files ({files.length})
      </h2>
      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
        {categoryOrder.filter((c) => grouped.has(c)).map((cat) => (
          <div key={cat} className="px-5 py-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`text-xs px-2 py-0.5 rounded-md border ${categoryColors[cat]}`}>{cat}</span>
            </div>
            <div className="space-y-1.5">
              {grouped.get(cat)!.map((f) => (
                <div key={f.path} className="flex items-center gap-3 py-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${f.exists ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                  <span className={`text-sm font-mono flex-1 min-w-0 truncate ${f.exists ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600 line-through"}`}>
                    {f.name}
                  </span>
                  {f.exists && f.sizeBytes != null && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{formatBytes(f.sizeBytes)}</span>
                  )}
                  {!f.exists && (
                    <span className="text-xs text-slate-400 dark:text-slate-600 shrink-0 italic">missing</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
