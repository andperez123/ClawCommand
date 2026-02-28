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
  mcpDependencies: z.array(z.string()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const skillRecordSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  version: z.string().optional(),
  sourcePath: z.string().optional(),
  pinned: z.boolean().optional(),
  policyApproved: z.boolean().optional(),
});

const mcpServerRecordSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sourcePath: z.string().optional(),
  validConfig: z.boolean().optional(),
  toolCount: z.number().int().nonnegative().optional(),
  authConfigured: z.boolean().optional(),
});

const runRecordSchema = z.object({
  id: z.string().optional(),
  agentId: z.string().min(1),
  timestamp: z.string().min(1),
  success: z.boolean(),
  errorSignature: z.string().optional(),
  summary: z.string().optional(),
});

export const snapshotSchema = z.object({
  scanId: z.uuid(),
  timestamp: z.string().min(1),
  workspacePath: z.string().min(1),
  agents: z.array(agentRecordSchema).default([]),
  skills: z.array(skillRecordSchema).default([]),
  mcpServers: z.array(mcpServerRecordSchema).default([]),
  runs: z.array(runRecordSchema).optional(),
});

export const diffQuerySchema = z.object({
  a: z.uuid("Scan ID 'a' must be a valid UUID"),
  b: z.uuid("Scan ID 'b' must be a valid UUID"),
});

export const scanIdParamSchema = z.object({
  id: z.uuid("Scan ID must be a valid UUID"),
});
