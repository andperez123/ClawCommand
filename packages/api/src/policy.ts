/**
 * Policy Engine — Milestone 5
 * Rule definition, violation detection, compliance scoring.
 */

import type {
  Snapshot,
  PolicyViolation,
  PolicyResult,
} from "@clawcommand/shared";

export type { PolicyResult };

export interface PolicyRule {
  id: string;
  name: string;
  check: (snapshot: Snapshot) => PolicyViolation[];
}

const RULES: PolicyRule[] = [
  {
    id: "skill-pinning",
    name: "Skills must be version-pinned",
    check: (snapshot) => {
      const violations: PolicyViolation[] = [];
      for (const s of snapshot.skills) {
        if (!s.pinned && !s.version) {
          violations.push({
            ruleId: "skill-pinning",
            ruleName: "Skills must be version-pinned",
            message: `Skill "${s.name}" is unpinned (no version)`,
            severity: "medium",
            evidence: { file: s.sourcePath, entityId: s.id },
            recommendedFix: 'Add version to SKILL.md: version: "1.0.0"',
          });
        }
      }
      return violations;
    },
  },
  {
    id: "mcp-auth",
    name: "MCP servers should have auth configured",
    check: (snapshot) => {
      const violations: PolicyViolation[] = [];
      for (const m of snapshot.mcpServers) {
        if (!m.authConfigured && m.validConfig) {
          violations.push({
            ruleId: "mcp-auth",
            ruleName: "MCP servers should have auth configured",
            message: `MCP server "${m.name}" has no auth (env/headers/apiKey)`,
            severity: "low",
            evidence: { file: m.sourcePath, entityId: m.id },
            recommendedFix: "Add env vars or headers for authentication",
          });
        }
      }
      return violations;
    },
  },
  {
    id: "agent-source",
    name: "Agents should have traceable source",
    check: (snapshot) => {
      const violations: PolicyViolation[] = [];
      for (const a of snapshot.agents) {
        if (!a.sourcePath || a.sourcePath === "<unknown>") {
          violations.push({
            ruleId: "agent-source",
            ruleName: "Agents should have traceable source",
            message: `Agent "${a.name}" has no source path`,
            severity: "low",
            evidence: { file: "<unknown>", entityId: a.id },
          });
        }
      }
      return violations;
    },
  },
];

export function evaluatePolicies(snapshot: Snapshot): PolicyResult {
  const violations: PolicyViolation[] = [];
  for (const rule of RULES) {
    violations.push(...rule.check(snapshot));
  }
  const passedRules = RULES.length - new Set(violations.map((v) => v.ruleId)).size;
  const complianceScore =
    RULES.length === 0 ? 100 : Math.round((passedRules / RULES.length) * 100);
  return {
    violations,
    complianceScore,
    totalRules: RULES.length,
    passedRules,
  };
}
