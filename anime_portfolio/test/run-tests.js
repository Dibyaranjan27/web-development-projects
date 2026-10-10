/**
 * Master Automated E2E Test Suite Runner
 * Anime-Inspired Cinematic Portfolio SPA
 */

const { reporter, waitForAllTests } = require('./test-framework.js');

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   ANIME CINEMATIC PORTFOLIO SPA — COMPREHENSIVE E2E SUITE   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Phase 1: Static Rubric Verification
  const rubricResult = require('./verify-rubric.js');

  // Phase 2: Detailed Behavioral & Integration Test Suites
  require('./test-spa.js');
  require('./test-parallax.js');
  require('./test-three.js');
  require('./test-transitions.js');
  require('./test-forms.js');
  require('./test-integrity.js');

  // Wait for all asynchronous test promises to resolve
  await waitForAllTests();

  // Phase 3: Final Aggregated Reporting
  const allPassed = reporter.printSummary() && rubricResult.failCount === 0;

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
