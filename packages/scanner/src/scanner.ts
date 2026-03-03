/**
 * OpenClaw workspace scanner — read-only, no secrets.
 * Deep analysis: captures full agent instructions, skill content, MCP details,
 * rules, and run history from every known config location.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import type {
  Snapshot, AgentRecord, SkillRecord, McpServerRecord, RuleRecord, RunRecord,
  ProjectMeta, GitActivity, GitCommit, TranscriptSummary, TranscriptSession, CapabilitiesSummary,
  AuditResult, AuditFinding, AuditCategory, WorkspaceFile,
} from "@clawcommand/shared";
import { slugify } from "@clawcommand/shared";
import { execFile } from "node:child_process";
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

  const [agents, skills, mcpServers, rules, runs, projectMeta, gitActivity, transcriptSummary] = await Promise.all([
    discoverAgents(workspacePath),
    discoverSkills(workspacePath),
    discoverMcpServers(workspacePath),
    discoverRules(workspacePath),
    options.includeRuns ? discoverRuns(workspacePath) : Promise.resolve([]),
    discoverProjectMeta(workspacePath),
    discoverGitActivity(workspacePath),
    discoverTranscripts(workspacePath),
  ]);

  const capabilities = buildCapabilities(agents, skills, mcpServers, rules);
  const audit = await auditWorkspace(workspacePath, agents, skills, mcpServers);

  return normalizeSnapshot({
    scanId,
    timestamp,
    workspacePath,
    agents,
    skills,
    mcpServers,
    ...(rules.length > 0 ? { rules } : {}),
    ...(options.includeRuns && runs.length > 0 ? { runs } : {}),
    ...(projectMeta ? { projectMeta } : {}),
    ...(gitActivity ? { gitActivity } : {}),
    ...(transcriptSummary ? { transcriptSummary } : {}),
    capabilities,
    audit,
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

// ── Project Meta Discovery ────────────────────────────────────────────

async function discoverProjectMeta(workspacePath: string): Promise<ProjectMeta | null> {
  try {
    const pkgPath = join(workspacePath, "package.json");
    const pkgContent = await safeReadFile(pkgPath);
    let meta: ProjectMeta | null = null;

    if (pkgContent) {
      const pkg = JSON.parse(pkgContent);
      meta = {
        name: pkg.name ?? basename(workspacePath),
        description: pkg.description,
        version: pkg.version,
        scripts: pkg.scripts ? Object.fromEntries(
          Object.entries(pkg.scripts as Record<string, string>).slice(0, 30)
        ) : undefined,
        dependencies: pkg.dependencies ? Object.keys(pkg.dependencies).length : 0,
        devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies).length : 0,
      };
    } else {
      meta = { name: basename(workspacePath) };
    }

    const readmePaths = ["README.md", "readme.md", "Readme.md"];
    for (const p of readmePaths) {
      const content = await safeReadFile(join(workspacePath, p));
      if (content) {
        meta.readme = content.slice(0, 4000);
        const goals = extractGoals(content);
        if (goals.length > 0) meta.goals = goals;
        break;
      }
    }

    return meta;
  } catch {
    return null;
  }
}

function extractGoals(readme: string): string[] {
  const goals: string[] = [];
  const lines = readme.split(/\r?\n/);
  let capturing = false;
  for (const line of lines) {
    if (/^#{1,3}\s.*(objective|goal|purpose|overview|about|what)/i.test(line)) {
      capturing = true;
      continue;
    }
    if (capturing && /^#{1,3}\s/.test(line)) break;
    if (capturing) {
      const trimmed = line.replace(/^[-*]\s*/, "").trim();
      if (trimmed.length > 5) goals.push(trimmed);
    }
  }
  return goals.slice(0, 10);
}

// ── Git Activity Discovery ────────────────────────────────────────────

function execGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, maxBuffer: 2 * 1024 * 1024, timeout: 10000 }, (err, stdout) => {
      resolve(err ? "" : stdout.trim());
    });
  });
}

