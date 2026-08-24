#!/usr/bin/env node
// getslide.md — dependency-free real-browser QA via an installed Chrome/Chromium + CDP.
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';

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

try {
  const executable = findBrowser();
  add('PASS', 'Installed browser found', executable);

  const launched = await launchBrowser(executable, pathToFileURL(target).href, profile);
  browser = launched.process;
  add('PASS', 'Headless browser launched', launched.browserWsUrl);

  const port = Number(new URL(launched.browserWsUrl).port);
  const page = await findPage(port, target);
  cdp = await CdpClient.connect(page.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
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
        width: slide.getBoundingClientRect().width,
        height: slide.getBoundingClientRect().height,
        clientWidth: slide.clientWidth,
        scrollWidth: slide.scrollWidth
      })),
      tocHrefs: links.map((link) => link.getAttribute('href')),
      tocText: links.map((link) => link.textContent.trim()),
      pageNumbers: nums.map((num) => num.textContent.trim()),
      activeIds: slides.filter((slide) => slide.classList.contains('active')).map((slide) => slide.id),
      hash: location.hash
    };
  })()`);

  const n = state.slideIds.length;
  add(n > 0 ? 'PASS' : 'FAIL', 'Slides rendered', `${n} slide(s)`);
  add(state.tocHrefs.length === n ? 'PASS' : 'FAIL', 'Generated TOC count', `${state.tocHrefs.length}/${n}`);
  add(state.pageNumbers.length === n ? 'PASS' : 'FAIL', 'Generated page-number count', `${state.pageNumbers.length}/${n}`);

  const expectedNums = state.slideIds.map((_, index) => `${index + 1} / ${n}`);
  add(equalArray(expectedNums, state.pageNumbers) ? 'PASS' : 'FAIL', 'Page numbers reflect current / total', equalArray(expectedNums, state.pageNumbers) ? expectedNums.join(', ') : state.pageNumbers.join(', '));

  const expectedHrefs = state.slideIds.map((id) => '#' + id);
  add(equalArray(expectedHrefs, state.tocHrefs) ? 'PASS' : 'FAIL', 'TOC links map to slide hashes', equalArray(expectedHrefs, state.tocHrefs) ? 'all links aligned' : `expected=${expectedHrefs.join(',')} actual=${state.tocHrefs.join(',')}`);

  const horizontalOverflow = state.documentScrollWidth > state.innerWidth + 1 || state.bodyScrollWidth > state.innerWidth + 1 || state.mainScrollWidth > state.mainClientWidth + 1 || state.slideBoxes.some((slide) => slide.scrollWidth > slide.clientWidth + 1);
  add(horizontalOverflow ? 'FAIL' : 'PASS', 'No horizontal viewport/body/slide overflow', horizontalOverflow ? JSON.stringify({ viewport: state.innerWidth, document: state.documentScrollWidth, body: state.bodyScrollWidth, main: [state.mainClientWidth, state.mainScrollWidth], slides: state.slideBoxes.filter((slide) => slide.scrollWidth > slide.clientWidth + 1) }) : `${state.innerWidth}px viewport`);

  const tallSlides = state.slideBoxes.filter((slide) => slide.height > state.innerHeight + 1);
  add(tallSlides.length ? 'FAIL' : 'PASS', 'Every slide fits one viewport vertically', tallSlides.length ? tallSlides.map((slide) => `${slide.id}:${Math.round(slide.height)}px`).join(', ') : `${n} slide(s) <= ${state.innerHeight}px`);

  add(state.activeIds.length === 1 && state.activeIds[0] === state.slideIds[0] ? 'PASS' : 'FAIL', 'Initial active slide', state.activeIds.join(',') || 'none');

  if (n >= 4) {
    await evaluate("document.querySelectorAll('#toc-list a')[1].click(); true");
    await sleep(150);
    await expectActive('TOC click navigation', state.slideIds[1]);

    await key('ArrowRight');
    await expectActive('ArrowRight navigation', state.slideIds[2]);
    await key('ArrowLeft');
    await expectActive('ArrowLeft navigation', state.slideIds[1]);
    await key('PageDown');
    await expectActive('PageDown navigation', state.slideIds[2]);
    await key('PageUp');
    await expectActive('PageUp navigation', state.slideIds[1]);
    await key('End');
    await expectActive('End navigation', state.slideIds[n - 1]);
    await key('Home');
    await expectActive('Home navigation', state.slideIds[0]);
    await key(' ');
    await expectActive('Space navigation', state.slideIds[1]);

    const directId = state.slideIds[3];
    await evaluate(`location.hash = ${JSON.stringify('#' + directId)}; true`);
    await sleep(180);
    await expectActive('Direct hash navigation', directId);
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
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      rejectPromise(new Error('Timed out waiting for Chrome DevTools endpoint. ' + stderr.slice(-500)));
    }, 10000);

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolvePromise({ process: child, browserWsUrl: match[1] });
      }
    });
    child.once('exit', (code) => {
      if (!/DevTools listening on /.test(stderr)) {
        clearTimeout(timeout);
        rejectPromise(new Error(`Browser exited before DevTools became ready (code ${code}). ${stderr.slice(-500)}`));
      }
    });
    child.once('error', (error) => {
      clearTimeout(timeout);
      rejectPromise(error);
    });
  });
}

async function findPage(port, targetPath) {
  const expected = pathToFileURL(targetPath).href.split('#')[0];
  for (let attempt = 0; attempt < 40; attempt++) {
    const pages = await getJson(port, '/json/list');
    const page = pages.find((item) => item.type === 'page' && item.url && item.url.split('#')[0] === expected) || pages.find((item) => item.type === 'page');
    if (page?.webSocketDebuggerUrl) return page;
    await sleep(100);
  }
  throw new Error('Could not find a debuggable page target for ' + basename(targetPath));
}

function getJson(port, path) {
  return new Promise((resolvePromise, rejectPromise) => {
    const request = http.get({ hostname: '127.0.0.1', port, path, timeout: 2000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try { resolvePromise(JSON.parse(body)); }
        catch (error) { rejectPromise(error); }
      });
    });
    request.on('error', rejectPromise);
    request.on('timeout', () => request.destroy(new Error('DevTools HTTP timeout')));
  });
}

async function evaluate(expression) {
  const response = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
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
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, text: value === ' ' ? ' ' : undefined });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
  await sleep(180);
}

async function expectActive(name, id) {
  const state = await evaluate(`(() => ({ active: document.querySelector('main .slide.active')?.id || '', hash: location.hash }))()`);
  const pass = state.active === id && state.hash === '#' + id;
  add(pass ? 'PASS' : 'FAIL', name, `active=${state.active} hash=${state.hash} expected=${id}`);
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

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    ws.addEventListener('message', (event) => this.onMessage(event.data));
    ws.addEventListener('close', () => {
      for (const pending of this.pending.values()) pending.reject(new Error('CDP websocket closed'));
      this.pending.clear();
    });
  }

  static connect(url) {
    return new Promise((resolvePromise, rejectPromise) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => rejectPromise(new Error('Timed out connecting to page DevTools websocket')), 5000);
      ws.addEventListener('open', () => {
        clearTimeout(timeout);
        resolvePromise(new CdpClient(ws));
      }, { once: true });
      ws.addEventListener('error', () => {
        clearTimeout(timeout);
        rejectPromise(new Error('Failed to connect to page DevTools websocket'));
      }, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async onMessage(data) {
    let text;
    if (typeof data === 'string') text = data;
    else if (data instanceof ArrayBuffer) text = Buffer.from(data).toString('utf8');
    else if (data && typeof data.text === 'function') text = await data.text();
    else text = String(data);
    const message = JSON.parse(text);
    if (!message.id) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.error) pending.reject(new Error(`${message.error.code}: ${message.error.message}`));
    else pending.resolve(message.result || {});
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}
