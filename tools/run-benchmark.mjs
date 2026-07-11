#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [runsArg, ...extra] = process.argv.slice(2);
if (!runsArg || extra.length) { console.error('Usage: node tools/run-benchmark.mjs <runs-directory>'); process.exit(1); }
const runs = resolve(runsArg), root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), reports = resolve(root, 'eval/reports');
if (!existsSync(runs)) { console.error('Runs directory not found: ' + runsArg); process.exit(1); }
const complete = [], incomplete = [];
for (const name of readdirSync(runs, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
  const dir = resolve(runs, name);
  const absent = ['source.md', 'benchmark.json', 'DECK_BRIEF.md', 'index.html'].filter((file) => !existsSync(resolve(dir, file)));
  if (absent.length) { incomplete.push({ name, absent }); continue; }
  const fixture = resolve(root, 'eval/fixtures', name);
  const result = spawnSync(process.execPath, [resolve(root, 'tools/evaluate-generation.mjs'), fixture, dir], { encoding: 'utf8' });
  const evaluation = JSON.parse(readFileSync(resolve(dir, 'evaluation.json'), 'utf8'));
  complete.push({ name, automated_pass: evaluation.automated_pass, validator_pass: evaluation.automated_passes.includes('Deck validator passed'), manual_review_required: evaluation.manual_review_required.length, exit_code: result.status });
}
const summary = { complete_runs: complete, incomplete_runs: incomplete, pass_count: complete.filter((x) => x.automated_pass).length, fail_count: complete.filter((x) => !x.automated_pass).length, validator_pass_count: complete.filter((x) => x.validator_pass).length };
mkdirSync(reports, { recursive: true });
writeFileSync(resolve(reports, 'latest.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
const lines = ['# Benchmark summary', '', '- Complete runs: ' + complete.length, '- Automated passes: ' + summary.pass_count, '- Automated failures: ' + summary.fail_count, '- Validator passes: ' + summary.validator_pass_count, '', '## Complete runs', ...complete.map((x) => '- ' + x.name + ': ' + (x.automated_pass ? 'PASS' : 'FAIL') + '; validator ' + (x.validator_pass ? 'PASS' : 'FAIL') + '; manual review items ' + x.manual_review_required), '', '## Incomplete runs', ...(incomplete.length ? incomplete.map((x) => '- ' + x.name + ': missing ' + x.absent.join(', ')) : ['- none'])];
writeFileSync(resolve(reports, 'latest.md'), lines.join('\n') + '\n', 'utf8');
console.log('Benchmark summary: ' + resolve(reports, 'latest.md'));