async function discoverGitActivity(workspacePath: string): Promise<GitActivity | null> {
  try {
    const isGit = await dirExists(join(workspacePath, ".git"));
    if (!isGit) return null;

    const logOutput = await execGit(
      ["log", "--pretty=format:%H|%an|%aI|%s", "--numstat", "-50"],
      workspacePath
    );
    if (!logOutput) return null;

    const commits: GitCommit[] = [];
    const allFiles = new Set<string>();
    const authorCounts = new Map<string, number>();
    const days = new Set<string>();

    const blocks = logOutput.split(/\n(?=[0-9a-f]{40}\|)/);
    for (const block of blocks) {
      const lines = block.split("\n");
      const headerLine = lines[0];
      const parts = headerLine.split("|");
      if (parts.length < 4) continue;

      const [hash, author, date, ...msgParts] = parts;
      const message = msgParts.join("|");

      let filesChanged = 0;
      for (let i = 1; i < lines.length; i++) {
        const fLine = lines[i].trim();
        if (!fLine) continue;
        const fParts = fLine.split("\t");
        if (fParts.length >= 3) {
          filesChanged++;
          allFiles.add(fParts[2]);
        }
      }

      commits.push({ hash: hash.slice(0, 8), author, date, message, filesChanged });
      authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
      days.add(date.slice(0, 10));
    }

    const topAuthors = [...authorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, commits: count }));

    return {
      totalCommits: commits.length,
      recentCommits: commits.slice(0, 20),
      activeDays: days.size,
      topAuthors,
      firstCommitDate: commits.length > 0 ? commits[commits.length - 1].date : undefined,
      lastCommitDate: commits.length > 0 ? commits[0].date : undefined,
      filesChanged: [...allFiles].slice(0, 200),
    };
  } catch {
    return null;
  }
}

// ── Transcript Discovery ──────────────────────────────────────────────

async function discoverTranscripts(workspacePath: string): Promise<TranscriptSummary | null> {
  try {
    const home = process.env.HOME ?? homedir();
    const candidates = [
      join(home, ".cursor", "projects"),
    ];

    const sessions: TranscriptSession[] = [];

    for (const projDir of candidates) {
      if (!(await dirExists(projDir))) continue;
      try {
        const projects = await readdir(projDir, { withFileTypes: true });
        for (const proj of projects) {
          if (!proj.isDirectory()) continue;
          const transcriptsDir = join(projDir, proj.name, "agent-transcripts");
          if (!(await dirExists(transcriptsDir))) continue;
          const files = await readdir(transcriptsDir, { withFileTypes: true });
          for (const f of files) {
            if (!f.isFile() || !f.name.endsWith(".jsonl")) continue;
            const filePath = join(transcriptsDir, f.name);
            const fileStat = await stat(filePath).catch(() => null);
            if (!fileStat) continue;

            const id = f.name.replace(".jsonl", "");
            let title: string | undefined;
            let messageCount = 0;

            const content = await safeReadFile(filePath);
            if (content) {
              const lines = content.split("\n").filter(Boolean);
              messageCount = lines.length;
              for (const line of lines.slice(0, 5)) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.type === "user" && parsed.message) {
                    title = (parsed.message as string).slice(0, 100);
                    break;
                  }
                  if (parsed.role === "user" && parsed.content) {
                    title = (typeof parsed.content === "string" ? parsed.content : "").slice(0, 100);
                    break;
                  }
                } catch { /* skip */ }
              }
            }

            sessions.push({
              id,
              title,
              timestamp: fileStat.mtime.toISOString(),
              messageCount,
            });
          }
        }
      } catch { /* skip */ }
    }

    if (sessions.length === 0) return null;

    sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const earliest = sessions[sessions.length - 1].timestamp;
    const latest = sessions[0].timestamp;

    return {
      totalSessions: sessions.length,
      recentSessions: sessions.slice(0, 20),
      dateRange: { earliest, latest },
    };
  } catch {
    return null;
  }
}

// ── Capabilities Builder ──────────────────────────────────────────────

function buildCapabilities(
  agents: AgentRecord[],
  skills: SkillRecord[],
  mcpServers: McpServerRecord[],
  rules: RuleRecord[],
): CapabilitiesSummary {
  const totalTools = mcpServers.reduce((sum, m) => sum + m.toolCount, 0);

  const agentSkillMap = agents
    .filter((a) => a.skills && a.skills.length > 0)
    .map((a) => ({ agent: a.name, skills: a.skills ?? [] }));

  const agentMcpMap = agents
    .filter((a) => a.mcpDependencies.length > 0)
    .map((a) => ({ agent: a.name, mcpServers: a.mcpDependencies }));

  const parts: string[] = [];
  parts.push(`${agents.length} agent${agents.length !== 1 ? "s" : ""}`);
  parts.push(`${skills.length} skill${skills.length !== 1 ? "s" : ""}`);
  parts.push(`${mcpServers.length} MCP server${mcpServers.length !== 1 ? "s" : ""}`);
  if (rules.length > 0) parts.push(`${rules.length} rule${rules.length !== 1 ? "s" : ""}`);
  if (totalTools > 0) parts.push(`${totalTools} tool${totalTools !== 1 ? "s" : ""}`);

  return {
    agentCount: agents.length,
    skillCount: skills.length,
    mcpServerCount: mcpServers.length,
    ruleCount: rules.length,
    totalTools,
    summary: `This environment has ${parts.join(", ")}`,
    agentSkillMap,
    agentMcpMap,
  };
}

