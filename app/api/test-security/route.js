import { ok } from '@/lib/api-utils';
import { runSecurityTests } from '@/lib/testing/security-tests';

export async function GET() {
  const results = await runSecurityTests();
  return ok({ securityTestReport: results });
}
