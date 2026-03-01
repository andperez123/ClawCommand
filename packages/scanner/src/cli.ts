#!/usr/bin/env node
/**
 * openclaw-scan — Read-only OpenClaw workspace scanner
 * Produces sanitized snapshot JSON. Never extracts secrets.
 */

import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { resolve, basename } from "node:path";
import { createSnapshot } from "./scanner.js";
import type { Snapshot } from "@clawcommand/shared";

const VERSION = "0.1.0";

const HELP = `
openclaw-scan v${VERSION}
Read-only OpenClaw workspace scanner. Produces sanitized snapshot JSON.

Usage:
  openclaw-scan [options]

Options:
  -p, --path <dir>       Workspace directory to scan (default: cwd)
  -e, --export <file>    Write snapshot JSON to a file (default: auto-named)
  -t, --token <token>    Upload snapshot to ClawCommand API (Bearer token)
      --include-runs     Include run/job history from log files
      --json             Output raw JSON to stdout (no summary)
      --quiet            Suppress summary output
  -h, --help             Show this help message
  -v, --version          Show version number

Environment:
  CLAWCOMMAND_API_URL    API endpoint (default: http://localhost:4000)

Examples:
  openclaw-scan                          Scan & show summary + save snapshot
  openclaw-scan -p ./my-project          Scan a specific directory
  openclaw-scan -e snapshot.json         Save snapshot to a named file
  openclaw-scan -t dev                   Scan & upload to local API
  openclaw-scan --json                   Output raw JSON (for piping)
  openclaw-scan --json | jq '.agents'    Pipe to jq for filtering
`.trim();

// ── Colors ──────────────────────────────────────────────────────

const isTTY = process.stderr.isTTY;
const c = {
  reset: isTTY ? "\x1b[0m" : "",
  bold: isTTY ? "\x1b[1m" : "",
  dim: isTTY ? "\x1b[2m" : "",
  green: isTTY ? "\x1b[32m" : "",
  yellow: isTTY ? "\x1b[33m" : "",
  cyan: isTTY ? "\x1b[36m" : "",
  red: isTTY ? "\x1b[31m" : "",
  magenta: isTTY ? "\x1b[35m" : "",
};

