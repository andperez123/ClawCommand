import { describe, it, expect } from "vitest";
import { evaluatePolicies } from "../policy.js";
import type { Snapshot } from "@clawcommand/shared";

function makeSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    scanId: "test-id",
    timestamp: "2025-01-01T00:00:00Z",
    workspacePath: "/test",
    agents: [],
    skills: [],
    mcpServers: [],
    ...overrides,
  };
}

describe("evaluatePolicies", () => {
  it("returns 100% compliance for clean snapshot", () => {
    const result = evaluatePolicies(makeSnapshot({
      agents: [{ id: "a1", name: "Agent", sourcePath: "/a", status: "active", skillCount: 0, mcpDependencies: [] }],
      skills: [{ id: "s1", name: "Skill", sourcePath: "/s", pinned: true, version: "1.0" }],
      mcpServers: [{ id: "m1", name: "Server", sourcePath: "/m", validConfig: true, toolCount: 1, authConfigured: true }],
    }));
    expect(result.complianceScore).toBe(100);
    expect(result.violations).toHaveLength(0);
    expect(result.passedRules).toBe(result.totalRules);
  });

  it("flags unpinned skills", () => {
    const result = evaluatePolicies(makeSnapshot({
      skills: [{ id: "s1", name: "Unpinned", sourcePath: "/s", pinned: false }],
    }));
    expect(result.violations.some((v) => v.ruleId === "skill-pinning")).toBe(true);
    expect(result.complianceScore).toBeLessThan(100);
  });

  it("flags MCP servers without auth", () => {
    const result = evaluatePolicies(makeSnapshot({
      mcpServers: [{ id: "m1", name: "NoAuth", sourcePath: "/m", validConfig: true, toolCount: 0, authConfigured: false }],
    }));
    expect(result.violations.some((v) => v.ruleId === "mcp-auth")).toBe(true);
  });

  it("flags agents without source path", () => {
    const result = evaluatePolicies(makeSnapshot({
      agents: [{ id: "a1", name: "NoSource", sourcePath: "", status: "unknown", skillCount: 0, mcpDependencies: [] }],
    }));
    expect(result.violations.some((v) => v.ruleId === "agent-source")).toBe(true);
  });

  it("scores per-rule not per-entity", () => {
    const result = evaluatePolicies(makeSnapshot({
      skills: [
        { id: "s1", name: "A", sourcePath: "/s", pinned: false },
        { id: "s2", name: "B", sourcePath: "/s", pinned: false },
      ],
    }));
    expect(result.violations.filter((v) => v.ruleId === "skill-pinning")).toHaveLength(2);
    expect(result.passedRules).toBe(result.totalRules - 1);
  });

  it("handles empty snapshot", () => {
    const result = evaluatePolicies(makeSnapshot());
    expect(result.complianceScore).toBe(100);
    expect(result.violations).toHaveLength(0);
  });
});
