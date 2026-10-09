import { runSecurityTests } from '../lib/testing/security-tests.js';

async function main() {
  console.log('🔒 Starting Security Regression Test Suite...\n');
  const results = await runSecurityTests();
  console.log(JSON.stringify(results, null, 2));
  console.log('\n✅ Security Regression Test Execution Complete.');
}

main().catch(console.error);
