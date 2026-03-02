import { describe, it, expect } from "vitest";
import { parseAgentFromAgentsMd, parseAgentFromJson, parseAgentsFromOpenClawConfig } from "../agent.js";

describe("parseAgentFromAgentsMd", () => {
  it("extracts agent name from heading", () => {
    const result = parseAgentFromAgentsMd("# My Agent\nSome instructions");
    expect(result.name).toBe("My Agent");
    expect(result.instructions).toBe("Some instructions");
    expect(result.description).toBe("Some instructions");
  });

  it("returns default when no heading found", () => {
    const result = parseAgentFromAgentsMd("no heading here");
    expect(result.name).toBe("default");
    expect(result.instructions).toBe("no heading here");
  });

  it("trims whitespace from name", () => {
    expect(parseAgentFromAgentsMd("#   Padded Name  ").name).toBe("Padded Name");
  });

  it("handles empty content", () => {
    expect(parseAgentFromAgentsMd("").name).toBe("default");
  });

  it("extracts sections from H2 headings", () => {
    const content = "# Agent\n## Setup\nsetup info\n## Usage\nusage info";
    const result = parseAgentFromAgentsMd(content);
    expect(result.sections).toEqual(["Setup", "Usage"]);
  });
});

describe("parseAgentFromJson", () => {
  it("parses name from JSON", () => {
    const result = parseAgentFromJson('{"name":"test-agent"}', "file.json");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("test-agent");
  });

  it("falls back to id field", () => {
    const result = parseAgentFromJson('{"id":"agent-1"}', "file.json");
    expect(result!.name).toBe("agent-1");
  });

  it("falls back to filename", () => {
    const result = parseAgentFromJson('{}', "my-agent.json");
    expect(result!.name).toBe("my-agent");
  });

  it("extracts skills array", () => {
    const result = parseAgentFromJson('{"name":"a","skills":["s1","s2"]}', "f.json");
    expect(result!.skills).toEqual(["s1", "s2"]);
  });

  it("extracts MCP dependencies", () => {
    const result = parseAgentFromJson('{"name":"a","mcpServers":["m1"]}', "f.json");
    expect(result!.mcpDependencies).toEqual(["m1"]);
  });

  it("returns null for invalid JSON", () => {
    expect(parseAgentFromJson("not json", "f.json")).toBeNull();
  });

  it("handles skills as comma-separated string", () => {
    const result = parseAgentFromJson('{"name":"a","skills":"s1, s2"}', "f.json");
    expect(result!.skills).toEqual(["s1", "s2"]);
  });
});

describe("parseAgentsFromOpenClawConfig", () => {
  it("parses agent strings", () => {
    const result = parseAgentsFromOpenClawConfig('{"agents":["agent-a","agent-b"]}');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("agent-a");
  });

  it("parses agent objects", () => {
    const result = parseAgentsFromOpenClawConfig('{"agents":[{"name":"obj-agent","skills":["s1"]}]}');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("obj-agent");
    expect(result[0].skills).toEqual(["s1"]);
  });

  it("returns empty for missing agents key", () => {
    expect(parseAgentsFromOpenClawConfig("{}")).toEqual([]);
  });

  it("returns empty for invalid JSON", () => {
    expect(parseAgentsFromOpenClawConfig("broken")).toEqual([]);
  });

  it("filters null entries", () => {
    const result = parseAgentsFromOpenClawConfig('{"agents":["valid", 123, null]}');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("valid");
  });
});
