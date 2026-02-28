/**
 * Diff Engine — Milestone 4
 * Scan-to-scan comparison, change tracking.
 */

import type { Snapshot, ScanDiff } from "@clawcommand/shared";

function stableStringify(obj: unknown): string {
  if (obj === undefined) return "null";
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";
  const rec = obj as Record<string, unknown>;
  const sorted = Object.keys(rec).filter((k) => rec[k] !== undefined).sort();
  return "{" + sorted.map((k) => JSON.stringify(k) + ":" + stableStringify(rec[k])).join(",") + "}";
}

function diffEntities<T extends { id: string; name: string }>(
  a: T[],
  b: T[]
): { added: string[]; removed: string[]; modified: string[] } {
  const namesA = new Set(a.map((x) => x.name));
  const namesB = new Set(b.map((x) => x.name));
  const added = b.filter((x) => !namesA.has(x.name)).map((x) => x.name);
  const removed = a.filter((x) => !namesB.has(x.name)).map((x) => x.name);
  const modified: string[] = [];
  const mapA = new Map(a.map((x) => [x.name, x]));
  const mapB = new Map(b.map((x) => [x.name, x]));
  for (const name of namesA) {
    if (namesB.has(name)) {
      const va = mapA.get(name)!;
      const vb = mapB.get(name)!;
      if (stableStringify(va) !== stableStringify(vb)) {
        modified.push(name);
      }
    }
  }
  return { added, removed, modified };
}

export function diffScans(snapshotA: Snapshot, snapshotB: Snapshot): ScanDiff {
  return {
    scanIdA: snapshotA.scanId,
    scanIdB: snapshotB.scanId,
    timestampA: snapshotA.timestamp,
    timestampB: snapshotB.timestamp,
    changes: {
      agents: diffEntities(snapshotA.agents, snapshotB.agents),
      skills: diffEntities(snapshotA.skills, snapshotB.skills),
      mcpServers: diffEntities(snapshotA.mcpServers, snapshotB.mcpServers),
    },
  };
}
