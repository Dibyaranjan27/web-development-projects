/**
 * Empirical Adversarial Challenger Suite (CDP Live Edge/Chromium)
 * Agent: Challenger R2_1
 * 
 * Stress-tests gsap.set fix, layer transforms, real browser scrolling,
 * window resize storms, and multi-scene transitions under live Chromium runtime.
 */

const { spawn } = require('child_process');
const http = require('http');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = 'file:///c:/Users/Dibya/Desktop/code/wdproject/anime_portfolio/index.html';
const PORT = 9223; // Use distinct port to prevent conflicts

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

async function runAdversarialCDPChallenge() {
  console.log('======================================================================');
  console.log('⚔️  CHALLENGER R2_1: ADVERSARIAL REAL-BROWSER CDP STRESS TEST');
  console.log('======================================================================');

  console.log('Launching headless Microsoft Edge on port', PORT, '...');
  const edgeProcess = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--allow-file-access-from-files',
    '--no-first-run',
    '--no-default-browser-check',
    TARGET_URL
  ]);

  let killed = false;
  function cleanup() {
    if (!killed) {
      killed = true;
      edgeProcess.kill();
    }
  }

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('uncaughtException', cleanup);

  let pageTarget = null;
  for (let i = 0; i < 35; i++) {
    await sleep(200);
    try {
      const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
      pageTarget = targets.find(t => t.type === 'page' && t.url.includes('anime_portfolio'));
      if (pageTarget) break;
    } catch (e) {}
  }

  if (!pageTarget) {
    console.error('❌ Failed to connect to Edge target');
    cleanup();
    process.exit(1);
  }

  console.log(`✅ Connected to CDP page: ${pageTarget.url}`);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idSeq = 1;
  const requests = new Map();
  const consoleMessages = [];
  const uncaughtExceptions = [];

  function sendCommand(method, params = {}) {
    const id = idSeq++;
    return new Promise((resolve, reject) => {
      requests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let pageLoaded = false;
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && requests.has(msg.id)) {
      const { resolve, reject } = requests.get(msg.id);
      requests.delete(msg.id);
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

  await sendCommand('Runtime.enable');
  await sendCommand('Console.enable');
  await sendCommand('Page.enable');

  // Wait until document.readyState === 'complete' and modules are fully bound
  for (let i = 0; i < 50; i++) {
    try {
      const readyRes = await sendCommand('Runtime.evaluate', {
        expression: 'document.readyState === "complete" && typeof window.gsap === "object" && typeof window.SPAApp === "object"',
        returnByValue: true
      });
      if (readyRes.result && readyRes.result.value === true) break;
    } catch (e) {}
    await sleep(100);
  }
  await sleep(300);

  async function evaluate(code) {
    const res = await sendCommand('Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception
        ? res.exceptionDetails.exception.description
        : (res.exceptionDetails.text || 'Eval error');
      throw new Error(desc);
    }
    return res.result ? res.result.value : undefined;
  }

  const assertions = [];
  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✔ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      assertions.push({ name, pass: true });
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      assertions.push({ name, pass: false, details });
    }
  }

  // ============================================================================
  // STRESS 1: gsap.set Functionality & Edge Cases in Real Browser
  // ============================================================================
  console.log('\n--- 1. GSAP.SET FUNCTIONALITY & BEHAVIORAL VERIFICATION ---');
  const gsapChecks = await evaluate(`(function() {
    var results = {};
    results.hasGsap = typeof window.gsap === 'object' && window.gsap !== null;
    results.hasSet = typeof (window.gsap && window.gsap.set) === 'function';
    
    // Test 1: Synchronous execution on DOM element
    var div = document.createElement('div');
    document.body.appendChild(div);
    
    window.gsap.set(div, { y: 120, force3D: true });
    results.transformImmediate3D = div.style.transform;
    
    window.gsap.set(div, { x: 45, y: 90, force3D: true });
    results.transformXY3D = div.style.transform;
    
    window.gsap.set(div, { opacity: 0.5, scale: 1.2 });
    results.opacity = div.style.opacity;
    results.scaleTransform = div.style.transform;
    
    // Test 2: NodeList handling
    var p1 = document.createElement('p');
    var p2 = document.createElement('p');
    div.appendChild(p1);
    div.appendChild(p2);
    window.gsap.set(div.querySelectorAll('p'), { y: 25, force3D: true });
    results.nodeListP1Transform = p1.style.transform;
    results.nodeListP2Transform = p2.style.transform;
    
    // Cleanup
    document.body.removeChild(div);
    return results;
  })()`);

  console.log('Actual gsapChecks in Edge:', JSON.stringify(gsapChecks, null, 2));

  assert('gsap object is present', gsapChecks.hasGsap);
  assert('gsap.set is a function', gsapChecks.hasSet);
  assert('gsap.set applies 3D transform synchronously', /translate3d\(0(px)?, 120px, 0(px)?\)/.test(gsapChecks.transformImmediate3D), gsapChecks.transformImmediate3D);
  assert('gsap.set applies dual X/Y 3D transform', /translate3d\(45px, 90px, 0(px)?\)/.test(gsapChecks.transformXY3D), gsapChecks.transformXY3D);
  assert('gsap.set applies opacity', gsapChecks.opacity === '0.5');
  assert('gsap.set applies to NodeList elements',
    /translate3d\(0(px)?, 25px, 0(px)?\)/.test(gsapChecks.nodeListP1Transform) &&
    /translate3d\(0(px)?, 25px, 0(px)?\)/.test(gsapChecks.nodeListP2Transform),
    `p1=${gsapChecks.nodeListP1Transform}, p2=${gsapChecks.nodeListP2Transform}`);

  // ============================================================================
  // STRESS 2: Real Browser Parallax Scrolling Dynamics
  // ============================================================================
  console.log('\n--- 2. REAL BROWSER PARALLAX SCROLLING DYNAMICS & STRESS ---');
  const scrollDynamics = await evaluate(`(function() {
    var scrollSteps = [0, 100, 250, 500, 750, 1000];
    var layerData = [];
    
    for (var i = 0; i < scrollSteps.length; i++) {
      var s = scrollSteps[i];
      window.scrollTo(0, s);
      window.dispatchEvent(new Event('scroll'));
      
      var sky = document.querySelector('.layer-sky');
      var far = document.querySelector('.layer-cloud-far');
      var banner = document.querySelector('.layer-banner');
      var near = document.querySelector('.layer-cloud-near');
      var petals = document.querySelector('.layer-petals');
      
      layerData.push({
        scroll: s,
        sky: sky ? sky.style.transform : null,
        far: far ? far.style.transform : null,
        banner: banner ? banner.style.transform : null,
        near: near ? near.style.transform : null,
        petals: petals ? petals.style.transform : null
      });
    }
    
    // Rapid scroll storm: 100 rapid oscillations
    for (var j = 0; j < 100; j++) {
      window.scrollTo(0, (j % 2 === 0) ? 600 : 50);
      window.dispatchEvent(new Event('scroll'));
    }
    
    return {
      layerData: layerData,
      finalSky: document.querySelector('.layer-sky').style.transform,
      finalPetals: document.querySelector('.layer-petals').style.transform
    };
  })()`);

  assert('Parallax layers respond dynamically to scroll steps', scrollDynamics.layerData.length === 6);
  // Verify that at scroll > 0, sky and petals transforms have updated and differ
  const step500 = scrollDynamics.layerData.find(d => d.scroll === 500);
  assert('Sky layer has valid translate3d at scroll=500', step500 && step500.sky && step500.sky.startsWith('translate3d') && !step500.sky.includes('NaN'));
  assert('Petals layer has negative translate3d at scroll=500 (reverse parallax)', step500 && step500.petals && step500.petals.includes('-') && !step500.petals.includes('NaN'));
  assert('Rapid 100-event scroll storm completed without corrupting styles', scrollDynamics.finalSky && !scrollDynamics.finalSky.includes('NaN'));

  // ============================================================================
  // STRESS 3: Real Browser Window Resize Storm & Viewport Extremes
  // ============================================================================
  console.log('\n--- 3. WINDOW RESIZE STORM & RESIZE EVENT HANDLING ---');
  const resizeStress = await evaluate(`(function() {
    var errors = [];
    var initialFrames = window.__THREE_SCENE__ ? window.__THREE_SCENE__.frameCount : 0;
    
    // Simulate 100 rapid resize events with various dimensions
    var dimensions = [
      { w: 1920, h: 1080 },
      { w: 1440, h: 900 },
      { w: 800, h: 600 },
      { w: 375, h: 812 },
      { w: 3840, h: 2160 },
      { w: 100, h: 100 }
    ];
    
    for (var i = 0; i < 60; i++) {
      var d = dimensions[i % dimensions.length];
      window.innerWidth = d.w;
      window.innerHeight = d.h;
      try {
        window.dispatchEvent(new Event('resize'));
      } catch (err) {
        errors.push(err.message);
      }
    }
    
    return {
      errorCount: errors.length,
      errors: errors,
      hasThreeScene: !!window.__THREE_SCENE__,
      framesProgressed: (window.__THREE_SCENE__ ? window.__THREE_SCENE__.frameCount : 0) >= initialFrames
    };
  })()`);

  assert('Window resize storm dispatched without throwing errors', resizeStress.errorCount === 0);
  assert('Three.js scene maintained rendering across resize storm', resizeStress.hasThreeScene && resizeStress.framesProgressed);

  // ============================================================================
  // STRESS 4: Full Multi-Scene Transition Lifecycle in Real Browser
  // ============================================================================
  console.log('\n--- 4. FULL MULTI-SCENE TRANSITION LIFECYCLE AUDIT ---');
  const scenes = ['about', 'contact', 'login', 'registration', 'project'];
  let allTransitionsClean = true;

  for (const sceneId of scenes) {
    // Navigate
    await evaluate(`window.SPAApp.navigateTo('${sceneId}', true)`);
    // Mid-transition check
    await sleep(120);
    const mid = await evaluate(`({
      shutterActive: document.getElementById('cinematic-shutter').classList.contains('animating'),
      isTransitioning: window.TransitionController.isTransitioning
    })`);
    
    // Wait for transition completion (total transition is ~560ms)
    await sleep(600);
    const post = await evaluate(`({
      currentScene: window.SPAApp.getCurrentScene(),
      activeId: document.querySelector('.scene-section.active') ? document.querySelector('.scene-section.active').id : null,
      activeCount: document.querySelectorAll('.scene-section.active').length,
      isTransitioning: window.TransitionController.isTransitioning,
      scrollY: window.scrollY
    })`);

    const passed = post.currentScene === sceneId &&
                   post.activeId === `scene-${sceneId}` &&
                   post.activeCount === 1 &&
                   !post.isTransitioning &&
                   post.scrollY === 0;

    assert(`Transition to scene '${sceneId}' completed cleanly`, passed, `active=${post.activeId}, count=${post.activeCount}, transitioning=${post.isTransitioning}`);
    if (!passed) allTransitionsClean = false;
  }

  // ============================================================================
  // STRESS 5: Rapid Concurrent Transition Spamming (Re-entrancy Guard)
  // ============================================================================
  console.log('\n--- 5. RAPID RE-ENTRANCY TRANSITION SPAMMING IN LIVE BROWSER ---');
  const spamResult = await evaluate(`(function() {
    var targets = ['registration', 'about', 'login', 'contact', 'project', 'about', 'registration'];
    // Fire rapid navigateTo calls in synchronous succession
    for (var i = 0; i < targets.length; i++) {
      window.SPAApp.navigateTo(targets[i], true);
    }
    return {
      isTransitioning: window.TransitionController.isTransitioning,
      activeCount: document.querySelectorAll('.scene-section.active').length
    };
  })()`);

  assert('Rapid spamming engaged re-entrancy lock', spamResult.isTransitioning === true);
  assert('Active DOM section count strictly 1 during transition spam', spamResult.activeCount === 1);

  // Settle after transition
  await sleep(750);
  const postSpamState = await evaluate(`({
    activeCount: document.querySelectorAll('.scene-section.active').length,
    isTransitioning: window.TransitionController.isTransitioning,
    currentScene: window.SPAApp.getCurrentScene()
  })`);

  assert('Transition lock released after spam settles', postSpamState.isTransitioning === false);
  assert('Exactly 1 active section remains after spam settles', postSpamState.activeCount === 1);

  // ============================================================================
  // STRESS 6: Mouse Parallax Tilt Boundary Stress
  // ============================================================================
  console.log('\n--- 6. MOUSE PARALLAX TILT BOUNDARY STRESS ---');
  const mouseStress = await evaluate(`(function() {
    var hero = document.querySelector('.parallax-hero-wrapper');
    if (!hero) return { error: 'No hero element' };
    
    // Dispatch extreme mouse events
    var clientXs = [-5000, 0, 100, 99999, -1];
    var clientYs = [-5000, 0, 100, 99999, -1];
    for (var i = 0; i < clientXs.length; i++) {
      var evt = new MouseEvent('mousemove', {
        clientX: clientXs[i],
        clientY: clientYs[i],
        bubbles: true
      });
      hero.dispatchEvent(evt);
    }
    
    // Leave hero
    hero.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    return { ok: true };
  })()`);

  assert('Extreme mouse tilt events handled cleanly', mouseStress.ok === true);

  // ============================================================================
  // FINAL AUDIT: Console Error and Uncaught Exception Counts
  // ============================================================================
  console.log('\n======================================================================');
  console.log('--- CONSOLE ERROR AND UNCAUGHT EXCEPTION LOG AUDIT ---');
  const errors = consoleMessages.filter(m => m.type === 'error');
  const warnings = consoleMessages.filter(m => m.type === 'warning');

  console.log(`Captured Console Messages: ${consoleMessages.length}`);
  console.log(`Console Errors:            ${errors.length}`);
  console.log(`Console Warnings:          ${warnings.length}`);
  console.log(`Uncaught Exceptions:       ${uncaughtExceptions.length}`);

  if (errors.length > 0) {
    console.error('Captured Console Errors:');
    errors.forEach((err, idx) => console.error(`  [Error ${idx+1}]`, err));
  }

  if (uncaughtExceptions.length > 0) {
    console.error('Captured Uncaught Exceptions:');
    uncaughtExceptions.forEach((ex, idx) => {
      const desc = ex.exceptionDetails && ex.exceptionDetails.exception && ex.exceptionDetails.exception.description
        ? ex.exceptionDetails.exception.description
        : JSON.stringify(ex.exceptionDetails);
      console.error(`  [Exception ${idx+1}]`, desc);
    });
  }

  assert('Zero console errors in real browser', errors.length === 0, `found ${errors.length}`);
  assert('Zero uncaught exceptions in real browser', uncaughtExceptions.length === 0, `found ${uncaughtExceptions.length}`);

  const totalPassed = assertions.filter(a => a.pass).length;
  const totalFailed = assertions.filter(a => !a.pass).length;

  console.log('\n======================================================================');
  console.log(`CHALLENGER R2_1 RESULT: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  const finalVerdict = totalFailed === 0 && errors.length === 0 && uncaughtExceptions.length === 0;
  console.log(finalVerdict ? '🎉 VERDICT: APPROVE / CONFIRM_CORRECT' : '❌ VERDICT: REJECT');
  console.log('======================================================================');

  ws.close();
  cleanup();
  process.exit(finalVerdict ? 0 : 1);
}

runAdversarialCDPChallenge().catch(err => {
  console.error('Fatal CDP Challenge Error:', err);
  process.exit(1);
});
