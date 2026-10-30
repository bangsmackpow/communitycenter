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

// POST /api/admin/users - Admin provisions a new user
const createAdminUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'landlord', 'business', 'admin']).default('user'),
  tier: z.enum(['free', 'pro_monthly', 'pro_annual']).default('free'),
});

adminRoutes.post('/users', zValidator('json', createAdminUserSchema), async (c) => {
  const db = c.get('db');
  const { name, email, password, role, tier } = c.req.valid('json');
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalizedEmail))
    .get();

  if (existing) {
    return c.json({ error: 'A user with this email address already exists.' }, 400);
  }

  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);
  const now = new Date();
  const tierExpiresAt =
    tier === 'free'
      ? null
      : new Date(Date.now() + (tier === 'pro_monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);

  await db.insert(schema.users).values({
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    emailVerified: true,
    role: role as any,
    tier: tier as any,
    tierExpiresAt,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.accounts).values({
    id: crypto.randomUUID(),
    userId,
    accountId: normalizedEmail,
    providerId: 'credential',
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  return c.json(
    {
      success: true,
      message: `User ${normalizedEmail} successfully created.`,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role,
        tier,
        tierExpiresAt,
      },
    },
    201
  );
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

// POST /api/admin/users/:id/grant-pro - Grant Pro license or set tier for any user
const grantProSchema = z.object({
  tier: z.enum(['free', 'pro_monthly', 'pro_annual']).default('pro_annual'),
  durationDays: z.number().int().nonnegative().default(365),
});

adminRoutes.post('/users/:id/grant-pro', zValidator('json', grantProSchema), async (c) => {
  const db = c.get('db');
  const userId = c.req.param('id');
  const { tier, durationDays } = c.req.valid('json');

  const targetUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();

  if (!targetUser) {
    return c.json({ error: 'User not found.' }, 404);
  }

  const expiresAt = tier === 'free' ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await db
    .update(schema.users)
    .set({
      tier: tier as any,
      tierExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  const message = tier === 'free'
    ? `Pro license revoked. ${targetUser.email} set to Free Tier.`
    : `Granted ${tier.toUpperCase()} license to ${targetUser.email} (valid for ${durationDays} days).`;

  return c.json({
    success: true,
    message,
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

// GET /api/admin/reports - View all safety flags and reported listings
adminRoutes.get('/reports', async (c) => {
  const db = c.get('db');

  const reports = await db
    .select({
      id: schema.reportsAndFlags.id,
      listingId: schema.reportsAndFlags.listingId,
      reason: schema.reportsAndFlags.reason,
      notes: schema.reportsAndFlags.notes,
      status: schema.reportsAndFlags.status,
      createdAt: schema.reportsAndFlags.createdAt,
      listingTitle: schema.listings.title,
      listingTown: schema.listings.town,
      listingCategory: schema.listings.categoryType,
      listingStatus: schema.listings.status,
    })
    .from(schema.reportsAndFlags)
    .leftJoin(schema.listings, eq(schema.reportsAndFlags.listingId, schema.listings.id))
    .orderBy(desc(schema.reportsAndFlags.createdAt));

  return c.json({ reports });
});

// PATCH /api/admin/reports/:id - Resolve or dismiss flag
const updateReportSchema = z.object({
  status: z.enum(['open', 'resolved', 'dismissed']),
});

adminRoutes.patch('/reports/:id', zValidator('json', updateReportSchema), async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  const { status } = c.req.valid('json');

  await db
    .update(schema.reportsAndFlags)
    .set({ status })
    .where(eq(schema.reportsAndFlags.id, id));

  return c.json({ success: true, message: `Report marked as ${status}.` });
});

// DELETE /api/admin/listings/:id - Admin take down spam / scam listing
adminRoutes.delete('/listings/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  // Delete media first
  await db.delete(schema.listingMedia).where(eq(schema.listingMedia.listingId, id));
  // Delete reports
  await db.delete(schema.reportsAndFlags).where(eq(schema.reportsAndFlags.listingId, id));
  // Delete listing
  await db.delete(schema.listings).where(eq(schema.listings.id, id));

  return c.json({ success: true, message: 'Listing permanently removed from directory.' });
});
