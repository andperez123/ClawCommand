/**
 * OpenClaw workspace scanner — read-only, no secrets.
 * Deep analysis: captures full agent instructions, skill content, MCP details,
 * rules, and run history from every known config location.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import type { Snapshot, AgentRecord, SkillRecord, McpServerRecord, RuleRecord, RunRecord } from "@clawcommand/shared";
import { slugify } from "@clawcommand/shared";
import { randomUUID } from "node:crypto";
import {
  parseAgentFromAgentsMd,
  parseAgentFromJson,
  parseAgentsFromOpenClawConfig,
  parseSkillManifest,
  parseMcpConfig,
  parseRule,
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

  const [agents, skills, mcpServers, rules, runs] = await Promise.all([
    discoverAgents(workspacePath),
    discoverSkills(workspacePath),
    discoverMcpServers(workspacePath),
    discoverRules(workspacePath),
    options.includeRuns ? discoverRuns(workspacePath) : Promise.resolve([]),
  ]);

  return normalizeSnapshot({
    scanId,
    timestamp,
    workspacePath,
    agents,
    skills,
    mcpServers,
    ...(rules.length > 0 ? { rules } : {}),
    ...(options.includeRuns && runs.length > 0 ? { runs } : {}),
  });
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function safeReadFile(p: string): Promise<string | null> {
  try {
    return await readFile(p, "utf-8");
  } catch {
    return null;
  }
}

// ── Agent Discovery ──────────────────────────────────────────────────

async function discoverAgents(workspacePath: string): Promise<AgentRecord[]> {
  const agents: AgentRecord[] = [];

  const agentsMdPaths = [
    join(workspacePath, ".cursor", "AGENTS.md"),
    join(workspacePath, "AGENTS.md"),
  ];
  for (const agentsPath of agentsMdPaths) {
    if (!(await fileExists(agentsPath))) continue;
    const content = await safeReadFile(agentsPath);
    if (!content) continue;
    const parsed = parseAgentFromAgentsMd(content);
    if (!agents.some((x) => x.name === parsed.name)) {
      agents.push({
        id: `agent-${slugify(parsed.name)}`,
        name: parsed.name,
        sourcePath: agentsPath,
        status: "unknown",
        skillCount: parsed.skills?.length ?? 0,
        skills: parsed.skills,
        mcpDependencies: parsed.mcpDependencies ?? [],
        instructions: parsed.instructions,
        sections: parsed.sections,
        description: parsed.description,
      });
    }
  }

  // ~/.openclaw/agents/
  try {
    const agentsDir = join(process.env.HOME ?? homedir(), ".openclaw", "agents");
    if (await dirExists(agentsDir)) {
      const entries = await readdir(agentsDir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isFile() || (!e.name.endsWith(".json") && !e.name.endsWith(".md"))) continue;
        const filePath = join(agentsDir, e.name);
        const content = await safeReadFile(filePath);
        if (!content) continue;

        const parsed = e.name.endsWith(".json")
          ? parseAgentFromJson(content, e.name)
          : parseAgentFromAgentsMd(content);
        if (!parsed) continue;

        const name = parsed.name ?? e.name.replace(/\.(json|md)$/, "");
        if (agents.some((x) => x.name === name)) continue;

        const config = parsed.config ? sanitizeConfig(parsed.config) : undefined;
        agents.push({
          id: `agent-${slugify(name)}`,
          name,
          sourcePath: filePath,
          status: "unknown",
          skillCount: parsed.skills?.length ?? 0,
          skills: parsed.skills,
          mcpDependencies: parsed.mcpDependencies ?? [],
          instructions: parsed.instructions,
          sections: parsed.sections,
          description: parsed.description,
          config,
        });
      }
    }
  } catch { /* ignore */ }

  // openclaw.config.json
  try {
    const configPath = join(workspacePath, "openclaw.config.json");
    const content = await safeReadFile(configPath);
    if (content) {
      const parsedAgents = parseAgentsFromOpenClawConfig(content);
      for (const p of parsedAgents) {
        if (agents.some((x) => x.name === p.name)) continue;
        agents.push({
          id: `agent-${slugify(p.name)}`,
          name: p.name,
          sourcePath: configPath,
          status: "unknown",
          skillCount: p.skills?.length ?? 0,
          skills: p.skills,
          mcpDependencies: p.mcpDependencies ?? [],
          instructions: p.instructions,
          description: p.description,
          config: p.config ? sanitizeConfig(p.config) : undefined,
        });
      }
    }
  } catch { /* ignore */ }

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

// ── Skill Discovery ──────────────────────────────────────────────────

