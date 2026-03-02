/**
 * Rule parser — parses .cursor/rules/*.mdc files (MDC format with frontmatter)
 */

export interface ParsedRule {
  name?: string;
  description?: string;
  content: string;
  alwaysApply?: boolean;
  globs?: string[];
}

/**
 * Parse a .mdc rule file — extracts frontmatter metadata and body content
 */
export function parseRule(content: string, filename: string): ParsedRule {
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/);

  if (!frontmatter) {
    const body = content.trim();
    const h1 = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return {
      name: h1 ?? filename.replace(/\.mdc?$/, ""),
      content: body,
    };
  }

  const block = frontmatter[1];
  const description = block.match(/description:\s*(.+)/)?.[1]?.trim();
  const alwaysApplyStr = block.match(/alwaysApply:\s*(.+)/)?.[1]?.trim();
  const alwaysApply = alwaysApplyStr === "true";

  const globMatch = block.match(/globs:\s*(.+)/)?.[1]?.trim();
  let globs: string[] | undefined;
  if (globMatch) {
    if (globMatch.startsWith("[")) {
      try { globs = JSON.parse(globMatch); } catch { globs = [globMatch]; }
    } else {
      globs = globMatch.split(",").map((g) => g.trim()).filter(Boolean);
    }
  }

  const bodyStart = content.indexOf("---", content.indexOf("---") + 3) + 3;
  const body = content.slice(bodyStart).trim();
  const h1 = body.match(/^#\s+(.+)$/m)?.[1]?.trim();

  return {
    name: h1 ?? description ?? filename.replace(/\.mdc?$/, ""),
    description,
    content: body,
    alwaysApply: alwaysApply || undefined,
    globs: globs && globs.length > 0 ? globs : undefined,
  };
}
