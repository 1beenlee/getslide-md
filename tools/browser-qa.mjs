#!/usr/bin/env node
// getslide.md — zero-dependency real-browser QA with an installed Chrome/Chromium.
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const REQUIRED_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
];
const PRESENTATION_KEYS = ['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', 'Home', 'End', ' '];

const targetArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!targetArg) failUsage();
const target = resolve(targetArg);
if (!existsSync(target)) exitError('Deck not found: ' + target);
if (typeof WebSocket === 'undefined') exitError('Built-in WebSocket is unavailable. Node 22+ is recommended.');

const results = [];
const add = (status, name, detail = '') => results.push({ status, name, detail });
const profile = mkdtempSync(join(tmpdir(), 'getslide-browser-qa-'));
let browser = null;
let cdp = null;
let sessionId = null;

try {
  const executable = findBrowser();
  add('PASS', 'Installed browser found', executable);

  const launched = await launchBrowser(executable, pathToFileURL(target).href, profile);
  browser = launched.process;
  add('PASS', 'Headless browser launched', launched.wsUrl);

  cdp = await connectCdp(launched.wsUrl);
  const page = await findPageTarget(cdp, target);
  sessionId = (await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true })).sessionId;
  if (!sessionId) throw new Error('Chrome did not return a page CDP session ID');
  add('PASS', 'Page target attached', page.url);

  await sendPage('Runtime.enable');
  await sendPage('Page.enable');
  await waitUntil(async () => (await evaluate('document.readyState')) === 'complete', 5000, 'page load');
  await waitUntil(async () => (await evaluate("document.querySelectorAll('main .slide').length")) > 0, 5000, 'slide initialization');
  await sleep(150);

  const structure = await evaluate(`(() => {
    const slides = Array.from(document.querySelectorAll('main .slide'));
    const links = Array.from(document.querySelectorAll('#toc-list a'));
    const nums = Array.from(document.querySelectorAll('.slide-num'));
    return {
      slideIds: slides.map((slide) => slide.id),
      tocHrefs: links.map((link) => link.getAttribute('href')),
      pageNumbers: nums.map((num) => num.textContent.trim()),
      activeIds: slides.filter((slide) => slide.classList.contains('active')).map((slide) => slide.id)
    };
  })()`);

  const n = structure.slideIds.length;
  add(n > 0 ? 'PASS' : 'FAIL', 'Slides rendered', `${n} slide(s)`);
  add(structure.tocHrefs.length === n ? 'PASS' : 'FAIL', 'Generated TOC count', `${structure.tocHrefs.length}/${n}`);
  add(structure.pageNumbers.length === n ? 'PASS' : 'FAIL', 'Generated page-number count', `${structure.pageNumbers.length}/${n}`);

  const expectedNums = structure.slideIds.map((_, index) => `${index + 1} / ${n}`);
  add(equalArray(expectedNums, structure.pageNumbers) ? 'PASS' : 'FAIL', 'Page numbers reflect current / total', equalArray(expectedNums, structure.pageNumbers) ? expectedNums.join(', ') : structure.pageNumbers.join(', '));

  const expectedHrefs = structure.slideIds.map((id) => '#' + id);
  add(equalArray(expectedHrefs, structure.tocHrefs) ? 'PASS' : 'FAIL', 'TOC links map to slide hashes', equalArray(expectedHrefs, structure.tocHrefs) ? 'all links aligned' : `expected=${expectedHrefs.join(',')} actual=${structure.tocHrefs.join(',')}`);

  for (const viewport of REQUIRED_VIEWPORTS) await checkViewport(viewport);
  await setViewport(REQUIRED_VIEWPORTS[0]);

  add(structure.activeIds.length === 1 && structure.activeIds[0] === structure.slideIds[0] ? 'PASS' : 'FAIL', 'Initial active slide', structure.activeIds.join(',') || 'none');

  if (n < 4) {
    add('FAIL', 'Runtime navigation fixture depth', 'at least four slides are required');
  } else {
    await evaluate("document.querySelectorAll('#toc-list a')[1].click(); true");
    await expectActiveStable('TOC click navigation', structure.slideIds[1]);
    await navigateKey('ArrowRight', 'ArrowRight navigation', structure.slideIds[2]);
    await navigateKey('ArrowLeft', 'ArrowLeft navigation', structure.slideIds[1]);
    await navigateKey('PageDown', 'PageDown navigation', structure.slideIds[2]);
    await navigateKey('PageUp', 'PageUp navigation', structure.slideIds[1]);
    await navigateKey('End', 'End navigation', structure.slideIds[n - 1]);
    await navigateKey('Home', 'Home navigation', structure.slideIds[0]);
    await navigateKey(' ', 'Space navigation', structure.slideIds[1]);

    const directId = structure.slideIds[3];
    await evaluate(`location.hash = ${JSON.stringify('#' + directId)}; true`);
    await expectActiveStable('Direct hash navigation', directId);

    await checkTypingTargetGuard();
  }

  report();
} catch (error) {
  add('FAIL', 'Browser QA runtime', error instanceof Error ? error.message : String(error));
  report();
} finally {
  await shutdownBrowser();
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch (error) {
    console.warn(`WARN: could not remove temporary browser profile ${profile}: ${error.code || error.message}`);
  }
}

