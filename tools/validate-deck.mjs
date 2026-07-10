#!/usr/bin/env node
// getslide.md — zero-dependency deck validator
// https://github.com/1beenlee/getslide-md
//
// Usage:
//   node tools/validate-deck.mjs <path-to-deck.html> [--template]
//
// Runs the automatable subset of docs/VALIDATION.md against a standalone
// HTML deck. Uses only Node.js built-in modules — no dependencies, no build.
//
// Template mode:
//   Reusable templates under templates/ intentionally contain "Replace with ..."
//   placeholders. The validator auto-detects templates (path under templates/ or
//   basename base-onefile-deck.html) and downgrades placeholder findings to
//   warnings. Pass --template to force template mode, or --strict to force
//   example rules (placeholders fail).
//
// Exit code: 0 if no failures, 1 otherwise. Warnings never change the exit code.

import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

// ---------- args ----------
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const target = args.find((a) => !a.startsWith('--'));

if (!target) {
  console.error('Usage: node tools/validate-deck.mjs <path-to-deck.html> [--template]');
  process.exit(1);
}

// ---------- result collection ----------
const results = []; // { status: 'PASS'|'FAIL'|'WARN'|'INFO', name, detail }
const add = (status, name, detail = '') => results.push({ status, name, detail });

// Template detection (depends only on path/flags, not file contents — computed
// before any early exit so report() can always reference it).
const normalized = target.replace(/\\/g, '/');
const isTemplate =
  flags.has('--template') ||
  (!flags.has('--strict') &&
    (/(^|\/)templates\//.test(normalized) || basename(normalized) === 'base-onefile-deck.html'));
const placeholderStatus = isTemplate ? 'WARN' : 'FAIL';

// ---------- check 1: file exists ----------
if (!existsSync(target)) {
  add('FAIL', 'File exists', `Not found: ${target}`);
  report();
  process.exit(1);
}

const raw = readFileSync(target, 'utf8');
add('PASS', 'File exists', target);

// Strip HTML comments before structural parsing so guidance-comment examples
// (e.g. <section class="slide" data-slide-id="..."> shown as documentation)
// are not mistaken for real slides.
const noComments = raw.replace(/<!--[\s\S]*?-->/g, '');

// Helper: 1-based line number of the first index of `needle` (regex) in text.
const lineOf = (text, regex) => {
  const m = regex.exec(text);
  if (!m) return null;
  return text.slice(0, m.index).split('\n').length;
};

// ---------- checks 2–5: slide sections & attributes ----------
const sectionTagRe = /<section\b[^>]*\bclass="[^"]*\bslide\b[^"]*"[^>]*>/g;
const sectionTags = noComments.match(sectionTagRe) || [];

if (sectionTags.length === 0) {
  add('FAIL', 'section.slide present', 'No <section class="slide"> elements found');
} else {
  add('PASS', 'section.slide present', `${sectionTags.length} slide(s)`);
}

const ids = [];
let missingId = 0;
let missingPattern = 0;
for (const tag of sectionTags) {
  const idm = tag.match(/\bdata-slide-id="([^"]*)"/);
  const pm = tag.match(/\bdata-pattern="([^"]*)"/);
  if (idm && idm[1].trim()) ids.push(idm[1]);
  else missingId++;
  if (!(pm && pm[1].trim())) missingPattern++;
}

if (sectionTags.length > 0) {
  add(
    missingId === 0 ? 'PASS' : 'FAIL',
    'Every slide has data-slide-id',
    missingId === 0 ? `${ids.length}/${sectionTags.length}` : `${missingId} slide(s) missing data-slide-id`
  );
  add(
    missingPattern === 0 ? 'PASS' : 'FAIL',
    'Every slide has data-pattern',
    missingPattern === 0 ? `${sectionTags.length}/${sectionTags.length}` : `${missingPattern} slide(s) missing data-pattern`
  );

  const seen = new Set();
  const dups = new Set();
  for (const id of ids) {
    if (seen.has(id)) dups.add(id);
    seen.add(id);
  }
  add(
    dups.size === 0 ? 'PASS' : 'FAIL',
    'data-slide-id values unique',
    dups.size === 0 ? 'all unique' : `duplicate(s): ${[...dups].join(', ')}`
  );
}

