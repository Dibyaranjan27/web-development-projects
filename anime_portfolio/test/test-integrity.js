/**
 * Test Suite: Asset Integrity, Vendored Libs, Theming, and Syntax Validation
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite, test, assert, assertEqual } = require('./test-framework.js');

const rootDir = path.resolve(__dirname, '..');
const picDir = path.resolve(rootDir, '..', 'pic');

suite('Asset Loading Resilience, Vendored Libs & System Integrity', () => {

  test('F6.1: Physical Asset Existence in ../pic/ directory', () => {
    assert(fs.existsSync(picDir), 'pic/ directory exists adjacent to anime_portfolio');

    const referencedAssets = [
      'bannerbg.png',
      'bg2.jpg',
      'bgimg1.png',
      'Take a look at my Canva design!.png',
      'login-removebg-preview.png',
      'loginbg.png',
      'cloud.png'
    ];

    referencedAssets.forEach(filename => {
      const filePath = path.join(picDir, filename);
      const exists = fs.existsSync(filePath);
      assert(exists, `Asset file exists on disk: pic/${filename}`);
      if (exists) {
        const stats = fs.statSync(filePath);
        assert(stats.size > 0, `Asset pic/${filename} is non-empty (${stats.size} bytes)`);
      }
    });
  });

  test('F6.2: Ghibli Theme Palette Variables Specification in css/main.css', () => {
    const mainCssPath = path.join(rootDir, 'css', 'main.css');
    const mainCss = fs.readFileSync(mainCssPath, 'utf8');

    const requiredVars = [
      '--color-sky',
      '--color-aqua',
      '--color-forest',
      '--color-seafoam',
      '--color-teal',
      '--color-coral',
      '--color-gold'
    ];

    requiredVars.forEach(v => {
      assert(mainCss.includes(v), `Palette CSS variable ${v} defined in css/main.css`);
    });
  });

  test('F6.3: Vendored Offline Libraries Verification', () => {
    const libsDir = path.join(rootDir, 'libs');

    const requiredLibs = [
      { name: 'three.min.js', minSize: 10000, marker: 'THREE' },
      { name: 'gsap.min.js', minSize: 5000, marker: 'gsap' },
      { name: 'ScrollTrigger.min.js', minSize: 2000, marker: 'ScrollTrigger' }
    ];

    requiredLibs.forEach(lib => {
      const libPath = path.join(libsDir, lib.name);
      assert(fs.existsSync(libPath), `Vendored library libs/${lib.name} exists`);
      const content = fs.readFileSync(libPath, 'utf8');
      assert(content.length >= lib.minSize, `Library libs/${lib.name} has substantial size (${content.length} chars)`);
      assert(content.includes(lib.marker), `Library libs/${lib.name} contains identifier '${lib.marker}'`);
    });
  });

  test('F6.4: Zero Syntax Errors - All JavaScript scripts parse cleanly', () => {
    const jsFiles = [
      path.join(rootDir, 'js', 'app.js'),
      path.join(rootDir, 'js', 'parallax.js'),
      path.join(rootDir, 'js', 'three-scene.js'),
      path.join(rootDir, 'js', 'transitions.js'),
      path.join(rootDir, 'libs', 'three.min.js'),
      path.join(rootDir, 'libs', 'gsap.min.js'),
      path.join(rootDir, 'libs', 'ScrollTrigger.min.js')
    ];

    jsFiles.forEach(file => {
      const code = fs.readFileSync(file, 'utf8');
      let parsed = false;
      try {
        new vm.Script(code, { filename: path.basename(file) });
        parsed = true;
      } catch (err) {
        assert(false, `Syntax error in ${path.basename(file)}: ${err.message}`);
      }
      assert(parsed, `File ${path.basename(file)} compiled with zero syntax errors`);
    });
  });

  test('F6.5: Legacy Content & Narrative Integration in DOM', () => {
    const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

    assert(htmlContent.includes('Chronicles'), 'Chronicles title integrated');
    assert(htmlContent.includes('Dibyaranjan'), 'Creator name Dibyaranjan integrated');
    assert(htmlContent.includes('22amtics481@gmail.com'), 'Contact email 22amtics481@gmail.com integrated');
    assert(htmlContent.includes('Request A Call Back'), 'Contact section call-back card integrated');
    assert(htmlContent.includes('Our Story'), 'About section story integrated');
  });

});
