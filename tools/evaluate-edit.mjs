#!/usr/bin/env node
// getslide.md — zero-dependency before/after edit containment evaluator.
// Mechanical containment is not semantic factual verification.
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const beforeArg = args[0];
const afterArg = args[1];
const mode = option('--mode');

if (!beforeArg || !afterArg || beforeArg.startsWith('--') || afterArg.startsWith('--') || !['targeted', 'split', 'reorder', 'compression'].includes(mode)) {
  usage();
  process.exit(1);
}

const beforePath = resolve(beforeArg);
const afterPath = resolve(afterArg);
const results = [];
const add = (status, name, detail = '') => results.push({ status, name, detail });

for (const [label, path] of [['Before deck', beforePath], ['After deck', afterPath]]) {
  if (!existsSync(path)) add('FAIL', label + ' exists', 'Not found: ' + path);
  else add('PASS', label + ' exists', path);
}
if (results.some((result) => result.status === 'FAIL')) finish();

const beforeRaw = readFileSync(beforePath, 'utf8');
const afterRaw = readFileSync(afterPath, 'utf8');
const before = parseDeck(beforeRaw);
const after = parseDeck(afterRaw);

add(before.slides.length > 0 ? 'PASS' : 'FAIL', 'Before deck has slides', `${before.slides.length} slide(s)`);
add(after.slides.length > 0 ? 'PASS' : 'FAIL', 'After deck has slides', `${after.slides.length} slide(s)`);

runValidator(afterPath);
compareSystem(before, after);

if (mode === 'targeted') evaluateTargeted(before, after);
if (mode === 'split') evaluateSplit(before, after);
if (mode === 'reorder') evaluateReorder(before, after);
if (mode === 'compression') evaluateCompression(before, after);

add('INFO', 'Semantic source grounding', 'NOT mechanically verified — review the source/DECK_BRIEF.md and factual meaning separately');
finish();

function option(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : null;
}

function csv(value) {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function usage() {
  console.error('Usage:');
  console.error('  node tools/evaluate-edit.mjs <before.html> <after.html> --mode targeted --targets <id[,id...]>');
  console.error('  node tools/evaluate-edit.mjs <before.html> <after.html> --mode split --replace <old:new1,new2>');
  console.error('  node tools/evaluate-edit.mjs <before.html> <after.html> --mode reorder --order <id1,id2,...>');
  console.error('  node tools/evaluate-edit.mjs <before.html> <after.html> --mode compression --targets <id[,id...]> [--allow-remove <id[,id...]>]');
}

function parseDeck(raw) {
  const slideRe = /<section\b[^>]*\bclass\s*=\s*(["'])[^"']*\bslide\b[^"']*\1[^>]*>[\s\S]*?<\/section>/gi;
  const slides = [];
  let match;
  while ((match = slideRe.exec(raw))) {
    const html = match[0];
    const open = html.match(/^<section\b[^>]*>/i)?.[0] || '';
    const id = attr(open, 'data-slide-id');
    const pattern = attr(open, 'data-pattern');
    slides.push({ id, pattern, html });
  }
  const ids = slides.map((slide) => slide.id);
  const map = new Map(slides.map((slide) => [slide.id, slide]));
  const roots = [...raw.matchAll(/:root\s*\{[^}]*\}/gi)].map((entry) => entry[0]);
  const scripts = [...raw.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map((entry) => entry[0]);
  const shell = raw
    .replace(/<section\b[^>]*\bclass\s*=\s*(["'])[^"']*\bslide\b[^"']*\1[^>]*>[\s\S]*?<\/section>/gi, '<GETSLIDE_SLIDE/>')
    .replace(/(?:<GETSLIDE_SLIDE\/>\s*)+/g, '<GETSLIDE_SLIDES/>');
  return { slides, ids, map, roots, scripts, shell };
}

function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp("\\b" + escaped + "\\s*=\\s*([\"'])(.*?)\\1", 'i'));
  return match ? match[2].trim() : '';
}

function runValidator(path) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const validator = resolve(root, 'tools', 'validate-deck.mjs');
  const run = spawnSync(process.execPath, [validator, path, '--strict'], { encoding: 'utf8' });
  if (run.status === 0) {
    add('PASS', 'After deck validator', 'exit 0');
  } else {
    const detail = (run.stdout || run.stderr || 'validator failed').trim().split(/\r?\n/).slice(-4).join(' | ');
    add('FAIL', 'After deck validator', detail);
  }
}

