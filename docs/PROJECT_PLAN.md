# ClawCommand — OpenClaw Control Dashboard

**File-Scanner First → Optional Runtime Control Upgrade**

---

## 1. Executive Objective

Build a hosted control dashboard for OpenClaw environments that:

**Phase 1 (MVP):**
- Uses a local file-based scanner
- Requires no runtime control or networking changes
- Provides inventory, diagnostics, compliance, drift detection
- Generates patch bundles for remediation

**Phase 2 (Upgrade):**
- Adds optional lightweight Node Agent daemon
- Enables real-time status, job execution, log streaming, restart control

**Strategy:** Start with lowest-friction onboarding (scanner) → expand to full orchestration.

---

## 2. Product Architecture

### Control Plane (Hosted SaaS)
- Web dashboard (React / Next)
- API layer (Node / Go)
- Snapshot ingestion endpoint
- Parser & normalization engine
- Diff engine (scan-to-scan)
- Policy engine
- Patch generator
- Audit log
- Auth + RBAC

### Local Component (Phase 1)
**OpenClaw Scanner:**
- Single binary
- Read-only
- Auto-detect workspace
- Upload snapshot OR export zip

### Optional Local Component (Phase 2)
**Node Agent daemon:**
- Heartbeats
- Job execution
- Restart commands
- Live logs
- MCP testing

---

## 3. Phase 1 — File Scanner MVP

### 3.1 Scanner Features

**Command:** `openclaw-scan --token <TOKEN>`

**Capabilities:**
- Auto-detect OpenClaw workspace
- Parse: Agent configs, Skill manifests, MCP server configs, Tool schemas, Run metadata, Log summaries
- Never upload secret values
- Upload sanitized snapshot JSON

**Flags:** `--token`, `--path`, `--export`, `--include-runs`

**Security:** Read-only, no shell execution, no remote control, no secret extraction.

### 3.2 Dashboard Modules (Scanner-Based)

| Module | Purpose |
|--------|---------|
| **A. Onboarding** | Generate token, upload snapshot or live scan sync, import review |
| **B. Overview** | Agents/MCP/Skills status, compliance score, latest scan, top issues |
| **C. Agents** | List/detail views, config validation, skills matrix, MCP deps, run history, patch generation |
| **D. MCP Servers** | Tool catalog, schema validation, auth config, version mismatch, patches |
| **E. Skills Registry** | Fleet-wide version map, policy-approved versions, unpinned/drift detection |
| **F. Runs / Job History** | Parsed from logs, group by failure signature, root cause hints |
| **G. Policy & Compliance** | Required pinning, allowed MCP, env keys, tool allowlist, violations, patches |
| **H. Scan Engine** | Normalized state, scan-to-scan diff, change tracking UI |

---

## 4. Data Model

**Core entities:** Workspace, Node, Agent, Skill, MCP Server, Tool, Run, Scan, Policy, Violation, PatchBundle, User, Role

---

## 5. Development Milestones (Phase 1)

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 1 | Scanner + Snapshot Upload | CLI scanner, snapshot JSON schema, ingestion endpoint, basic inventory display |
| 2 | Config Parser + Normalizer | Agent/MCP/skill/run metadata parsers |
| 3 | Validation Engine | Schema validation, missing keys, version mismatch |
| 4 | Diff Engine | Scan comparison, change tracking UI |
| 5 | Policy Engine | Rule definition, violation detection, compliance scoring |
| 6 | Patch Generator | Diff writer, patch bundle builder, PR integration (optional) |
| 7 | Production Hardening | RBAC, audit log, encryption, limits, rate limiting |

---

## 6. Security Model

**Phase 1:** Read-only scanning, secrets masked, no command execution, no inbound ports, signed onboarding tokens.

**Phase 2:** Outbound-only daemon, scoped commands, audit logging, RBAC, optional approval workflow.

---

## 7. UX Principles

- Always show "Based on scan at <timestamp>"
- Every issue links to: Evidence (file + line), Recommended fix, One-click patch
- No ambiguous statuses
- Clear separation: Static state (scanner) vs Live state (daemon-enabled)

---

## 8. Strategic Advantage

Scanner-first: Minimal adoption friction, low security resistance, fast engineering path, strong enterprise positioning, natural upsell path.
