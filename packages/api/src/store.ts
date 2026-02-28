/**
 * Scan store — SQLite-backed persistence with in-memory fallback
 */

import type { Snapshot } from "@clawcommand/shared";
import { logger } from "./logger.js";

export interface StoreBackend {
  save(snapshot: Snapshot): string;
  get(id: string): Snapshot | undefined;
  delete(id: string): boolean;
  list(): { scanId: string; timestamp: string; workspacePath: string }[];
  size(): number;
  close(): void;
}

function createMemoryStore(): StoreBackend {
  const MAX_SCANS = 500;
  const scans = new Map<string, Snapshot>();
  return {
    save(snapshot: Snapshot): string {
      if (scans.size >= MAX_SCANS) {
        const oldest = scans.keys().next().value;
        if (oldest) scans.delete(oldest);
      }
      scans.set(snapshot.scanId, snapshot);
      return snapshot.scanId;
    },
    get(id: string): Snapshot | undefined {
      return scans.get(id);
    },
    delete(id: string): boolean {
      return scans.delete(id);
    },
    list() {
      return [...scans.values()]
        .map((s) => ({ scanId: s.scanId, timestamp: s.timestamp, workspacePath: s.workspacePath }))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    },
    size(): number {
      return scans.size;
    },
    close() {},
  };
}

function createSqliteStore(dbPath: string): StoreBackend | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS scans (
        scan_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        workspace_path TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    const insertStmt = db.prepare(
      "INSERT OR REPLACE INTO scans (scan_id, timestamp, workspace_path, data) VALUES (?, ?, ?, ?)"
    );
    const getStmt = db.prepare("SELECT data FROM scans WHERE scan_id = ?");
    const deleteStmt = db.prepare("DELETE FROM scans WHERE scan_id = ?");
    const listStmt = db.prepare(
      "SELECT scan_id, timestamp, workspace_path FROM scans ORDER BY timestamp DESC"
    );
    const countStmt = db.prepare("SELECT COUNT(*) as count FROM scans");

    logger.info({ dbPath }, "SQLite store initialized");

    return {
      save(snapshot: Snapshot): string {
        insertStmt.run(snapshot.scanId, snapshot.timestamp, snapshot.workspacePath, JSON.stringify(snapshot));
        return snapshot.scanId;
      },
      get(id: string): Snapshot | undefined {
        const row = getStmt.get(id) as { data: string } | undefined;
        return row ? JSON.parse(row.data) as Snapshot : undefined;
      },
      delete(id: string): boolean {
        const result = deleteStmt.run(id);
        return result.changes > 0;
      },
      list() {
        return (listStmt.all() as { scan_id: string; timestamp: string; workspace_path: string }[])
          .map((r) => ({ scanId: r.scan_id, timestamp: r.timestamp, workspacePath: r.workspace_path }));
      },
      size(): number {
        return (countStmt.get() as { count: number }).count;
      },
      close() {
        db.close();
      },
    };
  } catch {
    return null;
  }
}

const dbPath = process.env.CLAWCOMMAND_DB_PATH ?? "clawcommand.db";
const sqliteStore = process.env.CLAWCOMMAND_STORE !== "memory" ? createSqliteStore(dbPath) : null;

if (!sqliteStore && process.env.CLAWCOMMAND_STORE !== "memory") {
  logger.warn("SQLite unavailable, falling back to in-memory store");
}

export const store: StoreBackend = sqliteStore ?? createMemoryStore();
