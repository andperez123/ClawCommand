/**
 * OpenClaw workspace scanner — read-only, no secrets.
 * Uses @clawcommand/parser for Agent/MCP/skill/run metadata parsing (Milestone 2).
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { Snapshot, AgentRecord, SkillRecord, McpServerRecord, RunRecord } from "@clawcommand/shared";
import { slugify } from "@clawcommand/shared";
import { randomUUID } from "node:crypto";
import {
  parseAgentFromAgentsMd,
  parseAgentFromJson,
  parseAgentsFromOpenClawConfig,
  parseSkillManifest,
  parseMcpConfig,
  parseRunFromLogLine,
  normalizeSnapshot,
} from "@clawcommand/parser";

export interface ScanOptions {
  includeRuns?: boolean;
}

export async function createSnapshot(
  workspacePath: string,
  options: ScanOptions = {}
): Promise<Snapshot> {
  const scanId = randomUUID();
  const timestamp = new Date().toISOString();

  const [agents, skills, mcpServers, runs] = await Promise.all([
    discoverAgents(workspacePath),
    discoverSkills(workspacePath),
    discoverMcpServers(workspacePath),
    options.includeRuns ? discoverRuns(workspacePath) : Promise.resolve([]),
  ]);

  return normalizeSnapshot({
    scanId,
    timestamp,
    workspacePath,
    agents,
    skills,
    mcpServers,
    ...(options.includeRuns && runs.length > 0 ? { runs } : {}),
  });
}

async function discoverAgents(workspacePath: string): Promise<AgentRecord[]> {
  const agents: AgentRecord[] = [];

  // Check project .cursor/AGENTS.md
  try {
    const agentsPath = join(workspacePath, ".cursor", "AGENTS.md");
    const st = await stat(agentsPath);
    if (st.isFile()) {
      const content = await readFile(agentsPath, "utf-8");
      const { name } = parseAgentFromAgentsMd(content);
      agents.push({
        id: `agent-${slugify(name)}`,
        name,
        sourcePath: agentsPath,
        status: "unknown",
        skillCount: 0,
        mcpDependencies: [],
      });
    }
  } catch {
    // ignore
  }

  // Check ~/.openclaw/agents/
  try {
    const agentsDir = join(process.env.HOME ?? homedir(), ".openclaw", "agents");
    const entries = await readdir(agentsDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && (e.name.endsWith(".json") || e.name.endsWith(".md"))) {
        const filePath = join(agentsDir, e.name);
        const content = await readFile(filePath, "utf-8").catch(() => "");
        const parsed = content
          ? e.name.endsWith(".json")
            ? parseAgentFromJson(content, e.name)
            : { name: parseAgentFromAgentsMd(content).name }
          : null;
        const name = parsed?.name ?? e.name.replace(/\.(json|md)$/, "");
        const skills = parsed?.skills ?? [];
        const mcpDeps = parsed?.mcpDependencies ?? [];
        const config = parsed?.config ? sanitizeConfig(parsed.config) : undefined;
        if (!agents.some((x) => x.name === name)) {
          agents.push({
            id: `agent-${slugify(name)}`,
            name,
            sourcePath: filePath,
            status: "unknown",
            skillCount: skills.length,
            mcpDependencies: mcpDeps,
            config,
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // Check openclaw.config.json
  try {
    const configPath = join(workspacePath, "openclaw.config.json");
    const content = await readFile(configPath, "utf-8");
    const parsedAgents = parseAgentsFromOpenClawConfig(content);
    for (const p of parsedAgents) {
      if (!agents.some((x) => x.name === p.name)) {
        agents.push({
          id: `agent-${slugify(p.name)}`,
          name: p.name,
          sourcePath: configPath,
          status: "unknown",
          skillCount: p.skills?.length ?? 0,
          mcpDependencies: p.mcpDependencies ?? [],
          config: p.config ? sanitizeConfig(p.config) : undefined,
        });
      }
    }
  } catch {
    // ignore
  }

  if (agents.length === 0) {
    agents.push({
      id: "agent-default",
      name: "default",
      sourcePath: workspacePath,
      status: "unknown",
      skillCount: 0,
      mcpDependencies: [],
    });
  }

  return agents;
}

async function discoverSkills(workspacePath: string): Promise<SkillRecord[]> {
  const skills = new Map<string, SkillRecord>();

  const home = process.env.HOME ?? homedir();
  const candidates = [
    join(workspacePath, ".cursor", "skills-cursor"),
    join(home, ".cursor", "skills-cursor"),
    join(home, ".openclaw", "skills"),
    join(workspacePath, "skills"),
  ];

  for (const dir of candidates) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const skillPath = join(dir, e.name);
          const manifestPath = join(skillPath, "SKILL.md");
          try {
            const content = await readFile(manifestPath, "utf-8");
            const parsed = parseSkillManifest(content);
            const id = `skill-${slugify(parsed.name ?? e.name)}`;
            if (!skills.has(id)) {
              skills.set(id, {
                id,
                name: parsed.name ?? e.name,
                version: parsed.version,
                sourcePath: skillPath,
                pinned: parsed.pinned,
              });
            }
          } catch {
            const fallbackId = `skill-${slugify(e.name)}`;
            if (!skills.has(fallbackId)) {
              skills.set(fallbackId, {
                id: fallbackId,
                name: e.name,
                sourcePath: skillPath,
                pinned: false,
              });
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return [...skills.values()];
}

async function discoverMcpServers(workspacePath: string): Promise<McpServerRecord[]> {
  const servers = new Map<string, McpServerRecord>();
  const home = process.env.HOME ?? homedir();

  const configPaths = [
    join(home, ".openclaw", "openclaw.json"),
    join(home, ".cursor", "mcp.json"),
    join(workspacePath, ".cursor", "mcp.json"),
  ];

  for (const configPath of configPaths) {
    try {
      const content = await readFile(configPath, "utf-8");
      const parsed = parseMcpConfig(content);
      for (const p of parsed) {
        const id = `mcp-${slugify(p.name)}`;
        if (!servers.has(id)) {
          servers.set(id, {
            id,
            name: p.name,
            sourcePath: configPath,
            validConfig: typeof p.config === "object" && p.config !== null,
            toolCount: p.toolCount,
            authConfigured: p.authConfigured,
          });
        }
      }
    } catch {
      // ignore — config file doesn't exist
    }
  }

  return [...servers.values()];
}

async function discoverRuns(workspacePath: string): Promise<RunRecord[]> {
  const runs: RunRecord[] = [];
  const home = process.env.HOME ?? homedir();
  const logDirs = [
    join(home, ".cursor", "logs"),
    join(workspacePath, ".cursor", "logs"),
  ];
  const seen = new Set<string>();
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  for (const logDir of logDirs) {
    try {
      const entries = await readdir(logDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && (e.name.endsWith(".log") || e.name.endsWith(".json"))) {
          const filePath = join(logDir, e.name);
          const fileStat = await stat(filePath).catch(() => null);
          if (!fileStat || fileStat.size > MAX_FILE_SIZE) continue;
          const content = await readFile(filePath, "utf-8").catch(() => "");
          const lines = content.split(/\r?\n/).filter(Boolean);
          for (const line of lines) {
            const parsed = parseRunFromLogLine(line);
            if (parsed) {
              const key = `${parsed.agentId}:${parsed.timestamp}`;
              if (!seen.has(key)) {
                seen.add(key);
                runs.push({
                  id: `run-${slugify(parsed.agentId)}-${parsed.timestamp.replace(/[^0-9]/g, "").slice(0, 14)}`,
                  agentId: parsed.agentId,
                  timestamp: parsed.timestamp,
                  success: parsed.success,
                  errorSignature: parsed.errorSignature,
                  summary: parsed.summary,
                });
              }
            }
          }
        }
      }
    } catch {
      // ignore — log directory doesn't exist
    }
  }
  runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return runs.slice(0, 100);
}

function sanitizeConfig(obj: unknown): Record<string, unknown> | undefined {
  if (typeof obj !== "object" || obj === null) return undefined;
  const out: Record<string, unknown> = {};
  const secretPatterns = [
    "password",
    "secret",
    "apikey",
    "api_key",
    "credential",
    "private_key",
    "privatekey",
    "passphrase",
    "auth_token",
    "access_key",
    "secret_key",
  ];
  function isSecretKey(key: string): boolean {
    const lower = key.toLowerCase();
    if (lower === "token" || lower === "api_token" || lower === "access_token") return true;
    return secretPatterns.some((s) => lower.includes(s));
  }
  function sanitizeValue(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(sanitizeValue);
    if (typeof v === "object" && v !== null) return sanitizeConfig(v);
    return v;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (isSecretKey(k)) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = sanitizeValue(v);
    }
  }
  return out;
}