function printSummary(snapshot: Snapshot, exportPath?: string, uploadedId?: string) {
  const out = process.stderr;
  const hr = `${c.dim}${"─".repeat(56)}${c.reset}`;

  out.write(`\n${hr}\n`);
  out.write(`${c.bold}${c.cyan}  ClawCommand Scan Results${c.reset}\n`);
  out.write(`${hr}\n\n`);

  out.write(`  ${c.bold}Workspace${c.reset}   ${snapshot.workspacePath}\n`);
  out.write(`  ${c.bold}Scan ID${c.reset}     ${c.dim}${snapshot.scanId}${c.reset}\n`);
  out.write(`  ${c.bold}Timestamp${c.reset}   ${snapshot.timestamp}\n\n`);

  // Inventory counts
  const agents = snapshot.agents.length;
  const skills = snapshot.skills.length;
  const mcpServers = snapshot.mcpServers.length;
  const runs = snapshot.runs?.length ?? 0;

  out.write(`  ${c.bold}Discovered:${c.reset}\n`);
  out.write(`    ${icon(agents)} ${c.bold}${agents}${c.reset} agent${agents !== 1 ? "s" : ""}`);
  if (agents > 0) {
    const names = snapshot.agents.map((a) => a.name).join(", ");
    out.write(` ${c.dim}(${names})${c.reset}`);
  }
  out.write("\n");

  out.write(`    ${icon(skills)} ${c.bold}${skills}${c.reset} skill${skills !== 1 ? "s" : ""}`);
  if (skills > 0 && skills <= 8) {
    const names = snapshot.skills.map((s) => s.name).join(", ");
    out.write(` ${c.dim}(${names})${c.reset}`);
  }
  out.write("\n");

  out.write(`    ${icon(mcpServers)} ${c.bold}${mcpServers}${c.reset} MCP server${mcpServers !== 1 ? "s" : ""}`);
  if (mcpServers > 0 && mcpServers <= 8) {
    const names = snapshot.mcpServers.map((m) => m.name).join(", ");
    out.write(` ${c.dim}(${names})${c.reset}`);
  }
  out.write("\n");

  if (runs > 0) {
    const succeeded = snapshot.runs!.filter((r) => r.success).length;
    out.write(`    ${icon(runs)} ${c.bold}${runs}${c.reset} run${runs !== 1 ? "s" : ""} ${c.dim}(${succeeded} succeeded)${c.reset}\n`);
  }

  // Warnings
  const warnings: string[] = [];
  const unpinnedSkills = snapshot.skills.filter((s) => !s.pinned);
  if (unpinnedSkills.length > 0) {
    warnings.push(`${unpinnedSkills.length} unpinned skill${unpinnedSkills.length !== 1 ? "s" : ""}`);
  }
  const noAuthMcp = snapshot.mcpServers.filter((m) => !m.authConfigured && m.validConfig);
  if (noAuthMcp.length > 0) {
    warnings.push(`${noAuthMcp.length} MCP server${noAuthMcp.length !== 1 ? "s" : ""} without auth`);
  }
  const invalidMcp = snapshot.mcpServers.filter((m) => !m.validConfig);
  if (invalidMcp.length > 0) {
    warnings.push(`${invalidMcp.length} MCP server${invalidMcp.length !== 1 ? "s" : ""} with invalid config`);
  }

  if (warnings.length > 0) {
    out.write(`\n  ${c.bold}${c.yellow}Heads up:${c.reset}\n`);
    for (const w of warnings) {
      out.write(`    ${c.yellow}⚠${c.reset}  ${w}\n`);
    }
  }

  out.write("\n");

  if (exportPath) {
    out.write(`  ${c.green}✓${c.reset} Saved to ${c.bold}${exportPath}${c.reset}\n`);
  }
  if (uploadedId) {
    out.write(`  ${c.green}✓${c.reset} Uploaded — Scan ID: ${c.bold}${uploadedId}${c.reset}\n`);
  }

  if (exportPath || uploadedId) out.write("\n");

  if (!uploadedId) {
    out.write(`  ${c.dim}Tip: Upload to dashboard with: openclaw-scan --token dev${c.reset}\n`);
    out.write(`  ${c.dim}     Start dashboard with:      npm run api && npm run dev:dashboard${c.reset}\n`);
  } else {
    out.write(`  ${c.dim}View results: open http://localhost:3000${c.reset}\n`);
  }

  out.write(`${hr}\n\n`);
}

function icon(count: number): string {
  return count > 0 ? `${c.green}●${c.reset}` : `${c.dim}○${c.reset}`;
}

function defaultExportName(workspacePath: string): string {
  const dir = basename(workspacePath);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `clawcommand-scan-${dir}-${ts}.json`;
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      token: { type: "string", short: "t" },
      path: { type: "string", short: "p" },
      export: { type: "string", short: "e" },
      "include-runs": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      quiet: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP);
    return;
  }
  if (values.version) {
    console.log(VERSION);
    return;
  }

  const pathArg = values.path ?? positionals[0];
  const workspacePath = resolve(pathArg ?? process.cwd());
  const includeRuns = values["include-runs"] ?? false;
  const rawJson = values.json ?? false;
  const quiet = values.quiet ?? false;

  if (!quiet && !rawJson) {
    process.stderr.write(`${c.cyan}▸${c.reset} Scanning ${c.bold}${workspacePath}${c.reset}...\n`);
  }

  const snapshot = await createSnapshot(workspacePath, { includeRuns });
  const json = JSON.stringify(snapshot, null, 2);

  // Raw JSON mode: just print and exit (for piping)
  if (rawJson) {
    console.log(json);
    return;
  }

  // Determine export path
  let exportPath = values.export;
  const hasToken = Boolean(values.token);

  // Auto-export when no explicit destination is given
  if (!exportPath && !hasToken) {
    exportPath = defaultExportName(workspacePath);
  }

  // Write file
  if (exportPath) {
    await writeFile(exportPath, json, "utf-8");
  }

  // Upload to API
  let uploadedId: string | undefined;
  if (values.token) {
    const apiUrl = process.env.CLAWCOMMAND_API_URL ?? "http://localhost:4000";
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${values.token}`,
      },
      body: json,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as { scanId: string };
    uploadedId = data.scanId;
  }

  if (!quiet) {
    printSummary(snapshot, exportPath, uploadedId);
  }
}

main().catch((err) => {
  process.stderr.write(`${c.red}✗${c.reset} ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
