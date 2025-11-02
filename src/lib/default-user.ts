"use server";

import { prisma } from '@/lib/prisma';

/**
 * Get the default banker for the app
 * Since there's no auth yet, we always use the first banker from the database
 * This makes it easy to add auth later without changing the DB structure
 */
export async function getDefaultBanker() {
  const banker = await prisma.banker.findFirst({
    orderBy: { createdAt: 'asc' }
  });

  if (!banker) {
    throw new Error('No banker found in database. Please run the seed script.');
  }

  return banker;
}

