/**
 * Skill manifest parser — parses SKILL.md frontmatter and body
 */

export interface ParsedSkillManifest {
  name?: string;
  version?: string;
  description?: string;
  instructions?: string;
  pinned: boolean;
}

/**
 * Parse skill manifest from SKILL.md content — extracts frontmatter fields and body instructions
 */
export function parseSkillManifest(content: string): ParsedSkillManifest {
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    const body = content.trim();
    return {
      pinned: false,
      instructions: body || undefined,
      description: body ? body.split("\n")[0].slice(0, 300) : undefined,
    };
  }

  const block = frontmatter[1];
  const name = block.match(/name:\s*(.+)/)?.[1]?.trim();
  const version = block.match(/version:\s*["']?([^"'\n]+)["']?/)?.[1]?.trim();
  const description = block.match(/description:\s*(.+)/)?.[1]?.trim();

  const bodyStart = content.indexOf("---", content.indexOf("---") + 3) + 3;
  const body = content.slice(bodyStart).trim();

  return {
    name,
    version,
    description: description || (body ? body.split("\n")[0].slice(0, 300) : undefined),
    instructions: body || undefined,
    pinned: !!version,
  };
}
