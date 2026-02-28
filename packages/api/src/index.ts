/**
 * ClawCommand API — snapshot ingestion + persistent storage
 */

import express from "express";
import type { Request, Response, NextFunction } from "express";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";
import { scansRouter } from "./routes/scans.js";
import { store } from "./store.js";

export const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = process.env.CLAWCOMMAND_CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors(
    allowedOrigins?.length
      ? { origin: allowedOrigins, credentials: true }
      : undefined
  )
);
app.use(express.json({ limit: "5mb" }));
app.use(pinoHttp({ logger, autoLogging: true }));

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = parseInt(process.env.CLAWCOMMAND_RATE_LIMIT ?? "120", 10);

app.use((req: Request, res: Response, next: NextFunction) => {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  let entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateMap.set(key, entry);
  }
  entry.count++;
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT - entry.count));
  if (entry.count > RATE_LIMIT) {
    return res.status(429).json({ error: "Too many requests — try again later" });
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, scans: store.size() });
});

app.use("/api", scansRouter);

// Serve dashboard static export if present
const dashboardDir = process.env.DASHBOARD_DIR || resolve(__dirname, "dashboard-static");
if (existsSync(dashboardDir)) {
  logger.info({ dashboardDir }, "Serving dashboard static files");
  app.use(express.static(dashboardDir, { index: false }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") return next();
    const indexPath = resolve(dashboardDir, "index.html");
    if (existsSync(indexPath)) return res.sendFile(indexPath);
    next();
  });
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "ClawCommand API listening");
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received");
  server.close(() => {
    store.close();
    logger.info("Server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