async function setViewport({ width, height }) {
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await waitUntil(async () => {
    const size = await evaluate('({ width: innerWidth, height: innerHeight })');
    return size.width === width && size.height === height;
  }, 3000, `${width}x${height} viewport`);
  await sleep(100);
}

async function checkViewport(viewport) {
  const { width, height } = viewport;
  const label = `${width}×${height}`;
  await setViewport(viewport);

  const state = await evaluate(`(() => {
    const slides = Array.from(document.querySelectorAll('main .slide'));
    const main = document.querySelector('main');
    return {
      innerWidth,
      innerHeight,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      mainClientWidth: main ? main.clientWidth : 0,
      mainScrollWidth: main ? main.scrollWidth : 0,
      slideBoxes: slides.map((slide) => ({
        id: slide.id,
        height: slide.getBoundingClientRect().height,
        clientWidth: slide.clientWidth,
        scrollWidth: slide.scrollWidth
      }))
    };
  })()`);

  const exact = state.innerWidth === width && state.innerHeight === height;
  add(exact ? 'PASS' : 'FAIL', `${label} viewport applied`, exact ? `${state.innerWidth}×${state.innerHeight}` : `actual=${state.innerWidth}×${state.innerHeight}`);

  const overflowingSlides = state.slideBoxes.filter((slide) => slide.scrollWidth > slide.clientWidth + 1);
  const horizontalOverflow = state.documentScrollWidth > state.innerWidth + 1 ||
    state.bodyScrollWidth > state.innerWidth + 1 ||
    state.mainScrollWidth > state.mainClientWidth + 1 ||
    overflowingSlides.length > 0;
  add(horizontalOverflow ? 'FAIL' : 'PASS', `${label} no horizontal viewport/body/slide overflow`, horizontalOverflow
    ? JSON.stringify({ viewport: state.innerWidth, document: state.documentScrollWidth, body: state.bodyScrollWidth, main: [state.mainClientWidth, state.mainScrollWidth], slides: overflowingSlides.map((slide) => slide.id) })
    : `${state.slideBoxes.length} slide(s)`);

  const tallSlides = state.slideBoxes.filter((slide) => slide.height > state.innerHeight + 1);
  add(tallSlides.length ? 'FAIL' : 'PASS', `${label} every slide fits one viewport vertically`, tallSlides.length
    ? tallSlides.map((slide) => `${slide.id}:${Math.round(slide.height)}px`).join(', ')
    : `${state.slideBoxes.length} slide(s) <= ${state.innerHeight}px`);
}

