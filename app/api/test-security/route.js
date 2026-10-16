import { ok, err } from '@/lib/api-utils';
import { requireSuperuser } from '@/lib/auth';
import { runSecurityTests } from '@/lib/testing/security-tests';

export async function GET() {
  // This report describes how the app's own defences behave, so it is not public.
  const superuser = await requireSuperuser();
  if (!superuser) return err('Forbidden: Superuser access required', 403);

  const results = await runSecurityTests();
  return ok({ securityTestReport: results });
}
