import { ok } from '@/lib/api-utils';
import { logoutUser } from '@/lib/auth';

export async function POST() {
  await logoutUser();
  return ok({ success: true });
}
