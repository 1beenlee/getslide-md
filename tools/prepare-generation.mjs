#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const fixtureArg = args.find((arg) => !arg.startsWith('--'));
const outIndex = args.indexOf('--out');
if (!fixtureArg || outIndex === -1 || !args[outIndex + 1] || args.length !== 3) {
  console.error('Usage: node tools/prepare-generation.mjs <fixture-directory> --out <run-directory>');
  process.exit(1);
}
const fixture = resolve(fixtureArg);
const out = resolve(args[outIndex + 1]);
for (const name of ['source.md', 'benchmark.json']) {
  if (!existsSync(resolve(fixture, name))) {
    console.error('Fixture is missing ' + name + ': ' + fixtureArg);
    process.exit(1);
  }
}
mkdirSync(out, { recursive: true });
for (const name of ['source.md', 'benchmark.json']) copyFileSync(resolve(fixture, name), resolve(out, name));
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(fixture, 'source.md'), 'utf8');
const prompt = readFileSync(resolve(root, 'prompts/source-to-deck-brief.md'), 'utf8');
const schema = readFileSync(resolve(root, 'docs/DECK_BRIEF.schema.md'), 'utf8');
writeFileSync(resolve(out, 'source-to-brief-packet.md'), '# Source-to-brief packet\n\n' + prompt + '\n\n## Schema\n\n' + schema + '\n\n## Source\n\n' + source, 'utf8');
if (existsSync(resolve(out, 'DECK_BRIEF.md'))) {
  const files = ['prompts/brief-to-html-deck.md', 'templates/base-onefile-deck.html', 'docs/HTML_DECK_CONTRACT.md', 'docs/STUDENT_DEVELOPER_PATTERNS.md'];
  const packet = files.map((file) => '## ' + file + '\n\n' + readFileSync(resolve(root, file), 'utf8')).join('\n\n');
  writeFileSync(resolve(out, 'brief-to-deck-packet.md'), '# Brief-to-deck packet\n\n## Approved brief\n\n' + readFileSync(resolve(out, 'DECK_BRIEF.md'), 'utf8') + '\n\n' + packet, 'utf8');
  console.log('Prepared ' + display(out) + '. Next manual step: use brief-to-deck-packet.md to create index.html.');
} else {
  console.log('Prepared ' + display(out) + '. Next manual step: use source-to-brief-packet.md to create and approve DECK_BRIEF.md, then rerun this command.');
}
function display(path) {
  return (relative(process.cwd(), path) || basename(path)).replace(/\\/g, '/');
}
