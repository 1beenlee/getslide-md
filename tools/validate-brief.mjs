#!/usr/bin/env node
// getslide.md — zero-dependency DECK_BRIEF.md validator.
// Validates the project's documented top-level YAML-frontmatter subset.
// This is structural/source-sufficiency validation, not semantic factual proof.
import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const targetArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!targetArg) {
  console.error('Usage: node tools/validate-brief.mjs <DECK_BRIEF.md>');
  process.exit(1);
}

const target = resolve(targetArg);
const results = [];
const add = (status, name, detail = '') => results.push({ status, name, detail });

if (!existsSync(target)) {
  add('FAIL', 'Brief exists', 'Not found: ' + target);
  finish();
}

const raw = readFileSync(target, 'utf8');
add(raw.trim() ? 'PASS' : 'FAIL', 'Brief is non-empty', raw.trim() ? basename(target) : 'file is empty');

let parsed;
try {
  parsed = parseFrontmatter(raw);
  add('PASS', 'YAML frontmatter parsed', `${Object.keys(parsed.values).length} top-level field(s)`);
} catch (error) {
  add('FAIL', 'YAML frontmatter parsed', error instanceof Error ? error.message : String(error));
  finish();
}

for (const duplicate of parsed.duplicates) {
  add('FAIL', 'No duplicate top-level fields', `duplicate: ${duplicate}`);
}
if (!parsed.duplicates.length) add('PASS', 'No duplicate top-level fields', 'none');

const requiredScalars = [
  'title',
  'audience',
  'presentation_context',
  'presentation_goal',
  'core_message',
];
for (const field of requiredScalars) requireScalar(parsed, field);

requireNonEmptyList(parsed, 'key_points');
requireNonEmptyList(parsed, 'source_materials');

const confidence = scalar(parsed, 'confidence');
if (!confidence) {
  add('FAIL', 'confidence valid', 'missing or empty');
} else if (!['high', 'medium', 'low'].includes(confidence)) {
  add('FAIL', 'confidence valid', `expected high|medium|low, got ${confidence}`);
} else {
  add('PASS', 'confidence valid', confidence);
}

for (const field of ['required_links', 'required_images', 'missing_information', 'auto_filled_assumptions']) {
  if (has(parsed, field)) requireList(parsed, field);
}

for (const field of ['time_limit_minutes', 'slide_count_target']) {
  if (has(parsed, field)) validateNumberOrUnknown(parsed, field);
}

if (has(parsed, 'recommended_direction')) {
  const direction = scalar(parsed, 'recommended_direction');
  const allowed = ['developer-demo', 'clean-academic', 'portfolio-case-study', 'other'];
  if (!direction || !allowed.includes(direction)) {
    add('FAIL', 'recommended_direction valid', `expected ${allowed.join('|')}, got ${direction || 'empty'}`);
  } else {
    add('PASS', 'recommended_direction valid', direction);
  }
}

const missing = list(parsed, 'missing_information') || [];
if (confidence === 'high' && missing.length > 0) {
  add('FAIL', 'High-confidence source-sufficiency gate', `high confidence cannot retain unresolved missing_information (${missing.length} item(s))`);
} else if (confidence === 'high') {
  add('PASS', 'High-confidence source-sufficiency gate', 'no unresolved missing_information');
} else {
  add('INFO', 'Source-sufficiency gate', `${confidence || 'invalid'} confidence; semantic review still required`);
}

add('INFO', 'Semantic source grounding', 'NOT mechanically verified — confirm every key point and assumption against the supplied source');
finish();

function parseFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) throw new Error('file must start with a YAML frontmatter delimiter (---)');
  const end = normalized.indexOf('\n---', 4);
  if (end === -1) throw new Error('closing YAML frontmatter delimiter (---) not found');

  const block = normalized.slice(4, end);
  const lines = block.split('\n');
  const values = {};
  const kinds = {};
  const duplicates = [];
  let currentList = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const lineNo = index + 2;
    if (!line.trim() || /^\s*#/.test(line)) continue;

    const top = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (top) {
      const [, key, rest = ''] = top;
      if (Object.prototype.hasOwnProperty.call(values, key)) duplicates.push(key);
      currentList = null;

      if (!rest.trim()) {
        values[key] = [];
        kinds[key] = 'pending-list';
        currentList = key;
        continue;
      }

      const trimmed = rest.trim();
      if (trimmed === '[]') {
        values[key] = [];
        kinds[key] = 'list';
      } else if (trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed === '|' || trimmed === '>') {
        throw new Error(`unsupported YAML shape for ${key} on line ${lineNo}; use a scalar or indented dash list`);
      } else {
        values[key] = decodeScalar(trimmed, lineNo);
        kinds[key] = 'scalar';
      }
      continue;
    }

    const item = line.match(/^\s{2,}-\s+(.*)$/);
    if (item && currentList) {
      const value = item[1].trim();
      if (!value) throw new Error(`empty list item on line ${lineNo}`);
      values[currentList].push(decodeScalar(value, lineNo));
      kinds[currentList] = 'list';
      continue;
    }

    throw new Error(`unsupported or malformed frontmatter syntax on line ${lineNo}: ${line.trim()}`);
  }

  for (const [key, kind] of Object.entries(kinds)) {
    if (kind === 'pending-list') kinds[key] = 'list';
  }
  return { values, kinds, duplicates };
}

function decodeScalar(value, lineNo) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    if (value.length < 2) throw new Error(`malformed quoted scalar on line ${lineNo}`);
    return value.slice(1, -1).trim();
  }
  if (value.startsWith('"') || value.startsWith("'") || value.endsWith('"') || value.endsWith("'")) {
    throw new Error(`unbalanced quoted scalar on line ${lineNo}`);
  }
  return value.trim();
}

function has(doc, field) {
  return Object.prototype.hasOwnProperty.call(doc.values, field);
}

function scalar(doc, field) {
  return doc.kinds[field] === 'scalar' ? String(doc.values[field]).trim() : '';
}

function list(doc, field) {
  return doc.kinds[field] === 'list' ? doc.values[field] : null;
}

function requireScalar(doc, field) {
  if (!has(doc, field)) return add('FAIL', `${field} present`, 'missing required field');
  if (doc.kinds[field] !== 'scalar') return add('FAIL', `${field} valid`, 'expected non-empty scalar');
  const value = scalar(doc, field);
  add(value ? 'PASS' : 'FAIL', `${field} valid`, value ? 'non-empty scalar' : 'empty scalar');
}

function requireList(doc, field) {
  if (doc.kinds[field] !== 'list') add('FAIL', `${field} valid`, 'expected list');
  else add('PASS', `${field} valid`, `${doc.values[field].length} item(s)`);
}

function requireNonEmptyList(doc, field) {
  if (!has(doc, field)) return add('FAIL', `${field} present`, 'missing required field');
  if (doc.kinds[field] !== 'list') return add('FAIL', `${field} valid`, 'expected non-empty list');
  add(doc.values[field].length > 0 ? 'PASS' : 'FAIL', `${field} valid`, `${doc.values[field].length} item(s)`);
}

function validateNumberOrUnknown(doc, field) {
  if (doc.kinds[field] !== 'scalar') return add('FAIL', `${field} valid`, 'expected positive number or unknown');
  const value = scalar(doc, field);
  if (value === 'unknown') return add('PASS', `${field} valid`, 'unknown');
  const number = Number(value);
  add(Number.isFinite(number) && number > 0 ? 'PASS' : 'FAIL', `${field} valid`, Number.isFinite(number) && number > 0 ? String(number) : `expected positive number or unknown, got ${value || 'empty'}`);
}

function finish() {
  const icon = { PASS: '[PASS]', FAIL: '[FAIL]', INFO: '[INFO]' };
  console.log(`getslide.md brief validator — ${basename(target)}\n`);
  for (const result of results) console.log(`${icon[result.status]} ${result.name}${result.detail ? ' — ' + result.detail : ''}`);
  const failures = results.filter((result) => result.status === 'FAIL');
  console.log('');
  console.log(failures.length ? `RESULT: FAIL (${failures.length} failure(s))` : 'RESULT: PASS');
  process.exit(failures.length ? 1 : 0);
}
