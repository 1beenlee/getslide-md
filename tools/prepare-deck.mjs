#!/usr/bin/env node
// Zero-dependency source staging for the agent-native getslide workflow.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length !== 3 || args[1] !== '--out') {
  fail('Usage: node tools/prepare-deck.mjs <source-text-or-markdown-file> --out <run-directory>');
}

const sourcePath = resolve(args[0]);
const out = resolve(args[2]);
if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
  fail('Source file does not exist or is not a file: ' + args[0]);
}

const source = readFileSync(sourcePath, 'utf8');
if (!source.trim()) fail('Source file is empty: ' + args[0]);

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'source.md'), source, 'utf8');

const sourcePrompt = readFileSync(resolve(root, 'prompts', 'source-to-deck-brief.md'), 'utf8');
const schema = readFileSync(resolve(root, 'docs', 'DECK_BRIEF.schema.md'), 'utf8');
const sourcePacket = [
  '# Source-to-brief packet',
  '',
  sourcePrompt,
  '',
  '## Schema',
  '',
  schema,
  '',
  '## Source',
  '',
  source,
].join('\n');
writeFileSync(resolve(out, 'source-to-brief-packet.md'), sourcePacket, 'utf8');

const briefPath = resolve(out, 'DECK_BRIEF.md');
if (!existsSync(briefPath)) {
  console.log('Prepared ' + display(out) + '. Next: create DECK_BRIEF.md from source-to-brief-packet.md, then rerun this command.');
  process.exit(0);
}

const brief = readFileSync(briefPath, 'utf8');
if (!brief.trim()) fail('DECK_BRIEF.md exists but is empty: ' + display(briefPath));

const files = [
  'prompts/brief-to-html-deck.md',
  'templates/base-onefile-deck.html',
  'docs/HTML_DECK_CONTRACT.md',
  'docs/STUDENT_DEVELOPER_PATTERNS.md',
];
const generationResources = files
  .map((file) => '## ' + file + '\n\n' + readFileSync(resolve(root, file), 'utf8'))
  .join('\n\n');
const deckPacket = '# Brief-to-deck packet\n\n## Current brief\n\n' + brief + '\n\n' + generationResources;
writeFileSync(resolve(out, 'brief-to-deck-packet.md'), deckPacket, 'utf8');
console.log('Prepared ' + display(out) + '. Next: create index.html from brief-to-deck-packet.md, then validate it.');

function display(path) {
  return (relative(process.cwd(), path) || basename(path)).replace(/\\/g, '/');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
