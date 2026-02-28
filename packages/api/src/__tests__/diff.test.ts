import { describe, it, expect } from "vitest";
import { diffScans } from "../diff.js";
import type { Snapshot } from "@clawcommand/shared";

function makeSnapshot(id: string, overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    scanId: id,
    timestamp: "2025-01-01T00:00:00Z",
    workspacePath: "/test",
    agents: [],
    skills: [],
    mcpServers: [],
    ...overrides,
  };
}

describe("diffScans", () => {
  it("reports no changes for identical snapshots", () => {
    const snap = makeSnapshot("a", {
      agents: [{ id: "a1", name: "Agent", sourcePath: "/a", status: "active", skillCount: 0, mcpDependencies: [] }],
    });
    const diff = diffScans(snap, snap);
    expect(diff.changes.agents.added).toHaveLength(0);
    expect(diff.changes.agents.removed).toHaveLength(0);
    expect(diff.changes.agents.modified).toHaveLength(0);
  });

  it("detects added entities", () => {
    const a = makeSnapshot("a");
    const b = makeSnapshot("b", {
      agents: [{ id: "a1", name: "New", sourcePath: "/a", status: "active", skillCount: 0, mcpDependencies: [] }],
    });
    const diff = diffScans(a, b);
    expect(diff.changes.agents.added).toEqual(["New"]);
  });

  it("detects removed entities", () => {
    const a = makeSnapshot("a", {
      skills: [{ id: "s1", name: "Old", sourcePath: "/s", pinned: true }],
    });
    const b = makeSnapshot("b");
    const diff = diffScans(a, b);
    expect(diff.changes.skills.removed).toEqual(["Old"]);
  });

  it("detects modified entities", () => {
    const a = makeSnapshot("a", {
      mcpServers: [{ id: "m1", name: "Server", sourcePath: "/m", validConfig: true, toolCount: 1, authConfigured: false }],
    });
    const b = makeSnapshot("b", {
      mcpServers: [{ id: "m1", name: "Server", sourcePath: "/m", validConfig: true, toolCount: 5, authConfigured: true }],
    });
    const diff = diffScans(a, b);
    expect(diff.changes.mcpServers.modified).toEqual(["Server"]);
  });

  it("includes scan metadata", () => {
    const a = makeSnapshot("scan-a");
    const b = makeSnapshot("scan-b");
    const diff = diffScans(a, b);
    expect(diff.scanIdA).toBe("scan-a");
    expect(diff.scanIdB).toBe("scan-b");
  });

  it("handles empty snapshots", () => {
    const diff = diffScans(makeSnapshot("a"), makeSnapshot("b"));
    expect(diff.changes.agents).toEqual({ added: [], removed: [], modified: [] });
    expect(diff.changes.skills).toEqual({ added: [], removed: [], modified: [] });
    expect(diff.changes.mcpServers).toEqual({ added: [], removed: [], modified: [] });
  });
});
