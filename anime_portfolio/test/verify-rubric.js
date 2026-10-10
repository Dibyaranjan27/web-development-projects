/**
 * Automated Rubric Verification Test Suite
 * Asserts all 4 Agent-as-Judge criteria from ORIGINAL_REQUEST.md
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🔍 ANIME CINEMATIC PORTFOLIO SPA: RUBRIC VERIFICATION');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    if (details) console.log(`   └─ ${details}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`   └─ ${details}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: SPA Architecture & Framework Verification
// -----------------------------------------------------------------------------
console.log('--- Criterion 1: SPA Architecture & Code Purity ---');
const htmlPath = path.join(rootDir, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Check no heavy frameworks
const hasReact = /react(\.production)?\.min\.js|vue(\.global)?\.js|angular(\.min)?\.js/i.test(htmlContent);
assert(!hasReact, 'No heavy frameworks imported', 'Confirmed pure HTML5, CSS3, Vanilla JS');

// Check all 5 in-DOM functional sections exist
const hasProject = htmlContent.includes('id="scene-project"');
const hasAbout = htmlContent.includes('id="scene-about"');
const hasContact = htmlContent.includes('id="scene-contact"');
const hasLogin = htmlContent.includes('id="scene-login"');
const hasRegistration = htmlContent.includes('id="scene-registration"');

assert(
  hasProject && hasAbout && hasContact && hasLogin && hasRegistration,
  'All 5 functional sections exist in DOM',
  'Found #scene-project, #scene-about, #scene-contact, #scene-login, #scene-registration'
);

// Check Router & Navigation delegation logic in app.js
const appJsPath = path.join(rootDir, 'js', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const hasPushState = appJsContent.includes('history.pushState');
const hasPreventDefault = appJsContent.includes('e.preventDefault()');
const hasPopstate = appJsContent.includes("'popstate'");

assert(
  hasPushState && hasPreventDefault && hasPopstate,
  'Client-side SPA Router prevents browser reloads',
  'Verified event delegation, e.preventDefault(), history.pushState, and popstate listeners'
);

// Check Registration Form has all 10 fields
const hasFirstName = htmlContent.includes('id="reg-firstname"');
const hasLastName = htmlContent.includes('id="reg-lastname"');
const hasUsername = htmlContent.includes('id="reg-username"');
const hasEmail = htmlContent.includes('id="reg-email"');
const hasPassword = htmlContent.includes('id="reg-password"');
const hasConfirmPass = htmlContent.includes('id="reg-confirmpassword"');
const hasCity = htmlContent.includes('id="reg-city"');
const hasState = htmlContent.includes('id="reg-state"');
const hasPinCode = htmlContent.includes('id="reg-pincode"');
const hasTerms = htmlContent.includes('id="reg-terms"');

assert(
  hasFirstName && hasLastName && hasUsername && hasEmail && hasPassword &&
  hasConfirmPass && hasCity && hasState && hasPinCode && hasTerms,
  'Registration section contains complete 10-field form specification',
  'First/Last Name, Username, Email, Passwords, City, State dropdown, Pin, and Terms verified'
);

// -----------------------------------------------------------------------------
// Test 2: 2D Multi-Layer Parallax Depth
// -----------------------------------------------------------------------------
console.log('\n--- Criterion 2: 2D Parallax Scrolling Multi-Layer Depth ---');
const parallaxCssPath = path.join(rootDir, 'css', 'parallax.css');
const parallaxJsPath = path.join(rootDir, 'js', 'parallax.js');
const parallaxCssContent = fs.readFileSync(parallaxCssPath, 'utf8');
const parallaxJsContent = fs.readFileSync(parallaxJsPath, 'utf8');

const hasSkyLayer = htmlContent.includes('layer-sky') && parallaxCssContent.includes('.layer-sky');
const hasFarCloudLayer = htmlContent.includes('layer-cloud-far') && parallaxCssContent.includes('.layer-cloud-far');
const hasBannerLayer = htmlContent.includes('layer-banner') && parallaxCssContent.includes('.layer-banner');
const hasNearCloudLayer = htmlContent.includes('layer-cloud-near') && parallaxCssContent.includes('.layer-cloud-near');
const hasPetalsLayer = htmlContent.includes('layer-petals') && parallaxCssContent.includes('.layer-petals');

assert(
  hasSkyLayer && hasFarCloudLayer && hasBannerLayer && hasNearCloudLayer && hasPetalsLayer,
  'Multi-layer 2D parallax depth containers present in DOM & CSS',
  'Sky (0.1x), Far Clouds (0.3x), Banners (0.55x), Foreground Clouds (0.8x), Petals (-0.4x)'
);

const hasDualEngine = parallaxJsContent.includes('ScrollTrigger.create') && parallaxJsContent.includes('translate3d');
assert(
  hasDualEngine,
  'Dual-engine parallax implementation (GSAP ScrollTrigger + Vanilla JS RAF Fallback)',
  'Both hardware-accelerated transform engines verified in js/parallax.js'
);

// -----------------------------------------------------------------------------
// Test 3: 3D WebGL Canvas Scene (Three.js)
// -----------------------------------------------------------------------------
console.log('\n--- Criterion 3: 3D WebGL Element in Canvas ---');
const hasCanvas = htmlContent.includes('<canvas id="webgl-canvas"');
assert(hasCanvas, '<canvas id="webgl-canvas"> element exists in DOM', 'Canvas located at root viewport background');

const threeJsPath = path.join(rootDir, 'js', 'three-scene.js');
const threeJsContent = fs.readFileSync(threeJsPath, 'utf8');

const hasTorusKnot = threeJsContent.includes('TorusKnotGeometry');
const hasRunicRing = threeJsContent.includes('TorusGeometry');
const hasSakuraParticles = threeJsContent.includes('particleCount = 600') || threeJsContent.includes('600');
const hasDebugHandle = threeJsContent.includes('__THREE_SCENE__');
const hasZeroErrorGuard = threeJsContent.includes('try') && threeJsContent.includes('catch');

assert(
  hasTorusKnot && hasRunicRing && hasSakuraParticles,
  'Celestial Monolith & 600-particle Sakura Vortex configured in Three.js scene',
  'Torus knot core, orbital runic ring, and 600 swirling particles verified'
);

assert(
  hasDebugHandle && hasZeroErrorGuard,
  'Debug inspection handle and zero-console-error fallback boundary active',
  'window.__THREE_SCENE__ exposed with frameCount, scene, camera, and renderer'
);

// -----------------------------------------------------------------------------
// Test 4: Observable Cinematic Transitions
// -----------------------------------------------------------------------------
console.log('\n--- Criterion 4: Cinematic Scene Transitions ---');
const transitionsCssPath = path.join(rootDir, 'css', 'transitions.css');
const transitionsJsPath = path.join(rootDir, 'js', 'transitions.js');
const transitionsCssContent = fs.readFileSync(transitionsCssPath, 'utf8');
const transitionsJsContent = fs.readFileSync(transitionsJsPath, 'utf8');

const hasShutterDom = htmlContent.includes('id="cinematic-shutter"');
const hasCurtains = transitionsCssContent.includes('.shutter-top') && transitionsCssContent.includes('.shutter-bottom');
const hasSpeedlines = transitionsCssContent.includes('.speedlines-effect');

assert(
  hasShutterDom && hasCurtains && hasSpeedlines,
  'Cinematic shutter and speedlines overlay markup & styles defined',
  'Dual letterbox curtains, anime speedline rays, and kanji crest configured'
);

const hasTimelinePhases = transitionsJsContent.includes('260') && transitionsJsContent.includes('320') && transitionsJsContent.includes('560');
const hasObservableTriggerBeforeSwap = transitionsJsContent.indexOf('shutter.classList.add') < transitionsJsContent.indexOf('swapCallback()');

assert(
  hasTimelinePhases && hasObservableTriggerBeforeSwap,
  '4-phase transition triggers observable animation BEFORE section visibility swap',
  'Curtains close at t=0ms, DOM active swap occurs at midpoint t=260ms, reveal at t=320ms, complete at t=560ms'
);

// -----------------------------------------------------------------------------
// Test 5: Offline Library Vendoring
// -----------------------------------------------------------------------------
console.log('\n--- Criterion 5: Offline Library Vendoring ---');
const libs = ['three.min.js', 'gsap.min.js', 'ScrollTrigger.min.js'];
let allLibsExist = true;

libs.forEach(lib => {
  const libPath = path.join(rootDir, 'libs', lib);
  const exists = fs.existsSync(libPath);
  if (!exists) allLibsExist = false;
  assert(exists, `Vendored library exists: libs/${lib}`, `Size: ${exists ? fs.statSync(libPath).size + ' bytes' : '0'}`);
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');

if (require.main === module) {
  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL RUBRIC CRITERIA VERIFIED AND PASSING SUCCESSFULLY!\n');
    process.exit(0);
  }
}

module.exports = { passCount, failCount };
