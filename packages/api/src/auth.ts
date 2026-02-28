/**
 * Auth middleware — token validation
 * Rejects empty/invalid Bearer tokens. In dev, "dev" is allowed.
 */

import type { Request, Response, NextFunction } from "express";

const DEV_TOKEN = "dev";

function getAllowAnon(): boolean {
  return process.env.CLAWCOMMAND_ALLOW_ANON === "1";
}

function getValidTokens(): Set<string> {
  return new Set(
    (process.env.CLAWCOMMAND_TOKENS ?? "").split(",").map((t) => t.trim()).filter(Boolean)
  );
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function validateToken(req: Request): boolean {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7).trim();
  if (!token) return false;
  if (!isProduction() && token === DEV_TOKEN) return true;
  const validTokens = getValidTokens();
  if (validTokens.size > 0 && validTokens.has(token)) return true;
  return false;
}

/** Require a valid token — rejects 401/403 on failure */
export function requireToken(req: Request, res: Response, next: NextFunction) {
  if (getAllowAnon()) return next();
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header (Bearer token required)" });
  }
  const token = auth.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Bearer token cannot be empty" });
  }
  if (!isProduction() && token === DEV_TOKEN) {
    return next();
  }
  const validTokens = getValidTokens();
  if (validTokens.size > 0 && validTokens.has(token)) {
    return next();
  }
  return res.status(403).json({ error: "Invalid or expired token" });
}

/** Optional auth for read routes — passes through in non-production, enforces in production */
export function requireTokenIfProduction(req: Request, res: Response, next: NextFunction) {
  if (!isProduction()) return next();
  if (getAllowAnon()) return next();
  if (validateToken(req)) return next();
  return res.status(401).json({ error: "Authentication required" });
}
