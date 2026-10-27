import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';
import { hashPassword } from '../crypto';

export const adminRoutes = new Hono<AppContext>();

// Middleware: Require Admin role
adminRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Access denied: Admin privileges required.' }, 403);
  }
  await next();
});

// GET /api/admin/users - List all users
adminRoutes.get('/users', async (c) => {
  const db = c.get('db');

  const allUsers = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      tier: schema.users.tier,
      tierExpiresAt: schema.users.tierExpiresAt,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt));

  return c.json({ users: allUsers });
});

// POST /api/admin/users/:id/reset-password - Admin resets any user password
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6),
});

adminRoutes.post('/users/:id/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const db = c.get('db');
  const userId = c.req.param('id');
  const { newPassword } = c.req.valid('json');

  const targetUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();

  if (!targetUser) {
    return c.json({ error: 'User not found.' }, 404);
  }

  const newHash = await hashPassword(newPassword);
  const now = new Date();

  // Check if credential account exists
  const existingAccount = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.providerId, 'credential')))
    .get();

  if (existingAccount) {
    await db
      .update(schema.accounts)
      .set({ password: newHash, updatedAt: now })
      .where(eq(schema.accounts.id, existingAccount.id));
  } else {
    await db.insert(schema.accounts).values({
      id: crypto.randomUUID(),
      userId,
      accountId: targetUser.email,
      providerId: 'credential',
      password: newHash,
      createdAt: now,
      updatedAt: now,
    });
  }

  return c.json({
    success: true,
    message: `Password successfully reset for ${targetUser.email}.`,
  });
});

// POST /api/admin/users/:id/grant-pro - Give Pro license to anyone wanting to test
const grantProSchema = z.object({
  tier: z.enum(['pro_monthly', 'pro_annual']).default('pro_annual'),
  durationDays: z.number().int().positive().default(365),
});

adminRoutes.post('/users/:id/grant-pro', zValidator('json', grantProSchema), async (c) => {
  const db = c.get('db');
  const userId = c.req.param('id');
  const { tier, durationDays } = c.req.valid('json');

  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await db
    .update(schema.users)
    .set({
      tier: tier as any,
      tierExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  return c.json({
    success: true,
    message: `Granted ${tier.toUpperCase()} testing license (valid for ${durationDays} days).`,
    tier,
    expiresAt,
  });
});

// PATCH /api/admin/users/:id - Update user role, email, or name
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'landlord', 'business', 'admin']).optional(),
  tier: z.enum(['free', 'pro_monthly', 'pro_annual']).optional(),
});

adminRoutes.patch('/users/:id', zValidator('json', updateUserSchema), async (c) => {
  const db = c.get('db');
  const userId = c.req.param('id');
  const updates = c.req.valid('json');

  await db
    .update(schema.users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  return c.json({ success: true, message: 'User updated successfully.' });
});
