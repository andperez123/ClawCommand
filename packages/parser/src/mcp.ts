/**
 * MCP config parser — parses MCP server configs, infers tool count from schema files
 */

export interface ParsedMcpServer {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, unknown>;
  envKeys?: string[];
  toolCount: number;
  authConfigured: boolean;
  transport?: string;
  url?: string;
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

      const envObj = typeof c.env === "object" && c.env !== null ? (c.env as Record<string, unknown>) : undefined;
      const envKeys = envObj ? Object.keys(envObj) : undefined;

      const transport = typeof c.transport === "string"
        ? c.transport
        : command ? "stdio" : typeof c.url === "string" ? "sse" : undefined;

      const url = typeof c.url === "string" ? c.url : undefined;

      const toolCount = Array.isArray(c.tools)
        ? c.tools.length
        : typeof c.toolCount === "number"
          ? c.toolCount as number
          : 0;

      servers.push({
        name,
        command,
        args,
        env: envObj,
        envKeys,
        toolCount,
        authConfigured: !!hasAuth,
        transport,
        url,
        config: c,
      });
    }
  } catch {
    // ignore parse errors
  }
  return servers;
}
