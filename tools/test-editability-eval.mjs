#!/usr/bin/env node
// Zero-dependency positive/negative regression cases for tools/evaluate-edit.mjs.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const node = process.execPath;
const evaluator = join(root, 'tools', 'evaluate-edit.mjs');
const sourceDeck = join(root, 'examples', 'hackathon-demo', 'index.html');
const original = readFileSync(sourceDeck, 'utf8');
const work = mkdtempSync(join(tmpdir(), 'getslide-edit-eval-'));
const beforePath = join(work, 'before.html');
writeFileSync(beforePath, original, 'utf8');

const slides = extractSlides(original);
assert(slides.length >= 6, 'public example must contain at least six slides for editability regression');
assert(new Set(slides.map((slide) => slide.id)).size === slides.length, 'public example slide IDs must be unique');

try {
  const target = slides[1];
  const other = slides[2];

  // E1 / E3 mechanical shape: one declared slide changes and everything else stays stable.
  const targeted = replaceSlide(original, target.id, insertBeforeClose(target.html, '<p class="lead">Regression-only targeted edit.</p>'));
  expectPass('targeted positive', targeted, ['--mode', 'targeted', '--targets', target.id]);

  const targetedLeak = replaceSlide(targeted, other.id, insertBeforeClose(other.html, '<p>Unexpected second-slide edit.</p>'));
  expectFail('targeted blocks undeclared slide drift', targetedLeak, ['--mode', 'targeted', '--targets', target.id], /unexpected changed\/missing slide/i);

  const tokenDrift = targeted.replace('--bg: #0d1117;', '--bg: #111827;');
  expectFail('targeted blocks design-token drift', tokenDrift, ['--mode', 'targeted', '--targets', target.id], /design-token block drift/i);

  const scriptDrift = targeted.replace('<script>\n(function () {', '<script>\n// regression drift\n(function () {');
  expectFail('targeted blocks navigation script drift', scriptDrift, ['--mode', 'targeted', '--targets', target.id], /script block drift/i);

  // E2: one original slide becomes exactly two declared replacement slides.
  const splitTarget = slides[3];
  const splitA = makeReplacementSlide(splitTarget, splitTarget.id + '-overview', 'Overview');
  const splitB = makeReplacementSlide(splitTarget, splitTarget.id + '-details', 'Details');
  const splitDeck = replaceSlide(original, splitTarget.id, splitA + '\n\n' + splitB);
  expectPass('split positive', splitDeck, ['--mode', 'split', '--replace', `${splitTarget.id}:${splitTarget.id}-overview,${splitTarget.id}-details`]);

  const splitLeak = replaceSlide(splitDeck, slides[4].id, insertBeforeClose(slides[4].html, '<p>Unexpected split-side edit.</p>'));
  expectFail('split blocks unrelated slide drift', splitLeak, ['--mode', 'split', '--replace', `${splitTarget.id}:${splitTarget.id}-overview,${splitTarget.id}-details`], /unexpected changed\/missing slide/i);

  // E4: reorder only; every slide section must stay byte-identical.
  const reorderedSlides = [...slides];
  [reorderedSlides[2], reorderedSlides[3]] = [reorderedSlides[3], reorderedSlides[2]];
  const reorderDeck = replaceAllSlides(original, reorderedSlides.map((slide) => slide.html));
  expectPass('reorder positive', reorderDeck, ['--mode', 'reorder', '--order', reorderedSlides.map((slide) => slide.id).join(',')]);

  const reorderContentDrift = replaceSlide(reorderDeck, reorderedSlides[2].id, insertBeforeClose(reorderedSlides[2].html, '<p>Content drift during reorder.</p>'));
  expectFail('reorder blocks content rewrite', reorderContentDrift, ['--mode', 'reorder', '--order', reorderedSlides.map((slide) => slide.id).join(',')], /preserves slide contents/i);

  // E5: constrained tone/length compression may edit declared slides and remove declared slides only.
  const compressionTarget = slides[4];
  const removeTarget = slides[5];
  let compressionDeck = replaceSlide(original, compressionTarget.id, insertBeforeClose(compressionTarget.html, '<p class="lead">Shorter regression copy.</p>'));
  compressionDeck = removeSlide(compressionDeck, removeTarget.id);
  expectPass('compression positive', compressionDeck, ['--mode', 'compression', '--targets', compressionTarget.id, '--allow-remove', removeTarget.id]);

  const undeclaredRemoval = removeSlide(compressionDeck, slides[6].id);
  expectFail('compression blocks undeclared removal', undeclaredRemoval, ['--mode', 'compression', '--targets', compressionTarget.id, '--allow-remove', removeTarget.id], /undeclared removal/i);

  console.log('PASS: editability evaluator positive and negative regression suite');
} finally {
  rmSync(work, { recursive: true, force: true });
}

function expectPass(name, html, extraArgs) {
  const path = writeCase(name, html);
  const run = spawnSync(node, [evaluator, beforePath, path, ...extraArgs], { cwd: root, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`${name} should PASS\n${run.stdout}\n${run.stderr}`);
  console.log('PASS:', name);
}

function expectFail(name, html, extraArgs, expected) {
  const path = writeCase(name, html);
  const run = spawnSync(node, [evaluator, beforePath, path, ...extraArgs], { cwd: root, encoding: 'utf8' });
  if (run.status === 0) throw new Error(`${name} should FAIL\n${run.stdout}`);
  if (!expected.test(run.stdout + run.stderr)) throw new Error(`${name} failed for the wrong reason\n${run.stdout}\n${run.stderr}`);
  console.log('PASS:', name);
}

function writeCase(name, html) {
  const safe = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const path = join(work, safe + '.html');
  writeFileSync(path, html, 'utf8');
  return path;
}

function extractSlides(html) {
  const re = /<section\b[^>]*\bclass\s*=\s*(["'])[^"']*\bslide\b[^"']*\1[^>]*>[\s\S]*?<\/section>/gi;
  return [...html.matchAll(re)].map((match) => {
    const section = match[0];
    const id = section.match(/\bdata-slide-id="([^"]+)"/i)?.[1] || '';
    const pattern = section.match(/\bdata-pattern="([^"]+)"/i)?.[1] || 'demo-flow';
    return { id, pattern, html: section };
  });
}

function replaceSlide(html, id, replacement) {
  const slides = extractSlides(html);
  const target = slides.find((slide) => slide.id === id);
  assert(target, 'missing slide ' + id);
  return html.replace(target.html, replacement);
}

function removeSlide(html, id) {
  return replaceSlide(html, id, '');
}

function replaceAllSlides(html, replacements) {
  const current = extractSlides(html);
  assert(current.length === replacements.length, 'replacement slide count mismatch');
  const first = html.indexOf(current[0].html);
  const last = html.indexOf(current[current.length - 1].html) + current[current.length - 1].html.length;
  return html.slice(0, first) + replacements.join('\n\n') + html.slice(last);
}

function insertBeforeClose(section, addition) {
  return section.replace(/<\/section>\s*$/i, '  ' + addition + '\n  </section>');
}

function makeReplacementSlide(source, id, label) {
  return `<section class="slide" data-slide-id="${id}" data-pattern="${source.pattern}">\n    <p class="kicker">${label}</p>\n    <h2>${label}: ${source.id}</h2>\n    <p class="lead">Fictional regression content derived only for structural evaluator testing.</p>\n  </section>`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
