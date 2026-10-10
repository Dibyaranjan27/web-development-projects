/**
 * Test Suite: Observable Cinematic Scene Transitions (Agent-as-Judge Criterion 4)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite, test, assert, assertEqual, createTestEnvironment } = require('./test-framework.js');

const rootDir = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const transitionsCssContent = fs.readFileSync(path.join(rootDir, 'css', 'transitions.css'), 'utf8');
const transitionsJsContent = fs.readFileSync(path.join(rootDir, 'js', 'transitions.js'), 'utf8');

suite('Criterion 4: Observable Cinematic Scene Transitions', () => {

  test('F4.1: DOM Shutter Overlay - Fullscreen cinematic shutter markup in place', () => {
    assert(htmlContent.includes('id="cinematic-shutter"'), '#cinematic-shutter exists in HTML');
    assert(htmlContent.includes('class="shutter-curtain shutter-top"'), '.shutter-top curtain exists in HTML');
    assert(htmlContent.includes('class="shutter-curtain shutter-bottom"'), '.shutter-bottom curtain exists in HTML');
    assert(htmlContent.includes('class="speedlines-effect"'), '.speedlines-effect exists in HTML');
  });

  test('F4.2: CSS Keyframes & Cinematic Letterbox Rules Defined', () => {
    assert(transitionsCssContent.includes('#cinematic-shutter'), '#cinematic-shutter rule in transitions.css');
    assert(transitionsCssContent.includes('.shutter-closed'), '.shutter-closed rule in transitions.css');
    assert(transitionsCssContent.includes('.speedlines-effect'), '.speedlines-effect rule in transitions.css');
    assert(transitionsCssContent.includes('.scene-exiting'), '.scene-exiting rule in transitions.css');
    assert(transitionsCssContent.includes('.scene-entering'), '.scene-entering rule in transitions.css');
    assert(transitionsCssContent.includes('.scene-entered'), '.scene-entered rule in transitions.css');
  });

  test('F4.3: Observable Animation Initiates at t=0ms BEFORE Destination Visibility Swap', async () => {
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

    vm.runInContext(transitionsJsContent, context);
    env.window.TransitionController.init();

    // Initial state: project is active, about is inactive
    const projectSec = env.document.getElementById('scene-project');
    const aboutSec = env.document.getElementById('scene-about');
    const shutter = env.document.getElementById('cinematic-shutter');

    projectSec.classList.add('active');
    aboutSec.classList.remove('active');

    let swapCalled = false;

    // Trigger transition from project to about
    const transitionPromise = env.window.TransitionController.playTransition('about', () => {
      swapCalled = true;
    });

    // --- Phase 1: t = 0ms ---
    assert(shutter.classList.contains('animating'), 'Shutter received .animating immediately at t=0ms');
    assert(projectSec.classList.contains('scene-exiting'), 'Outgoing scene received .scene-exiting at t=0ms');

    // Run next animation frame tick (t=16ms)
    env.clock.runRaf();
    assert(shutter.classList.contains('shutter-closed'), 'Shutter letterboxes sliding closed on RAF tick');

    // CRITICAL RUBRIC ASSERTION: At t=100ms (before swap at 260ms), destination is NOT yet visible
    env.clock.advanceBy(100);
    assert(!swapCalled, 'DOM swap callback NOT yet called at t=100ms');
    assert(!aboutSec.classList.contains('active'), 'Destination scene is NOT visible at t=100ms');
    assert(shutter.classList.contains('animating'), 'Observable animation is actively masking viewport at t=100ms');

    // --- Phase 2: t = 260ms ---
    env.clock.advanceBy(160); // 100ms + 160ms = 260ms
    assert(swapCalled, 'DOM swap callback executed at t=260ms under closed shutter');
    assert(!projectSec.classList.contains('active'), 'Outgoing scene active class removed at t=260ms');
    assert(aboutSec.classList.contains('active'), 'Incoming scene active class added at t=260ms');
    assert(aboutSec.classList.contains('scene-entering'), 'Incoming scene has .scene-entering at t=260ms');

    // --- Phase 3: t = 320ms ---
    env.clock.advanceBy(60); // 260ms + 60ms = 320ms
    assert(!shutter.classList.contains('shutter-closed'), 'Shutter begins opening at t=320ms');
    assert(aboutSec.classList.contains('scene-entered'), 'Incoming scene transitioned to .scene-entered at t=320ms');

    // --- Phase 4: t = 560ms ---
    env.clock.advanceBy(240); // 320ms + 240ms = 560ms
    assert(!shutter.classList.contains('animating'), 'Shutter .animating removed at t=560ms');
    assert(!aboutSec.classList.contains('scene-entered'), 'Incoming scene .scene-entered cleaned up at t=560ms');
    assertEqual(env.window.TransitionController.isTransitioning, false, 'isTransitioning unlocked at t=560ms');

    const result = await transitionPromise;
    assertEqual(result, true, 'Transition promise resolved to true');
  });

  test('F4.4: Re-entrancy Protection - Blocks concurrent transitions while active', async () => {
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

    vm.runInContext(transitionsJsContent, context);
    env.window.TransitionController.init();

    // Start transition 1
    const p1 = env.window.TransitionController.playTransition('about', () => {});
    assertEqual(env.window.TransitionController.isTransitioning, true, 'Controller is transitioning');

    // Attempt transition 2 concurrently
    const p2 = env.window.TransitionController.playTransition('contact', () => {});
    const p2Result = await p2;

    assertEqual(p2Result, false, 'Concurrent transition was rejected (returned false)');

    // Complete transition 1
    env.clock.advanceBy(600);
    const p1Result = await p1;
    assertEqual(p1Result, true, 'Original transition completed successfully');
    assertEqual(env.window.TransitionController.isTransitioning, false, 'Controller unlocked after completion');
  });

  test('F4.5: Scroll Reset Contract - Window scrolls to top upon section swap', () => {
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

    vm.runInContext(transitionsJsContent, context);
    env.window.TransitionController.init();

    // Set scroll position down the page
    env.window.scrollTo(0, 850);
    assertEqual(env.window.pageYOffset, 850, 'Initial scroll offset is 850px');

    env.window.TransitionController.playTransition('contact', () => {});
    env.clock.advanceBy(260); // Advance to Phase 2 swap

    assertEqual(env.window.pageYOffset, 0, 'Scroll position reset to 0 upon section swap');
  });

});