// ---------- check 6: unresolved placeholders ----------
const placeholderPatterns = [
  { label: 'TODO', re: /\bTODO\b/ },
  { label: 'TBD', re: /\bTBD\b/ },
  { label: 'FIXME', re: /\bFIXME\b/ },
  { label: 'XXX', re: /\bXXX\b/ },
  { label: '{{', re: /\{\{/ },
  { label: '[PLACEHOLDER]', re: /\[PLACEHOLDER\]/i },
  { label: 'lorem', re: /\blorem\b/i },
  { label: 'Replace with', re: /Replace with/i },
];
const placeholderHits = [];
for (const p of placeholderPatterns) {
  const ln = lineOf(raw, new RegExp(p.re.source, p.re.flags.includes('i') ? 'i' : ''));
  if (ln !== null) placeholderHits.push(`${p.label} (line ${ln})`);
}
if (placeholderHits.length === 0) {
  add('PASS', 'No unresolved placeholders', 'none found');
} else {
  add(
    placeholderStatus,
    'No unresolved placeholders',
    (isTemplate ? 'template placeholders (expected): ' : 'found: ') + placeholderHits.join('; ')
  );
}

// ---------- check 7: private / internal trace ----------
const tracePatterns = [
  { label: '.env reference', re: /\.env\b/ },
  { label: 'private key', re: /private key/i },
  { label: 'PEM private key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: 'internal source', re: /internal source/i },
  { label: 'system prompt', re: /system prompt/i },
  { label: 'briefing-deck-maker', re: /briefing-deck-maker/i },
  { label: 'kick-off', re: /kick-off/i },
];
const traceHits = [];
for (const p of tracePatterns) {
  const ln = lineOf(raw, new RegExp(p.re.source, p.re.flags.includes('i') ? 'i' : ''));
  if (ln !== null) traceHits.push(`${p.label} (line ${ln})`);
}
if (traceHits.length === 0) {
  add('PASS', 'No private/internal traces', 'none found');
} else {
  add('FAIL', 'No private/internal traces', `found: ${traceHits.join('; ')}`);
}

// ---------- check 8: print CSS ----------
add(
  /@media\s+print/.test(raw) ? 'PASS' : 'FAIL',
  '@media print present',
  /@media\s+print/.test(raw) ? 'print styles found' : 'no @media print block'
);

// ---------- check 9: keyboard navigation ----------
const hasKeydown = /addEventListener\(\s*['"]keydown['"]/.test(raw);
const hasArrows = /Arrow(Left|Right)/.test(raw);
add(
  hasKeydown && hasArrows ? 'PASS' : 'FAIL',
  'Keyboard navigation present',
  hasKeydown && hasArrows ? 'keydown + arrow handling found' : 'missing keydown handler or arrow keys'
);

// ---------- check 10: metrics labeling (informational only) ----------
// Conservative: never fails the build. Just notes whether demo/example labels
// exist when stat-like content is present, to prompt a manual review.
const hasStats = /class="stat"/.test(raw) || /class="[^"]*\bchip\b[^"]*"/.test(raw);
const hasLabel = /EXAMPLE DATA/i.test(raw) || /fictional/i.test(raw);
if (hasStats) {
  add(
    'INFO',
    'Metrics labeling (manual review)',
    hasLabel
      ? 'stat/metric content present and demo/example labels found'
      : 'stat/metric content present but no EXAMPLE DATA/fictional label — verify numbers are real or labeled'
  );
}

// ---------- report ----------
function report() {
  const icon = { PASS: '[PASS]', FAIL: '[FAIL]', WARN: '[WARN]', INFO: '[INFO]' };
  const mode = isTemplate ? 'template' : 'example';
  console.log(`getslide.md deck validator — ${target} (${mode} mode)\n`);
  for (const r of results) {
    console.log(`${icon[r.status]} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  }
  const fails = results.filter((r) => r.status === 'FAIL');
  const warns = results.filter((r) => r.status === 'WARN');
  console.log('');
  if (fails.length === 0) {
    console.log(`RESULT: PASS${warns.length ? ` (${warns.length} warning(s))` : ''}`);
  } else {
    console.log(`RESULT: FAIL (${fails.length} failure(s)${warns.length ? `, ${warns.length} warning(s)` : ''})`);
    for (const f of fails) console.log(`  - ${f.name}: ${f.detail}`);
  }
}

report();
process.exit(results.some((r) => r.status === 'FAIL') ? 1 : 0);
