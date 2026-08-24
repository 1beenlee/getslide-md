#!/usr/bin/env node
// getslide.md — dependency-free real-browser QA via an installed Chrome/Chromium + CDP.
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const targetArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!targetArg) {
  console.error('Usage: node tools/browser-qa.mjs <deck.html>');
  process.exit(1);
}

const target = resolve(targetArg);
if (!existsSync(target)) {
  console.error('Deck not found: ' + target);
  process.exit(1);
}
if (typeof WebSocket === 'undefined') {
  console.error('Built-in WebSocket is unavailable. Browser QA requires a modern Node runtime (Node 22+ recommended).');
  process.exit(1);
}

const results = [];
const add = (status, name, detail = '') => results.push({ status, name, detail });
const profile = mkdtempSync(join(tmpdir(), 'getslide-browser-qa-'));
let browser = null;
let cdp = null;
let pageSessionId = null;

try {
  const executable = findBrowser();
  add('PASS', 'Installed browser found', executable);

  const launched = await launchBrowser(executable, pathToFileURL(target).href, profile);
  browser = launched.process;
  add('PASS', 'Headless browser launched', launched.browserWsUrl);

  cdp = await connectCdp(launched.browserWsUrl);
  const pageTarget = await findPageTarget(cdp, target);
  const attached = await cdp.send('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });
  pageSessionId = attached.sessionId;
  if (!pageSessionId) throw new Error('Chrome did not return a page CDP session ID');
  add('PASS', 'Page target attached', pageTarget.url);

  await pageSend('Runtime.enable');
  await pageSend('Page.enable');
  await waitUntil(async () => (await evaluate('document.readyState')) === 'complete', 5000, 'page load');
  await waitUntil(async () => (await evaluate("document.querySelectorAll('main .slide').length")) > 0, 5000, 'slide initialization');
  await sleep(150);

  const state = await evaluate(`(() => {
    const slides = Array.from(document.querySelectorAll('main .slide'));
    const links = Array.from(document.querySelectorAll('#toc-list a'));
    const nums = Array.from(document.querySelectorAll('.slide-num'));
    const main = document.querySelector('main');
    return {
      innerWidth,
      innerHeight,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      mainClientWidth: main ? main.clientWidth : 0,
      mainScrollWidth: main ? main.scrollWidth : 0,
      slideIds: slides.map((slide) => slide.id),
      slideBoxes: slides.map((slide) => ({
        id: slide.id,
        height: slide.getBoundingClientRect().height,
        clientWidth: slide.clientWidth,
        scrollWidth: slide.scrollWidth
      })),
      tocHrefs: links.map((link) => link.getAttribute('href')),
      pageNumbers: nums.map((num) => num.textContent.trim()),
      activeIds: slides.filter((slide) => slide.classList.contains('active')).map((slide) => slide.id)
    };
  })()`);

  const n = state.slideIds.length;
  add(n > 0 ? 'PASS' : 'FAIL', 'Slides rendered', `${n} slide(s)`);
  add(state.tocHrefs.length === n ? 'PASS' : 'FAIL', 'Generated TOC count', `${state.tocHrefs.length}/${n}`);
  add(state.pageNumbers.length === n ? 'PASS' : 'FAIL', 'Generated page-number count', `${state.pageNumbers.length}/${n}`);

  const expectedNums = state.slideIds.map((_, index) => `${index + 1} / ${n}`);
  const numsMatch = equalArray(expectedNums, state.pageNumbers);
  add(numsMatch ? 'PASS' : 'FAIL', 'Page numbers reflect current / total', numsMatch ? expectedNums.join(', ') : state.pageNumbers.join(', '));

  const expectedHrefs = state.slideIds.map((id) => '#' + id);
  const hrefsMatch = equalArray(expectedHrefs, state.tocHrefs);
  add(hrefsMatch ? 'PASS' : 'FAIL', 'TOC links map to slide hashes', hrefsMatch ? 'all links aligned' : `expected=${expectedHrefs.join(',')} actual=${state.tocHrefs.join(',')}`);

  const horizontalOverflow = state.documentScrollWidth > state.innerWidth + 1 ||
    state.bodyScrollWidth > state.innerWidth + 1 ||
    state.mainScrollWidth > state.mainClientWidth + 1 ||
    state.slideBoxes.some((slide) => slide.scrollWidth > slide.clientWidth + 1);
  add(horizontalOverflow ? 'FAIL' : 'PASS', 'No horizontal viewport/body/slide overflow', horizontalOverflow
    ? JSON.stringify({ viewport: state.innerWidth, document: state.documentScrollWidth, body: state.bodyScrollWidth, main: [state.mainClientWidth, state.mainScrollWidth], slides: state.slideBoxes.filter((slide) => slide.scrollWidth > slide.clientWidth + 1) })
    : `${state.innerWidth}px viewport`);

  const tallSlides = state.slideBoxes.filter((slide) => slide.height > state.innerHeight + 1);
  add(tallSlides.length ? 'FAIL' : 'PASS', 'Every slide fits one viewport vertically', tallSlides.length
    ? tallSlides.map((slide) => `${slide.id}:${Math.round(slide.height)}px`).join(', ')
    : `${n} slide(s) <= ${state.innerHeight}px`);

  const initialActive = state.activeIds.length === 1 && state.activeIds[0] === state.slideIds[0];
  add(initialActive ? 'PASS' : 'FAIL', 'Initial active slide', state.activeIds.join(',') || 'none');

  if (n >= 4) {
    await evaluate("document.querySelectorAll('#toc-list a')[1].click(); true");
    await expectActiveStable('TOC click navigation', state.slideIds[1]);

    await key('ArrowRight');
    await expectActiveStable('ArrowRight navigation', state.slideIds[2]);
    await key('ArrowLeft');
    await expectActiveStable('ArrowLeft navigation', state.slideIds[1]);
    await key('PageDown');
    await expectActiveStable('PageDown navigation', state.slideIds[2]);
    await key('PageUp');
    await expectActiveStable('PageUp navigation', state.slideIds[1]);
    await key('End');
    await expectActiveStable('End navigation', state.slideIds[n - 1]);
    await key('Home');
    await expectActiveStable('Home navigation', state.slideIds[0]);
    await key(' ');
    await expectActiveStable('Space navigation', state.slideIds[1]);

    const directId = state.slideIds[3];
    await evaluate(`location.hash = ${JSON.stringify('#' + directId)}; true`);
    await expectActiveStable('Direct hash navigation', directId);
  } else {
    add('FAIL', 'Runtime navigation fixture depth', 'at least four slides are required for browser navigation QA');
  }

  finish();
} catch (error) {
  add('FAIL', 'Browser QA runtime', error instanceof Error ? error.message : String(error));
  finish();
} finally {
  if (cdp) cdp.close();
  if (browser && !browser.killed) browser.kill('SIGKILL');
  rmSync(profile, { recursive: true, force: true });
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
      '--no-sandbox',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      '--remote-debugging-port=0',
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
        resolvePromise({ process: child, browserWsUrl: match[1] });
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
      if (settled) return;
      settled = true;
      rejectPromise(new Error('Timed out connecting to browser DevTools websocket'));
    }, 5000);

    ws.addEventListener('message', async (event) => {
      let text;
      if (typeof event.data === 'string') text = event.data;
      else if (event.data instanceof ArrayBuffer) text = Buffer.from(event.data).toString('utf8');
      else if (event.data && typeof event.data.text === 'function') text = await event.data.text();
      else text = String(event.data);
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
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolvePromise({
        send(method, params = {}, sessionId = null) {
          const id = nextId++;
          return new Promise((resolveSend, rejectSend) => {
            pending.set(id, { resolve: resolveSend, reject: rejectSend });
            const message = { id, method, params };
            if (sessionId) message.sessionId = sessionId;
            ws.send(JSON.stringify(message));
          });
        },
        close() {
          try { ws.close(); } catch {}
        }
      });
    }, { once: true });

    ws.addEventListener('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      rejectPromise(new Error('Failed to connect to browser DevTools websocket'));
    }, { once: true });
  });
}

