import { describe, it, expect } from "vitest";
import { normalizeSnapshot } from "../normalizer.js";

describe("normalizeSnapshot", () => {
  const base = { scanId: "abc-123", timestamp: "2025-01-01T00:00:00Z", workspacePath: "/test" };

  it("returns complete snapshot from minimal input", () => {
    const result = normalizeSnapshot(base);
    expect(result.scanId).toBe("abc-123");
    expect(result.agents).toEqual([]);
    expect(result.skills).toEqual([]);
    expect(result.mcpServers).toEqual([]);
    expect(result.runs).toBeUndefined();
  });

  it("generates agent IDs from name", () => {
    const result = normalizeSnapshot({
      ...base,
      agents: [{ name: "My Agent" }] as any,
    });
    expect(result.agents[0].id).toBe("agent-my-agent");
    expect(result.agents[0].status).toBe("unknown");
    expect(result.agents[0].skillCount).toBe(0);
    expect(result.agents[0].mcpDependencies).toEqual([]);
  });

  it("preserves existing agent ID", () => {
    const result = normalizeSnapshot({
      ...base,
      agents: [{ id: "custom-id", name: "Test" }] as any,
    });
    expect(result.agents[0].id).toBe("custom-id");
  });

  it("generates skill IDs from name", () => {
    const result = normalizeSnapshot({
      ...base,
      skills: [{ name: "Code Review" }] as any,
    });
    expect(result.skills[0].id).toBe("skill-code-review");
    expect(result.skills[0].pinned).toBe(false);
  });

  it("generates MCP server IDs from name", () => {
    const result = normalizeSnapshot({
      ...base,
      mcpServers: [{ name: "My Server" }] as any,
    });
    expect(result.mcpServers[0].id).toBe("mcp-my-server");
    expect(result.mcpServers[0].validConfig).toBe(true);
    expect(result.mcpServers[0].authConfigured).toBe(false);
  });

  it("includes runs when present", () => {
    const result = normalizeSnapshot({
      ...base,
      runs: [{ agentId: "a", timestamp: "2025-01-01T00:00:00Z", success: true }] as any,
    });
    expect(result.runs).toHaveLength(1);
    expect(result.runs![0].id).toMatch(/^run-a-/);
  });

  it("omits runs when empty", () => {
    const result = normalizeSnapshot({ ...base, runs: [] as any });
    expect(result.runs).toBeUndefined();
  });
});
