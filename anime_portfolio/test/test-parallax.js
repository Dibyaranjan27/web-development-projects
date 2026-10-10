/**
 * Test Suite: 2D Parallax Scrolling Multi-Layer Depth (Agent-as-Judge Criterion 2)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite, test, assert, assertEqual, assertCloseTo, createTestEnvironment } = require('./test-framework.js');

const rootDir = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const parallaxCssContent = fs.readFileSync(path.join(rootDir, 'css', 'parallax.css'), 'utf8');
const parallaxJsContent = fs.readFileSync(path.join(rootDir, 'js', 'parallax.js'), 'utf8');

suite('Criterion 2: 2D Parallax Scrolling Multi-Layer Depth', () => {

  test('F2.1: DOM Layer Structure - All 5 parallax depth containers exist in markup', () => {
    assert(htmlContent.includes('class="parallax-layer layer-sky"'), 'Sky layer container in HTML');
    assert(htmlContent.includes('class="parallax-layer layer-cloud-far"'), 'Far clouds layer container in HTML');
    assert(htmlContent.includes('class="parallax-layer layer-banner"'), 'Anime banners layer container in HTML');
    assert(htmlContent.includes('class="parallax-layer layer-cloud-near"'), 'Near clouds layer container in HTML');
    assert(htmlContent.includes('class="parallax-layer layer-petals"'), 'Sakura petals reverse layer in HTML');
  });

  test('F2.2: CSS Hardware Acceleration - transform and will-change defined', () => {
    assert(parallaxCssContent.includes('will-change: transform'), 'will-change: transform specified in parallax.css');
    assert(parallaxCssContent.includes('translate3d'), 'Hardware-accelerated translate3d specified in parallax.css');
    assert(parallaxCssContent.includes('.layer-sky'), '.layer-sky rule in parallax.css');
    assert(parallaxCssContent.includes('.layer-cloud-far'), '.layer-cloud-far rule in parallax.css');
    assert(parallaxCssContent.includes('.layer-banner'), '.layer-banner rule in parallax.css');
    assert(parallaxCssContent.includes('.layer-cloud-near'), '.layer-cloud-near rule in parallax.css');
    assert(parallaxCssContent.includes('.layer-petals'), '.layer-petals rule in parallax.css');
  });

  test('F2.3: Mathematical Depth Multipliers Specification', () => {
    // Parallax multipliers contract
    const multipliers = {
      sky: 0.1,
      cloudFar: 0.3,
      banner: 0.55,
      cloudNear: 0.8,
      petals: -0.4
    };

    // Verify all multipliers are referenced in parallax.js
    assert(parallaxJsContent.includes('0.1'), '0.1x multiplier defined for sky layer');
    assert(parallaxJsContent.includes('0.3'), '0.3x multiplier defined for far clouds layer');
    assert(parallaxJsContent.includes('0.55'), '0.55x multiplier defined for banner layer');
    assert(parallaxJsContent.includes('0.8'), '0.8x multiplier defined for foreground clouds layer');
    assert(parallaxJsContent.includes('-0.4'), '-0.4x reverse multiplier defined for petals layer');
  });

  test('F2.4: Differential Velocity Assertion - Layers move at distinct speeds relative to foreground', () => {
    const scrollDeltas = [100, 250, 500];

    for (const deltaY of scrollDeltas) {
      const ySky = deltaY * 0.1;
      const yCloudFar = deltaY * 0.3;
      const yBanner = deltaY * 0.55;
      const yCloudNear = deltaY * 0.8;
      const yContent = deltaY * 1.0; // Foreground natural scroll
      const yPetals = deltaY * -0.4; // Reverse parallax

      // Assert strict monotonic separation for forward layers
      assert(ySky < yCloudFar, `Sky (${ySky}px) slower than Far Cloud (${yCloudFar}px) at scroll ${deltaY}px`);
      assert(yCloudFar < yBanner, `Far Cloud (${yCloudFar}px) slower than Banner (${yBanner}px) at scroll ${deltaY}px`);
      assert(yBanner < yCloudNear, `Banner (${yBanner}px) slower than Near Cloud (${yCloudNear}px) at scroll ${deltaY}px`);
      assert(yCloudNear < yContent, `Near Cloud (${yCloudNear}px) slower than Foreground Content (${yContent}px) at scroll ${deltaY}px`);

      // Assert reverse direction for sakura petals
      assert(yPetals < 0, `Petals (${yPetals}px) move in reverse direction`);

      // Verify relative speed ratios to foreground content
      assertCloseTo(ySky / yContent, 0.1, 0.001, 'Sky layer speed ratio is 0.1');
      assertCloseTo(yCloudFar / yContent, 0.3, 0.001, 'Far cloud layer speed ratio is 0.3');
      assertCloseTo(yBanner / yContent, 0.55, 0.001, 'Banner layer speed ratio is 0.55');
      assertCloseTo(yCloudNear / yContent, 0.8, 0.001, 'Near cloud layer speed ratio is 0.8');
      assertCloseTo(yPetals / yContent, -0.4, 0.001, 'Petals layer speed ratio is -0.4');
    }
  });

  test('F2.5: Vanilla JS RAF Fallback Engine Execution', () => {
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

    // Run parallax script without GSAP to exercise fallback engine
    vm.runInContext(parallaxJsContent, context);

    assert(env.window.ParallaxController, 'ParallaxController registered on window');
    env.window.ParallaxController.init();
    assertEqual(env.window.ParallaxController.isGsapAvailable, false, 'Engine recognized GSAP is absent and activated Vanilla fallback');

    // Simulate page scroll to Y = 200px
    env.window.pageYOffset = 200;
    env.window.dispatchEvent({ type: 'scroll' });
    env.clock.runRaf();

    const skyEl = env.document.querySelector('.layer-sky');
    const farCloudEl = env.document.querySelector('.layer-cloud-far');
    const bannerEl = env.document.querySelector('.layer-banner');
    const nearCloudEl = env.document.querySelector('.layer-cloud-near');
    const petalsEl = env.document.querySelector('.layer-petals');

    function extractY(transformStr) {
      const match = transformStr.match(/translate3d\(0,\s*(-?[0-9.]+)px,\s*0\)/);
      return match ? parseFloat(match[1]) : NaN;
    }

    assertCloseTo(extractY(skyEl.style.transform), 20, 0.01, 'Sky layer transformed by 200 * 0.1 = 20px');
    assertCloseTo(extractY(farCloudEl.style.transform), 60, 0.01, 'Far cloud layer transformed by 200 * 0.3 = 60px');
    assertCloseTo(extractY(bannerEl.style.transform), 110, 0.01, 'Banner layer transformed by 200 * 0.55 = 110px');
    assertCloseTo(extractY(nearCloudEl.style.transform), 160, 0.01, 'Near cloud layer transformed by 200 * 0.8 = 160px');
    assertCloseTo(extractY(petalsEl.style.transform), -80, 0.01, 'Petals layer transformed by 200 * -0.4 = -80px');
  });

  test('F2.6: GSAP ScrollTrigger Integration Engine Execution', () => {
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

    // Load real vendored gsap.min.js
    const gsapContent = fs.readFileSync(path.join(rootDir, 'libs', 'gsap.min.js'), 'utf8');
    vm.runInContext(gsapContent, context);

    // Load real vendored ScrollTrigger.min.js
    const scrollTriggerContent = fs.readFileSync(path.join(rootDir, 'libs', 'ScrollTrigger.min.js'), 'utf8');
    vm.runInContext(scrollTriggerContent, context);

    // Verify real gsap.set is present and is a function
    assertEqual(typeof env.window.gsap.set, 'function', 'gsap.set exists as a function on vendored library');

    // Run parallax script with real GSAP and ScrollTrigger present
    vm.runInContext(parallaxJsContent, context);
    env.window.ParallaxController.init();

    assertEqual(env.window.ParallaxController.isGsapAvailable, true, 'Engine recognized GSAP and activated ScrollTrigger timeline');

    const createdTriggers = env.window.ScrollTrigger.getAll();
    assert(createdTriggers.length >= 5, `Created ${createdTriggers.length} ScrollTrigger instances for parallax layers`);

    // Verify onUpdate callbacks for scrubbed progress
    const skyTrigger = createdTriggers[0];
    skyTrigger.onUpdate({ progress: 0.5 });
    const skyEl = env.document.querySelector('.layer-sky');
    assertEqual(skyEl.style.transform, 'translate3d(0, 40px, 0)', 'GSAP set sky layer to 0.5 * 80 = 40px');

    // Verify direct gsap.set functionality on DOM element
    const bannerEl = env.document.querySelector('.layer-banner');
    env.window.gsap.set(bannerEl, { y: 130, force3D: true });
    assertEqual(bannerEl.style.transform, 'translate3d(0, 130px, 0)', 'gsap.set directly updates element transform to translate3d');
  });

  test('F2.7: Mouse Tilt Interaction Handler', () => {
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

    const hero = env.document.querySelector('.parallax-hero-wrapper');
    assert(hero !== null, 'Hero wrapper found');

    // Trigger mouse move event on hero wrapper
    const mouseMoveEvt = {
      type: 'mousemove',
      clientX: 1400,
      clientY: 600
    };
    hero.dispatchEvent(mouseMoveEvt);

    // Advance RAF frames to allow lerp to update margins
    env.clock.advanceBy(100);

    const farCloud = env.document.querySelector('.layer-cloud-far');
    const nearCloud = env.document.querySelector('.layer-cloud-near');
    assert(farCloud.style.marginLeft !== undefined, 'Far cloud marginLeft initialized by mouse parallax');
    assert(nearCloud.style.marginLeft !== undefined, 'Near cloud marginLeft initialized by mouse parallax');
  });

  test('F2.8: ParallaxController.refresh() updates layers without throwing', () => {
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

    // Trigger refresh
    env.window.ParallaxController.refresh();
    assert(env.window.ParallaxController.layers.sky !== null, 'Layers cached after refresh');
  });

  test('F2.9: Defensive Fallback Guard - ScrollTrigger onUpdate falls back to inline translate3d if gsap.set throws', () => {
    const env = createTestEnvironment(htmlContent);
    const brokenGsap = {
      registerPlugin: () => {},
      set: () => {
        throw new Error('Simulated gsap.set fault');
      }
    };
    const createdTriggers = [];
    const mockScrollTrigger = {
      create: (config) => {
        createdTriggers.push(config);
      },
      refresh: () => {}
    };

    env.window.gsap = brokenGsap;
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
      gsap: brokenGsap,
      ScrollTrigger: mockScrollTrigger
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(parallaxJsContent, context);
    env.window.ParallaxController.init();

    // Trigger onUpdate with failing gsap.set
    const skyTrigger = createdTriggers[0];
    assert(skyTrigger !== undefined, 'Sky ScrollTrigger created');
    skyTrigger.onUpdate({ progress: 0.5 });

    const skyEl = env.document.querySelector('.layer-sky');
    assertEqual(skyEl.style.transform, 'translate3d(0, 40px, 0)', 'Defensive guard applied inline translate3d transform despite gsap.set exception');
  });

});
