#!/usr/bin/env node
// Zero-dependency regression checks for the v0.3 agent-native workflow.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const node = process.execPath;
const run = mkdtempSync(join(tmpdir(), 'getslide-agent-'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(text, pattern, message) {
  assert(pattern.test(text), message);
}

function runNode(script, args) {
  return spawnSync(node, [join(root, script), ...args], { cwd: root, encoding: 'utf8' });
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert(match, 'skill is missing YAML frontmatter');
  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (field) fields.set(field[1], field[2].trim());
  }
  return fields;
}

try {
  const agentSkillPath = join(root, '.agents', 'skills', 'getslide', 'SKILL.md');
  const claudeSkillPath = join(root, '.claude', 'skills', 'getslide', 'SKILL.md');
  assert(existsSync(agentSkillPath), 'missing .agents getslide skill');
  assert(existsSync(claudeSkillPath), 'missing .claude getslide skill');

  const agentSkill = readFileSync(agentSkillPath, 'utf8');
  const claudeSkill = readFileSync(claudeSkillPath, 'utf8');
  assert(agentSkill === claudeSkill, 'Codex/Agent Skills and Claude Code skill copies have drifted');

  const frontmatter = parseFrontmatter(agentSkill);
  assert(frontmatter.get('name') === 'getslide', 'skill frontmatter name must be getslide');
  assert((frontmatter.get('description') || '').length >= 40, 'skill description is missing or too short');

  for (const path of [
    'AGENTS.md',
    'PRODUCT_DECISIONS.md',
    'OPEN_SOURCE_BOUNDARY.md',
    'docs/DECK_BRIEF.schema.md',
    'docs/HTML_DECK_CONTRACT.md',
    'docs/STUDENT_DEVELOPER_PATTERNS.md',
    'docs/VALIDATION.md',
    'docs/EDITABILITY_EVAL.md',
    'tools/prepare-deck.mjs',
    'tools/validate-deck.mjs',
  ]) {
    assert(agentSkill.includes(path), `skill does not reference required resource ${path}`);
    assert(existsSync(join(root, path)), `skill references missing resource ${path}`);
  }
  for (const token of ['High confidence', 'Medium confidence', 'Low confidence', 'missing_information', 'auto_filled_assumptions']) {
    assert(agentSkill.includes(token), `skill is missing source-sufficiency rule: ${token}`);
  }
  console.log('PASS: cross-client getslide skill contract is present and synchronized');

  const sourcePath = join(run, 'input.md');
  const outputPath = join(run, 'output');
  writeFileSync(sourcePath, '# Demo project\n\nA source-grounded project README with a clearly supported project statement.\n', 'utf8');

  const first = runNode('tools/prepare-deck.mjs', [sourcePath, '--out', outputPath]);
  assert(first.status === 0, `prepare-deck first pass failed: ${first.stderr || first.stdout}`);
  for (const name of ['source.md', 'source-to-brief-packet.md']) {
    assert(existsSync(join(outputPath, name)), `prepare-deck did not create ${name}`);
  }
  assert(!existsSync(join(outputPath, 'brief-to-deck-packet.md')), 'prepare-deck created a deck packet before DECK_BRIEF.md existed');

  const stagedSource = readFileSync(join(outputPath, 'source.md'), 'utf8');
  assert(stagedSource === readFileSync(sourcePath, 'utf8'), 'prepare-deck changed source wording during staging');

  writeFileSync(join(outputPath, 'DECK_BRIEF.md'), [
    '---',
    'title: "Demo project"',
    'audience: "University student developer demo audience"',
    'presentation_context: "Project demo"',
    'presentation_goal: "Explain the project faithfully"',
    'core_message: "Use the supplied project source as the evidence boundary."',
    'key_points:',
    '  - "The supplied README is the source for the deck"',
    'source_materials:',
    '  - "Project README"',
    'confidence: high',
    'recommended_direction: developer-demo',
    '---',
    '',
  ].join('\n'), 'utf8');

  const second = runNode('tools/prepare-deck.mjs', [sourcePath, '--out', outputPath]);
  assert(second.status === 0, `prepare-deck second pass failed: ${second.stderr || second.stdout}`);
  const packetPath = join(outputPath, 'brief-to-deck-packet.md');
  assert(existsSync(packetPath), 'prepare-deck did not create brief-to-deck-packet.md after a brief existed');
  const packet = readFileSync(packetPath, 'utf8');
  assertIncludes(packet, /## Current brief/, 'deck packet does not contain the current brief boundary');
  assertIncludes(packet, /Do not replace, simplify, remove, or rewrite the template navigation script/i, 'deck packet omits canonical navigation protection');
  assertIncludes(packet, /HTML_DECK_CONTRACT/, 'deck packet omits the HTML contract');
  console.log('PASS: arbitrary source staging creates both agent workflow packets');

  const prepareScript = readFileSync(join(root, 'tools', 'prepare-deck.mjs'), 'utf8');
  assert(!/\bfetch\s*\(|https?:\/\/|openai|anthropic|gemini/i.test(prepareScript), 'prepare-deck.mjs introduces a provider or network dependency');
  console.log('PASS: v0.3 source staging remains provider-neutral and zero-network');
} finally {
  rmSync(run, { recursive: true, force: true });
}
