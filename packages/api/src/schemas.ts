/**
 * Zod request/response schemas for API input validation
 */

import { z } from "zod";

const agentRecordSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sourcePath: z.string().optional(),
  status: z.enum(["active", "stale", "error", "unknown"]).optional(),
  lastRun: z.string().optional(),
  lastErrorSignature: z.string().optional(),
  skillCount: z.number().int().nonnegative().optional(),
  skills: z.array(z.string()).optional(),
  mcpDependencies: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  sections: z.array(z.string()).optional(),
  description: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const skillRecordSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  version: z.string().optional(),
  sourcePath: z.string().optional(),
  pinned: z.boolean().optional(),
  policyApproved: z.boolean().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  files: z.array(z.string()).optional(),
});

const mcpServerRecordSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sourcePath: z.string().optional(),
  validConfig: z.boolean().optional(),
  toolCount: z.number().int().nonnegative().optional(),
  authConfigured: z.boolean().optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  envKeys: z.array(z.string()).optional(),
  transport: z.string().optional(),
  url: z.string().optional(),
});

const ruleRecordSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sourcePath: z.string().optional(),
  description: z.string().optional(),
  content: z.string(),
  alwaysApply: z.boolean().optional(),
  globs: z.array(z.string()).optional(),
});

const runRecordSchema = z.object({
  id: z.string().optional(),
  agentId: z.string().min(1),
  timestamp: z.string().min(1),
  success: z.boolean(),
  errorSignature: z.string().optional(),
  summary: z.string().optional(),
});

const projectMetaSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  goals: z.array(z.string()).optional(),
  scripts: z.record(z.string(), z.string()).optional(),
  dependencies: z.number().optional(),
  devDependencies: z.number().optional(),
  readme: z.string().optional(),
}).optional();

const gitCommitSchema = z.object({
  hash: z.string(),
  author: z.string(),
  date: z.string(),
  message: z.string(),
  filesChanged: z.number(),
});

const gitActivitySchema = z.object({
  totalCommits: z.number(),
  recentCommits: z.array(gitCommitSchema),
  activeDays: z.number(),
  topAuthors: z.array(z.object({ name: z.string(), commits: z.number() })),
  firstCommitDate: z.string().optional(),
  lastCommitDate: z.string().optional(),
  filesChanged: z.array(z.string()),
}).optional();

const transcriptSessionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  timestamp: z.string(),
  messageCount: z.number(),
});

const transcriptSummarySchema = z.object({
  totalSessions: z.number(),
  recentSessions: z.array(transcriptSessionSchema),
  dateRange: z.object({ earliest: z.string(), latest: z.string() }).optional(),
}).optional();

const capabilitiesSummarySchema = z.object({
  agentCount: z.number(),
  skillCount: z.number(),
  mcpServerCount: z.number(),
  ruleCount: z.number(),
  totalTools: z.number(),
  summary: z.string(),
  agentSkillMap: z.array(z.object({ agent: z.string(), skills: z.array(z.string()) })),
  agentMcpMap: z.array(z.object({ agent: z.string(), mcpServers: z.array(z.string()) })),
}).optional();

export const snapshotSchema = z.object({
  scanId: z.uuid(),
  timestamp: z.string().min(1),
  workspacePath: z.string().min(1),
  agents: z.array(agentRecordSchema).default([]),
  skills: z.array(skillRecordSchema).default([]),
  mcpServers: z.array(mcpServerRecordSchema).default([]),
  rules: z.array(ruleRecordSchema).optional(),
  runs: z.array(runRecordSchema).optional(),
  projectMeta: projectMetaSchema,
  gitActivity: gitActivitySchema,
  transcriptSummary: transcriptSummarySchema,
  capabilities: capabilitiesSummarySchema,
});

export const diffQuerySchema = z.object({
  a: z.uuid("Scan ID 'a' must be a valid UUID"),
  b: z.uuid("Scan ID 'b' must be a valid UUID"),
});

export const scanIdParamSchema = z.object({
  id: z.uuid("Scan ID must be a valid UUID"),
});
