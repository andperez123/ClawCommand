#!/usr/bin/env node
/**
 * openclaw-scan — Read-only OpenClaw workspace scanner
 * Produces sanitized snapshot JSON. Never extracts secrets.
 */

import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { createSnapshot } from "./scanner.js";

const VERSION = "0.1.0";

const HELP = `
openclaw-scan v${VERSION}
Read-only OpenClaw workspace scanner. Produces sanitized snapshot JSON.

Usage:
  openclaw-scan [options]

Options:
  -p, --path <dir>       Workspace directory to scan (default: cwd)
  -e, --export <file>    Write snapshot JSON to a file
  -t, --token <token>    Upload snapshot to ClawCommand API (Bearer token)
      --include-runs     Include run/job history from log files
  -h, --help             Show this help message
  -v, --version          Show version number

Environment:
  CLAWCOMMAND_API_URL    API endpoint (default: http://localhost:4000)

Examples:
  openclaw-scan                          Print snapshot to stdout
  openclaw-scan -p ./my-project          Scan a specific directory
  openclaw-scan -e snapshot.json         Save snapshot to file
  openclaw-scan -t dev                   Upload to local API
  openclaw-scan -e out.json -t dev       Save locally AND upload
`.trim();

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      token: { type: "string", short: "t" },
      path: { type: "string", short: "p" },
      export: { type: "string", short: "e" },
      "include-runs": { type: "boolean", default: false },
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

  const snapshot = await createSnapshot(workspacePath, { includeRuns });
  const json = JSON.stringify(snapshot, null, 2);

  if (values.export) {
    await writeFile(values.export, json, "utf-8");
    console.error(`Snapshot written to ${values.export}`);
  }

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
    console.error(`Snapshot uploaded. Scan ID: ${data.scanId}`);
  }

  if (!values.export && !values.token) {
    console.log(json);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
