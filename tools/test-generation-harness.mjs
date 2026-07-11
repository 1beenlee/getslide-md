#!/usr/bin/env node
// Minimal zero-dependency regression checks for the generation harness.
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const node = process.execPath;
const fixture = join(root, 'eval', 'fixtures', '01-en-complete-hackathon-pwa');
const run = mkdtempSync(join(tmpdir(), 'getslide-harness-'));

function runNode(script, args) {
  return spawnSync(node, [join(root, script), ...args], { cwd: root, encoding: 'utf8' });
}

try {
  const prepared = runNode('tools/prepare-generation.mjs', [fixture, '--out', run]);
  if (prepared.status !== 0) throw new Error(`prepare failed: ${prepared.stderr || prepared.stdout}`);
  for (const name of ['source.md', 'benchmark.json', 'source-to-brief-packet.md']) {
    if (!existsSync(join(run, name))) throw new Error(`prepare did not create ${name}`);
  }
  console.log('PASS: prepare-generation copies a fixture and creates a source packet');
} finally {
  rmSync(run, { recursive: true, force: true });
}
