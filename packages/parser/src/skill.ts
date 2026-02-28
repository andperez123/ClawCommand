/**
 * Skill manifest parser — parses SKILL.md frontmatter
 */

export interface ParsedSkillManifest {
  name?: string;
  version?: string;
  description?: string;
  pinned: boolean;
}

/**
 * Parse skill manifest from SKILL.md content
 */
export function parseSkillManifest(content: string): ParsedSkillManifest {
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    return { pinned: false };
  }

  const block = frontmatter[1];
  const name = block.match(/name:\s*(.+)/)?.[1]?.trim();
  const version = block.match(/version:\s*(.+)/)?.[1]?.trim();
  const description = block.match(/description:\s*(.+)/)?.[1]?.trim();

  return {
    name,
    version,
    description,
    pinned: !!version,
  };
}