async function checkTypingTargetGuard() {
  const baseline = await readActiveState();
  const injected = await evaluate(`(() => {
    const active = document.querySelector('main .slide.active');
    if (!active) return false;
    const input = document.createElement('input');
    input.id = 'getslide-qa-typing-target';
    input.setAttribute('aria-label', 'getslide browser QA temporary typing target');
    input.style.position = 'fixed';
    input.style.left = '-10000px';
    input.style.top = '0';
    active.appendChild(input);
    input.focus();
    return document.activeElement === input;
  })()`);

  if (!injected) {
    add('FAIL', 'Typing-target guard setup', 'could not focus temporary input');
    return;
  }
  add('PASS', 'Typing-target guard setup', `focused temporary input on ${baseline.active}`);

  const failed = [];
  for (const key of PRESENTATION_KEYS) {
    await dispatchKey(key);
    await sleep(150);
    const state = await evaluate(`(() => ({
      active: document.querySelector('main .slide.active')?.id || '',
      hash: location.hash,
      focused: document.activeElement?.id || ''
    }))()`);
    if (state.active !== baseline.active || state.hash !== baseline.hash || state.focused !== 'getslide-qa-typing-target') {
      failed.push(`${displayKey(key)}:active=${state.active},hash=${state.hash},focus=${state.focused}`);
    }
  }

  add(failed.length ? 'FAIL' : 'PASS', 'Typing-target guard blocks presentation navigation', failed.length ? failed.join('; ') : `${PRESENTATION_KEYS.length}/${PRESENTATION_KEYS.length} keys contained while input focused`);

  await evaluate(`(() => {
    const input = document.getElementById('getslide-qa-typing-target');
    if (input) input.remove();
    document.body.focus?.();
    return !document.getElementById('getslide-qa-typing-target');
  })()`);
}

function findBrowser() {
  const candidates = [
    process.env.GETSLIDE_BROWSER,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    'chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chrome.exe'
  ].filter(Boolean);

  for (const candidate of [...new Set(candidates)]) {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8', timeout: 3000, windowsHide: true });
    if (probe.status === 0) return candidate;
  }
  throw new Error('No installed Chrome/Chromium executable found. Set GETSLIDE_BROWSER to an executable path.');
}

function launchBrowser(executable, url, userDataDir) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(executable, [
      '--headless=new',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      '--remote-debugging-port=0',
      '--proxy-server=http://127.0.0.1:9',
      '--window-size=1440,900',
      '--user-data-dir=' + userDataDir,
      url
    ], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });

    let stderr = '';
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      rejectPromise(new Error('Timed out waiting for Chrome DevTools endpoint. ' + stderr.slice(-500)));
    }, 10000);

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timeout);
        resolvePromise({ process: child, wsUrl: match[1] });
      }
    });
    child.once('exit', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        rejectPromise(new Error(`Browser exited before DevTools became ready (code ${code}). ${stderr.slice(-500)}`));
      }
    });
    child.once('error', (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        rejectPromise(error);
      }
    });
  });
}

function connectCdp(url) {
  return new Promise((resolvePromise, rejectPromise) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    let nextId = 1;
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) rejectPromise(new Error('Timed out connecting to browser DevTools websocket'));
    }, 5000);

    ws.addEventListener('message', async (event) => {
      const text = typeof event.data === 'string' ? event.data : event.data instanceof ArrayBuffer ? Buffer.from(event.data).toString('utf8') : await event.data.text();
      const message = JSON.parse(text);
      if (!message.id) return;
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      if (message.error) item.reject(new Error(`${message.error.code}: ${message.error.message}`));
      else item.resolve(message.result || {});
    });
    ws.addEventListener('close', () => {
      for (const item of pending.values()) item.reject(new Error('CDP websocket closed'));
      pending.clear();
    });
    ws.addEventListener('open', () => {
      settled = true;
      clearTimeout(timeout);
      resolvePromise({
        send(method, params = {}, targetSessionId = null) {
          const id = nextId++;
          return new Promise((resolveSend, rejectSend) => {
            pending.set(id, { resolve: resolveSend, reject: rejectSend });
            const message = { id, method, params };
            if (targetSessionId) message.sessionId = targetSessionId;
            ws.send(JSON.stringify(message));
          });
        },
        close() { try { ws.close(); } catch {} }
      });
    }, { once: true });
    ws.addEventListener('error', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        rejectPromise(new Error('Failed to connect to browser DevTools websocket'));
      }
    }, { once: true });
  });
}

