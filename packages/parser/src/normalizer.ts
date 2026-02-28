/**
 * Snapshot normalizer — produces canonical Snapshot shape with consistent IDs and cross-refs
 */

import type {
  Snapshot,
  AgentRecord,
  SkillRecord,
  McpServerRecord,
  RunRecord,
} from "@clawcommand/shared";
import { slugify } from "@clawcommand/shared";

/**
 * Normalize a snapshot: ensure consistent IDs, defaults, and cross-references
 */
export function normalizeSnapshot(raw: Partial<Snapshot> & { scanId: string; timestamp: string; workspacePath: string }): Snapshot {
  const agents = (raw.agents ?? []).map(normalizeAgent);
  const skills = (raw.skills ?? []).map(normalizeSkill);
  const mcpServers = (raw.mcpServers ?? []).map(normalizeMcpServer);
  const runs = (raw.runs ?? []).map(normalizeRun);

  return {
    scanId: raw.scanId,
    timestamp: raw.timestamp,
    workspacePath: raw.workspacePath,
    agents,
    skills,
    mcpServers,
    ...(runs.length > 0 ? { runs } : {}),
  };
}

function normalizeAgent(a: Partial<AgentRecord> & { name: string }): AgentRecord {
  const id = a.id ?? `agent-${slugify(a.name)}`;
  return {
    id,
    name: a.name,
    sourcePath: a.sourcePath ?? "",
    status: a.status ?? "unknown",
    lastRun: a.lastRun,
    lastErrorSignature: a.lastErrorSignature,
    skillCount: a.skillCount ?? 0,
    mcpDependencies: Array.isArray(a.mcpDependencies) ? a.mcpDependencies : [],
    config: a.config,
  };
}

function normalizeSkill(
  s: Partial<SkillRecord> & { name: string }
): SkillRecord {
  const id = s.id ?? `skill-${slugify(s.name)}`;
  return {
    id,
    name: s.name,
    version: s.version,
    sourcePath: s.sourcePath ?? "",
    pinned: s.pinned ?? false,
    policyApproved: s.policyApproved,
  };
}

function normalizeMcpServer(
  m: Partial<McpServerRecord> & { name: string }
): McpServerRecord {
  const id = m.id ?? `mcp-${slugify(m.name)}`;
  return {
    id,
    name: m.name,
    sourcePath: m.sourcePath ?? "",
    validConfig: m.validConfig ?? true,
    toolCount: typeof m.toolCount === "number" ? m.toolCount : 0,
    authConfigured: m.authConfigured ?? false,
  };
}

function normalizeRun(
  r: Partial<RunRecord> & { agentId: string; timestamp: string; success: boolean }
): RunRecord {
  const id =
    r.id ??
    `run-${slugify(r.agentId)}-${r.timestamp.replace(/[^0-9]/g, "").slice(0, 14)}`;
  return {
    id,
    agentId: r.agentId,
    timestamp: r.timestamp,
    success: r.success,
    errorSignature: r.errorSignature,
    summary: r.summary,
  };
}
