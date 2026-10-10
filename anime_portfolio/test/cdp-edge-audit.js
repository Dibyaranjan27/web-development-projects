/**
 * Real Browser Chrome DevTools Protocol (CDP) Empirical Audit
 * Launches headless Microsoft Edge, connects via CDP WebSocket,
 * and audits runtime console errors, Three.js 3D rendering, and SPA transitions.
 */

const { spawn } = require('child_process');
const http = require('http');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = 'file:///c:/Users/Dibya/Desktop/code/wdproject/anime_portfolio/index.html';
const PORT = 9222;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runEdgeAudit() {
  console.log('🚀 Spawning headless Microsoft Edge for empirical CDP audit...');
  const edgeProcess = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--allow-file-access-from-files',
    '--no-first-run',
    '--no-default-browser-check',
    TARGET_URL
  ]);

  let edgeKilled = false;
  function cleanup() {
    if (!edgeKilled) {
      edgeKilled = true;
      edgeProcess.kill();
    }
  }

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('uncaughtException', cleanup);

  // Poll for CDP endpoint
  let pageTarget = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(200);
    try {
      const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
      pageTarget = targets.find(t => t.type === 'page' && t.url.includes('anime_portfolio'));
      if (pageTarget) break;
    } catch (e) {}
  }

  if (!pageTarget) {
    console.error('❌ Could not connect to Edge DevTools target within timeout.');
    cleanup();
    process.exit(1);
  }

  console.log(`✅ Connected to Edge Target: ${pageTarget.url}`);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pendingRequests = new Map();
  const consoleMessages = [];
  const uncaughtExceptions = [];

  function sendCommand(method, params = {}) {
    const id = idCounter++;
    return new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let pageLoaded = false;
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) {
        reject(new Error(msg.error.message));
      } else {
        resolve(msg.result);
      }
    } else if (msg.method === 'Page.loadEventFired') {
      pageLoaded = true;
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(msg.params);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      uncaughtExceptions.push(msg.params);
    }
  };

  // Enable CDP domains
  await sendCommand('Runtime.enable');
  await sendCommand('Console.enable');
  await sendCommand('Page.enable');

  // Reload page to catch all life cycle events cleanly
  await sendCommand('Page.reload');

  // Wait for Page.loadEventFired
  for (let i = 0; i < 40; i++) {
    if (pageLoaded) break;
    await sleep(100);
  }
  await sleep(600);

  // Helper to evaluate JS in Edge
  async function evaluate(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const text = res.exceptionDetails.exception
        ? res.exceptionDetails.exception.description
        : (res.exceptionDetails.text || 'Evaluation exception');
      throw new Error(text);
    }
    return res.result ? res.result.value : undefined;
  }

  console.log('\n--- Real Browser Auditing Checks ---');

  // 1. Check Framework Purity
  const frameworkCheck = await evaluate(`({
    hasReact: !!window.React,
    hasVue: !!window.Vue,
    hasAngular: !!window.angular,
    hasJQuery: !!window.jQuery,
    hasSPAApp: !!window.SPAApp
  })`);
  console.log('1. Framework Purity:', frameworkCheck);

  // 2. Check 3D WebGL / Fallback Scene State
  const threeCheck = await evaluate(`({
    exists: !!window.__THREE_SCENE__,
    isRendering: window.__THREE_SCENE__ ? window.__THREE_SCENE__.isRendering : false,
    frameCount: window.__THREE_SCENE__ ? window.__THREE_SCENE__.frameCount : 0,
    hasCanvas: !!document.getElementById('webgl-canvas')
  })`);
  console.log('2. 3D WebGL Element in Real Browser:', threeCheck);

  // 3. Check Initial Scene
  const initialScene = await evaluate(`window.SPAApp.getCurrentScene()`);
  const activeSceneEl = await evaluate(`document.querySelector('.scene-section.active').id`);
  console.log(`3. Initial Scene Resolution: scene="${initialScene}", activeSection="${activeSceneEl}"`);

  // 4. Test Real Navigation Transition to 'about'
  console.log('4. Triggering real navigation to #about...');
  await evaluate(`window.SPAApp.navigateTo('about', true)`);
  // Check shutter active state mid-flight at t=100ms
  await sleep(100);
  const midFlightShutter = await evaluate(`({
    shutterAnimating: document.getElementById('cinematic-shutter').classList.contains('animating'),
    shutterClosed: document.getElementById('cinematic-shutter').classList.contains('shutter-closed'),
    isTransitioning: window.TransitionController.isTransitioning
  })`);
  console.log('   Mid-flight Transition State (t=100ms):', midFlightShutter);

  // Wait for transition completion (t=600ms)
  await sleep(600);
  const afterTransition = await evaluate(`({
    currentScene: window.SPAApp.getCurrentScene(),
    activeSection: document.querySelector('.scene-section.active').id,
    activeCount: document.querySelectorAll('.scene-section.active').length,
    shutterAnimating: document.getElementById('cinematic-shutter').classList.contains('animating'),
    isTransitioning: window.TransitionController.isTransitioning,
    hash: window.location.hash
  })`);
  console.log('   Completed Transition State (t=700ms):', afterTransition);

  // 5. Test Rapid Navigation Spamming in Real Browser
  console.log('5. Spamming 50 rapid clicks across all navigation links in real browser...');
  const spamResult = await evaluate(`(function() {
    var tabs = ['contact', 'login', 'registration', 'project', 'about'];
    for (var i = 0; i < 50; i++) {
      var tab = tabs[i % tabs.length];
      window.SPAApp.navigateTo(tab, true);
    }
    return {
      isTransitioning: window.TransitionController.isTransitioning,
      activeSections: document.querySelectorAll('.scene-section.active').length
    };
  })()`);
  console.log('   Spam result:', spamResult);

  await sleep(700);
  const afterSpam = await evaluate(`({
    currentScene: window.SPAApp.getCurrentScene(),
    activeSection: document.querySelector('.scene-section.active').id,
    activeCount: document.querySelectorAll('.scene-section.active').length,
    isTransitioning: window.TransitionController.isTransitioning
  })`);
  console.log('   Post-Spam Settled State:', afterSpam);

  // 6. Test Window Resize in Real Browser
  console.log('6. Triggering window resize events...');
  const resizeResult = await evaluate(`(function() {
    window.dispatchEvent(new Event('resize'));
    return {
      frameCountAfterResize: window.__THREE_SCENE__ ? window.__THREE_SCENE__.frameCount : 0
    };
  })()`);
  console.log('   Resize result:', resizeResult);

  // 7. Test Parallax Scroll in Real Browser
  console.log('7. Triggering window scroll deltas...');
  const scrollResult = await evaluate(`(function() {
    window.scrollTo(0, 350);
    window.dispatchEvent(new Event('scroll'));
    var sky = document.querySelector('.layer-sky');
    var petals = document.querySelector('.layer-petals');
    return {
      skyTransform: sky ? sky.style.transform : null,
      petalsTransform: petals ? petals.style.transform : null
    };
  })()`);
  console.log('   Scroll Parallax result:', scrollResult);

  // 8. Check Captured Console Errors & Exceptions
  console.log('\n--- Browser Console Log Audit ---');
  const errors = consoleMessages.filter(m => m.type === 'error');
  const warnings = consoleMessages.filter(m => m.type === 'warning');
  console.log(`Total Console Messages: ${consoleMessages.length}`);
  console.log(`Console Errors: ${errors.length}`);
  console.log(`Console Warnings: ${warnings.length}`);
  console.log(`Uncaught Exceptions: ${uncaughtExceptions.length}`);

  if (errors.length > 0) {
    console.error('Console Errors encountered:');
    errors.forEach(e => console.error(e));
  }
  if (uncaughtExceptions.length > 0) {
    console.error('❌ Uncaught exceptions encountered in real browser:');
    uncaughtExceptions.forEach((e, idx) => {
      const desc = e.exceptionDetails && e.exceptionDetails.exception && e.exceptionDetails.exception.description
        ? e.exceptionDetails.exception.description
        : JSON.stringify(e.exceptionDetails);
      console.error(`   [${idx + 1}] ${desc}`);
    });
  }

  // Final Assertions
  const auditPassed =
    !frameworkCheck.hasReact &&
    !frameworkCheck.hasVue &&
    threeCheck.exists &&
    threeCheck.frameCount > 0 &&
    afterTransition.currentScene === 'about' &&
    afterTransition.activeCount === 1 &&
    afterSpam.activeCount === 1 &&
    errors.length === 0 &&
    uncaughtExceptions.length === 0;

  console.log('\n============================================================');
  if (auditPassed) {
    console.log('🎉 REAL BROWSER CDP AUDIT: 100% PASS! ZERO ERRORS DETECTED.');
  } else {
    console.log('❌ REAL BROWSER CDP AUDIT FAILED!');
  }
  console.log('============================================================');

  ws.close();
  cleanup();
  process.exit(auditPassed ? 0 : 1);
}

runEdgeAudit().catch(err => {
  console.error('Fatal Edge Audit Error:', err);
  process.exit(1);
});
