import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const instructions = readFileSync("AGENTS.md", "utf8");
const root = ".agents/skills";
const skills = readdirSync(root, { withFileTypes: true }).filter((entry) =>
  entry.isDirectory(),
);
assert.ok(skills.length, "At least one repository skill is required");

for (const { name } of skills) {
  const path = `${root}/${name}/SKILL.md`;
  const manifest = readFileSync(path, "utf8");
  const frontmatter = /^---\r?\n([\s\S]+?)\r?\n---\r?\n/.exec(manifest)?.[1];
  assert.ok(frontmatter, `${path} needs frontmatter`);
  assert.ok(frontmatter.split(/\r?\n/).includes(`name: ${name}`));
  assert.match(frontmatter, /^description: \S.+$/m);
  assert.ok(instructions.includes(`(${path})`), `AGENTS.md must link ${path}`);
}
