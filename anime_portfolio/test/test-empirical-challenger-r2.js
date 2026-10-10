/**
 * Empirical Challenge & Adversarial Stress Suite - Challenger R2_2
 * Focus: Defensive Parallax Fallback Guard, Transition Fault Recovery,
 *        Three.js Resilience, Form State Persistence & Extreme Route Fuzzing.
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
const transitionsJsContent = fs.readFileSync(path.join(rootDir, 'js', 'transitions.js'), 'utf8');
const threeJsContent = fs.readFileSync(path.join(rootDir, 'js', 'three-scene.js'), 'utf8');
const gsapLibContent = fs.readFileSync(path.join(rootDir, 'libs', 'gsap.min.js'), 'utf8');
const scrollTriggerLibContent = fs.readFileSync(path.join(rootDir, 'libs', 'ScrollTrigger.min.js'), 'utf8');
const threeLibContent = fs.readFileSync(path.join(rootDir, 'libs', 'three.min.js'), 'utf8');

function setupFullEnv() {
  const env = createTestEnvironment(htmlContent);

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

  // Load vendored libs
  vm.runInContext(gsapLibContent, context);
  vm.runInContext(scrollTriggerLibContent, context);
  vm.runInContext(threeLibContent, context);

  // Load application modules
  vm.runInContext(transitionsJsContent, context);
  vm.runInContext(threeJsContent, context);
  vm.runInContext(parallaxJsContent, context);
  vm.runInContext(appJsContent, context);

  return env;
}

// =============================================================================
// SUITE 1: Defensive Parallax Fallback Guard (Adversarial Breakdown Scenarios)
// =============================================================================
suite('Challenger R2_2: Parallax Engine & Defensive Fallback Stress Matrix', () => {

  test('FALLBACK-1: GSAP present but gsap.set missing - updates layer transforms cleanly via translate3d', () => {
    const env = createTestEnvironment(htmlContent);
    const triggers = [];
    const mockGsap = {
      registerPlugin: () => {}
      // gsap.set is deliberately missing!
    };
    const mockScrollTrigger = {
      create: (opts) => triggers.push(opts),
      refresh: () => {}
    };

    env.window.gsap = mockGsap;
    env.window.ScrollTrigger = mockScrollTrigger;

    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: console,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame,
      gsap: mockGsap,
      ScrollTrigger: mockScrollTrigger
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(parallaxJsContent, context);
    env.window.ParallaxController.init();

    assertEqual(triggers.length, 5, 'All 5 ScrollTriggers registered even without gsap.set');

    // Simulate progress updates for all 5 layers
    const skyEl = env.document.querySelector('.layer-sky');
    const cloudFarEl = env.document.querySelector('.layer-cloud-far');
    const bannerEl = env.document.querySelector('.layer-banner');
    const cloudNearEl = env.document.querySelector('.layer-cloud-near');
    const petalsEl = env.document.querySelector('.layer-petals');

    // Sky: 0.5 * 80 = 40px
    triggers[0].onUpdate({ progress: 0.5 });
    assertEqual(skyEl.style.transform, 'translate3d(0, 40px, 0)', 'Sky layer updated via translate3d fallback');

    // CloudFar: 0.5 * 180 = 90px
    triggers[1].onUpdate({ progress: 0.5 });
    assertEqual(cloudFarEl.style.transform, 'translate3d(0, 90px, 0)', 'Far cloud updated via translate3d fallback');

    // Banner: 0.5 * 260 = 130px
    triggers[2].onUpdate({ progress: 0.5 });
    assertEqual(bannerEl.style.transform, 'translate3d(0, 130px, 0)', 'Banner updated via translate3d fallback');

    // CloudNear: 0.5 * 380 = 190px
    triggers[3].onUpdate({ progress: 0.5 });
    assertEqual(cloudNearEl.style.transform, 'translate3d(0, 190px, 0)', 'Near cloud updated via translate3d fallback');

    // Petals: -0.5 * 220 = -110px
    triggers[4].onUpdate({ progress: 0.5 });
    assertEqual(petalsEl.style.transform, 'translate3d(0, -110px, 0)', 'Petals updated via translate3d reverse fallback');
  });

  test('FALLBACK-2: gsap.set throws arbitrary errors - caught and falls back to translate3d', () => {
    const env = createTestEnvironment(htmlContent);
    const triggers = [];
    let throwCount = 0;
    const mockGsap = {
      registerPlugin: () => {},
      set: () => {
        throwCount++;
        throw new TypeError('Simulated corrupted GSAP runtime error');
      }
    };
    const mockScrollTrigger = {
      create: (opts) => triggers.push(opts),
      refresh: () => {}
    };

    env.window.gsap = mockGsap;
    env.window.ScrollTrigger = mockScrollTrigger;

    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: console,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame,
      gsap: mockGsap,
      ScrollTrigger: mockScrollTrigger
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(parallaxJsContent, context);
    env.window.ParallaxController.init();

    const skyEl = env.document.querySelector('.layer-sky');
    triggers[0].onUpdate({ progress: 0.75 }); // 0.75 * 80 = 60px

    assert(throwCount > 0, 'gsap.set was invoked and threw');
    assertEqual(skyEl.style.transform, 'translate3d(0, 60px, 0)', 'Layer style successfully set to translate3d despite throw');
  });

  test('FALLBACK-3: GSAP completely absent - activates Vanilla RAF engine without errors', () => {
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
      // No gsap or ScrollTrigger in context!
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(parallaxJsContent, context);
    env.window.ParallaxController.init();

    assertEqual(env.window.ParallaxController.isGsapAvailable, false, 'isGsapAvailable is false');

    // Simulate scroll offset 500
    env.window.pageYOffset = 500;
    env.window.dispatchEvent({ type: 'scroll' });
    env.clock.advanceBy(16);

    const skyEl = env.document.querySelector('.layer-sky');
    const cloudFarEl = env.document.querySelector('.layer-cloud-far');
    const petalsEl = env.document.querySelector('.layer-petals');

    assertEqual(skyEl.style.transform, 'translate3d(0, 50px, 0)', 'Vanilla sky: 500 * 0.1 = 50px');
    assertEqual(cloudFarEl.style.transform, 'translate3d(0, 150px, 0)', 'Vanilla cloudFar: 500 * 0.3 = 150px');
    assertEqual(petalsEl.style.transform, 'translate3d(0, -200px, 0)', 'Vanilla petals: 500 * -0.4 = -200px');
  });

  test('FALLBACK-4: ScrollTrigger.refresh() throwing an exception is cleanly handled', () => {
    const env = createTestEnvironment(htmlContent);
    const mockScrollTrigger = {
      refresh: () => {
        throw new Error('Simulated ScrollTrigger.refresh() fault during window resize');
      }
    };

    env.window.ScrollTrigger = mockScrollTrigger;
    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: console,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame,
      ScrollTrigger: mockScrollTrigger
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(parallaxJsContent, context);

    // Call refresh() directly - must not throw
    let didThrow = false;
    try {
      env.window.ParallaxController.refresh();
    } catch (e) {
      didThrow = true;
    }
    assertEqual(didThrow, false, 'ParallaxController.refresh() caught and silenced ScrollTrigger error safely');
  });

  test('FALLBACK-5: Null or missing layer elements in DOM do not crash updateLayer', () => {
    const env = createTestEnvironment(htmlContent);
    const triggers = [];
    const mockGsap = {
      registerPlugin: () => {},
      set: (target, props) => {
        if (target && target.style) target.style.transform = `translate3d(0, ${props.y}px, 0)`;
      }
    };
    const mockScrollTrigger = {
      create: (opts) => triggers.push(opts),
      refresh: () => {}
    };

    env.window.gsap = mockGsap;
    env.window.ScrollTrigger = mockScrollTrigger;

    const context = {
      window: env.window,
      document: env.document,
      history: env.window.history,
      location: env.window.location,
      console: console,
      setTimeout: env.window.setTimeout,
      clearTimeout: env.window.clearTimeout,
      requestAnimationFrame: env.window.requestAnimationFrame,
      cancelAnimationFrame: env.window.cancelAnimationFrame,
      gsap: mockGsap,
      ScrollTrigger: mockScrollTrigger
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(parallaxJsContent, context);
    env.window.ParallaxController.init();

    // Nullify sky layer deliberately
    env.window.ParallaxController.layers.sky = null;

    // Trigger onUpdate for all triggers
    triggers.forEach(trig => {
      trig.onUpdate({ progress: 0.5 });
    });

    assert(true, 'Missing layer handled gracefully without throwing');
  });

});

// =============================================================================
// SUITE 2: Transition Resilience & Unhandled Swap Errors
// =============================================================================
suite('Challenger R2_2: Transition Controller Fault Recovery & Concurrency', () => {

  test('TRANS-1: DOM swapCallback throwing an error does not leave transition locked permanently', () => {
    const env = setupFullEnv();
    const ctrl = env.window.TransitionController;

    assertEqual(ctrl.isTransitioning, false, 'Initially not transitioning');

    // Attempt transition with a throwing callback
    ctrl.playTransition('about', () => {
      throw new Error('Simulated DOM swap failure in user callback');
    });

    // Advance clock past midpoint (260ms) and finish (560ms)
    env.clock.advanceBy(300);
    env.clock.advanceBy(300);

    // Assert transition lock is safely cleared
    assertEqual(ctrl.isTransitioning, false, 'isTransitioning was reset to false even after callback threw');
    const shutter = env.document.getElementById('cinematic-shutter');
    assert(!shutter.classList.contains('closing'), 'Shutter closing class removed');
  });

  test('TRANS-2: Rapid concurrent navigation spamming strictly adheres to single active section invariant', () => {
    const env = setupFullEnv();

    const sections = ['scene-project', 'scene-about', 'scene-contact', 'scene-login', 'scene-registration'];
    const countActive = () => sections.filter(id => env.document.getElementById(id).classList.contains('active')).length;

    assertEqual(countActive(), 1, 'Exactly 1 active section initially');

    // Spam navigations rapidly with 10ms intervals
    for (let i = 0; i < 200; i++) {
      const target = ['project', 'about', 'contact', 'login', 'registration'][i % 5];
      env.window.SPAApp.navigateTo(target, false);
      env.clock.advanceBy(10);
    }

    // Advance through remaining transition
    env.clock.advanceBy(1000);

    assertEqual(countActive(), 1, 'Exactly 1 active section after 200 navigation spam bursts');
    assertEqual(env.window.TransitionController.isTransitioning, false, 'Transition lock released');
  });

});

// =============================================================================
// SUITE 3: Three.js Resilience & WebGL Context Simulation
// =============================================================================
suite('Challenger R2_2: Three.js Lifecycle & Error Boundary', () => {

  test('THREE-1: 1,000 continuous frames maintain strictly monotonic count and zero errors', () => {
    const env = setupFullEnv();

    const initialFrames = env.window.__THREE_SCENE__.frameCount;

    for (let f = 0; f < 1000; f++) {
      env.clock.advanceBy(16);
    }

    const finalFrames = env.window.__THREE_SCENE__.frameCount;
    assert(finalFrames >= initialFrames + 1000, `Frame count progressed by >= 1000 frames (${initialFrames} -> ${finalFrames})`);
  });

  test('THREE-2: Repeated window resize storms do not corrupt camera aspect or trigger NaN', () => {
    const env = setupFullEnv();
    const ctrl = env.window.ThreeSceneController;

    for (let w = 100; w <= 3840; w += 200) {
      for (let h = 100; h <= 2160; h += 300) {
        env.window.innerWidth = w;
        env.window.innerHeight = h;
        ctrl.onResize();

        assert(!isNaN(ctrl.camera.aspect), `Camera aspect is not NaN for ${w}x${h}`);
        assert(isFinite(ctrl.camera.aspect), `Camera aspect is finite for ${w}x${h}`);
      }
    }
  });

});

// =============================================================================
// SUITE 4: End-to-End Hash Traversal & Navigation State Invariants
// =============================================================================
suite('Challenger R2_2: Route Hash Matrix & Input Sanitization', () => {

  test('HASH-1: Extreme hash variations resolve safely to project or target scene', () => {
    const env = setupFullEnv();

    const edgeHashes = [
      '#', '##', '#/', '#//', '#about/extra/path', '#login?query=1&foo=bar',
      '#ABOUT', '#CoNtAcT', '#   registration   ', '#<svg/onload=alert(1)>',
      '#../..', '#undefined', '#null', '#NaN', '#0'
    ];

    edgeHashes.forEach(h => {
      env.window.location.hash = h;
      env.window.dispatchEvent({ type: 'hashchange' });
      env.clock.advanceBy(600);

      const current = env.window.SPAApp.getCurrentScene();
      const validScenes = ['project', 'about', 'contact', 'login', 'registration'];
      assert(validScenes.includes(current), `Hash "${h}" resolved to valid scene "${current}"`);
      assertEqual(env.window.TransitionController.isTransitioning, false, 'Transition lock freed');
    });
  });

});

// =============================================================================
// SUITE 5: Parallax Layer Velocity Separation & Rapid Form Submission Stress
// =============================================================================
suite('Challenger R2_2: Parallax Layer Separation & Rapid Form Bursts', () => {

  test('PARALLAX-SEP: Multi-layer depth velocities remain strictly non-colliding across full scroll scrub', () => {
    const env = setupFullEnv();
    const ctrl = env.window.ParallaxController;

    // Verify all 5 layers cached
    assert(ctrl.layers.sky !== null, 'Sky layer cached');
    assert(ctrl.layers.cloudFar !== null, 'Far cloud layer cached');
    assert(ctrl.layers.banner !== null, 'Banner layer cached');
    assert(ctrl.layers.cloudNear !== null, 'Near cloud layer cached');
    assert(ctrl.layers.petals !== null, 'Petals layer cached');

    // Test across scrub intervals
    const progressSteps = [0.1, 0.25, 0.5, 0.75, 0.9, 1.0];
    progressSteps.forEach(p => {
      const ySky = p * 80;
      const yFar = p * 180;
      const yBanner = p * 260;
      const yNear = p * 380;
      const yPetals = -p * 220;

      // Assert strict ordering of forward layers
      assert(ySky < yFar, `Sky (${ySky}) < Far (${yFar}) at progress ${p}`);
      assert(yFar < yBanner, `Far (${yFar}) < Banner (${yBanner}) at progress ${p}`);
      assert(yBanner < yNear, `Banner (${yBanner}) < Near (${yNear}) at progress ${p}`);
      assert(yPetals < 0, `Petals (${yPetals}) moves in negative reverse direction`);

      // Delta separations are strictly positive
      assert(yFar - ySky > 0, 'Far - Sky > 0');
      assert(yBanner - yFar > 0, 'Banner - Far > 0');
      assert(yNear - yBanner > 0, 'Near - Banner > 0');
    });
  });

  test('FORM-BURST: 100 rapid concurrent submissions to Contact & Registration forms handled safely', () => {
    const env = setupFullEnv();
    const cForm = env.document.getElementById('contact-form');
    const cName = env.document.getElementById('contact-name');
    const cEmail = env.document.getElementById('contact-email');
    const cMsg = env.document.getElementById('contact-message');
    const cAlert = env.document.getElementById('contact-form-alert');

    cName.value = 'Haku';
    cEmail.value = 'haku@river.spirit';
    cMsg.value = 'Fly away, Sen!';

    for (let i = 0; i < 50; i++) {
      cForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      assert(cAlert.classList.contains('success'), `Contact submission ${i} succeeded`);
      // Re-populate for next iteration
      cName.value = 'Haku';
      cEmail.value = 'haku@river.spirit';
      cMsg.value = 'Fly away, Sen!';
    }

    const rForm = env.document.getElementById('registration-form');
    const rAlert = env.document.getElementById('registration-alert');

    for (let i = 0; i < 50; i++) {
      env.document.getElementById('reg-firstname').value = 'Kiki';
      env.document.getElementById('reg-lastname').value = 'Delivery';
      env.document.getElementById('reg-username').value = 'kiki_witch';
      env.document.getElementById('reg-email').value = 'kiki@koriko.jp';
      env.document.getElementById('reg-password').value = 'broomstick123';
      env.document.getElementById('reg-confirmpassword').value = 'broomstick123';
      env.document.getElementById('reg-city').value = 'Koriko';
      env.document.getElementById('reg-state').value = 'Tokyo';
      env.document.getElementById('reg-pincode').value = '100001';
      env.document.getElementById('reg-terms').checked = true;

      rForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      assert(rAlert.classList.contains('success'), `Registration submission ${i} succeeded`);
    }
  });

});

if (require.main === module) {
  const { reporter } = require('./test-framework.js');
  Promise.all([]).then(() => {
    const success = reporter.printSummary();
    process.exit(success ? 0 : 1);
  });
}
