/**
 * Test Suite: SPA Architecture & Navigation (Agent-as-Judge Criterion 1)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite, test, assert, assertEqual, createTestEnvironment } = require('./test-framework.js');

const rootDir = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const appJsContent = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
const transitionsJsContent = fs.readFileSync(path.join(rootDir, 'js', 'transitions.js'), 'utf8');

suite('Criterion 1: SPA Architecture & Navigation Without Reload', () => {

  test('F1.1: Code purity - Zero heavy frameworks imported', () => {
    const hasReact = /react(\.production)?\.min\.js/i.test(htmlContent);
    const hasVue = /vue(\.global)?\.js/i.test(htmlContent);
    const hasAngular = /angular(\.min)?\.js/i.test(htmlContent);
    const hasSvelte = /svelte/i.test(htmlContent);
    const hasJquery = /jquery(\.min)?\.js/i.test(htmlContent);

    assert(!hasReact, 'No React framework in index.html');
    assert(!hasVue, 'No Vue framework in index.html');
    assert(!hasAngular, 'No Angular framework in index.html');
    assert(!hasSvelte, 'No Svelte framework in index.html');
    assert(!hasJquery, 'No jQuery in index.html');
  });

  test('F1.2: In-DOM Semantic Views - All 5 functional sections exist in DOM', () => {
    assert(htmlContent.includes('id="scene-project"'), '#scene-project section present');
    assert(htmlContent.includes('id="scene-about"'), '#scene-about section present');
    assert(htmlContent.includes('id="scene-contact"'), '#scene-contact section present');
    assert(htmlContent.includes('id="scene-login"'), '#scene-login section present');
    assert(htmlContent.includes('id="scene-registration"'), '#scene-registration section present');
  });

  test('F1.3: Initial View Resolution - Defaults to Project scene', () => {
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

    // Run transitions and app scripts
    vm.runInContext(transitionsJsContent, context);
    vm.runInContext(appJsContent, context);

    assertEqual(env.window.SPAApp.getCurrentScene(), 'project', 'Initial current scene is project');
    const projectSection = env.document.getElementById('scene-project');
    assert(projectSection.classList.contains('active'), 'scene-project element has active class');
  });

  test('F1.4: Deep Linking - Resolves initial scene from URL hash', () => {
    const env = createTestEnvironment(htmlContent);
    env.window.location.hash = '#about';

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
    vm.runInContext(appJsContent, context);

    assertEqual(env.window.SPAApp.getCurrentScene(), 'about', 'Current scene resolves to about from hash');
    const aboutSection = env.document.getElementById('scene-about');
    assert(aboutSection.classList.contains('active'), 'scene-about element has active class');
  });

  test('F1.5: Zero Page Reload Contract - Navigation updates DOM without triggering window unload', () => {
    const env = createTestEnvironment(htmlContent);
    let unloadTriggered = false;
    let beforeUnloadTriggered = false;

    env.window.addEventListener('unload', () => { unloadTriggered = true; });
    env.window.addEventListener('beforeunload', () => { beforeUnloadTriggered = true; });

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
    vm.runInContext(appJsContent, context);

    // Navigate sequentially across all 5 scenes: project -> about -> contact -> login -> registration -> project
    const tour = ['about', 'contact', 'login', 'registration', 'project'];
    for (const targetScene of tour) {
      env.window.SPAApp.navigateTo(targetScene, true);
      // Advance transition clock by 600ms to complete 4-phase transition
      env.clock.advanceBy(600);

      assertEqual(env.window.SPAApp.getCurrentScene(), targetScene, `Scene updated to ${targetScene}`);
      const activeEl = env.document.getElementById(`scene-${targetScene}`);
      assert(activeEl && activeEl.classList.contains('active'), `DOM section #scene-${targetScene} has active class`);
      assertEqual(env.window.location.hash, `#${targetScene}`, `Hash updated to #${targetScene}`);
    }

    assert(!unloadTriggered, 'unload event was NEVER fired during navigation');
    assert(!beforeUnloadTriggered, 'beforeunload event was NEVER fired during navigation');
  });

  test('F1.6: Click Delegation & Event Interception - e.preventDefault() prevents default link reload', () => {
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
    vm.runInContext(appJsContent, context);

    // Simulate clicking an anchor tag with href="#contact"
    const mockAnchor = env.document.querySelector('a[href="#contact"]');
    assert(mockAnchor !== null, 'Anchor with href="#contact" found');

    let defaultPrevented = false;
    const clickEvent = {
      type: 'click',
      target: mockAnchor,
      preventDefault: () => { defaultPrevented = true; },
      defaultPrevented: false
    };

    env.document.dispatchEvent(clickEvent);
    env.clock.advanceBy(600);

    assert(defaultPrevented, 'Event delegation called e.preventDefault() to halt page reload');
    assertEqual(env.window.SPAApp.getCurrentScene(), 'contact', 'Scene successfully navigated to contact');
  });

  test('F1.7: History API - popstate event navigates views backwards/forwards', () => {
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
    vm.runInContext(appJsContent, context);

    // Navigate to registration
    env.window.SPAApp.navigateTo('registration', true);
    env.clock.advanceBy(600);
    assertEqual(env.window.SPAApp.getCurrentScene(), 'registration', 'Scene is registration');

    // Simulate browser Back button: URL hash changes back to #project, popstate fires
    env.window.location.hash = '#project';
    env.window.dispatchEvent({ type: 'popstate', state: { scene: 'project' } });
    env.clock.advanceBy(600);

    assertEqual(env.window.SPAApp.getCurrentScene(), 'project', 'Scene returned to project via popstate');
  });

  test('F1.8: Nav Indicator Active Class Synchronisation', () => {
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
    vm.runInContext(appJsContent, context);

    env.window.SPAApp.navigateTo('login', true);
    env.clock.advanceBy(600);

    const loginLinks = env.document.querySelectorAll('.nav-link[href="#login"]');
    loginLinks.forEach(link => {
      assert(link.classList.contains('active'), 'Active nav link for #login has .active class');
    });

    const projectLinks = env.document.querySelectorAll('.nav-link[href="#project"]');
    projectLinks.forEach(link => {
      assert(!link.classList.contains('active'), 'Inactive nav link for #project removed .active class');
    });
  });

  test('F1.9: Boundary / Adversarial - Unknown hash route falls back gracefully to project', () => {
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
    vm.runInContext(appJsContent, context);

    // Attempt to navigate to an unknown scene
    env.window.SPAApp.navigateTo('completely_invalid_scene', true);
    env.clock.advanceBy(600);

    assertEqual(env.window.SPAApp.getCurrentScene(), 'project', 'Unknown scene safely fell back to project');
  });

  test('F1.10: Boundary / Adversarial - Redundant navigation to active scene is a no-op', () => {
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
    vm.runInContext(appJsContent, context);

    // Currently on project; navigating to project should be ignored
    env.window.SPAApp.navigateTo('project', true);
    assert(!env.window.TransitionController.isTransitioning, 'TransitionController remained idle on redundant navigate');
  });

});