async function findPageTarget(client, targetPath) {
  const expected = pathToFileURL(targetPath).href.split('#')[0];
  for (let attempt = 0; attempt < 50; attempt++) {
    const targets = (await client.send('Target.getTargets')).targetInfos || [];
    const exact = targets.find((item) => item.type === 'page' && item.url && item.url.split('#')[0] === expected);
    if (exact) return exact;
    const fallback = targets.find((item) => item.type === 'page' && item.url?.startsWith('file://'));
    if (fallback) return fallback;
    await sleep(100);
  }
  throw new Error('Could not find a page target for ' + basename(targetPath));
}

function sendPage(method, params = {}) {
  return cdp.send(method, params, sessionId);
}

async function evaluate(expression) {
  const response = await sendPage('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error('Runtime.evaluate failed: ' + JSON.stringify(response.exceptionDetails));
  return response.result?.value;
}

async function readActiveState() {
  return evaluate(`(() => ({ active: document.querySelector('main .slide.active')?.id || '', hash: location.hash }))()`);
}

async function dispatchKey(key) {
  const codes = {
    ArrowRight: ['ArrowRight', 39], ArrowLeft: ['ArrowLeft', 37],
    PageDown: ['PageDown', 34], PageUp: ['PageUp', 33],
    Home: ['Home', 36], End: ['End', 35], ' ': ['Space', 32]
  };
  const [code, keyCode] = codes[key];
  const common = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
  if (key === ' ') common.text = ' ';
  await sendPage('Input.dispatchKeyEvent', { type: 'keyDown', ...common });
  await sendPage('Input.dispatchKeyEvent', { type: 'keyUp', ...common, text: undefined });
}

async function navigateKey(key, name, expectedId) {
  await dispatchKey(key);
  await expectActiveStable(name, expectedId);
}

async function expectActiveStable(name, id) {
  const expectedHash = '#' + id;
  const deadline = Date.now() + 5000;
  let last = { active: '', hash: '' };
  while (Date.now() < deadline) {
    last = await readActiveState();
    if (last.active === id && last.hash === expectedHash) {
      await sleep(350);
      const stable = await readActiveState();
      if (stable.active === id && stable.hash === expectedHash) {
        add('PASS', name, `active=${stable.active} hash=${stable.hash} expected=${id}`);
        return;
      }
      last = stable;
    }
    await sleep(100);
  }
  add('FAIL', name, `active=${last.active} hash=${last.hash} expected=${id} (not stable within 5s)`);
}

async function shutdownBrowser() {
  if (cdp && browser && browser.exitCode === null) {
    try { await cdp.send('Browser.close'); } catch {}
    await waitForExit(browser, 2000);
  }
  if (cdp) cdp.close();
  if (browser && browser.exitCode === null) {
    browser.kill('SIGKILL');
    await waitForExit(browser, 2000);
  }
}

function waitUntil(check, timeoutMs, name) {
  const started = Date.now();
  return new Promise((resolvePromise, rejectPromise) => {
    const poll = async () => {
      try {
        if (await check()) return resolvePromise();
        if (Date.now() - started >= timeoutMs) return rejectPromise(new Error('Timed out waiting for ' + name));
        setTimeout(poll, 100);
      } catch (error) { rejectPromise(error); }
    };
    poll();
  });
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolvePromise) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolvePromise();
    };
    const timer = setTimeout(finish, timeoutMs);
    child.once('exit', finish);
  });
}

function displayKey(key) { return key === ' ' ? 'Space' : key; }
function sleep(ms) { return new Promise((resolvePromise) => setTimeout(resolvePromise, ms)); }
function equalArray(a, b) { return a.length === b.length && a.every((value, index) => value === b[index]); }
function failUsage() { console.error('Usage: node tools/browser-qa.mjs <deck.html>'); process.exit(1); }
function exitError(message) { console.error(message); process.exit(1); }

function report() {
  const icon = { PASS: '[PASS]', FAIL: '[FAIL]' };
  console.log(`getslide.md browser QA — ${basename(target)}\n`);
  for (const result of results) console.log(`${icon[result.status]} ${result.name}${result.detail ? ' — ' + result.detail : ''}`);
  const failures = results.filter((result) => result.status === 'FAIL');
  console.log('');
  console.log(failures.length ? `RESULT: FAIL (${failures.length} failure(s))` : 'RESULT: PASS');
  if (failures.length) process.exitCode = 1;
}
