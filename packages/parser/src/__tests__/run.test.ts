import { describe, it, expect } from "vitest";
import { parseRunFromLogLine } from "../run.js";

describe("parseRunFromLogLine", () => {
  it("parses JSON log line", () => {
    const line = JSON.stringify({
      agentId: "agent-1",
      timestamp: "2025-01-15T10:00:00Z",
      success: true,
      summary: "Completed task",
    });
    const result = parseRunFromLogLine(line);
    expect(result).not.toBeNull();
    expect(result!.agentId).toBe("agent-1");
    expect(result!.timestamp).toBe("2025-01-15T10:00:00Z");
    expect(result!.success).toBe(true);
    expect(result!.summary).toBe("Completed task");
  });

  it("parses JSON with error", () => {
    const line = JSON.stringify({
      agentId: "agent-2",
      timestamp: "2025-01-15T10:00:00Z",
      success: false,
      error: "TIMEOUT",
    });
    const result = parseRunFromLogLine(line);
    expect(result!.success).toBe(false);
    expect(result!.errorSignature).toBe("TIMEOUT");
  });

  it("handles alternative field names", () => {
    const line = JSON.stringify({ agent: "alt", time: "2025-01-01T00:00:00Z" });
    const result = parseRunFromLogLine(line);
    expect(result!.agentId).toBe("alt");
    expect(result!.timestamp).toBe("2025-01-01T00:00:00Z");
  });

  it("parses ISO timestamp text format", () => {
    const result = parseRunFromLogLine("2025-01-15T10:00:00Z [agent-1] success completed");
    expect(result).not.toBeNull();
    expect(result!.agentId).toBe("agent-1");
    expect(result!.success).toBe(true);
  });

  it("parses error text format", () => {
    const result = parseRunFromLogLine("2025-01-15T10:00:00Z [agent-1] error: TIMEOUT");
    expect(result).not.toBeNull();
    expect(result!.success).toBe(false);
    expect(result!.errorSignature).toBe("TIMEOUT");
  });

  it("returns null for empty line", () => {
    expect(parseRunFromLogLine("")).toBeNull();
    expect(parseRunFromLogLine("   ")).toBeNull();
  });

  it("returns null for non-matching text", () => {
    expect(parseRunFromLogLine("just some random text")).toBeNull();
  });

  it("returns null for JSON without timestamp", () => {
    expect(parseRunFromLogLine('{"agentId":"a"}')).toBeNull();
  });

  it("defaults agentId to unknown when missing", () => {
    const line = JSON.stringify({ timestamp: "2025-01-01T00:00:00Z" });
    const result = parseRunFromLogLine(line);
    expect(result!.agentId).toBe("unknown");
  });
});