async function discoverSkills(workspacePath: string): Promise<SkillRecord[]> {
  const skills = new Map<string, SkillRecord>();
  const home = process.env.HOME ?? homedir();

  const candidates = [
    join(workspacePath, ".cursor", "skills-cursor"),
    join(workspacePath, ".cursor", "skills"),
    join(home, ".cursor", "skills-cursor"),
    join(home, ".openclaw", "skills"),
    join(workspacePath, "skills"),
  ];

  for (const dir of candidates) {
    if (!(await dirExists(dir))) continue;
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        const skillPath = join(dir, e.name);
        const manifestPath = join(skillPath, "SKILL.md");
        const manifestContent = await safeReadFile(manifestPath);

        const files = await listSkillFiles(skillPath);

        if (manifestContent) {
          const parsed = parseSkillManifest(manifestContent);
          const id = `skill-${slugify(parsed.name ?? e.name)}`;
          if (!skills.has(id)) {
            skills.set(id, {
              id,
              name: parsed.name ?? e.name,
              version: parsed.version,
              sourcePath: skillPath,
              pinned: parsed.pinned,
              description: parsed.description,
              instructions: parsed.instructions,
              files: files.length > 0 ? files : undefined,
            });
          }
        } else {
          const fallbackId = `skill-${slugify(e.name)}`;
          if (!skills.has(fallbackId)) {
            skills.set(fallbackId, {
              id: fallbackId,
              name: e.name,
              sourcePath: skillPath,
              pinned: false,
              files: files.length > 0 ? files : undefined,
            });
          }
        }
      }
    } catch { /* ignore */ }
  }

  return [...skills.values()];
}

async function listSkillFiles(skillPath: string): Promise<string[]> {
  try {
    const entries = await readdir(skillPath, { withFileTypes: true, recursive: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => {
        const parent = e.parentPath ?? e.path ?? "";
        const rel = parent.startsWith(skillPath) ? parent.slice(skillPath.length + 1) : "";
        return rel ? `${rel}/${e.name}` : e.name;
      });
  } catch {
    return [];
  }
}

// ── MCP Server Discovery ─────────────────────────────────────────────

async function discoverMcpServers(workspacePath: string): Promise<McpServerRecord[]> {
  const servers = new Map<string, McpServerRecord>();
  const home = process.env.HOME ?? homedir();

  const configPaths = [
    join(home, ".openclaw", "openclaw.json"),
    join(home, ".openclaw", "mcp.json"),
    join(home, ".cursor", "mcp.json"),
    join(workspacePath, ".cursor", "mcp.json"),
    join(workspacePath, "openclaw.json"),
    join(workspacePath, "mcp.json"),
  ];

  for (const configPath of configPaths) {
    const content = await safeReadFile(configPath);
    if (!content) continue;
    try {
      const parsed = parseMcpConfig(content);
      for (const p of parsed) {
        const id = `mcp-${slugify(p.name)}`;
        if (servers.has(id)) continue;
        servers.set(id, {
          id,
          name: p.name,
          sourcePath: configPath,
          validConfig: typeof p.config === "object" && p.config !== null,
          toolCount: p.toolCount,
          authConfigured: p.authConfigured,
          command: p.command,
          args: p.args,
          envKeys: p.envKeys,
          transport: p.transport,
          url: p.url,
        });
      }
    } catch { /* ignore */ }
  }

  return [...servers.values()];
}

// ── Rule Discovery ───────────────────────────────────────────────────

async function discoverRules(workspacePath: string): Promise<RuleRecord[]> {
  const rules: RuleRecord[] = [];
  const seen = new Set<string>();

  const ruleDirs = [
    join(workspacePath, ".cursor", "rules"),
  ];

  for (const dir of ruleDirs) {
    if (!(await dirExists(dir))) continue;
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isFile()) continue;
        if (!e.name.endsWith(".mdc") && !e.name.endsWith(".md")) continue;
        const filePath = join(dir, e.name);
        const content = await safeReadFile(filePath);
        if (!content) continue;

        const parsed = parseRule(content, e.name);
        const name = parsed.name ?? e.name.replace(/\.mdc?$/, "");
        const id = `rule-${slugify(name)}`;
        if (seen.has(id)) continue;
        seen.add(id);

        rules.push({
          id,
          name,
          sourcePath: filePath,
          description: parsed.description,
          content: parsed.content,
          alwaysApply: parsed.alwaysApply,
          globs: parsed.globs,
        });
      }
    } catch { /* ignore */ }
  }

  return rules;
}

// ── Run Discovery ────────────────────────────────────────────────────

async function discoverRuns(workspacePath: string): Promise<RunRecord[]> {
  const runs: RunRecord[] = [];
  const home = process.env.HOME ?? homedir();
  const logDirs = [
    join(home, ".openclaw", "logs"),
    join(home, ".cursor", "logs"),
    join(workspacePath, ".cursor", "logs"),
  ];
  const seen = new Set<string>();
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  for (const logDir of logDirs) {
    if (!(await dirExists(logDir))) continue;
    try {
      const entries = await readdir(logDir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isFile() || (!e.name.endsWith(".log") && !e.name.endsWith(".json"))) continue;
        const filePath = join(logDir, e.name);
        const fileStat = await stat(filePath).catch(() => null);
        if (!fileStat || fileStat.size > MAX_FILE_SIZE) continue;
        const content = await safeReadFile(filePath);
        if (!content) continue;
        const lines = content.split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          const parsed = parseRunFromLogLine(line);
          if (!parsed) continue;
          const key = `${parsed.agentId}:${parsed.timestamp}`;
          if (seen.has(key)) continue;
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
    } catch { /* ignore */ }
  }

  runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return runs.slice(0, 100);
}

// ── Secret Sanitization ──────────────────────────────────────────────

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
