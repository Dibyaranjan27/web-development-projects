/**
 * Adversarial Stress & Chaos Test Suite - Anime Cinematic SPA
 * 
 * Empirically tests:
 * 1. Rapid navigation clicking / spamming & re-entrancy transition locking
 * 2. Adversarial route traversal with malformed/unexpected hashes
 * 3. Window resize storms & boundary resolutions during 3D WebGL rendering
 * 4. 2D Parallax scroll calculations under extreme bounds & rapid deltas
 * 5. Adversarial input validation & XSS payload escaping
 * 6. Degraded DOM resilience & null-safety boundaries
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  suite,
  test,
  assert,
  assertEqual,
  assertNotEqual,
  assertIncludes,
  createTestEnvironment,
  MockElement
} = require('./test-framework.js');

const rootDir = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const appJsContent = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
const transitionsJsContent = fs.readFileSync(path.join(rootDir, 'js', 'transitions.js'), 'utf8');
const parallaxJsContent = fs.readFileSync(path.join(rootDir, 'js', 'parallax.js'), 'utf8');
const threeJsContent = fs.readFileSync(path.join(rootDir, 'js', 'three-scene.js'), 'utf8');

// Helper to instantiate a fully configured SPA VM sandbox
function createFullAppEnvironment(initialHash = '') {
  const env = createTestEnvironment(htmlContent);
  if (initialHash) {
    env.window.location.hash = initialHash;
  }

  // Enhance createElement so that div.textContent -> div.innerHTML follows standard HTML escaping
  const originalCreateElement = env.document.createElement;
  env.document.createElement = function(tag) {
    const el = originalCreateElement.call(env.document, tag);
    let _text = '';
    let _html = '';
    Object.defineProperty(el, 'textContent', {
      get: () => _text,
      set: (val) => {
        _text = String(val);
        _html = _text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    });
    Object.defineProperty(el, 'innerHTML', {
      get: () => _html || _text,
      set: (val) => {
        _html = String(val);
        _text = _html.replace(/<[^>]*>/g, '');
      }
    });
    return el;
  };

  const mockCamera = {
    position: { x: 0, y: 0, z: 6.2 },
    aspect: 1,
    updateProjectionMatrix: function() { this._matrixUpdated = true; }
  };

  let renders = 0;
  const mockRenderer = {
    setPixelRatio: () => {},
    setSize: function(w, h) { this._lastW = w; this._lastH = h; },
    render: function() { renders++; }
  };

  const mockMesh = {
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 }
  };

  const mockThree = {
    Scene: function() {
      return { add: () => {} };
    },
    PerspectiveCamera: function(fov, aspect, near, far) {
      mockCamera.fov = fov;
      mockCamera.aspect = aspect;
      mockCamera.near = near;
      mockCamera.far = far;
      return mockCamera;
    },
    WebGLRenderer: function() {
      return mockRenderer;
    },
    AmbientLight: function() { return {}; },
    DirectionalLight: function() { return { position: { set: () => {} } }; },
    PointLight: function() { return { position: { set: () => {} } }; },
    TorusKnotGeometry: function() { return {}; },
    MeshStandardMaterial: function() { return {}; },
    TorusGeometry: function() { return {}; },
    MeshBasicMaterial: function() { return {}; },
    Mesh: function() {
      return {
        rotation: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 }
      };
    },
    BufferGeometry: function() { return { setAttribute: () => {} }; },
    BufferAttribute: function() { return {}; },
    PointsMaterial: function() { return {}; },
    Points: function() {
      return {
        rotation: { x: 0, y: 0 }
      };
    }
  };

  env.window.THREE = mockThree;

  const context = {
    window: env.window,
    document: env.document,
    history: env.window.history,
    location: env.window.location,
    console: {
      log: () => {},
      warn: () => {},
      error: (...args) => { context._errors = context._errors || []; context._errors.push(args.join(' ')); }
    },
    setTimeout: env.window.setTimeout,
    clearTimeout: env.window.clearTimeout,
    requestAnimationFrame: env.window.requestAnimationFrame,
    cancelAnimationFrame: env.window.cancelAnimationFrame,
    THREE: mockThree
  };
  context.global = context;
  vm.createContext(context);

  // Execute scripts in proper order
  vm.runInContext(transitionsJsContent, context);
  vm.runInContext(threeJsContent, context);
  vm.runInContext(parallaxJsContent, context);
  vm.runInContext(appJsContent, context);

  return { env, context, mockCamera, mockRenderer, getRenders: () => renders };
}

// =============================================================================
// SUITE 1: Rapid Navigation Spamming & Re-entrancy Stress Harness
// =============================================================================
suite('Adversarial Stress 1: Rapid Navigation Spamming & Re-entrancy', () => {

  test('ADV1.1: Synchronous 500-Click Flood across alternating tabs', () => {
    const { env } = createFullAppEnvironment();
    const tabs = ['about', 'contact', 'login', 'registration', 'project'];

    // Spam 500 clicks synchronously in loop at t=0 via document event delegation
    for (let i = 0; i < 500; i++) {
      const target = tabs[i % tabs.length];
      const link = env.document.querySelector(`a[href="#${target}"]`);
      if (link) {
        env.document.dispatchEvent({
          type: 'click',
          target: link,
          preventDefault: () => {}
        });
      } else {
        env.window.SPAApp.navigateTo(target, true);
      }
    }

    // Only the first transition should have been accepted ('about')
    assertEqual(env.window.TransitionController.isTransitioning, true, 'Transition controller locked');

    // Run clock to complete Phase 1 -> Phase 4
    env.clock.advanceBy(600);

    // After completion, transition lock must be released
    assertEqual(env.window.TransitionController.isTransitioning, false, 'Controller unlocked after transition');
    assertEqual(env.window.SPAApp.getCurrentScene(), 'about', 'First clicked scene successfully activated');

    // Exactly one active scene section
    const activeSections = env.document.querySelectorAll('.scene-section.active');
    assertEqual(activeSections.length, 1, 'Strictly ONE scene section has .active class');
    assertEqual(activeSections[0].id, 'scene-about', 'Active section matches currentScene');
  });

  test('ADV1.2: Millisecond-Offset Chaos Clicking (Spamming during Phase 1, 2, 3, 4)', () => {
    const { env } = createFullAppEnvironment();
    const scenes = ['about', 'contact', 'login', 'registration', 'project'];

    // Initial transition to 'about'
    env.window.SPAApp.navigateTo('about', true);

    // Timeline barrage: click at t=10ms, 50ms, 120ms, 259ms, 260ms, 300ms, 320ms, 550ms
    const barrageTimings = [10, 40, 70, 139, 1, 40, 20, 230]; // cumulative advances
    barrageTimings.forEach((dt, idx) => {
      env.clock.advanceBy(dt);
      const nextTarget = scenes[(idx + 1) % scenes.length];
      // Attempt click during flight
      env.window.SPAApp.navigateTo(nextTarget, true);
    });

    // Advance to 560ms+ to ensure complete cycle
    env.clock.advanceBy(100);

    assertEqual(env.window.TransitionController.isTransitioning, false, 'Transition lock released cleanly');
    assertEqual(env.window.SPAApp.getCurrentScene(), 'about', 'Initial flight completed uninterrupted');

    const activeSections = env.document.querySelectorAll('.scene-section.active');
    assertEqual(activeSections.length, 1, 'Only one active section remains in DOM');
    assertEqual(activeSections[0].id, 'scene-about', 'Active section is scene-about');

    // Now immediate subsequent navigation must succeed cleanly
    env.window.SPAApp.navigateTo('registration', true);
    assertEqual(env.window.TransitionController.isTransitioning, true, 'New transition started cleanly');
    env.clock.advanceBy(600);

    assertEqual(env.window.SPAApp.getCurrentScene(), 'registration', 'Subsequent transition completed');
    assertEqual(env.document.querySelectorAll('.scene-section.active').length, 1, 'Single active section');
  });

  test('ADV1.3: Redundant Clicking on Current Scene During In-Flight Transition', () => {
    const { env } = createFullAppEnvironment();

    env.window.SPAApp.navigateTo('contact', true);
    assertEqual(env.window.TransitionController.isTransitioning, true, 'Transition in flight');

    // Click same scene 'contact' again mid-transition
    env.clock.advanceBy(150);
    env.window.SPAApp.navigateTo('contact', true);

    // Click starting scene 'project' mid-transition
    env.window.SPAApp.navigateTo('project', true);

    env.clock.advanceBy(500);

    assertEqual(env.window.TransitionController.isTransitioning, false, 'Unlocked');
    assertEqual(env.window.SPAApp.getCurrentScene(), 'contact', 'Current scene is contact');
    const shutter = env.document.getElementById('cinematic-shutter');
    assert(!shutter.classList.contains('animating'), 'Shutter clean of animating class');
    assert(!shutter.classList.contains('shutter-closed'), 'Shutter clean of closed class');
  });

  test('ADV1.4: Popstate & Hashchange Mid-Transition Interruption Resilience', () => {
    const { env } = createFullAppEnvironment();

    // Start transition to 'login'
    env.window.SPAApp.navigateTo('login', true);

    // At t=100ms, user hits browser Back button triggering popstate with hash '#project'
    env.clock.advanceBy(100);
    env.window.location.hash = '#project';
    env.window.dispatchEvent({ type: 'popstate', state: { scene: 'project' } });

    // At t=200ms, another hashchange event arrives '#about'
    env.clock.advanceBy(100);
    env.window.location.hash = '#about';
    env.window.dispatchEvent({ type: 'hashchange' });

    // Let initial transition finish
    env.clock.advanceBy(400);

    // Verify system did not crash, corrupt classes, or leave multiple active views
    assertEqual(env.window.TransitionController.isTransitioning, false, 'Lock is released');
    const activeSections = env.document.querySelectorAll('.scene-section.active');
    assertEqual(activeSections.length, 1, 'Exactly 1 active section in DOM');
  });

});

// =============================================================================
// SUITE 2: Adversarial Route Traversal & Malformed Hash Stress Harness
// =============================================================================
suite('Adversarial Stress 2: Route Traversal with Malformed Hashes', () => {

  const adversarialHashes = [
    { hash: '', expected: 'project', desc: 'Empty hash' },
    { hash: '#', expected: 'project', desc: 'Single hash symbol' },
    { hash: '##', expected: 'project', desc: 'Double hash symbol' },
    { hash: '#/', expected: 'project', desc: 'Slash route' },
    { hash: '#///', expected: 'project', desc: 'Multiple slashes' },
    { hash: '#unknown', expected: 'project', desc: 'Unknown route' },
    { hash: '#404', expected: 'project', desc: 'Numeric 404 route' },
    { hash: '#undefined', expected: 'project', desc: 'String undefined route' },
    { hash: '#null', expected: 'project', desc: 'String null route' },
    { hash: '#NaN', expected: 'project', desc: 'String NaN route' },
    { hash: '#scene-unknown', expected: 'project', desc: 'scene- prefix with unknown' },
    { hash: '#scene-about', expected: 'about', desc: 'scene- prefix with valid scene' },
    { hash: '#scene-contact', expected: 'contact', desc: 'scene- prefix with valid scene contact' },
    { hash: '#about?ref=nav&user=test', expected: 'project', desc: 'Hash with query parameters' },
    { hash: '#about#contact', expected: 'project', desc: 'Chained hashes' },
    { hash: '#contact/details/123', expected: 'project', desc: 'Nested subpath' },
    { hash: '#<script>alert(1)</script>', expected: 'project', desc: 'XSS script injection in hash' },
    { hash: '#../../etc/passwd', expected: 'project', desc: 'Path traversal in hash' },
    { hash: '#!/admin', expected: 'project', desc: 'Hashbang admin route' },
    { hash: '#🌸🌸🌸', expected: 'project', desc: 'Unicode emoji hash' },
    { hash: '#' + 'a'.repeat(2000), expected: 'project', desc: 'Buffer overflow 2000-char hash' },
    { hash: '#  ABOUT  ', expected: 'about', desc: 'Uppercase and whitespace padded' },
    { hash: '#LOGIN', expected: 'login', desc: 'Uppercase LOGIN' },
    { hash: '#ReGiStRaTiOn', expected: 'registration', desc: 'Mixed-case ReGiStRaTiOn' }
  ];

  adversarialHashes.forEach(({ hash, expected, desc }, i) => {
    test(`ADV2.${i + 1}: Deep linking adversarial hash: ${desc} ("${hash.slice(0, 25)}")`, () => {
      const { env } = createFullAppEnvironment(hash);
      const current = env.window.SPAApp.getCurrentScene();
      assertEqual(current, expected, `Hash '${hash.slice(0, 25)}' resolved safely to '${expected}'`);

      const activeEl = env.document.querySelector('.scene-section.active');
      assert(activeEl !== null, 'An active section exists in DOM');
      assertEqual(activeEl.id, 'scene-' + expected, `DOM section id matches expected: scene-${expected}`);
    });
  });

  test('ADV2.25: navigateTo() with Non-String and Hostile Types', () => {
    const { env } = createFullAppEnvironment();

    const hostileInputs = [
      null,
      undefined,
      12345,
      {},
      [],
      true,
      false,
      () => {},
      '__proto__',
      'constructor',
      'toString',
      Symbol('test')
    ];

    hostileInputs.forEach(input => {
      let threw = false;
      try {
        env.window.SPAApp.navigateTo(input, false);
      } catch (e) {
        threw = true;
      }
      assert(!threw, `navigateTo(${String(input)}) threw no uncaught error`);
    });

    // Verify system still alive and operational
    env.clock.advanceBy(600);
    assertEqual(env.window.TransitionController.isTransitioning, false, 'System unlocked and functional');
  });

});

// =============================================================================
// SUITE 3: Window Resize & Resolution Stress Harness during 3D WebGL Rendering
// =============================================================================
suite('Adversarial Stress 3: Window Resize During 3D WebGL Rendering', () => {

  test('ADV3.1: Resize Storm (1000 consecutive resize events during active render loop)', () => {
    const { env, mockCamera } = createFullAppEnvironment();

    const controller = env.window.ThreeSceneController;
    assert(controller.isRendering, 'Render loop is active');

    let errorsEncountered = 0;

    // Fire 1000 resize events with wildly fluctuating dimensions
    for (let i = 0; i < 1000; i++) {
      env.window.innerWidth = 300 + (i % 1600);
      env.window.innerHeight = 200 + (i % 900);
      try {
        controller.onResize();
      } catch (err) {
        errorsEncountered++;
      }
    }

    assertEqual(errorsEncountered, 0, 'Zero errors during 1000-resize storm');
    assert(mockCamera._matrixUpdated, 'Camera projection matrix updated');

    // Run animation loop for 20 frames
    const beforeFrames = controller.frameCount;
    env.clock.advanceBy(200);
    const afterFrames = controller.frameCount;

    assert(afterFrames > beforeFrames, 'Animation loop continued rendering smoothly');
  });

  test('ADV3.2: Boundary Viewport Resolutions (Zero, Negative, 8K, 16K, Mobile Ultra-Narrow)', () => {
    const { env } = createFullAppEnvironment();
    const controller = env.window.ThreeSceneController;

    const extremeViewports = [
      { w: 0, h: 0, desc: 'Zero dimensions (0x0)' },
      { w: 1920, h: 0, desc: 'Zero height (division by zero test)' },
      { w: 0, h: 1080, desc: 'Zero width' },
      { w: -100, h: -50, desc: 'Negative dimensions' },
      { w: 1, h: 1, desc: '1x1 micro-viewport' },
      { w: 320, h: 480, desc: 'iPhone SE portrait' },
      { w: 7680, h: 4320, desc: '8K UHD' },
      { w: 15360, h: 8640, desc: '16K Ultra' }
    ];

    extremeViewports.forEach(({ w, h, desc }) => {
      env.window.innerWidth = w;
      env.window.innerHeight = h;

      let threw = false;
      try {
        controller.onResize();
      } catch (e) {
        threw = true;
      }
      assert(!threw, `Viewport '${desc}' handled without throwing`);
    });

    // Restore standard resolution and verify rendering continues
    env.window.innerWidth = 1920;
    env.window.innerHeight = 1080;
    controller.onResize();

    const startFrames = controller.frameCount;
    env.clock.advanceBy(100);
    assert(controller.frameCount > startFrames, 'Frame counter advances after boundary resize');
  });

  test('ADV3.3: Resize in 2D Fallback Mode', () => {
    const env = createTestEnvironment(htmlContent);

    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: console,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame
      // Note: THREE is NOT defined, forcing 2D fallback
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(threeJsContent, context);
    env.window.ThreeSceneController.init('webgl-canvas');

    assertEqual(env.window.__THREE_SCENE__.isRendering, true, 'Fallback 2D is rendering');

    // Fire resize events
    env.window.innerWidth = 2560;
    env.window.innerHeight = 1440;

    let threw = false;
    try {
      env.window.ThreeSceneController.onResize();
    } catch (e) {
      threw = true;
    }

    assert(!threw, 'onResize in 2D fallback mode did not throw');
  });

  test('ADV3.4: Mouse Tracking Extreme Values (Cursor outside viewport)', () => {
    const { env } = createFullAppEnvironment();
    const controller = env.window.ThreeSceneController;

    const hostileMouseEvents = [
      { clientX: -99999, clientY: -99999, desc: 'Far negative offscreen' },
      { clientX: 99999, clientY: 99999, desc: 'Far positive offscreen' },
      { clientX: 0, clientY: 0, desc: 'Top-left corner' },
      { clientX: 1920, clientY: 1080, desc: 'Bottom-right corner' },
      { clientX: NaN, clientY: NaN, desc: 'NaN coordinates' }
    ];

    hostileMouseEvents.forEach(({ clientX, clientY, desc }) => {
      let threw = false;
      try {
        env.window.dispatchEvent({ type: 'mousemove', clientX, clientY });
        env.clock.advanceBy(50); // advance lerp
      } catch (e) {
        threw = true;
      }
      assert(!threw, `Mouse coordinate '${desc}' processed without error`);
    });
  });

});

// =============================================================================
// SUITE 4: Parallax Scroll Boundary & Mathematical Resilience Harness
// =============================================================================
suite('Adversarial Stress 4: Parallax Scroll Extreme Bounds', () => {

  test('ADV4.1: Negative Overscroll & Rubber-Band Scrolling (-5000px)', () => {
    const { env } = createFullAppEnvironment();

    // Trigger negative scroll offset (typical of iOS/macOS bounce)
    env.window.pageYOffset = -5000;
    env.document.documentElement.scrollTop = -5000;

    env.window.dispatchEvent({ type: 'scroll' });
    env.clock.runRaf();

    const sky = env.document.querySelector('.layer-sky');
    const cloudFar = env.document.querySelector('.layer-cloud-far');
    const banner = env.document.querySelector('.layer-banner');
    const cloudNear = env.document.querySelector('.layer-cloud-near');
    const petals = env.document.querySelector('.layer-petals');

    // Expected:
    // sky: -5000 * 0.1 = -500px
    // cloudFar: -5000 * 0.3 = -1500px
    // banner: -5000 * 0.55 = -2750px
    // cloudNear: -5000 * 0.8 = -4000px
    // petals: -(-5000) * 0.4 = +2000px
    assertEqual(sky.style.transform, 'translate3d(0, -500px, 0)', 'Sky layer handled negative overscroll');
    assertEqual(cloudFar.style.transform, 'translate3d(0, -1500px, 0)', 'Far cloud handled negative overscroll');
    assertEqual(banner.style.transform, 'translate3d(0, -2750px, 0)', 'Banner layer handled negative overscroll');
    assertEqual(cloudNear.style.transform, 'translate3d(0, -4000px, 0)', 'Near cloud handled negative overscroll');
    assertEqual(petals.style.transform, 'translate3d(0, 2000px, 0)', 'Petals reverse layer handled negative overscroll');
  });

  test('ADV4.2: Ultra-Deep Scroll Bounds (+1,000,000px)', () => {
    const { env } = createFullAppEnvironment();

    env.window.pageYOffset = 1000000;
    env.document.documentElement.scrollTop = 1000000;

    env.window.dispatchEvent({ type: 'scroll' });
    env.clock.runRaf();

    const sky = env.document.querySelector('.layer-sky');
    const petals = env.document.querySelector('.layer-petals');

    assertEqual(sky.style.transform, 'translate3d(0, 100000px, 0)', 'Sky scaled to 100,000px');
    assertEqual(petals.style.transform, 'translate3d(0, -400000px, 0)', 'Petals reversed to -400,000px');
  });

  test('ADV4.3: Rapid Scroll Oscillation Storm (500 rapid alternating deltas)', () => {
    const { env } = createFullAppEnvironment();

    for (let i = 0; i < 500; i++) {
      const offset = (i % 2 === 0) ? -2000 + i : 3000 + i;
      env.window.pageYOffset = offset;
      env.window.dispatchEvent({ type: 'scroll' });
    }

    env.clock.runRaf();

    const sky = env.document.querySelector('.layer-sky');
    assert(sky.style.transform.startsWith('translate3d(0,'), 'Valid CSS transform after scroll oscillation storm');
    assert(!sky.style.transform.includes('NaN'), 'No NaN in transform string');
  });

  test('ADV4.4: Zero-Dimension Hero Bounding Rect on Mousemove', () => {
    const { env } = createFullAppEnvironment();
    const hero = env.document.querySelector('.parallax-hero-wrapper');

    // Simulate zero-width/height bounding rect (e.g., hidden element or unstyled container)
    hero.getBoundingClientRect = () => ({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 });

    let threw = false;
    try {
      hero.dispatchEvent({ type: 'mousemove', clientX: 100, clientY: 100 });
      env.clock.advanceBy(100);
    } catch (e) {
      threw = true;
    }

    assert(!threw, 'Zero-dimension bounding rect does not throw unhandled exception');
  });

  test('ADV4.5: Refresh Storm (Calling ParallaxController.refresh() 200 times)', () => {
    const { env } = createFullAppEnvironment();

    let threw = false;
    try {
      for (let i = 0; i < 200; i++) {
        env.window.ParallaxController.refresh();
      }
    } catch (e) {
      threw = true;
    }

    assert(!threw, 'ParallaxController.refresh() storm completed without throwing');
  });

});

// =============================================================================
// SUITE 5: Form Validation Adversarial Security & Boundary Inputs
// =============================================================================
suite('Adversarial Stress 5: Form Validation & Security Input Filtering', () => {

  test('ADV5.1: Contact Form XSS Payload Sanitization', () => {
    const { env } = createFullAppEnvironment();

    const form = env.document.getElementById('contact-form');
    const nameInput = env.document.getElementById('contact-name');
    const emailInput = env.document.getElementById('contact-email');
    const msgInput = env.document.getElementById('contact-message');
    const alertBox = env.document.getElementById('contact-form-alert');

    // Inject raw script tags and HTML event handlers
    nameInput.value = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    emailInput.value = 'valid.user@example.com';
    msgInput.value = '<b>Test HTML message payload</b>';

    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(alertBox.classList.contains('success'), 'Form accepted valid email and strings');
    // Ensure raw <script> tag is escaped in innerHTML output
    assertIncludes(alertBox.innerHTML, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;', 'Script tags properly HTML-escaped');
    assert(!alertBox.innerHTML.includes('<script>'), 'Raw unescaped <script> tag strictly prohibited');
  });

  test('ADV5.2: Registration Form SQL Injection & Boundary Length Inputs', () => {
    const { env } = createFullAppEnvironment();

    const form = env.document.getElementById('registration-form');
    const firstName = env.document.getElementById('reg-firstname');
    const lastName = env.document.getElementById('reg-lastname');
    const username = env.document.getElementById('reg-username');
    const email = env.document.getElementById('reg-email');
    const password = env.document.getElementById('reg-password');
    const confirmPassword = env.document.getElementById('reg-confirmpassword');
    const city = env.document.getElementById('reg-city');
    const state = env.document.getElementById('reg-state');
    const pincode = env.document.getElementById('reg-pincode');
    const terms = env.document.getElementById('reg-terms');
    const alertBox = env.document.getElementById('registration-alert');

    // SQL Injection strings
    firstName.value = "Robert'; DROP TABLE Students;--";
    lastName.value = "' OR '1'='1";
    username.value = 'admin--';
    email.value = 'test+sql@chronicles.org';
    password.value = 'pass123!';
    confirmPassword.value = 'pass123!';
    city.value = "Tokyo' OR '1'='1";
    state.value = 'Maharashtra';
    pincode.value = '400001';
    terms.checked = true;

    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(alertBox.classList.contains('success'), 'Submission succeeded with escaped string values');
    assertIncludes(alertBox.innerHTML, 'Robert&#39;; DROP TABLE Students;--', 'Single quotes properly escaped');
  });

  test('ADV5.3: Adversarial Email Regex Rejections', () => {
    const { env } = createFullAppEnvironment();

    const form = env.document.getElementById('contact-form');
    const nameInput = env.document.getElementById('contact-name');
    const emailInput = env.document.getElementById('contact-email');
    const msgInput = env.document.getElementById('contact-message');
    const alertBox = env.document.getElementById('contact-form-alert');

    nameInput.value = 'Tester';
    msgInput.value = 'Hello world';

    const badEmails = [
      'plainaddress',
      '#@%^%#$@#$@#.com',
      '@example.com',
      'Joe Smith <email@example.com>',
      'email.example.com',
      'email@example@example.com',
      'email@example'
    ];

    badEmails.forEach(bad => {
      emailInput.value = bad;
      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      assert(alertBox.classList.contains('error'), `Rejected invalid email format: ${bad}`);
    });
  });

});

// =============================================================================
// SUITE 6: Degraded DOM Resilience & Null-Safety Boundaries
// =============================================================================
suite('Adversarial Stress 6: Degraded DOM Resilience & Null-Safety', () => {

  test('ADV6.1: Missing Canvas Element Handled Without Throwing', () => {
    const env = createTestEnvironment(htmlContent);
    // Remove canvas from DOM
    const canvas = env.document.getElementById('webgl-canvas');
    if (canvas && canvas.parentNode) {
      canvas.parentNode.children = canvas.parentNode.children.filter(c => c !== canvas);
    }
    env.document.getElementById = (id) => (id === 'webgl-canvas' ? null : env.document.querySelector('#' + id));

    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: console,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame
    };
    context.global = context;
    vm.createContext(context);

    let threw = false;
    try {
      vm.runInContext(threeJsContent, context);
      env.window.ThreeSceneController.init('webgl-canvas');
    } catch (e) {
      threw = true;
    }

    assert(!threw, 'Missing canvas handled gracefully with zero errors');
  });

  test('ADV6.2: Missing Shutter Element Graceful Fallback', () => {
    const env = createTestEnvironment(htmlContent);
    const shutter = env.document.getElementById('cinematic-shutter');
    if (shutter && shutter.parentNode) {
      shutter.parentNode.children = shutter.parentNode.children.filter(c => c !== shutter);
    }

    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: console,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(transitionsJsContent, context);
    env.window.TransitionController.init();

    let swapCalled = false;
    let threw = false;

    try {
      env.window.TransitionController.playTransition('about', () => {
        swapCalled = true;
      });
      env.clock.advanceBy(600);
    } catch (e) {
      threw = true;
    }

    assert(!threw, 'Missing shutter did not throw exception');
    assert(swapCalled, 'DOM swap callback executed even without physical shutter element');
  });

});