function compareSystem(beforeDeck, afterDeck) {
  const rootsStable = equalArray(beforeDeck.roots, afterDeck.roots);
  const scriptsStable = equalArray(beforeDeck.scripts, afterDeck.scripts);
  const shellStable = beforeDeck.shell === afterDeck.shell;
  add(rootsStable ? 'PASS' : 'FAIL', ':root design tokens unchanged', rootsStable ? `${beforeDeck.roots.length} block(s)` : 'design-token block drift detected');
  add(scriptsStable ? 'PASS' : 'FAIL', 'Script/navigation system unchanged', scriptsStable ? `${beforeDeck.scripts.length} script block(s)` : 'script block drift detected');
  add(shellStable ? 'PASS' : 'FAIL', 'Non-slide system shell unchanged', shellStable ? 'no drift outside slide sections' : 'markup/style/system drift outside slide sections detected');
}

function evaluateTargeted(beforeDeck, afterDeck) {
  const targets = new Set(csv(option('--targets')));
  requireNonEmpty(targets, '--targets');
  validateDeclaredIds(beforeDeck, targets, 'target');
  const topologyStable = equalArray(beforeDeck.ids, afterDeck.ids);
  add(topologyStable ? 'PASS' : 'FAIL', 'Targeted edit preserves slide set/order', topologyStable ? `${afterDeck.ids.length} slide(s)` : `before=${beforeDeck.ids.join(',')} after=${afterDeck.ids.join(',')}`);
  compareUntouched(beforeDeck, afterDeck, targets, 'Targeted edit containment');
}

function evaluateSplit(beforeDeck, afterDeck) {
  const spec = option('--replace') || '';
  const colon = spec.indexOf(':');
  const target = colon > 0 ? spec.slice(0, colon).trim() : '';
  const replacements = colon > 0 ? csv(spec.slice(colon + 1)) : [];
  if (!target || replacements.length < 2) {
    add('FAIL', 'Split declaration valid', 'expected --replace old:new1,new2');
    return;
  }
  add(beforeDeck.map.has(target) ? 'PASS' : 'FAIL', 'Split target exists', target);
  const replacementUnique = new Set(replacements).size === replacements.length;
  add(replacementUnique ? 'PASS' : 'FAIL', 'Split replacement IDs unique', replacements.join(','));
  const collisions = replacements.filter((id) => beforeDeck.map.has(id) && id !== target);
  add(collisions.length === 0 ? 'PASS' : 'FAIL', 'Split replacement IDs are new', collisions.length ? 'collision(s): ' + collisions.join(',') : replacements.join(','));

  const expected = [];
  for (const id of beforeDeck.ids) {
    if (id === target) expected.push(...replacements);
    else expected.push(id);
  }
  const topologyMatches = equalArray(expected, afterDeck.ids);
  add(topologyMatches ? 'PASS' : 'FAIL', 'Split changes only declared slide topology', topologyMatches ? expected.join(',') : `expected=${expected.join(',')} after=${afterDeck.ids.join(',')}`);
  compareUntouched(beforeDeck, afterDeck, new Set([target, ...replacements]), 'Split edit containment');
}

