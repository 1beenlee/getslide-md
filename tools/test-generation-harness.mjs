#!/usr/bin/env node
// Zero-dependency regression checks for the generation harness.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(text, pattern, message) {
  assert(pattern.test(text), message);
}

try {
  const template = readFileSync(join(root, 'templates', 'base-onefile-deck.html'), 'utf8');
  for (const key of ['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', 'Home', 'End']) {
    assertIncludes(template, new RegExp("['\"]" + key + "['\"]"), `template is missing ${key} navigation`);
  }
  assertIncludes(template, /case\s+['"]\s['"]\s*:/, 'template is missing Space navigation');
  assertIncludes(template, /preventDefault\(\)/, 'template does not prevent presentation-key scrolling');
  assertIncludes(template, /INPUT[\s\S]*TEXTAREA[\s\S]*SELECT[\s\S]*isContentEditable/, 'template is missing the typing-target guard');
  assertIncludes(template, /classList\.toggle\(['"]active['"]/, 'template does not synchronize the active TOC entry');
  assertIncludes(template, /location\.hash/, 'template does not synchronize the current slide to the URL hash');
  assertIncludes(template, /hashchange/, 'template does not handle direct hash navigation');
  assertIncludes(template, /addEventListener\(['"]click['"]/, 'template does not explicitly synchronize TOC click navigation');
  assertIncludes(template, /slide-num[\s\S]*\+\s*['"]\s\/\s['"]\s*\+\s*slides\.length/, 'template does not generate current / total page numbers');
  console.log('PASS: template contains the complete navigation contract');

  const prompt = readFileSync(join(root, 'prompts', 'brief-to-html-deck.md'), 'utf8');
  assertIncludes(prompt, /Do not replace, simplify, remove, or rewrite the template navigation script/i, 'brief-to-deck prompt does not prohibit replacing or simplifying navigation');
  console.log('PASS: brief-to-deck prompt protects the canonical navigation script');

  writeFileSync(join(run, 'DECK_BRIEF.md'), '---\ntitle: "Test"\naudience: "Test"\npresentation_context: "Test"\npresentation_goal: "Test"\ncore_message: "Test"\nkey_points:\n  - "Test"\nsource_materials:\n  - "Test"\nconfidence: high\nrecommended_direction: developer-demo\n---\n', 'utf8');
  const prepared = runNode('tools/prepare-generation.mjs', [fixture, '--out', run]);
  if (prepared.status !== 0) throw new Error(`prepare failed: ${prepared.stderr || prepared.stdout}`);
  for (const name of ['source.md', 'benchmark.json', 'source-to-brief-packet.md', 'brief-to-deck-packet.md']) {
    assert(existsSync(join(run, name)), `prepare did not create ${name}`);
  }
  const packet = readFileSync(join(run, 'brief-to-deck-packet.md'), 'utf8');
  assertIncludes(packet, /Do not replace, simplify, remove, or rewrite the template navigation script/i, 'prepared packet omits the navigation-script preservation rule');
  assertIncludes(packet, /URL hash reflects the current slide/i, 'prepared packet omits the hash invariant');
  console.log('PASS: prepare-generation creates a complete brief-to-deck packet');

  const incompleteDeck = join(run, 'incomplete-navigation.html');
  writeFileSync(incompleteDeck, '<!doctype html><html><head><style>:root { --x: 1; } @media print {}</style></head><body><main><section class="slide" data-slide-id="title" data-pattern="title-cover"><h1>Test</h1></section></main><script>document.addEventListener("keydown", function () { if (event.key === "ArrowRight") event.preventDefault(); });</script></body></html>', 'utf8');
  const incompleteValidation = runNode('tools/validate-deck.mjs', [incompleteDeck]);
  assert(incompleteValidation.status === 1, 'validator accepted an incomplete navigation deck');
  assertIncludes(incompleteValidation.stdout, /Navigation contract complete/, 'validator did not report the incomplete navigation contract');
  console.log('PASS: validator rejects an incomplete navigation deck');

  const exampleValidation = runNode('tools/validate-deck.mjs', [join(root, 'examples', 'hackathon-demo', 'index.html')]);
  assert(exampleValidation.status === 0, `validator rejected the public example: ${exampleValidation.stdout}`);
  console.log('PASS: validator accepts the public example deck');

  const harnessFiles = ['tools/prepare-generation.mjs', 'tools/evaluate-generation.mjs', 'tools/run-benchmark.mjs'];
  for (const file of harnessFiles) {
    const contents = readFileSync(join(root, file), 'utf8');
    assert(!/fetch\(|https?:\/\/|openai|anthropic|gemini/i.test(contents), `${file} introduces a provider or external dependency`);
  }
  console.log('PASS: generation harness remains provider-neutral and zero-dependency');
} finally {
  rmSync(run, { recursive: true, force: true });
}
