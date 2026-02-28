/**
 * Run metadata parser — parses run records from log files
 */

export interface ParsedRunRecord {
  agentId: string;
  timestamp: string;
  success: boolean;
  errorSignature?: string;
  summary?: string;
}

/**
 * Parse run metadata from a log line (JSON or text format)
 * Supports common Cursor/OpenClaw log patterns
 */
export function parseRunFromLogLine(line: string): ParsedRunRecord | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Try JSON
  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;
    const agentId = (data.agentId ?? data.agent ?? data.agent_id) as string;
    const timestamp =
      (data.timestamp ?? data.time ?? data.createdAt) as string;
    const success = data.success !== false && !data.error;
    const errorSignature = (data.errorSignature ?? data.error_signature ?? data.error) as
      | string
      | undefined;
    const summary = (data.summary ?? data.message) as string | undefined;

    if (timestamp) {
      return {
        agentId: typeof agentId === "string" ? agentId : "unknown",
        timestamp: String(timestamp),
        success: !!success,
        errorSignature: typeof errorSignature === "string" ? errorSignature : undefined,
        summary: typeof summary === "string" ? summary : undefined,
      };
    }
  } catch {
    // not JSON
  }

  // ISO8601-like timestamp at start
  const isoMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2}T[\d:.+-Z]+)\s+(?:\[([^\]]+)\]\s+)?(?:success|error|fail)/i
  );
  if (isoMatch) {
    const [, ts, agentHint] = isoMatch;
    const success = /success/i.test(trimmed) && !/error|fail/i.test(trimmed);
    const errorMatch = trimmed.match(/error[:\s]+(\S+)/i);
    return {
      agentId: agentHint ?? "unknown",
      timestamp: ts ?? new Date().toISOString(),
      success,
      errorSignature: errorMatch?.[1],
      summary: trimmed.slice(0, 200),
    };
  }

  return null;
}
