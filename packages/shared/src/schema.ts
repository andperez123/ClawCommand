/**
 * ClawCommand Snapshot Schema
 * Sanitized output from openclaw-scan — never includes secret values.
 */

export interface Snapshot {
  scanId: string;
  timestamp: string; // ISO8601
  workspacePath: string;
  agents: AgentRecord[];
  skills: SkillRecord[];
  mcpServers: McpServerRecord[];
  rules?: RuleRecord[];
  runs?: RunRecord[];
}

export interface AgentRecord {
  id: string;
  name: string;
  sourcePath: string; // file path for evidence
  status: "active" | "stale" | "error" | "unknown";
  lastRun?: string; // ISO8601
  lastErrorSignature?: string;
  skillCount: number;
  skills?: string[];
  mcpDependencies: string[];
  instructions?: string; // full body content from AGENTS.md / config
  sections?: string[]; // H2-level headings found in agent config
  description?: string;
  config?: Record<string, unknown>; // sanitized, no secrets
}

export interface SkillRecord {
  id: string;
  name: string;
  version?: string;
  sourcePath: string;
  pinned: boolean;
  policyApproved?: boolean;
  description?: string;
  instructions?: string; // body content below frontmatter
  files?: string[]; // other files in the skill directory
}

export interface McpServerRecord {
  id: string;
  name: string;
  sourcePath: string;
  validConfig: boolean;
  toolCount: number;
  authConfigured: boolean; // presence only, never value
  command?: string;
  args?: string[];
  envKeys?: string[]; // env variable names only, never values
  transport?: string; // stdio, sse, streamable-http
  url?: string;
}

export interface RuleRecord {
  id: string;
  name: string;
  sourcePath: string;
  description?: string;
  content: string; // full rule body
  alwaysApply?: boolean;
  globs?: string[];
}

export interface RunRecord {
  id: string;
  agentId: string;
  timestamp: string;
  success: boolean;
  errorSignature?: string;
  summary?: string;
}

export interface ValidationEvidence {
  file: string;
  line?: number;
  entityId?: string;
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  evidence: ValidationEvidence;
  recommendedFix?: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  passed: boolean;
}

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  evidence: ValidationEvidence;
  recommendedFix?: string;
}

export interface PolicyResult {
  violations: PolicyViolation[];
  complianceScore: number;
  totalRules: number;
  passedRules: number;
}

export interface ScanDiff {
  scanIdA: string;
  scanIdB: string;
  timestampA: string;
  timestampB: string;
  changes: {
    agents: { added: string[]; removed: string[]; modified: string[] };
    skills: { added: string[]; removed: string[]; modified: string[] };
    mcpServers: { added: string[]; removed: string[]; modified: string[] };
  };
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "unknown";
}
