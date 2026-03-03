"use client";

import { useState } from "react";
import type { AuditResult, AuditCategory } from "@clawcommand/shared";

interface Props {
  audit: AuditResult;
}

const severityConfig: Record<string, { badge: string; icon: string; dot: string; order: number }> = {
  critical: { badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50", icon: "text-rose-500", dot: "bg-rose-500", order: 0 },
  high: { badge: "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50", icon: "text-orange-500", dot: "bg-orange-500", order: 1 },
  medium: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50", icon: "text-amber-500", dot: "bg-amber-500", order: 2 },
  low: { badge: "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200/50 dark:border-sky-800/50", icon: "text-sky-500", dot: "bg-sky-400", order: 3 },
  info: { badge: "bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50", icon: "text-slate-400", dot: "bg-slate-400", order: 4 },
};

const categoryLabels: Record<AuditCategory, { label: string; color: string; icon: JSX.Element }> = {
  identity: {
    label: "Identity Core",
    color: "text-violet-500",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>,
  },
  operations: {
    label: "Operational Rules",
    color: "text-indigo-500",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" /></svg>,
  },
  memory: {
    label: "Memory System",
    color: "text-emerald-500",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
  },
  health: {
    label: "Health & Performance",
    color: "text-amber-500",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>,
  },
  config: {
    label: "Configuration & Security",
    color: "text-rose-500",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
  },
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export function AuditPanel({ audit }: Props) {
  const [filter, setFilter] = useState<AuditCategory | "all">("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const sortedFindings = [...audit.findings].sort(
    (a, b) => (severityConfig[a.severity]?.order ?? 4) - (severityConfig[b.severity]?.order ?? 4)
  );

  const filtered = filter === "all" ? sortedFindings : sortedFindings.filter((f) => f.category === filter);

  const critCount = audit.findings.filter((f) => f.severity === "critical").length;
  const highCount = audit.findings.filter((f) => f.severity === "high").length;
  const medCount = audit.findings.filter((f) => f.severity === "medium").length;

  return (
    <div className="space-y-5">
      {/* Health score header */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" className={`${scoreBg(audit.healthScore).replace("bg-", "stroke-")}`} strokeWidth="3"
                  strokeDasharray={`${audit.healthScore} ${100 - audit.healthScore}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${scoreColor(audit.healthScore)}`}>{audit.healthScore}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Workspace Health Score</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {audit.findings.length === 0
                  ? "No issues found — your workspace is clean"
                  : `${audit.findings.length} finding${audit.findings.length !== 1 ? "s" : ""} across ${Object.keys(audit.categoryScores).length} categories`}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {critCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-rose-600 dark:text-rose-400">{critCount}</span>
                <span className="text-slate-400">critical</span>
              </div>
            )}
            {highCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="font-semibold text-orange-600 dark:text-orange-400">{highCount}</span>
                <span className="text-slate-400">high</span>
              </div>
            )}
            {medCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-semibold text-amber-600 dark:text-amber-400">{medCount}</span>
                <span className="text-slate-400">medium</span>
              </div>
            )}
          </div>
        </div>

        {/* Category score bars */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {(Object.entries(categoryLabels) as [AuditCategory, typeof categoryLabels[AuditCategory]][]).map(([cat, meta]) => {
            const catScore = audit.categoryScores[cat];
            const score = catScore?.score ?? 100;
            return (
              <button key={cat} onClick={() => setFilter(filter === cat ? "all" : cat)}
                className={`text-left p-3 rounded-lg border transition-all ${filter === cat ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30" : "border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={meta.color}>{meta.icon}</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">{meta.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${scoreBg(score)}`} style={{ width: `${score}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${scoreColor(score)}`}>{score}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Findings list */}
      {filtered.length > 0 && (
        <div>
          <h3 className="section-title mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {filter === "all" ? "All Findings" : categoryLabels[filter].label}
            ({filtered.length})
          </h3>
          <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.map((f) => {
              const sev = severityConfig[f.severity] ?? severityConfig.info;
              const isOpen = expandedIds.has(f.id);
              return (
                <div key={f.id}>
                  <button onClick={() => toggle(f.id)}
                    className="w-full px-5 py-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${sev.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-md border ${sev.badge}`}>{f.severity}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{f.file}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5">{f.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{f.description}</p>
                      </div>
                      <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 ml-[1.625rem] space-y-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="pt-3">
                        <span className="section-title">Recommended Action</span>
                        <div className="mt-2 px-3 py-2.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/40 dark:border-indigo-800/40">
                          <p className="text-sm text-indigo-700 dark:text-indigo-300">{f.action}</p>
                        </div>
                      </div>
                      {f.evidence && (
                        <div>
                          <span className="section-title">Evidence</span>
                          <code className="block mt-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2.5 font-mono border border-slate-200/50 dark:border-slate-700/50">
                            {f.evidence}
                          </code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {audit.findings.length === 0 && (
        <div className="glass-card px-5 py-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Workspace audit passed</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No issues detected across all categories</p>
        </div>
      )}
    </div>
  );
}
