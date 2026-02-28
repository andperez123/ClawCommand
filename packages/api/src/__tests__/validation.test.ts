import { describe, it, expect } from "vitest";
import { validateSnapshot } from "../validation.js";
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

describe("validateSnapshot", () => {
  it("passes clean snapshot", () => {
    const result = validateSnapshot(makeSnapshot({
      agents: [{ id: "a1", name: "Agent", sourcePath: "/a", status: "active", skillCount: 0, mcpDependencies: [] }],
      skills: [{ id: "s1", name: "Skill", sourcePath: "/s", pinned: true, version: "1.0" }],
      mcpServers: [{ id: "m1", name: "Server", sourcePath: "/m", validConfig: true, toolCount: 1, authConfigured: true }],
    }));
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("catches missing required fields", () => {
    const result = validateSnapshot({ scanId: "", timestamp: "", workspacePath: "", agents: [], skills: [], mcpServers: [] });
    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.code === "MISSING_REQUIRED")).toBe(true);
  });

  it("catches agent with no name", () => {
    const result = validateSnapshot(makeSnapshot({
      agents: [{ id: "a1", name: "", sourcePath: "/a", status: "unknown", skillCount: 0, mcpDependencies: [] }],
    }));
    expect(result.issues.some((i) => i.code === "AGENT_NO_NAME")).toBe(true);
  });

  it("catches agent with no source path", () => {
    const result = validateSnapshot(makeSnapshot({
      agents: [{ id: "a1", name: "Test", sourcePath: "", status: "unknown", skillCount: 0, mcpDependencies: [] }],
    }));
    expect(result.issues.some((i) => i.code === "AGENT_NO_SOURCE")).toBe(true);
  });

  it("catches duplicate agent names", () => {
    const result = validateSnapshot(makeSnapshot({
      agents: [
        { id: "a1", name: "Dup", sourcePath: "/a", status: "unknown", skillCount: 0, mcpDependencies: [] },
        { id: "a2", name: "Dup", sourcePath: "/b", status: "unknown", skillCount: 0, mcpDependencies: [] },
      ],
    }));
    expect(result.issues.some((i) => i.code === "AGENT_DUPLICATE_NAME")).toBe(true);
  });

  it("catches unpinned skill", () => {
    const result = validateSnapshot(makeSnapshot({
      skills: [{ id: "s1", name: "Unpinned", sourcePath: "/s", pinned: false }],
    }));
    expect(result.issues.some((i) => i.code === "SKILL_UNPINNED")).toBe(true);
  });

  it("catches invalid MCP config", () => {
    const result = validateSnapshot(makeSnapshot({
      mcpServers: [{ id: "m1", name: "Bad", sourcePath: "/m", validConfig: false, toolCount: 0, authConfigured: false }],
    }));
    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.code === "MCP_INVALID_CONFIG")).toBe(true);
  });

  it("catches duplicate MCP names", () => {
    const result = validateSnapshot(makeSnapshot({
      mcpServers: [
        { id: "m1", name: "Same", sourcePath: "/m", validConfig: true, toolCount: 0, authConfigured: false },
        { id: "m2", name: "Same", sourcePath: "/m", validConfig: true, toolCount: 0, authConfigured: false },
      ],
    }));
    expect(result.issues.some((i) => i.code === "MCP_DUPLICATE_NAME")).toBe(true);
  });
});
