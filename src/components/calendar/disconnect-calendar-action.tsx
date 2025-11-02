'use server';

import { clearOAuthSession } from '@/lib/calendar/oauth-session';
import { revalidatePath } from 'next/cache';

export async function disconnectCalendar() {
  await clearOAuthSession();
  revalidatePath('/meetings');
  return { success: true };
}

