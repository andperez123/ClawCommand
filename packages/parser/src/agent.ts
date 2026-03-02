/**
 * Agent config parser — parses agent metadata from AGENTS.md, JSON configs, openclaw.config.json
 */

export interface ParsedAgentConfig {
  name: string;
  skills?: string[];
  mcpDependencies?: string[];
  instructions?: string;
  sections?: string[];
  description?: string;
  config?: Record<string, unknown>;
}

/**
 * Parse agent metadata from AGENTS.md — extracts name, full body, section headings, and description
 */
export function parseAgentFromAgentsMd(content: string): ParsedAgentConfig {
  const h1Match = content.match(/^#\s+(.+)$/m);
  const name = h1Match ? h1Match[1].trim() : "default";

  const sections = [...content.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());

  const body = content.replace(/^#\s+.+$/m, "").trim();
  const instructions = body || undefined;

  const firstParagraph = body.match(/^[^#\n].+/m)?.[0]?.trim();
  const description = firstParagraph && firstParagraph.length <= 300
    ? firstParagraph
    : firstParagraph?.slice(0, 300);

  return {
    name,
    instructions,
    sections: sections.length > 0 ? sections : undefined,
    description,
  };
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
    const description = typeof data.description === "string" ? data.description : undefined;
    const instructions = typeof data.instructions === "string"
      ? data.instructions
      : typeof data.systemPrompt === "string"
        ? data.systemPrompt
        : typeof data.prompt === "string"
          ? data.prompt
          : undefined;

    return {
      name: typeof name === "string" ? name : "default",
      skills: skills.length ? skills : undefined,
      mcpDependencies: mcp.length ? mcp : undefined,
      description,
      instructions,
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
          const description = typeof obj.description === "string" ? obj.description : undefined;
          const instructions = typeof obj.instructions === "string"
            ? obj.instructions
            : typeof obj.systemPrompt === "string"
              ? obj.systemPrompt
              : undefined;
          return {
            name: typeof name === "string" ? name : "default",
            skills: skills.length ? skills : undefined,
            mcpDependencies: mcp.length ? mcp : undefined,
            description,
            instructions,
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
