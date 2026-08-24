#!/usr/bin/env node
// Zero-dependency regression cases for tools/validate-brief.mjs and prepare-deck gating.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const node = process.execPath;
const validator = join(root, 'tools', 'validate-brief.mjs');
const prepare = join(root, 'tools', 'prepare-deck.mjs');
const exampleBrief = readFileSync(join(root, 'examples', 'hackathon-demo', 'DECK_BRIEF.md'), 'utf8');
const work = mkdtempSync(join(tmpdir(), 'getslide-brief-validation-'));

try {
  expectValidatorPass('public fictional example brief', exampleBrief);

  expectValidatorFail(
    'missing required scalar',
    exampleBrief.replace(/^title:.*\n/m, ''),
    /title present.*missing required field/i
  );

  expectValidatorFail(
    'key_points must be a list',
    exampleBrief.replace(/key_points:\n(?:\s+-.*\n)+/, 'key_points: "single scalar"\n'),
    /key_points valid.*expected non-empty list/i
  );

  expectValidatorFail(
    'invalid confidence enum',
    exampleBrief.replace(/^confidence: medium$/m, 'confidence: certain'),
    /confidence valid.*expected high\|medium\|low/i
  );

  expectValidatorFail(
    'high confidence cannot retain unresolved gaps',
    exampleBrief.replace(/^confidence: medium$/m, 'confidence: high'),
    /high-confidence source-sufficiency gate/i
  );

  expectValidatorFail(
    'duplicate top-level field',
    exampleBrief.replace(/^audience:/m, 'title: "Duplicate"\naudience:'),
    /duplicate: title/i
  );

  expectValidatorFail(
    'unsupported nested mapping',
    exampleBrief.replace(/^presentation_goal:.*$/m, 'presentation_goal:\n  nested: value'),
    /unsupported or malformed frontmatter syntax/i
  );

  testPrepareBlocksInvalidBrief();
  testPrepareAcceptsValidBrief();

  console.log('PASS: brief validator and prepare-deck gate regression suite');
} finally {
  rmSync(work, { recursive: true, force: true });
}

function expectValidatorPass(name, brief) {
  const path = writeBrief(name, brief);
  const run = spawnSync(node, [validator, path], { cwd: root, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`${name} should PASS\n${run.stdout}\n${run.stderr}`);
  console.log('PASS:', name);
}

function expectValidatorFail(name, brief, expected) {
  const path = writeBrief(name, brief);
  const run = spawnSync(node, [validator, path], { cwd: root, encoding: 'utf8' });
  if (run.status === 0) throw new Error(`${name} should FAIL\n${run.stdout}`);
  if (!expected.test(run.stdout + run.stderr)) throw new Error(`${name} failed for the wrong reason\n${run.stdout}\n${run.stderr}`);
  console.log('PASS:', name);
}

function testPrepareBlocksInvalidBrief() {
  const dir = join(work, 'prepare-invalid');
  const source = join(work, 'source-invalid.md');
  writeFileSync(source, '# Demo source\n\nA small project.', 'utf8');
  const first = spawnSync(node, [prepare, source, '--out', dir], { cwd: root, encoding: 'utf8' });
  assert(first.status === 0, 'initial prepare should succeed');

  writeFileSync(join(dir, 'DECK_BRIEF.md'), exampleBrief.replace(/^title:.*\n/m, ''), 'utf8');
  writeFileSync(join(dir, 'brief-to-deck-packet.md'), 'STALE PACKET', 'utf8');
  const second = spawnSync(node, [prepare, source, '--out', dir], { cwd: root, encoding: 'utf8' });
  assert(second.status !== 0, 'prepare should reject invalid brief');
  assert(!existsSync(join(dir, 'brief-to-deck-packet.md')), 'invalid brief should remove stale generation packet');
  assert(/failed validation/i.test(second.stdout + second.stderr), 'prepare failure should name brief validation');
  console.log('PASS: prepare-deck blocks invalid brief and removes stale packet');
}

function testPrepareAcceptsValidBrief() {
  const dir = join(work, 'prepare-valid');
  const source = join(work, 'source-valid.md');
  writeFileSync(source, '# Demo source\n\nA small project.', 'utf8');
  const first = spawnSync(node, [prepare, source, '--out', dir], { cwd: root, encoding: 'utf8' });
  assert(first.status === 0, 'initial prepare should succeed');
  writeFileSync(join(dir, 'DECK_BRIEF.md'), exampleBrief, 'utf8');
  const second = spawnSync(node, [prepare, source, '--out', dir], { cwd: root, encoding: 'utf8' });
  assert(second.status === 0, `prepare with valid brief should succeed\n${second.stdout}\n${second.stderr}`);
  assert(existsSync(join(dir, 'brief-to-deck-packet.md')), 'valid brief should create generation packet');
  console.log('PASS: prepare-deck accepts validated brief and creates generation packet');
}

function writeBrief(name, content) {
  const path = join(work, name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.md');
  writeFileSync(path, content, 'utf8');
  return path;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