async function findPageTarget(client, targetPath) {
  const expected = pathToFileURL(targetPath).href.split('#')[0];
  for (let attempt = 0; attempt < 50; attempt++) {
    const response = await client.send('Target.getTargets');
    const targets = response.targetInfos || [];
    const exact = targets.find((item) => item.type === 'page' && item.url && item.url.split('#')[0] === expected);
    if (exact) return exact;
    const fallback = targets.find((item) => item.type === 'page' && item.url?.startsWith('file://'));
    if (fallback) return fallback;
    await sleep(100);
  }
  throw new Error('Could not find a page target for ' + basename(targetPath));
}

function pageSend(method, params = {}) {
  return cdp.send(method, params, pageSessionId);
}

async function evaluate(expression) {
  const response = await pageSend('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error('Runtime.evaluate failed: ' + JSON.stringify(response.exceptionDetails));
  return response.result?.value;
}

async function key(value) {
  const codes = {
    ArrowRight: ['ArrowRight', 39],
    ArrowLeft: ['ArrowLeft', 37],
    PageDown: ['PageDown', 34],
    PageUp: ['PageUp', 33],
    Home: ['Home', 36],
    End: ['End', 35],
    ' ': ['Space', 32]
  };
  const [code, keyCode] = codes[value];
  const common = { key: value, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
  if (value === ' ') common.text = ' ';
  await pageSend('Input.dispatchKeyEvent', { type: 'keyDown', ...common });
  await pageSend('Input.dispatchKeyEvent', { type: 'keyUp', ...common, text: undefined });
}

async function readActiveState() {
  return evaluate(`(() => ({ active: document.querySelector('main .slide.active')?.id || '', hash: location.hash }))()`);
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

function waitUntil(check, timeoutMs, name) {
  const started = Date.now();
  return new Promise((resolvePromise, rejectPromise) => {
    const poll = async () => {
      try {
        if (await check()) return resolvePromise();
        if (Date.now() - started >= timeoutMs) return rejectPromise(new Error('Timed out waiting for ' + name));
        setTimeout(poll, 100);
      } catch (error) {
        rejectPromise(error);
      }
    };
    poll();
  });
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function equalArray(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function finish() {
  const icon = { PASS: '[PASS]', FAIL: '[FAIL]' };
  console.log(`getslide.md browser QA — ${basename(target)}\n`);
  for (const result of results) console.log(`${icon[result.status]} ${result.name}${result.detail ? ' — ' + result.detail : ''}`);
  const failures = results.filter((result) => result.status === 'FAIL');
  console.log('');
  console.log(failures.length ? `RESULT: FAIL (${failures.length} failure(s))` : 'RESULT: PASS');
  if (failures.length) process.exitCode = 1;
}
