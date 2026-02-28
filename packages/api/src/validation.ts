/**
 * Validation Engine — Milestone 3
 * Schema validation, missing keys, version mismatch. Every issue links to evidence (file + line).
 */

import type {
  Snapshot,
  ValidationIssue,
  ValidationResult,
} from "@clawcommand/shared";

function issue(
  severity: "error" | "warning" | "info",
  code: string,
  message: string,
  evidence: { file: string; line?: number; entityId?: string },
  recommendedFix?: string
): ValidationIssue {
  return { severity, code, message, evidence, recommendedFix };
}

export function validateSnapshot(snapshot: Snapshot): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!snapshot.scanId || !snapshot.timestamp || !snapshot.workspacePath) {
    issues.push(
      issue(
        "error",
        "MISSING_REQUIRED",
        "Snapshot missing required fields: scanId, timestamp, or workspacePath",
        { file: "<ingestion>" },
        "Ensure the scanner sends a complete snapshot with scanId, timestamp, workspacePath"
      )
    );
  }

  const agentNames = new Set<string>();
  for (const a of snapshot.agents) {
    const evidenceFile = a.sourcePath || "<unknown>";
    if (!a.name?.trim()) {
      issues.push(
        issue("error", "AGENT_NO_NAME", "Agent has no name", { file: evidenceFile, entityId: a.id })
      );
    } else if (agentNames.has(a.name)) {
      issues.push(
        issue("warning", "AGENT_DUPLICATE_NAME", `Duplicate agent name: "${a.name}"`, { file: evidenceFile, entityId: a.id })
      );
    } else {
      agentNames.add(a.name);
    }
    if (!a.sourcePath) {
      issues.push(
        issue(
          "warning",
          "AGENT_NO_SOURCE",
          `Agent "${a.name}" has no source path`,
          { file: "<unknown>", entityId: a.id },
          "Re-scan to capture source path"
        )
      );
    }
  }

  const skillNames = new Set<string>();
  for (const s of snapshot.skills) {
    const evidenceFile = s.sourcePath || "<unknown>";
    if (!s.name?.trim()) {
      issues.push(
        issue("error", "SKILL_NO_NAME", "Skill has no name", { file: evidenceFile, entityId: s.id })
      );
    } else if (skillNames.has(s.name)) {
      issues.push(
        issue("warning", "SKILL_DUPLICATE_NAME", `Duplicate skill name: "${s.name}"`, { file: evidenceFile, entityId: s.id })
      );
    } else {
      skillNames.add(s.name);
    }
    if (!s.pinned && !s.version) {
      issues.push(
        issue(
          "warning",
          "SKILL_UNPINNED",
          `Skill "${s.name}" has no version (unpinned)`,
          { file: evidenceFile, entityId: s.id },
          'Add version to SKILL.md frontmatter: version: "1.0.0"'
        )
      );
    }
    if (!s.sourcePath) {
      issues.push(
        issue(
          "warning",
          "SKILL_NO_SOURCE",
          `Skill "${s.name}" has no source path`,
          { file: "<unknown>", entityId: s.id }
        )
      );
    }
  }

  const mcpNames = new Set<string>();
  for (const m of snapshot.mcpServers) {
    const evidenceFile = m.sourcePath || "<unknown>";
    if (!m.name?.trim()) {
      issues.push(
        issue("error", "MCP_NO_NAME", "MCP server has no name", { file: evidenceFile, entityId: m.id })
      );
    } else if (mcpNames.has(m.name)) {
      issues.push(
        issue("warning", "MCP_DUPLICATE_NAME", `Duplicate MCP server name: "${m.name}"`, { file: evidenceFile, entityId: m.id })
      );
    } else {
      mcpNames.add(m.name);
    }
    if (!m.validConfig) {
      issues.push(
        issue(
          "error",
          "MCP_INVALID_CONFIG",
          `MCP server "${m.name}" has invalid config`,
          { file: evidenceFile, entityId: m.id },
          "Check MCP config JSON structure (command, args, env)"
        )
      );
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  return {
    issues,
    passed: !hasErrors,
  };
}
