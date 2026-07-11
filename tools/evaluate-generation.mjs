#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [fixtureArg, runArg, ...extra] = process.argv.slice(2);
if (!fixtureArg || !runArg || extra.length) {
  console.error('Usage: node tools/evaluate-generation.mjs <fixture-directory> <run-directory>');
  process.exit(1);
}
const fixture = resolve(fixtureArg);
const run = resolve(runArg);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [], passes = [], manual = [];
let validator = null;
const paths = {};
for (const name of ['source.md', 'benchmark.json', 'DECK_BRIEF.md', 'index.html']) {
  paths[name] = resolve(run, name);
  if (existsSync(paths[name])) passes.push('Found ' + name); else failures.push('Missing ' + name);
}
if (failures.length) finish();
const bench = JSON.parse(readFileSync(paths['benchmark.json'], 'utf8'));
const brief = readFileSync(paths['DECK_BRIEF.md'], 'utf8');
const deck = readFileSync(paths['index.html'], 'utf8');
const frontmatter = brief.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!frontmatter) failures.push('DECK_BRIEF.md has no YAML frontmatter'); else passes.push('Brief has YAML frontmatter');
const yaml = frontmatter ? frontmatter[1] : '';
const field = (name) => new RegExp('^' + name + ':\\s*(?:.+|$)', 'm').test(yaml);
for (const name of ['title', 'audience', 'presentation_context', 'presentation_goal', 'core_message', 'key_points', 'source_materials', 'confidence']) {
  if (field(name)) passes.push('Brief field present: ' + name); else failures.push('Brief field missing: ' + name);
}
const confidence = (yaml.match(/^confidence:\s*(\w+)/m) || [])[1];
if (['high', 'medium', 'low'].includes(confidence)) passes.push('Confidence ' + confidence); else failures.push('Confidence ' + (confidence || 'missing'));
if (bench.expected_confidence && confidence !== bench.expected_confidence) failures.push('Expected confidence ' + bench.expected_confidence + ', got ' + (confidence || 'missing'));
const direction = (yaml.match(/^recommended_direction:\s*(\S+)/m) || [])[1];
if (direction === 'developer-demo') passes.push('Direction developer-demo'); else failures.push('Direction ' + (direction || 'missing'));
const combined = (brief + '\n' + deck).toLowerCase();
for (const term of bench.must_include_anywhere || []) check(combined.includes(term.toLowerCase()), 'Required term ' + term);
for (const link of bench.expected_links || []) check(combined.includes(link.toLowerCase()), 'Expected link ' + link);
for (const fragment of bench.forbidden_claim_fragments || []) check(!combined.includes(fragment.toLowerCase()), 'Forbidden claim ' + fragment);
const missingBlock = yaml.split(/\r?\n/).reduce((out, line, index, lines) => {
  if (/^missing_information:\s*/.test(line)) {
    for (let i = index + 1; i < lines.length && !/^[a-z_]+:\s*/.test(lines[i]); i += 1) out.push(lines[i]);
  }
  return out;
}, []).join('\n');
for (const item of bench.must_appear_in_missing_information || []) check(missingBlock.toLowerCase().includes(item.toLowerCase()), 'Missing-information item ' + item);
check(!/(?:[a-z]:\\users\\|\/users\/|system prompt|api[_ -]?key|\.env\b)/i.test(brief + '\n' + deck), 'No obvious path or prompt leakage');
validator = spawnSync(process.execPath, [resolve(root, 'tools/validate-deck.mjs'), paths['index.html']], { encoding: 'utf8' });
check(validator.status === 0, 'Deck validator ' + (validator.status === 0 ? 'passed' : 'failed'));
manual.push('Review factual support, omissions, narrative, readability, overflow, keyboard navigation, and print preview using docs/EVALUATION_RUBRIC.md.');
finish();

function check(ok, label) { if (ok) passes.push(label); else failures.push(label); }
function finish() {
  const result = {
    automated_pass: failures.length === 0,
    automated_passes: passes,
    automated_failures: failures,
    manual_review_required: manual,
    validator_output: validator ? (validator.stdout + validator.stderr).trim() : null
  };
  writeFileSync(resolve(run, 'evaluation.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
  const lines = ['# Generation evaluation', '', '## Automated ' + (result.automated_pass ? 'PASS' : 'FAIL'), ...passes.map((x) => '- PASS: ' + x), ...failures.map((x) => '- FAIL: ' + x), '', '## Manual review required', ...manual.map((x) => '- ' + x), '', 'String checks are conservative cues; they do not prove factual accuracy.'];
  writeFileSync(resolve(run, 'evaluation.md'), lines.join('\n') + '\n', 'utf8');
  console.log('Evaluation ' + (result.automated_pass ? 'PASS' : 'FAIL') + ': ' + resolve(run, 'evaluation.md'));
  process.exit(result.automated_pass ? 0 : 1);
}