function evaluateReorder(beforeDeck, afterDeck) {
  const expected = csv(option('--order'));
  if (!expected.length) {
    add('FAIL', 'Reorder declaration valid', 'missing --order');
    return;
  }
  const sameOriginalSet = sameSet(beforeDeck.ids, expected);
  const orderMatches = equalArray(expected, afterDeck.ids);
  add(sameOriginalSet ? 'PASS' : 'FAIL', 'Reorder declaration uses original slide set', sameOriginalSet ? `${expected.length} slide(s)` : 'declared order does not match original IDs');
  add(orderMatches ? 'PASS' : 'FAIL', 'Reorder matches declared order', orderMatches ? expected.join(',') : `expected=${expected.join(',')} after=${afterDeck.ids.join(',')}`);
  const changed = beforeDeck.ids.filter((id) => beforeDeck.map.get(id)?.html !== afterDeck.map.get(id)?.html);
  add(changed.length === 0 ? 'PASS' : 'FAIL', 'Reorder preserves slide contents', changed.length ? 'changed: ' + changed.join(',') : 'all slide sections byte-stable');
}

function evaluateCompression(beforeDeck, afterDeck) {
  const targets = new Set(csv(option('--targets')));
  const removable = new Set(csv(option('--allow-remove')));
  requireNonEmpty(targets, '--targets');
  validateDeclaredIds(beforeDeck, targets, 'target');
  validateDeclaredIds(beforeDeck, removable, 'removable');

  const additions = afterDeck.ids.filter((id) => !beforeDeck.map.has(id));
  add(additions.length === 0 ? 'PASS' : 'FAIL', 'Compression adds no slides', additions.length ? 'added: ' + additions.join(',') : 'none added');

  const removed = beforeDeck.ids.filter((id) => !afterDeck.map.has(id));
  const illegalRemoved = removed.filter((id) => !removable.has(id));
  add(illegalRemoved.length === 0 ? 'PASS' : 'FAIL', 'Compression removes only declared slides', illegalRemoved.length ? 'undeclared removal(s): ' + illegalRemoved.join(',') : (removed.length ? 'removed: ' + removed.join(',') : 'none removed'));

  const survivingBeforeOrder = beforeDeck.ids.filter((id) => afterDeck.map.has(id));
  const orderStable = equalArray(survivingBeforeOrder, afterDeck.ids);
  add(orderStable ? 'PASS' : 'FAIL', 'Compression preserves surviving slide order', orderStable ? afterDeck.ids.join(',') : 'surviving slides were reordered');
  compareUntouched(beforeDeck, afterDeck, new Set([...targets, ...removable]), 'Compression edit containment');
}

function compareUntouched(beforeDeck, afterDeck, allowed, label) {
  const unexpected = [];
  for (const id of beforeDeck.ids) {
    if (allowed.has(id)) continue;
    const beforeSlide = beforeDeck.map.get(id);
    const afterSlide = afterDeck.map.get(id);
    if (!afterSlide || beforeSlide.html !== afterSlide.html) unexpected.push(id);
  }
  add(unexpected.length === 0 ? 'PASS' : 'FAIL', label, unexpected.length ? 'unexpected changed/missing slide(s): ' + unexpected.join(',') : 'all non-declared slides byte-stable');
}

function validateDeclaredIds(deck, declared, label) {
  const missing = [...declared].filter((id) => !deck.map.has(id));
  add(missing.length === 0 ? 'PASS' : 'FAIL', `Declared ${label} IDs exist`, missing.length ? 'missing: ' + missing.join(',') : ([...declared].join(',') || 'none'));
}

function requireNonEmpty(set, name) {
  if (set.size === 0) add('FAIL', `${name} declaration present`, 'at least one slide ID is required');
  else add('PASS', `${name} declaration present`, [...set].join(','));
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const aa = new Set(a);
  const bb = new Set(b);
  return aa.size === bb.size && [...aa].every((item) => bb.has(item));
}

function equalArray(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function finish() {
  const icon = { PASS: '[PASS]', FAIL: '[FAIL]', INFO: '[INFO]' };
  console.log(`getslide.md edit evaluator — ${basename(beforePath)} → ${basename(afterPath)} (${mode || 'invalid'} mode)\n`);
  for (const result of results) console.log(`${icon[result.status]} ${result.name}${result.detail ? ' — ' + result.detail : ''}`);
  const failures = results.filter((result) => result.status === 'FAIL');
  console.log('');
  console.log(failures.length ? `RESULT: FAIL (${failures.length} failure(s))` : 'RESULT: PASS');
  process.exit(failures.length ? 1 : 0);
}
