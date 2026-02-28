/**
 * Agent config parser — parses agent metadata from AGENTS.md, JSON configs, openclaw.config.json
 */

export interface ParsedAgentConfig {
  name: string;
  skills?: string[];
  mcpDependencies?: string[];
  config?: Record<string, unknown>;
}

/**
 * Parse agent name and hints from AGENTS.md
 */
export function parseAgentFromAgentsMd(content: string): { name: string } {
  const m = content.match(/^#\s+(.+)$/m);
  return { name: m ? m[1].trim() : "default" };
}

/**
 * Parse agent config from JSON (e.g. ~/.openclaw/agents/*.json)
 */
export function parseAgentFromJson(
  content: string,
  filename: string
): ParsedAgentConfig | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    const name =
      (data.name as string) ??
      (data.id as string) ??
      filename.replace(/\.(json|md)$/, "");

    const skills = extractStringArray(data, "skills", "skill");
    const mcp = extractStringArray(data, "mcp", "mcpServers", "mcpDependencies");

    return {
      name: typeof name === "string" ? name : "default",
      skills: skills.length ? skills : undefined,
      mcpDependencies: mcp.length ? mcp : undefined,
      config: data,
    };
  } catch {
    return null;
  }
}

/**
 * Parse agents from openclaw.config.json
 */
export function parseAgentsFromOpenClawConfig(
  content: string
): ParsedAgentConfig[] {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    const agents = data.agents;
    if (!Array.isArray(agents)) return [];

    return agents
      .map((a): ParsedAgentConfig | null => {
        if (typeof a === "string") {
          return { name: a };
        }
        if (typeof a === "object" && a !== null) {
          const obj = a as Record<string, unknown>;
          const name = (obj.name as string) ?? (obj.id as string) ?? "default";
          const skills = extractStringArray(obj, "skills", "skill");
          const mcp = extractStringArray(obj, "mcp", "mcpServers", "mcpDependencies");
          return {
            name: typeof name === "string" ? name : "default",
            skills: skills.length ? skills : undefined,
            mcpDependencies: mcp.length ? mcp : undefined,
            config: obj,
          };
        }
        return null;
      })
      .filter((a): a is ParsedAgentConfig => a !== null);
  } catch {
    return [];
  }
}

function extractStringArray(
  obj: Record<string, unknown>,
  ...keys: string[]
): string[] {
  for (const key of keys) {
    const v = obj[key];
    if (Array.isArray(v)) {
      return v
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof v === "string") {
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      return Object.keys(v as Record<string, unknown>);
    }
  }
  return [];
}
