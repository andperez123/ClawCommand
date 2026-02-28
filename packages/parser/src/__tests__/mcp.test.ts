import { describe, it, expect } from "vitest";
import { parseMcpConfig } from "../mcp.js";

describe("parseMcpConfig", () => {
  it("parses mcpServers map", () => {
    const config = JSON.stringify({
      mcpServers: {
        "my-server": { command: "npx", args: ["-y", "server"], env: { KEY: "val" } },
      },
    });
    const result = parseMcpConfig(config);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("my-server");
    expect(result[0].command).toBe("npx");
    expect(result[0].args).toEqual(["-y", "server"]);
    expect(result[0].authConfigured).toBe(true);
  });

  it("detects auth from env", () => {
    const config = JSON.stringify({ mcpServers: { s: { env: { TOKEN: "x" } } } });
    expect(parseMcpConfig(config)[0].authConfigured).toBe(true);
  });

  it("detects auth from headers", () => {
    const config = JSON.stringify({ mcpServers: { s: { headers: { Authorization: "x" } } } });
    expect(parseMcpConfig(config)[0].authConfigured).toBe(true);
  });

  it("detects auth from apiKey", () => {
    const config = JSON.stringify({ mcpServers: { s: { apiKey: "key" } } });
    expect(parseMcpConfig(config)[0].authConfigured).toBe(true);
  });

  it("reports no auth when none present", () => {
    const config = JSON.stringify({ mcpServers: { s: { command: "test" } } });
    expect(parseMcpConfig(config)[0].authConfigured).toBe(false);
  });

  it("falls back to mcp key", () => {
    const config = JSON.stringify({ mcp: { alt: { command: "cmd" } } });
    expect(parseMcpConfig(config)).toHaveLength(1);
    expect(parseMcpConfig(config)[0].name).toBe("alt");
  });

  it("returns empty for invalid JSON", () => {
    expect(parseMcpConfig("not json")).toEqual([]);
  });

  it("returns empty for empty config", () => {
    expect(parseMcpConfig("{}")).toEqual([]);
  });

  it("parses multiple servers", () => {
    const config = JSON.stringify({
      mcpServers: { a: { command: "a" }, b: { command: "b" } },
    });
    expect(parseMcpConfig(config)).toHaveLength(2);
  });
});
