/**
 * ClawCommand Config Parser + Normalizer
 * Milestone 2: Agent/MCP/skill/run metadata parsers
 */

export {
  parseAgentFromAgentsMd,
  parseAgentFromJson,
  parseAgentsFromOpenClawConfig,
  type ParsedAgentConfig,
} from "./agent.js";

export {
  parseMcpConfig,
  type ParsedMcpServer,
} from "./mcp.js";

export {
  parseSkillManifest,
  type ParsedSkillManifest,
} from "./skill.js";

export {
  parseRunFromLogLine,
  type ParsedRunRecord,
} from "./run.js";

export { normalizeSnapshot } from "./normalizer.js";
