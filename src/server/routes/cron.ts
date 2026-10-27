import { Hono } from 'hono';
import { and, lte, eq } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';

export const cronRoutes = new Hono<AppContext>();

// POST or GET /api/cron/expire-listings - Transition listings past expiresAt to 'expired'
cronRoutes.all('/expire-listings', async (c) => {
  const db = c.get('db');
  const now = new Date();

  const expiredListings = await db
    .select({ id: schema.listings.id, title: schema.listings.title })
    .from(schema.listings)
    .where(
      and(
        eq(schema.listings.status, 'active'),
        lte(schema.listings.expiresAt, now)
      )
    );

  if (expiredListings.length > 0) {
    await db
      .update(schema.listings)
      .set({
        status: 'expired',
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.listings.status, 'active'),
          lte(schema.listings.expiresAt, now)
        )
      );
  }

  return c.json({
    success: true,
    transitionedCount: expiredListings.length,
    timestamp: now.toISOString(),
  });
});
