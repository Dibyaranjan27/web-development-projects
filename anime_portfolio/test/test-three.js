/**
 * Test Suite: 3D WebGL Canvas Scene & Three.js (Agent-as-Judge Criterion 3)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite, test, assert, assertEqual, createTestEnvironment } = require('./test-framework.js');

const rootDir = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const threeJsSource = fs.readFileSync(path.join(rootDir, 'js', 'three-scene.js'), 'utf8');

suite('Criterion 3: 3D WebGL Element in Canvas & Three.js', () => {

  test('F3.1: DOM Canvas Element - <canvas id="webgl-canvas"> present in DOM', () => {
    assert(htmlContent.includes('<canvas id="webgl-canvas">'), '<canvas id="webgl-canvas"> defined in HTML');
    assert(htmlContent.includes('id="webgl-container"'), 'Parent container #webgl-container exists for canvas');
  });

  test('F3.2: 3D Geometries Specification - Torus Knot Core, Orbital Ring, and 600 Particles', () => {
    // Monolith Core: TorusKnotGeometry(1.15, 0.32, 128, 32)
    assert(threeJsSource.includes('TorusKnotGeometry(1.15, 0.32, 128, 32)'), 'TorusKnotGeometry parameters verified');
    assert(threeJsSource.includes('MeshStandardMaterial'), 'MeshStandardMaterial used for metallic monolith');

    // Orbital Ring: TorusGeometry(2.35, 0.035, 16, 96)
    assert(threeJsSource.includes('TorusGeometry(2.35, 0.035, 16, 96)'), 'TorusGeometry parameters verified for runic ring');

    // Swirling Sakura Vortex: 600 particles
    assert(threeJsSource.includes('particleCount = 600'), 'particleCount exactly 600 configured');
    assert(threeJsSource.includes('vertexColors: true'), 'PointsMaterial configured with vertexColors');
  });

  test('F3.3: Lighting Rig Specification - 3-Point anime lighting setup', () => {
    assert(threeJsSource.includes('AmbientLight'), 'AmbientLight configured for soft moonshine');
    assert(threeJsSource.includes('DirectionalLight'), 'DirectionalLight configured for cyan rim light');
    assert(threeJsSource.includes('PointLight'), 'PointLight configured for magenta accent light');
  });

  test('F3.4: Zero Console Error Contract - Initialization produces zero console errors', () => {
    const env = createTestEnvironment(htmlContent);
    const consoleErrors = [];
    const consoleWarns = [];

    const mockConsole = {
      log: () => {},
      error: (...args) => consoleErrors.push(args.join(' ')),
      warn: (...args) => consoleWarns.push(args.join(' '))
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

    // Run three-scene script with fallback (no global.THREE present in standard VM)
    vm.runInContext(threeJsSource, context);
    env.window.ThreeSceneController.init('webgl-canvas');

    assertEqual(consoleErrors.length, 0, 'Zero console.error calls during initialization');
    assertEqual(consoleWarns.length, 0, 'Zero console.warn calls during initialization');
  });

  test('F3.5: Fallback 2D Graceful Boundary - Exposes window.__THREE_SCENE__ and drives animation loop', () => {
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

    vm.runInContext(threeJsSource, context);
    env.window.ThreeSceneController.init('webgl-canvas');

    assert(env.window.__THREE_SCENE__, 'window.__THREE_SCENE__ debug handle is exposed');
    assertEqual(env.window.__THREE_SCENE__.isRendering, true, 'isRendering is true');

    const initialFrames = env.window.__THREE_SCENE__.frameCount;
    env.clock.advanceBy(100);
    const laterFrames = env.window.__THREE_SCENE__.frameCount;

    assert(laterFrames > initialFrames, `Animation loop advanced frames from ${initialFrames} to ${laterFrames}`);
  });

  test('F3.6: Mock Three.js WebGL Execution & Debug Handle API Verification', () => {
    const env = createTestEnvironment(htmlContent);

    // Construct mock THREE WebGL environment
    let renderedScenes = 0;
    const mockScene = { add: () => {} };
    const mockCamera = { position: { z: 0 }, aspect: 1, updateProjectionMatrix: () => {} };
    const mockMesh = { rotation: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0 } };

    const mockThree = {
      Scene: function() { return mockScene; },
      PerspectiveCamera: function(fov, aspect, near, far) {
        mockCamera.fov = fov; mockCamera.aspect = aspect;
        return mockCamera;
      },
      WebGLRenderer: function(opts) {
        return {
          setPixelRatio: () => {},
          setSize: () => {},
          render: () => { renderedScenes++; }
        };
      },
      AmbientLight: function() { return {}; },
      DirectionalLight: function() { return { position: { set: () => {} } }; },
      PointLight: function() { return { position: { set: () => {} } }; },
      TorusKnotGeometry: function() { return {}; },
      MeshStandardMaterial: function() { return {}; },
      TorusGeometry: function() { return {}; },
      MeshBasicMaterial: function() { return {}; },
      Mesh: function() { return mockMesh; },
      BufferGeometry: function() {
        return { setAttribute: () => {} };
      },
      BufferAttribute: function() { return {}; },
      PointsMaterial: function() { return {}; },
      Points: function() { return { rotation: { x: 0, y: 0 } }; }
    };

    env.window.THREE = mockThree;

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
      THREE: mockThree
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(threeJsSource, context);
    env.window.ThreeSceneController.init('webgl-canvas');

    assert(env.window.__THREE_SCENE__, 'window.__THREE_SCENE__ exposed for WebGL mode');
    assertEqual(env.window.__THREE_SCENE__.isRendering, true, 'isRendering is true');
    assertEqual(env.window.__THREE_SCENE__.scene, mockScene, '__THREE_SCENE__.scene points to Three.js scene');
    assertEqual(env.window.__THREE_SCENE__.camera, mockCamera, '__THREE_SCENE__.camera points to Three.js camera');

    // Advance clock to trigger renders
    env.clock.advanceBy(60);
    assert(renderedScenes > 0, `WebGL renderer called render() ${renderedScenes} times`);
  });

  test('F3.7: Interactive Mouse Parallax Lerp inside Three.js Scene', () => {
    const env = createTestEnvironment(htmlContent);

    const mockThree = {
      Scene: function() { return { add: () => {} }; },
      PerspectiveCamera: function() { return { position: { z: 0 } }; },
      WebGLRenderer: function() {
        return { setPixelRatio: () => {}, setSize: () => {}, render: () => {} };
      },
      AmbientLight: function() { return {}; },
      DirectionalLight: function() { return { position: { set: () => {} } }; },
      PointLight: function() { return { position: { set: () => {} } }; },
      TorusKnotGeometry: function() { return {}; },
      MeshStandardMaterial: function() { return {}; },
      TorusGeometry: function() { return {}; },
      MeshBasicMaterial: function() { return {}; },
      Mesh: function() { return { rotation: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0 } }; },
      BufferGeometry: function() { return { setAttribute: () => {} }; },
      BufferAttribute: function() { return {}; },
      PointsMaterial: function() { return {}; },
      Points: function() { return { rotation: { x: 0, y: 0 } }; }
    };

    env.window.THREE = mockThree;

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
      THREE: mockThree
    };
    context.global = context;
    vm.createContext(context);

    vm.runInContext(threeJsSource, context);
    env.window.ThreeSceneController.init('webgl-canvas');

    // Trigger window mousemove
    env.window.dispatchEvent({
      type: 'mousemove',
      clientX: 1200,
      clientY: 800
    });

    assert(env.window.ThreeSceneController.targetMouseX !== 0, 'targetMouseX updated on mousemove');
  });

  test('F3.8: Resize Observer updates projection and renderer', () => {
    const env = createTestEnvironment(htmlContent);
    let projectionUpdated = false;

    const mockCamera = {
      aspect: 1,
      updateProjectionMatrix: () => { projectionUpdated = true; }
    };
    let newWidth = 0, newHeight = 0;
    const mockRenderer = {
      setSize: (w, h) => { newWidth = w; newHeight = h; }
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

    vm.runInContext(threeJsSource, context);
    env.window.ThreeSceneController.camera = mockCamera;
    env.window.ThreeSceneController.renderer = mockRenderer;

    env.window.innerWidth = 1440;
    env.window.innerHeight = 900;
    env.window.ThreeSceneController.onResize();

    assert(projectionUpdated, 'Camera projection matrix updated on resize');
    assertEqual(newWidth, 1440, 'Renderer width updated to 1440');
    assertEqual(newHeight, 900, 'Renderer height updated to 900');
  });

});
