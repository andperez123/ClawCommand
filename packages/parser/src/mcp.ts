/**
 * MCP config parser — parses MCP server configs, infers tool count from schema files
 */

export interface ParsedMcpServer {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, unknown>;
  toolCount: number;
  authConfigured: boolean;
  config: Record<string, unknown>;
}

/**
 * Parse MCP config from openclaw.json / mcp.json format
 */
export function parseMcpConfig(content: string): ParsedMcpServer[] {
  const servers: ParsedMcpServer[] = [];
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    const mcp = (data.mcpServers ?? data.mcp ?? {}) as Record<string, Record<string, unknown>>;

    for (const [name, config] of Object.entries(mcp)) {
      const c = config ?? {};
      const hasAuth =
        !!(c.env && typeof c.env === "object") ||
        !!(c.headers && typeof c.headers === "object") ||
        !!c.apiKey;

      const command = typeof c.command === "string" ? c.command : undefined;
      const args = Array.isArray(c.args)
        ? (c.args.filter((x): x is string => typeof x === "string") as string[])
        : undefined;

      servers.push({
        name,
        command,
        args,
        env: typeof c.env === "object" ? (c.env as Record<string, unknown>) : undefined,
        toolCount: 0, // Filled by tool schema parser when available
        authConfigured: !!hasAuth,
        config: c,
      });
    }
  } catch {
    // ignore parse errors
  }
  return servers;
}
