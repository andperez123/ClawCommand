import { describe, it, expect } from "vitest";
import { parseSkillManifest } from "../skill.js";

describe("parseSkillManifest", () => {
  it("parses frontmatter with all fields", () => {
    const content = `---
name: my-skill
version: 1.2.0
description: A useful skill
---
# My Skill
Instructions here`;
    const result = parseSkillManifest(content);
    expect(result.name).toBe("my-skill");
    expect(result.version).toBe("1.2.0");
    expect(result.description).toBe("A useful skill");
    expect(result.pinned).toBe(true);
    expect(result.instructions).toBe("# My Skill\nInstructions here");
  });

  it("sets pinned=true when version present", () => {
    const result = parseSkillManifest("---\nversion: 1.0.0\n---\n");
    expect(result.pinned).toBe(true);
    expect(result.version).toBe("1.0.0");
  });

  it("sets pinned=false when no version", () => {
    const result = parseSkillManifest("---\nname: noversion\n---\n");
    expect(result.pinned).toBe(false);
    expect(result.version).toBeUndefined();
  });

  it("returns defaults when no frontmatter", () => {
    const result = parseSkillManifest("Just markdown content");
    expect(result.pinned).toBe(false);
    expect(result.instructions).toBe("Just markdown content");
    expect(result.description).toBe("Just markdown content");
  });

  it("returns defaults for empty string", () => {
    const result = parseSkillManifest("");
    expect(result.pinned).toBe(false);
    expect(result.instructions).toBeUndefined();
  });

  it("handles name-only frontmatter", () => {
    const result = parseSkillManifest("---\nname: simple\n---\ncontent");
    expect(result.name).toBe("simple");
    expect(result.pinned).toBe(false);
  });
});
