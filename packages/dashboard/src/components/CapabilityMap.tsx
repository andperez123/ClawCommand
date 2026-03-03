"use client";

import type { CapabilitiesSummary } from "@clawcommand/shared";

interface Props {
  capabilities: CapabilitiesSummary;
}

export function CapabilityMap({ capabilities }: Props) {
  if (capabilities.agentSkillMap.length === 0 && capabilities.agentMcpMap.length === 0) return null;

  const agents = new Set<string>();
  capabilities.agentSkillMap.forEach((m) => agents.add(m.agent));
  capabilities.agentMcpMap.forEach((m) => agents.add(m.agent));

  const agentData = [...agents].map((name) => ({
    name,
    skills: capabilities.agentSkillMap.find((m) => m.agent === name)?.skills ?? [],
    mcpServers: capabilities.agentMcpMap.find((m) => m.agent === name)?.mcpServers ?? [],
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        Capability Map
      </h3>
      <div className="space-y-4">
        {agentData.map((agent) => (
          <div key={agent.name} className="rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{agent.name}</span>
              </div>
            </div>
            <div className="px-4 py-3 space-y-3">
              {agent.skills.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {agent.skills.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {agent.mcpServers.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">MCP Servers</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {agent.mcpServers.map((m) => (
                      <span key={m} className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
