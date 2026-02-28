/**
 * POST /api/scans — ingest snapshot (validated via zod, normalized via parser)
 * GET  /api/scans — list scans
 * GET  /api/scans/:id — get scan with validation + policy results
 * GET  /api/scans/diff — compare two scans
 */

import { Router } from "express";
import type { Snapshot } from "@clawcommand/shared";
import { normalizeSnapshot } from "@clawcommand/parser";
import { store } from "../store.js";
import { validateSnapshot } from "../validation.js";
import { evaluatePolicies } from "../policy.js";
import { diffScans } from "../diff.js";
import { requireToken, requireTokenIfProduction } from "../auth.js";
import { snapshotSchema, diffQuerySchema, scanIdParamSchema } from "../schemas.js";
import { logger } from "../logger.js";

export const scansRouter = Router();

function enrichSnapshot(snapshot: Snapshot) {
  const validation = validateSnapshot(snapshot);
  const policy = evaluatePolicies(snapshot);
  return {
    ...snapshot,
    validation,
    policy,
  };
}

scansRouter.post("/scans", requireToken, (req, res) => {
  const parsed = snapshotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid snapshot payload",
      details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  try {
    const snapshot = normalizeSnapshot(parsed.data as Partial<Snapshot> & { scanId: string; timestamp: string; workspacePath: string });
    const scanId = store.save(snapshot);
    logger.info({ scanId, workspace: snapshot.workspacePath }, "Scan ingested");
    res.status(201).json({ scanId });
  } catch (err) {
    logger.error({ err }, "Failed to store snapshot");
    res.status(500).json({ error: "Failed to store snapshot" });
  }
});

scansRouter.get("/scans", requireTokenIfProduction, (_req, res) => {
  const scans = store.list();
  res.json({ scans });
});

scansRouter.get("/scans/diff", requireTokenIfProduction, (req, res) => {
  const parsed = diffQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Query params required: ?a=<scanId>&b=<scanId>",
      details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const { a, b } = parsed.data;
  const snapA = store.get(a);
  const snapB = store.get(b);
  if (!snapA) return res.status(404).json({ error: `Scan not found: ${a}` });
  if (!snapB) return res.status(404).json({ error: `Scan not found: ${b}` });
  const diff = diffScans(snapA, snapB);
  res.json(diff);
});

scansRouter.get("/scans/:id", requireTokenIfProduction, (req, res) => {
  const parsed = scanIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid scan ID format" });
  }
  const snapshot = store.get(parsed.data.id);
  if (!snapshot) return res.status(404).json({ error: "Scan not found" });
  res.json(enrichSnapshot(snapshot));
});