// ── Workspace Audit Engine ────────────────────────────────────────────

interface FileSpec {
  name: string;
  category: AuditCategory;
  paths: string[];
}

async function auditWorkspace(
  workspacePath: string,
  agents: AgentRecord[],
  skills: SkillRecord[],
  mcpServers: McpServerRecord[],
): Promise<AuditResult> {
  const home = process.env.HOME ?? homedir();
  const findings: AuditFinding[] = [];
  const files: WorkspaceFile[] = [];
  let findingIdx = 0;
  const fid = () => `audit-${++findingIdx}`;

  const fileSpecs: FileSpec[] = [
    { name: "SOUL.md", category: "identity", paths: [join(workspacePath, "SOUL.md"), join(workspacePath, ".openclaw", "SOUL.md")] },
    { name: "IDENTITY.md", category: "identity", paths: [join(workspacePath, "IDENTITY.md"), join(workspacePath, ".openclaw", "IDENTITY.md")] },
    { name: "AGENTS.md", category: "operations", paths: [join(workspacePath, ".cursor", "AGENTS.md"), join(workspacePath, "AGENTS.md")] },
    { name: "TOOLS.md", category: "operations", paths: [join(workspacePath, "TOOLS.md"), join(workspacePath, ".openclaw", "TOOLS.md")] },
    { name: "MEMORY.md", category: "memory", paths: [join(workspacePath, "MEMORY.md"), join(workspacePath, ".openclaw", "MEMORY.md")] },
    { name: "HEARTBEAT.md", category: "health", paths: [join(workspacePath, "HEARTBEAT.md"), join(workspacePath, ".openclaw", "HEARTBEAT.md")] },
    { name: "openclaw.json", category: "config", paths: [join(workspacePath, "openclaw.json"), join(workspacePath, ".cursor", "openclaw.json"), join(home, ".openclaw", "openclaw.json")] },
    { name: ".env", category: "config", paths: [join(workspacePath, ".env")] },
    { name: ".gitignore", category: "config", paths: [join(workspacePath, ".gitignore")] },
  ];

  for (const spec of fileSpecs) {
    let found = false;
    for (const p of spec.paths) {
      const content = await safeReadFile(p);
      if (content !== null) {
        const fileStat = await stat(p).catch(() => null);
        files.push({
          path: p,
          name: spec.name,
          category: spec.category,
          exists: true,
          sizeBytes: fileStat?.size ?? content.length,
          snippet: content.slice(0, 200),
        });
        found = true;
        break;
      }
    }
    if (!found) {
      files.push({ path: spec.paths[0], name: spec.name, category: spec.category, exists: false });
    }
  }

  // Also check for memory/ daily logs
  const memoryDir = join(workspacePath, "memory");
  if (await dirExists(memoryDir)) {
    try {
      const entries = await readdir(memoryDir, { withFileTypes: true });
      const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".md"));
      for (const e of mdFiles.slice(0, 10)) {
        const p = join(memoryDir, e.name);
        const fileStat = await stat(p).catch(() => null);
        files.push({
          path: p, name: `memory/${e.name}`, category: "memory",
          exists: true, sizeBytes: fileStat?.size,
        });
      }
    } catch { /* skip */ }
  }

  // ── Run audits ──────────────────────────────────────────────────────

  const getFile = (name: string) => files.find((f) => f.name === name);
  const getContent = async (name: string) => {
    const f = getFile(name);
    return f?.exists ? await safeReadFile(f.path) : null;
  };

  // SOUL.md audit
  const soulFile = getFile("SOUL.md");
  if (!soulFile?.exists) {
    findings.push({ id: fid(), severity: "medium", category: "identity", file: "SOUL.md",
      title: "No SOUL.md found",
      description: "Your agent has no behavioral core defined. Without SOUL.md, the agent has no explicit tone, ethics, or unbreakable rules — making it more susceptible to personality bleed and prompt injection.",
      action: "Create SOUL.md with explicit behavioral constraints: tone, ethics, safety boundaries, and unbreakable rules." });
  } else {
    const soulContent = await getContent("SOUL.md");
    if (soulContent) {
      if (soulContent.length < 100) {
        findings.push({ id: fid(), severity: "medium", category: "identity", file: "SOUL.md",
          title: "SOUL.md is too sparse",
          description: `Only ${soulContent.length} characters. Vague behavioral definitions lead to personality bleed — the agent may become too chatty, ignore safety constraints, or drift from intended behavior.`,
          action: "Expand SOUL.md with specific rules: define tone (formal/casual), list prohibited behaviors, specify safety constraints explicitly." });
      }
      if (!/\b(never|must not|forbidden|prohibited|do not|don't)\b/i.test(soulContent)) {
        findings.push({ id: fid(), severity: "low", category: "identity", file: "SOUL.md",
          title: "No explicit prohibitions in SOUL.md",
          description: "SOUL.md lacks clear negative constraints (words like 'never', 'must not', 'forbidden'). Without hard boundaries, the agent may interpret instructions loosely.",
          action: "Add a 'Boundaries' section with explicit prohibitions: what the agent must NEVER do." });
      }
    }
  }

  // IDENTITY.md audit
  const identityFile = getFile("IDENTITY.md");
  if (!identityFile?.exists) {
    findings.push({ id: fid(), severity: "low", category: "identity", file: "IDENTITY.md",
      title: "No IDENTITY.md found",
      description: "No explicit agent identity defined. The agent may default to a 'General Assistant' persona, which is more prone to prompt injection than a tightly-scoped role.",
      action: "Create IDENTITY.md with: Name, Role (be specific — e.g. 'ReadOnly Data Analyst' not 'Assistant'), and Scope boundaries." });
  } else {
    const idContent = await getContent("IDENTITY.md");
    if (idContent) {
      if (/\b(general\s*assistant|helpful\s*assistant|ai\s*assistant)\b/i.test(idContent)) {
        findings.push({ id: fid(), severity: "medium", category: "identity", file: "IDENTITY.md",
          title: "Agent role is too generic",
          description: "The identity uses a broad role like 'General Assistant'. Generic roles are significantly more prone to prompt injection because the agent accepts a wider range of instructions.",
          action: "Narrow the role to a specific function: e.g. 'Backend Code Reviewer', 'DevOps Monitor', 'Security Audit Agent'.",
          evidence: idContent.slice(0, 200) });
      }
    }
  }

  // AGENTS.md audit
  const agentsContent = await getContent("AGENTS.md");
  if (agentsContent) {
    const lower = agentsContent.toLowerCase();
    if (!/\b(ask\s*(first|before|permission)|confirm\s*before|approval\s*required|human.in.the.loop)\b/i.test(agentsContent)) {
      findings.push({ id: fid(), severity: "high", category: "operations", file: "AGENTS.md",
        title: "Missing 'Ask First' safety rule",
        description: "AGENTS.md has no instruction requiring the agent to confirm before external data transmission. Without this, the agent could send data to email, Slack, webhooks, or APIs without your knowledge.",
        action: "Add to AGENTS.md Safety section: 'Always confirm with the user before sending any data to external services (email, Slack, webhooks, APIs).'" });
    }
    if (!/\b(safety|security|boundaries|restrictions)\b/i.test(lower)) {
      findings.push({ id: fid(), severity: "medium", category: "operations", file: "AGENTS.md",
        title: "No Safety section in AGENTS.md",
        description: "AGENTS.md has no dedicated safety or security section. The SOP should explicitly define operational boundaries.",
        action: "Add a '## Safety' section that covers: data handling rules, external communication policy, file access boundaries." });
    }
    if (!/\b(external|internal)\b/i.test(lower)) {
      findings.push({ id: fid(), severity: "low", category: "operations", file: "AGENTS.md",
        title: "No External vs Internal distinction",
        description: "AGENTS.md doesn't distinguish between external and internal actions. The agent needs clear boundaries on what can happen locally vs. what touches the network.",
        action: "Add an 'External vs Internal' section defining which actions are local-only and which may contact external services." });
    }
  } else if (agents.length > 0) {
    findings.push({ id: fid(), severity: "medium", category: "operations", file: "AGENTS.md",
      title: "Agents exist but no AGENTS.md SOP",
      description: `Found ${agents.length} agent(s) but no AGENTS.md to define their standard operating procedure. Without an SOP, agents run without structured guidelines.`,
      action: "Create AGENTS.md with: session startup procedure, safety rules, external communication policy, and task boundaries." });
  }

  // TOOLS.md audit — check for hardcoded secrets
  const toolsContent = await getContent("TOOLS.md");
  if (toolsContent) {
    const secretPatterns = [
      { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[A-Za-z0-9_\-]{20,}/i, label: "API key" },
      { pattern: /(?:password|passwd)\s*[:=]\s*["']?[^\s"']{8,}/i, label: "Password" },
      { pattern: /(?:secret|token)\s*[:=]\s*["']?[A-Za-z0-9_\-]{20,}/i, label: "Secret/Token" },
      { pattern: /(?:sk|pk)[-_][a-zA-Z0-9]{20,}/i, label: "API secret key (sk-/pk-)" },
      { pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}/i, label: "GitHub token" },
      { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i, label: "Private key" },
    ];
    for (const { pattern, label } of secretPatterns) {
      if (pattern.test(toolsContent)) {
        findings.push({ id: fid(), severity: "critical", category: "operations", file: "TOOLS.md",
          title: `Possible ${label} hardcoded in TOOLS.md`,
          description: `TOOLS.md appears to contain a hardcoded ${label}. Secrets in plain-text files can be leaked through git history, agent context, or log files.`,
          action: `Remove the ${label} from TOOLS.md immediately. Store secrets in .env or your system keychain, and reference them by variable name only.` });
      }
    }
  }

  // MEMORY.md audit
  const memoryFile = getFile("MEMORY.md");
  if (memoryFile?.exists) {
    const memContent = await getContent("MEMORY.md");
    if (memContent && memContent.length > 50000) {
      findings.push({ id: fid(), severity: "medium", category: "memory", file: "MEMORY.md",
        title: "MEMORY.md is very large",
        description: `MEMORY.md is ${Math.round(memContent.length / 1024)}KB. Large memory files consume excessive tokens every session, increasing costs and reducing the context window available for actual work.`,
        action: "Distill MEMORY.md to key decisions and preferences only. Move historical details to dated files in memory/ directory." });
    }
    if (/\b(main_session\s*:\s*false|group|channel|discord|slack)\b/i.test(memContent ?? "")) {
      findings.push({ id: fid(), severity: "high", category: "memory", file: "MEMORY.md",
        title: "MEMORY.md may be exposed to group contexts",
        description: "MEMORY.md references group chats or non-main sessions. If loaded in shared contexts (Discord, Slack channels), your personal preferences and decisions could leak to other users.",
        action: "Restrict MEMORY.md loading to main_session: true. Create separate, sanitized context files for group/channel interactions." });
    }
  }

  // memory/ daily logs — context bloat check
  const memoryLogs = files.filter((f) => f.name.startsWith("memory/") && f.exists);
  for (const log of memoryLogs) {
    if (log.sizeBytes && log.sizeBytes > 100 * 1024) {
      findings.push({ id: fid(), severity: "medium", category: "memory", file: log.name,
        title: `Daily log ${log.name} is bloated (${Math.round(log.sizeBytes / 1024)}KB)`,
        description: "Daily memory logs over 100KB cause context bloat — the agent spends too many tokens reading them, increasing API costs and reducing effective context window.",
        action: "Summarize this log file to under 100KB. Keep only key decisions and action items; archive verbose details separately." });
    }
  }

  // HEARTBEAT.md audit
  const heartbeatFile = getFile("HEARTBEAT.md");
  if (heartbeatFile?.exists && heartbeatFile.sizeBytes) {
    const hbContent = await getContent("HEARTBEAT.md");
    if (hbContent && hbContent.length > 500) {
      findings.push({ id: fid(), severity: "medium", category: "health", file: "HEARTBEAT.md",
        title: `HEARTBEAT.md is too large (${hbContent.length} chars)`,
        description: "HEARTBEAT.md should be under 500 characters. Since it's read every 15-30 minutes during heartbeat cycles, a large file will significantly increase your API costs.",
        action: "Trim HEARTBEAT.md to essential checks only. Move complex logic to AGENTS.md and reference it, don't inline it." });
    }
  }

  // openclaw.json audit — network exposure
  const openclawContent = await getContent("openclaw.json");
  if (openclawContent) {
    try {
      const cfg = JSON.parse(openclawContent);
      if (cfg.bind === "0.0.0.0") {
        findings.push({ id: fid(), severity: "critical", category: "config", file: "openclaw.json",
          title: "Network binding on 0.0.0.0 — exposed to all interfaces",
          description: "openclaw.json has bind: \"0.0.0.0\" which exposes the agent to all network interfaces, including public ones. Anyone on your network can reach this service.",
          action: "Change bind to \"127.0.0.1\" in openclaw.json to restrict access to localhost only.",
          evidence: "bind: \"0.0.0.0\"" });
      }
      if (cfg.auth === false || cfg.authentication === false) {
        findings.push({ id: fid(), severity: "high", category: "config", file: "openclaw.json",
          title: "Authentication is disabled",
          description: "openclaw.json has authentication explicitly disabled. Anyone who can reach the service can control it.",
          action: "Enable authentication in openclaw.json and set a strong token." });
      }
    } catch { /* not valid JSON, skip */ }
  }

  // .env in .gitignore check
  const envFile = getFile(".env");
  const gitignoreFile = getFile(".gitignore");
  if (envFile?.exists) {
    const gitignoreContent = gitignoreFile?.exists ? await getContent(".gitignore") : null;
    if (!gitignoreContent || !gitignoreContent.includes(".env")) {
      findings.push({ id: fid(), severity: "critical", category: "config", file: ".env",
        title: ".env file exists but is NOT in .gitignore",
        description: "Your .env file contains secrets (API keys, tokens, passwords). Without .gitignore protection, these will be committed to git and potentially pushed to a public repository.",
        action: "Add .env to .gitignore immediately: echo '.env' >> .gitignore",
        evidence: ".env found at: " + (envFile.path) });
    }
  }

  // Skill version pinning (enhanced from policy engine)
  const unpinnedSkills = skills.filter((s) => !s.pinned && !s.version);
  if (unpinnedSkills.length > 0) {
    findings.push({ id: fid(), severity: "medium", category: "health", file: "SKILL.md",
      title: `${unpinnedSkills.length} unpinned skill${unpinnedSkills.length !== 1 ? "s" : ""} detected`,
      description: `Skills without version pins are unstable and hard to audit over time. Unpinned: ${unpinnedSkills.map((s) => s.name).join(", ")}`,
      action: "Add version: \"1.0.0\" to each SKILL.md frontmatter. Pin skills to specific versions for reproducibility." });
  }

  // MCP servers without auth
  const noAuthMcp = mcpServers.filter((m) => m.validConfig && !m.authConfigured);
  if (noAuthMcp.length > 0) {
    findings.push({ id: fid(), severity: "medium", category: "config", file: "mcp.json",
      title: `${noAuthMcp.length} MCP server${noAuthMcp.length !== 1 ? "s" : ""} without authentication`,
      description: `Unauthenticated MCP servers: ${noAuthMcp.map((m) => m.name).join(", ")}. Without auth, any process on the machine can call these tool servers.`,
      action: "Configure authentication (API key or token) for each MCP server in your mcp.json." });
  }

  // MCP servers with network exposure
  for (const m of mcpServers) {
    if (m.url && /0\.0\.0\.0/.test(m.url)) {
      findings.push({ id: fid(), severity: "high", category: "config", file: m.sourcePath,
        title: `MCP server "${m.name}" bound to 0.0.0.0`,
        description: "This MCP server is exposed to all network interfaces. External hosts on your network could invoke its tools.",
        action: `Change the URL for "${m.name}" to use 127.0.0.1 instead of 0.0.0.0.`,
        evidence: m.url });
    }
  }

  // ── Compute scores ──────────────────────────────────────────────────

  const categories: AuditCategory[] = ["identity", "operations", "memory", "health", "config"];
  const severityWeights: Record<string, number> = { critical: 25, high: 15, medium: 8, low: 3, info: 0 };

  const categoryScores: Record<AuditCategory, { score: number; total: number; passed: number }> = {} as any;

  for (const cat of categories) {
    const catFindings = findings.filter((f) => f.category === cat);
    const penalty = catFindings.reduce((sum, f) => sum + (severityWeights[f.severity] ?? 0), 0);
    const score = Math.max(0, Math.min(100, 100 - penalty));
    categoryScores[cat] = { score, total: catFindings.length, passed: catFindings.length === 0 ? 1 : 0 };
  }

  const totalPenalty = findings.reduce((sum, f) => sum + (severityWeights[f.severity] ?? 0), 0);
  const healthScore = Math.max(0, Math.min(100, 100 - totalPenalty));

  return { findings, files, healthScore, categoryScores };
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
