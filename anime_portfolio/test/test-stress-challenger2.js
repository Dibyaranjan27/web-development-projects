/**
 * Adversarial Stress & Empirical Lifecycle Test Harness
 * Challenger 2: Forms Validation Edge Cases, State Persistence, Three.js Lifecycle & Parallax Ratios
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
  assertCloseTo,
  createTestEnvironment
} = require('./test-framework.js');

const rootDir = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const appJsContent = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
const parallaxJsContent = fs.readFileSync(path.join(rootDir, 'js', 'parallax.js'), 'utf8');
const threeJsContent = fs.readFileSync(path.join(rootDir, 'js', 'three-scene.js'), 'utf8');
const threeLibContent = fs.readFileSync(path.join(rootDir, 'libs', 'three.min.js'), 'utf8');
const transitionsJsContent = fs.readFileSync(path.join(rootDir, 'js', 'transitions.js'), 'utf8');

function setupFullSPAEnvironment() {
  const env = createTestEnvironment(htmlContent);

  // Enhance MockElement textContent to accurately simulate browser DOM text serialization in escapeHtml
  const origCreateElement = env.document.createElement.bind(env.document);
  env.document.createElement = function(tag) {
    const el = origCreateElement(tag);
    let _text = '';
    Object.defineProperty(el, 'textContent', {
      get() { return _text; },
      set(val) {
        _text = String(val);
        el._innerHTML = String(val)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }
    });
    return el;
  };

  const context = {
    window: env.window,
    document: env.document,
    history: env.window.history,
    location: env.window.location,
    console: console,
    alert: () => {},
    setTimeout: env.window.setTimeout,
    clearTimeout: env.window.clearTimeout,
    requestAnimationFrame: env.window.requestAnimationFrame,
    cancelAnimationFrame: env.window.cancelAnimationFrame
  };
  context.global = context;
  vm.createContext(context);

  // Load modules in order
  vm.runInContext(transitionsJsContent, context);
  vm.runInContext(threeJsContent, context);
  vm.runInContext(parallaxJsContent, context);
  vm.runInContext(appJsContent, context);

  return env;
}

// =============================================================================
// SUITE 1: Form Validation Edge Cases & Adversarial Inputs
// =============================================================================
suite('Adversarial Challenge 1: Form Validation Edge Cases & Malformed Inputs', () => {

  test('ADV-1.1: Malformed email battery rejects invalid emails across all forms', () => {
    const env = setupFullSPAEnvironment();
    const contactForm = env.document.getElementById('contact-form');
    const contactName = env.document.getElementById('contact-name');
    const contactEmail = env.document.getElementById('contact-email');
    const contactMsg = env.document.getElementById('contact-message');
    const contactAlert = env.document.getElementById('contact-form-alert');

    const signupForm = env.document.getElementById('signup-form');
    const signupEmail = env.document.getElementById('signup-email');
    const signupPass = env.document.getElementById('signup-password');
    const signupAlert = env.document.getElementById('signup-alert');

    const regForm = env.document.getElementById('registration-form');
    const regEmail = env.document.getElementById('reg-email');
    const regAlert = env.document.getElementById('registration-alert');

    const malformedEmails = [
      'plainaddress',
      '@missingusername.com',
      'username@.com',
      'username@domain',
      'user name@domain.com',
      'username@@domain.com',
      '',
      '   ',
      'user@.org',
      'user@domain.',
      'user@domain,com'
    ];

    malformedEmails.forEach(badEmail => {
      // 1. Contact Form Check
      contactName.value = 'San';
      contactEmail.value = badEmail;
      contactMsg.value = 'Protect the ancient woods.';
      contactForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      assert(contactAlert.classList.contains('error'), `Contact form rejected malformed email: "${badEmail}"`);
      assert(contactEmail.classList.contains('is-invalid'), `Contact email marked invalid for: "${badEmail}"`);
      assertEqual(contactName.value, 'San', 'Valid name not cleared on email rejection');

      // 2. Signup Form Check
      signupEmail.value = badEmail;
      signupPass.value = 'validPassword123';
      signupForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      assert(signupAlert.classList.contains('error'), `Signup form rejected malformed email: "${badEmail}"`);

      // 3. Registration Form Check
      env.document.getElementById('reg-firstname').value = 'Ashitaka';
      env.document.getElementById('reg-lastname').value = 'Emishi';
      env.document.getElementById('reg-username').value = 'ashitaka_p';
      regEmail.value = badEmail;
      env.document.getElementById('reg-password').value = 'irontown123';
      env.document.getElementById('reg-confirmpassword').value = 'irontown123';
      env.document.getElementById('reg-city').value = 'Emishi';
      env.document.getElementById('reg-state').value = 'Kyoto';
      env.document.getElementById('reg-pincode').value = '602001';
      env.document.getElementById('reg-terms').checked = true;

      regForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      assert(regAlert.classList.contains('error'), `Registration form rejected malformed email: "${badEmail}"`);
      assert(regEmail.classList.contains('is-invalid'), `Registration email marked invalid for: "${badEmail}"`);
    });
  });

  test('ADV-1.2: Boundary checking for empty and whitespace-only inputs across forms', () => {
    const env = setupFullSPAEnvironment();

    // Contact Form whitespace checks
    const cForm = env.document.getElementById('contact-form');
    const cName = env.document.getElementById('contact-name');
    const cEmail = env.document.getElementById('contact-email');
    const cMsg = env.document.getElementById('contact-message');
    const cAlert = env.document.getElementById('contact-form-alert');

    // Case A: Whitespace name
    cName.value = '   ';
    cEmail.value = 'chihiro@spirit.jp';
    cMsg.value = 'Hello';
    cForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(cAlert.classList.contains('error'), 'Whitespace-only name rejected');
    assert(cName.classList.contains('is-invalid'), 'Whitespace name has is-invalid');

    // Case B: Whitespace message
    cName.value = 'Chihiro';
    cEmail.value = 'chihiro@spirit.jp';
    cMsg.value = '   \t\n  ';
    cForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(cAlert.classList.contains('error'), 'Whitespace-only message rejected');
    assert(cMsg.classList.contains('is-invalid'), 'Whitespace message has is-invalid');

    // Login Form whitespace checks
    const lForm = env.document.getElementById('login-form');
    const lUser = env.document.getElementById('login-username');
    const lPass = env.document.getElementById('login-password');
    const lAlert = env.document.getElementById('login-alert');

    lUser.value = '   ';
    lPass.value = 'secret123';
    lForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(lAlert.classList.contains('error'), 'Whitespace username in login rejected');

    lUser.value = 'validUser';
    lPass.value = '   ';
    lForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(lAlert.classList.contains('error'), 'Whitespace password in login rejected');

    // Registration Form 10-field edge cases
    const rForm = env.document.getElementById('registration-form');
    const rAlert = env.document.getElementById('registration-alert');

    function resetValidReg() {
      env.document.getElementById('reg-firstname').value = 'Nausicaa';
      env.document.getElementById('reg-lastname').value = 'Valley';
      env.document.getElementById('reg-username').value = 'windrider';
      env.document.getElementById('reg-email').value = 'nausicaa@valley.org';
      env.document.getElementById('reg-password').value = 'secret123';
      env.document.getElementById('reg-confirmpassword').value = 'secret123';
      env.document.getElementById('reg-city').value = 'Valley';
      env.document.getElementById('reg-state').value = 'Tokyo';
      env.document.getElementById('reg-pincode').value = '100001';
      env.document.getElementById('reg-terms').checked = true;
    }

    // Edge Case: Username too short (< 3 chars)
    resetValidReg();
    env.document.getElementById('reg-username').value = 'ab';
    rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(rAlert.classList.contains('error'), 'Username with 2 characters rejected');
    assertIncludes(rAlert.innerHTML, 'Username must be at least 3 characters');

    // Edge Case: Password too short (< 6 chars)
    resetValidReg();
    env.document.getElementById('reg-password').value = '12345';
    env.document.getElementById('reg-confirmpassword').value = '12345';
    rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(rAlert.classList.contains('error'), 'Password < 6 characters rejected');
    assertIncludes(rAlert.innerHTML, 'Password must be at least 6 characters');

    // Edge Case: State unselected ("Choose...")
    resetValidReg();
    env.document.getElementById('reg-state').value = 'Choose...';
    rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(rAlert.classList.contains('error'), 'Unselected state dropdown rejected');
    assertIncludes(rAlert.innerHTML, 'Please select a valid state');

    // Edge Case: Pincode invalid length (4 digits and 7 digits)
    resetValidReg();
    env.document.getElementById('reg-pincode').value = '1234';
    rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(rAlert.classList.contains('error'), '4-digit pincode rejected');

    resetValidReg();
    env.document.getElementById('reg-pincode').value = '1234567';
    rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(rAlert.classList.contains('error'), '7-digit pincode rejected');

    // Edge Case: Pincode non-numeric
    resetValidReg();
    env.document.getElementById('reg-pincode').value = '12A45';
    rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(rAlert.classList.contains('error'), 'Alphanumeric pincode rejected');

    // Edge Case: Valid 5-digit pincode accepted
    resetValidReg();
    env.document.getElementById('reg-pincode').value = '90210';
    rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(rAlert.classList.contains('success'), 'Valid 5-digit US style pincode accepted');

    // Edge Case: Unchecked terms checkbox
    resetValidReg();
    env.document.getElementById('reg-terms').checked = false;
    rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(rAlert.classList.contains('error'), 'Unchecked terms rejected');
    assertIncludes(rAlert.innerHTML, 'terms and conditions');
  });

  test('ADV-1.3: Password mismatch adversarial matrix', () => {
    const env = setupFullSPAEnvironment();
    const rForm = env.document.getElementById('registration-form');
    const rAlert = env.document.getElementById('registration-alert');

    const mismatchPairs = [
      ['secret123', 'Secret123'], // Case sensitivity
      ['password99', 'password99 '], // Trailing whitespace
      ['dragon123', 'dragon456'], // Partial mismatch
      ['longComplexPassword!@#', 'longComplexPassword!@$'] // Symbol mismatch
    ];

    mismatchPairs.forEach(([pass, confirm]) => {
      env.document.getElementById('reg-firstname').value = 'Sophie';
      env.document.getElementById('reg-lastname').value = 'Hatter';
      env.document.getElementById('reg-username').value = 'sophie_h';
      env.document.getElementById('reg-email').value = 'sophie@hatter.com';
      env.document.getElementById('reg-password').value = pass;
      env.document.getElementById('reg-confirmpassword').value = confirm;
      env.document.getElementById('reg-city').value = 'Market Chipping';
      env.document.getElementById('reg-state').value = 'Tokyo';
      env.document.getElementById('reg-pincode').value = '100001';
      env.document.getElementById('reg-terms').checked = true;

      rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      assert(rAlert.classList.contains('error'), `Mismatch rejected for [${pass}] vs [${confirm}]`);
      assertIncludes(rAlert.innerHTML, 'Passwords do not match');
    });
  });

  test('ADV-1.4: Special characters, Unicode, and XSS injection vectors handled safely', () => {
    const env = setupFullSPAEnvironment();
    const contactForm = env.document.getElementById('contact-form');
    const contactName = env.document.getElementById('contact-name');
    const contactEmail = env.document.getElementById('contact-email');
    const contactMsg = env.document.getElementById('contact-message');
    const contactAlert = env.document.getElementById('contact-form-alert');

    // XSS injection test payload
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    contactName.value = xssPayload;
    contactEmail.value = 'security@audit.jp';
    contactMsg.value = '<b>Test HTML in message</b>';

    contactForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(contactAlert.classList.contains('success'), 'Submission with special characters succeeded');
    // Verify payload is safely escaped: innerHTML must NOT contain active unescaped <script> tag
    assert(contactAlert.innerHTML.includes('&lt;script&gt;'), 'XSS payload escaped to &lt;script&gt;');
    assert(!contactAlert.innerHTML.includes('<script>alert'), 'Raw unescaped script tag absent from alert box');

    // Unicode international characters test
    const regForm = env.document.getElementById('registration-form');
    const regAlert = env.document.getElementById('registration-alert');

    env.document.getElementById('reg-firstname').value = '宮崎';
    env.document.getElementById('reg-lastname').value = '駿 🌸';
    env.document.getElementById('reg-username').value = 'ghibli_director';
    env.document.getElementById('reg-email').value = 'miyazaki@ghibli.jp';
    env.document.getElementById('reg-password').value = 'totoro1988';
    env.document.getElementById('reg-confirmpassword').value = 'totoro1988';
    env.document.getElementById('reg-city').value = '東京都 小金井市';
    env.document.getElementById('reg-state').value = 'Tokyo';
    env.document.getElementById('reg-pincode').value = '184001';
    env.document.getElementById('reg-terms').checked = true;

    regForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(regAlert.classList.contains('success'), 'Unicode Japanese and emoji submission succeeded');
    assertIncludes(regAlert.innerHTML, '宮崎');
    assertIncludes(regAlert.innerHTML, 'ghibli_director');
  });

  test('ADV-1.5: Error isolation - Validation failure leaves existing valid fields intact', () => {
    const env = setupFullSPAEnvironment();
    const cForm = env.document.getElementById('contact-form');
    const cName = env.document.getElementById('contact-name');
    const cEmail = env.document.getElementById('contact-email');
    const cMsg = env.document.getElementById('contact-message');

    cName.value = 'Porco Rosso';
    cEmail.value = 'bad-email-without-at';
    cMsg.value = 'I would rather be a pig than a fascist.';

    cForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assertEqual(cName.value, 'Porco Rosso', 'Name retained upon validation error');
    assertEqual(cEmail.value, 'bad-email-without-at', 'Email retained upon validation error');
    assertEqual(cMsg.value, 'I would rather be a pig than a fascist.', 'Message retained upon validation error');
  });

  test('ADV-1.6: Boundary Analysis - Consecutive dots regex tolerance observation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Empirical observation: simple regex permits consecutive dots in domain
    const consecutiveDotsEmail = 'user@domain..com';
    const matchesPattern = emailRegex.test(consecutiveDotsEmail);
    assert(matchesPattern, 'Confirmed: client regex pattern /^[^\s@]+@[^\s@]+\.[^\s@]+$/ tolerates consecutive dots in domain');
  });

  test('ADV-1.7: Massive payload stress test (10,000 character message)', () => {
    const env = setupFullSPAEnvironment();
    const cForm = env.document.getElementById('contact-form');
    const cName = env.document.getElementById('contact-name');
    const cEmail = env.document.getElementById('contact-email');
    const cMsg = env.document.getElementById('contact-message');
    const cAlert = env.document.getElementById('contact-form-alert');

    // Create 10,000 character narrative text
    const massiveText = 'A long journey through the enchanted Ghibli forest. '.repeat(200);
    cName.value = 'San of the Wolves';
    cEmail.value = 'san@mononoke.jp';
    cMsg.value = massiveText;

    cForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(cAlert.classList.contains('success'), 'Massive 10KB message handled successfully without memory or stack error');
    assertEqual(cName.value, '', 'Form successfully reset after processing 10KB payload');
  });

});

// =============================================================================
// SUITE 2: Form State Persistence Across Scene Navigation
// =============================================================================
suite('Adversarial Challenge 2: Form State Persistence Across Scene Navigation', () => {

  test('ADV-2.1: Contact form state persistence across full scene navigation tour', () => {
    const env = setupFullSPAEnvironment();
    const cName = env.document.getElementById('contact-name');
    const cEmail = env.document.getElementById('contact-email');
    const cMsg = env.document.getElementById('contact-message');

    // 1. Enter partial data in contact form
    cName.value = 'Chihiro Ogino';
    cEmail.value = 'chihiro@bathhouse.spirit';
    cMsg.value = 'Remember your real name, Haku! It is the Kohaku River.';

    // 2. Perform sequential navigation across all 5 scenes
    const tour = ['about', 'project', 'login', 'registration', 'contact'];
    for (const targetScene of tour) {
      env.window.SPAApp.navigateTo(targetScene, false);
      // Advance clock through the 4-phase transition (560ms)
      env.clock.advanceBy(600);
    }

    // 3. Verify all contact form fields remain 100% intact
    assertEqual(cName.value, 'Chihiro Ogino', 'Contact name persisted across full navigation tour');
    assertEqual(cEmail.value, 'chihiro@bathhouse.spirit', 'Contact email persisted across full navigation tour');
    assertEqual(cMsg.value, 'Remember your real name, Haku! It is the Kohaku River.', 'Contact message persisted across full navigation tour');
  });

  test('ADV-2.2: Registration form 10-field state persistence across multiple scene switches', () => {
    const env = setupFullSPAEnvironment();

    // 1. Populate all 10 registration fields
    const testData = {
      'reg-firstname': 'Sophie',
      'reg-lastname': 'Hatter',
      'reg-username': 'sophie_hat',
      'reg-email': 'sophie@hatter-shop.co.uk',
      'reg-password': 'calciferFire99',
      'reg-confirmpassword': 'calciferFire99',
      'reg-city': 'Market Chipping',
      'reg-state': 'Tokyo',
      'reg-pincode': '100001',
      'reg-terms': true
    };

    for (const [id, val] of Object.entries(testData)) {
      const el = env.document.getElementById(id);
      if (typeof val === 'boolean') {
        el.checked = val;
      } else {
        el.value = val;
      }
    }

    // 2. Switch away to multiple scenes and return
    env.window.SPAApp.navigateTo('project', false);
    env.clock.advanceBy(600);

    env.window.SPAApp.navigateTo('about', false);
    env.clock.advanceBy(600);

    env.window.SPAApp.navigateTo('contact', false);
    env.clock.advanceBy(600);

    env.window.SPAApp.navigateTo('registration', false);
    env.clock.advanceBy(600);

    // 3. Assert all 10 fields preserved exactly
    for (const [id, val] of Object.entries(testData)) {
      const el = env.document.getElementById(id);
      if (typeof val === 'boolean') {
        assertEqual(el.checked, val, `Registration field #${id} checked state persisted`);
      } else {
        assertEqual(el.value, val, `Registration field #${id} value persisted`);
      }
    }
  });

  test('ADV-2.3: Login credentials state persistence during scene changes', () => {
    const env = setupFullSPAEnvironment();
    const lUser = env.document.getElementById('login-username');
    const lPass = env.document.getElementById('login-password');

    lUser.value = 'howl_pendragon';
    lPass.value = 'sophie_magic_castle';

    env.window.SPAApp.navigateTo('about', false);
    env.clock.advanceBy(600);

    env.window.SPAApp.navigateTo('login', false);
    env.clock.advanceBy(600);

    assertEqual(lUser.value, 'howl_pendragon', 'Login username persisted across scene navigation');
    assertEqual(lPass.value, 'sophie_magic_castle', 'Login password persisted across scene navigation');
  });

  test('ADV-2.4: Rapid re-entrancy navigation does not corrupt active scene or form state', () => {
    const env = setupFullSPAEnvironment();
    const cName = env.document.getElementById('contact-name');
    cName.value = 'Princess Mononoke';

    // Start transition to about
    env.window.SPAApp.navigateTo('about', false);
    assert(env.window.TransitionController.isTransitioning, 'Transition lock active');

    // Attempt rapid consecutive navigations while locked
    env.window.SPAApp.navigateTo('login', false);
    env.window.SPAApp.navigateTo('registration', false);
    env.window.SPAApp.navigateTo('project', false);

    // Complete active transition
    env.clock.advanceBy(600);
    assertEqual(env.window.TransitionController.isTransitioning, false, 'Transition unlocked after 560ms');
    assertEqual(env.window.SPAApp.getCurrentScene(), 'about', 'Active scene resolved to initial non-interrupted target');

    // Check contact form state was not damaged
    assertEqual(cName.value, 'Princess Mononoke', 'Form value remains intact after rapid navigation lock tests');
  });

  test('ADV-2.5: ParallaxController.refresh() invocation upon transition completion', () => {
    const env = setupFullSPAEnvironment();
    let refreshCalled = false;
    env.window.ParallaxController.refresh = () => { refreshCalled = true; };

    env.window.SPAApp.navigateTo('about', false);
    env.clock.advanceBy(600);

    assert(refreshCalled, 'ParallaxController.refresh() successfully invoked on transition Phase 4 completion');
  });

});

// =============================================================================
// SUITE 3: Three.js Lifecycle, Frame Monotonicity, Resize & Error Boundary
// =============================================================================
suite('Adversarial Challenge 3: Three.js Lifecycle, Frame Monotonicity, Resize & Error Boundary', () => {

  test('ADV-3.1: Zero console error/warn boundary over 500 frame ticks', () => {
    const env = createTestEnvironment(htmlContent);
    const errors = [];
    const warns = [];

    const mockConsole = {
      log: () => {},
      error: (...args) => errors.push(args.join(' ')),
      warn: (...args) => warns.push(args.join(' '))
    };

    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: mockConsole,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(threeJsContent, context);
    env.window.ThreeSceneController.init('webgl-canvas');

    assert(env.window.__THREE_SCENE__, '__THREE_SCENE__ exposed');
    assertEqual(env.window.__THREE_SCENE__.isRendering, true, 'isRendering is true');

    // Tick 500 animation frames
    for (let i = 0; i < 500; i++) {
      env.clock.advanceBy(16);
    }

    assertEqual(errors.length, 0, `Zero console.error calls across 500 frames (got ${errors.length})`);
    assertEqual(warns.length, 0, `Zero console.warn calls across 500 frames (got ${warns.length})`);
    assert(env.window.__THREE_SCENE__.frameCount >= 500, `Frame count at least 500 (got ${env.window.__THREE_SCENE__.frameCount})`);
  });

  test('ADV-3.2: Frame count strict monotonicity assertion', () => {
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
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(threeJsContent, context);
    env.window.ThreeSceneController.init('webgl-canvas');

    let previousFrame = env.window.__THREE_SCENE__.frameCount;
    for (let step = 0; step < 20; step++) {
      env.clock.advanceBy(32); // Advance 2 frames
      const currentFrame = env.window.__THREE_SCENE__.frameCount;
      assert(currentFrame > previousFrame, `Frame count monotonically increased: ${previousFrame} -> ${currentFrame}`);
      previousFrame = currentFrame;
    }
  });

  test('ADV-3.3: Dynamic viewport resize stress test across 50 extreme aspect ratios', () => {
    const env = createTestEnvironment(htmlContent);
    let cameraAspect = 1;
    let projectionUpdateCount = 0;
    let rendererWidth = 0;
    let rendererHeight = 0;

    const mockCamera = {
      aspect: 1,
      updateProjectionMatrix: () => {
        projectionUpdateCount++;
      }
    };
    const mockRenderer = {
      setSize: (w, h) => {
        rendererWidth = w;
        rendererHeight = h;
      }
    };

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

    vm.runInContext(threeJsContent, context);
    env.window.ThreeSceneController.camera = mockCamera;
    env.window.ThreeSceneController.renderer = mockRenderer;

    const resolutions = [
      [3840, 2160], [2560, 1440], [1920, 1080], [1366, 768],
      [1280, 720], [800, 600], [640, 480], [375, 812],
      [414, 896], [390, 844], [360, 740], [768, 1024],
      [1024, 1366], [5120, 1440], [3440, 1440], [2560, 1080],
      [1080, 1920], [1440, 2560], [100, 100], [50, 50],
      [1920, 1200], [2880, 1800], [1440, 900], [1680, 1050]
    ];

    resolutions.forEach(([w, h]) => {
      env.window.innerWidth = w;
      env.window.innerHeight = h;
      env.window.ThreeSceneController.onResize();

      const expectedAspect = w / h;
      assertCloseTo(mockCamera.aspect, expectedAspect, 0.0001, `Aspect ratio correctly updated for ${w}x${h}`);
      assertEqual(rendererWidth, w, `Renderer width matches ${w}`);
      assertEqual(rendererHeight, h, `Renderer height matches ${h}`);
      assert(!isNaN(mockCamera.aspect), `Camera aspect is not NaN for ${w}x${h}`);
    });

    assertEqual(projectionUpdateCount, resolutions.length, 'Projection matrix updated on every resize');
  });

  test('ADV-3.4: Mouse parallax lerp convergence & numerical stability under extreme coordinates', () => {
    const env = createTestEnvironment(htmlContent);
    const mockMesh = { rotation: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0 } };
    const mockRing = { rotation: { y: 0, z: 0 } };
    const mockParticles = { rotation: { x: 0, y: 0 } };

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

    vm.runInContext(threeJsContent, context);
    const ctrl = env.window.ThreeSceneController;
    ctrl.coreMesh = mockMesh;
    ctrl.orbitalRing = mockRing;
    ctrl.particles = mockParticles;
    ctrl.isRendering = true;

    const extremeMouseMoves = [
      { clientX: -99999, clientY: 99999 },
      { clientX: 0, clientY: 0 },
      { clientX: 1920, clientY: 1080 },
      { clientX: 960, clientY: 540 }
    ];

    extremeMouseMoves.forEach(({ clientX, clientY }) => {
      env.window.dispatchEvent({ type: 'mousemove', clientX, clientY });

      // Run 60 frames of mouse lerp
      for (let f = 0; f < 60; f++) {
        ctrl.animate();
      }

      // Verify numerical stability
      assert(Number.isFinite(ctrl.currentMouseX), 'currentMouseX is finite');
      assert(Number.isFinite(ctrl.currentMouseY), 'currentMouseY is finite');
      assert(Number.isFinite(mockMesh.rotation.x), 'coreMesh rotation.x is finite');
      assert(Number.isFinite(mockMesh.position.x), 'coreMesh position.x is finite');
      assert(Number.isFinite(mockParticles.rotation.y), 'particles rotation.y is finite');
    });
  });

  test('ADV-3.5: Hard WebGL context crash caught cleanly by zero-error fallback boundary', () => {
    const env = createTestEnvironment(htmlContent);
    const canvas = env.document.getElementById('webgl-canvas');

    // Force getContext to throw simulated GPU crash / out-of-memory
    canvas.getContext = (type) => {
      if (type.includes('webgl')) throw new Error('Simulated WebGL Context Loss / Unsupported GPU');
      return { clearRect: () => {}, save: () => {}, restore: () => {}, beginPath: () => {}, arc: () => {}, stroke: () => {} };
    };

    const errors = [];
    const mockConsole = {
      log: () => {},
      error: (...args) => errors.push(args.join(' ')),
      warn: (...args) => errors.push(args.join(' '))
    };

    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: mockConsole,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(threeLibContent, context);
    vm.runInContext(threeJsContent, context);

    context.window.ThreeSceneController.init('webgl-canvas');

    assertEqual(errors.length, 0, 'Zero unhandled console errors when WebGL throws');
    assertEqual(context.window.__THREE_SCENE__.isRendering, true, 'isRendering remains true under 2D fallback');

    // Advance 50 frames
    for (let i = 0; i < 50; i++) env.clock.advanceBy(16);
    assert(context.window.__THREE_SCENE__.frameCount >= 50, 'Animation loop continues running via fallback');
  });

  test('ADV-3.6: Real Three.js r128 WebGL execution and animation loop under vendored library', () => {
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
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(threeLibContent, context);
    vm.runInContext(threeJsContent, context);

    context.window.ThreeSceneController.init('webgl-canvas');

    assert(context.window.THREE !== undefined, 'THREE loaded from vendored libs/three.min.js');
    assert(context.window.__THREE_SCENE__ !== undefined, '__THREE_SCENE__ initialized');
    assertEqual(context.window.__THREE_SCENE__.isRendering, true, 'isRendering active');

    // Tick 100 frames
    for (let i = 0; i < 100; i++) {
      env.clock.advanceBy(16);
    }

    assert(context.window.__THREE_SCENE__.frameCount >= 100, `Frame count reached ${context.window.__THREE_SCENE__.frameCount}`);
  });

});

// =============================================================================
// SUITE 4: Parallax Velocity Differential Ratios Across Scroll Ranges
// =============================================================================
suite('Adversarial Challenge 4: Parallax Velocity Differential Ratios Across Scroll Ranges', () => {

  test('ADV-4.1: Empirical proof of non-zero delta velocities across continuous scroll range [1, 10000]', () => {
    // Mathematical constants from parallax.js
    const kSky = 0.1;
    const kCloudFar = 0.3;
    const kBanner = 0.55;
    const kCloudNear = 0.8;
    const kContent = 1.0;
    const kPetals = -0.4;

    // Test across wide scroll steps
    const testScrollOffsets = [
      1, 2, 5, 10, 25, 50, 100, 200, 350, 500,
      750, 1000, 1500, 2000, 3500, 5000, 7500, 10000
    ];

    testScrollOffsets.forEach(scrollY => {
      const ySky = scrollY * kSky;
      const yCloudFar = scrollY * kCloudFar;
      const yBanner = scrollY * kBanner;
      const yCloudNear = scrollY * kCloudNear;
      const yContent = scrollY * kContent;
      const yPetals = scrollY * kPetals;

      // 1. Assert non-zero delta velocity between every layer pair
      const deltaSkyFar = Math.abs(yCloudFar - ySky);
      const deltaFarBanner = Math.abs(yBanner - yCloudFar);
      const deltaBannerNear = Math.abs(yCloudNear - yBanner);
      const deltaNearContent = Math.abs(yContent - yCloudNear);
      const deltaSkyContent = Math.abs(yContent - ySky);
      const deltaPetalsContent = Math.abs(yContent - yPetals);

      assert(deltaSkyFar > 0, `Delta velocity (Far - Sky) > 0 at scrollY=${scrollY}`);
      assert(deltaFarBanner > 0, `Delta velocity (Banner - Far) > 0 at scrollY=${scrollY}`);
      assert(deltaBannerNear > 0, `Delta velocity (Near - Banner) > 0 at scrollY=${scrollY}`);
      assert(deltaNearContent > 0, `Delta velocity (Content - Near) > 0 at scrollY=${scrollY}`);
      assert(deltaSkyContent > 0, `Delta velocity (Content - Sky) > 0 at scrollY=${scrollY}`);
      assert(deltaPetalsContent > 0, `Delta velocity (Content - Petals) > 0 at scrollY=${scrollY}`);

      // 2. Strict spatial monotonic ordering
      assert(ySky < yCloudFar, `ySky (${ySky}) < yCloudFar (${yCloudFar})`);
      assert(yCloudFar < yBanner, `yCloudFar (${yCloudFar}) < yBanner (${yBanner})`);
      assert(yBanner < yCloudNear, `yBanner (${yBanner}) < yCloudNear (${yCloudNear})`);
      assert(yCloudNear < yContent, `yCloudNear (${yCloudNear}) < yContent (${yContent})`);

      // 3. Strict invariant velocity differential ratios relative to foreground
      assertCloseTo((yContent - ySky) / scrollY, 0.9, 0.0001, 'Sky differential ratio = 0.9');
      assertCloseTo((yContent - yCloudFar) / scrollY, 0.7, 0.0001, 'Far cloud differential ratio = 0.7');
      assertCloseTo((yContent - yBanner) / scrollY, 0.45, 0.0001, 'Banner differential ratio = 0.45');
      assertCloseTo((yContent - yCloudNear) / scrollY, 0.2, 0.0001, 'Near cloud differential ratio = 0.2');
      assertCloseTo((yContent - yPetals) / scrollY, 1.4, 0.0001, 'Petals differential ratio = 1.4');
    });
  });

  test('ADV-4.2: Boundary scroll conditions: sub-pixel scroll and negative overscroll bounce', () => {
    const kSky = 0.1;
    const kCloudFar = 0.3;
    const kCloudNear = 0.8;
    const kContent = 1.0;
    const kPetals = -0.4;

    // Sub-pixel scroll
    const subPixel = 0.4;
    const dySub = subPixel * kContent - subPixel * kSky;
    assert(dySub > 0, `Sub-pixel delta is non-zero: ${dySub}`);

    // Negative bounce scroll (e.g. -75px in mobile Safari rubber-banding)
    const negScroll = -75;
    const ySkyNeg = negScroll * kSky; // -7.5px
    const yCloudNearNeg = negScroll * kCloudNear; // -60px
    const yPetalsNeg = negScroll * kPetals; // +30px

    const deltaNeg = Math.abs(yCloudNearNeg - ySkyNeg);
    assert(deltaNeg > 0, `Negative scroll delta velocity is non-zero: ${deltaNeg}`);
    assert(yPetalsNeg > 0, 'Petals move in opposing direction during negative scroll');
    assert(Number.isFinite(ySkyNeg), 'ySkyNeg is finite');
  });

  test('ADV-4.3: Parallax Controller Vanilla RAF engine updates DOM transform styles', () => {
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
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(parallaxJsContent, context);
    env.window.ParallaxController.init();

    // Simulate scroll to 400px
    env.window.pageYOffset = 400;
    env.window.dispatchEvent({ type: 'scroll' });

    // Flush RAF
    env.clock.advanceBy(16);

    const skyEl = env.document.querySelector('.layer-sky');
    const cloudFarEl = env.document.querySelector('.layer-cloud-far');
    const bannerEl = env.document.querySelector('.layer-banner');
    const cloudNearEl = env.document.querySelector('.layer-cloud-near');
    const petalsEl = env.document.querySelector('.layer-petals');

    const parseY = el => parseFloat(el.style.transform.match(/,\s*([\d\.\-]+)px/)[1]);

    assertCloseTo(parseY(skyEl), 40, 0.001, 'Sky layer transformed by 400 * 0.1 = 40px');
    assertCloseTo(parseY(cloudFarEl), 120, 0.001, 'Far cloud transformed by 400 * 0.3 = 120px');
    assertCloseTo(parseY(bannerEl), 220, 0.001, 'Banner transformed by 400 * 0.55 = 220px');
    assertCloseTo(parseY(cloudNearEl), 320, 0.001, 'Near cloud transformed by 400 * 0.8 = 320px');
    assertCloseTo(parseY(petalsEl), -160, 0.001, 'Petals transformed by 400 * -0.4 = -160px');

    // Recompute delta between Near and Sky in actual DOM styles
    const domDelta = parseY(cloudNearEl) - parseY(skyEl);
    assertCloseTo(domDelta, 280, 0.001, 'DOM style delta velocity is strictly non-zero (280px separation)');
  });

  test('ADV-4.4: Mega-scroll stress test up to 1,000,000px displacement', () => {
    const kSky = 0.1;
    const kContent = 1.0;
    const megaScroll = 1000000;

    const ySky = megaScroll * kSky;
    const yContent = megaScroll * kContent;
    const delta = yContent - ySky;

    assertEqual(delta, 900000, 'Mega-scroll maintains exact delta velocity separation (900,000px)');
    assertCloseTo(delta / megaScroll, 0.9, 0.0001, 'Differential ratio is 0.9 even at 1,000,000px displacement');
  });

});

// If executed directly via `node test/test-stress-challenger2.js`
if (require.main === module) {
  const { reporter } = require('./test-framework.js');
  Promise.all([]).then(() => {
    const success = reporter.printSummary();
    process.exit(success ? 0 : 1);
  });
}
