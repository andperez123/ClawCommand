"use client";

import type { EnrichedSnapshot } from "../lib/api";
import { timeAgo } from "../lib/format";

interface Props {
  scan: EnrichedSnapshot;
}

const statCards = [
  {
    key: "agents",
    label: "Agents",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    gradient: "from-indigo-500 to-purple-600",
    bgLight: "bg-indigo-50 dark:bg-indigo-950/40",
    textColor: "text-indigo-600 dark:text-indigo-400",
    getValue: (s: EnrichedSnapshot) => s.agents.length,
  },
  {
    key: "skills",
    label: "Skills",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
    getValue: (s: EnrichedSnapshot) => s.skills.length,
  },
  {
    key: "mcp",
    label: "MCP Servers",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/40",
    textColor: "text-amber-600 dark:text-amber-400",
    getValue: (s: EnrichedSnapshot) => s.mcpServers.length,
  },
  {
    key: "rules",
    label: "Rules",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    gradient: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/40",
    textColor: "text-rose-600 dark:text-rose-400",
    getValue: (s: EnrichedSnapshot) => s.rules?.length ?? 0,
  },
] as const;

export function HeroOverview({ scan }: Props) {
  const compliance = scan.policy?.complianceScore;
  const complianceColor =
    compliance == null ? null :
    compliance >= 100 ? "text-emerald-500" :
    compliance >= 50 ? "text-amber-500" :
    "text-rose-500";

  return (
    <div className="space-y-4">
      {/* Project header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          {scan.projectMeta && (
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {scan.projectMeta.name}
              {scan.projectMeta.version && (
                <span className="ml-2 text-sm font-normal text-slate-400">v{scan.projectMeta.version}</span>
              )}
            </h2>
          )}
          {scan.projectMeta?.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{scan.projectMeta.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {compliance != null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <div className={`w-2 h-2 rounded-full ${compliance >= 100 ? "bg-emerald-500" : compliance >= 50 ? "bg-amber-500" : "bg-rose-500"}`} />
              <span className={`text-sm font-semibold ${complianceColor}`}>
                {Math.round(compliance)}%
              </span>
              <span className="text-xs text-slate-400">compliant</span>
            </div>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Scanned {timeAgo(scan.timestamp)}
          </span>
        </div>
      </div>

      {/* Capabilities banner */}
      {scan.capabilities && (
        <div className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-indigo-200/40 dark:border-indigo-800/40">
          <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
            {scan.capabilities.summary}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const value = card.getValue(scan);
          return (
            <div key={card.key} className="stat-card group">
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${card.gradient} transition-opacity duration-300`} style={{ opacity: 0.03 }} />
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgLight}`}>
                  <div className={card.textColor}>{card.icon}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{card.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
