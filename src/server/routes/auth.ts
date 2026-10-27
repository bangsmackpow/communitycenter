import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';
import { hashPassword, verifyPassword } from '../crypto';

export const authRoutes = new Hono<AppContext>();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['user', 'landlord', 'business']).optional().default('user'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Helper to set session cookie
function setSessionCookie(c: any, token: string) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  c.header(
    'Set-Cookie',
    `sw_session=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`
  );
}

// POST /api/auth/register
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const db = c.get('db');
  const body = c.req.valid('json');
  const email = body.email.toLowerCase().trim();

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();

  if (existing) {
    return c.json({ error: 'An account with this email already exists. Please sign in.' }, 400);
  }

  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(body.password);
  const now = new Date();

  // If registering as curtis@builtnetworks.com, ensure admin role and pro tier
  const role = email === 'curtis@builtnetworks.com' ? 'admin' : body.role;
  const tier = email === 'curtis@builtnetworks.com' ? 'pro_annual' : 'free';

  await db.insert(schema.users).values({
    id: userId,
    name: body.name.trim(),
    email,
    emailVerified: false,
    role: role as any,
    tier: tier as any,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.accounts).values({
    id: crypto.randomUUID(),
    userId,
    accountId: email,
    providerId: 'credential',
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(schema.sessions).values({
    id: crypto.randomUUID(),
    userId,
    token: sessionToken,
    expiresAt,
    ipAddress: c.req.header('cf-connecting-ip') || null,
    userAgent: c.req.header('user-agent') || null,
    createdAt: now,
    updatedAt: now,
  });

  setSessionCookie(c, sessionToken);

  return c.json({
    success: true,
    user: {
      id: userId,
      name: body.name.trim(),
      email,
      role,
      tier,
    },
    token: sessionToken,
  }, 201);
});

// POST /api/auth/login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const db = c.get('db');
  const body = c.req.valid('json');
  const email = body.email.toLowerCase().trim();

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();

  if (!user) {
    return c.json({ error: 'Invalid email or password.' }, 401);
  }

  const account = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.providerId, 'credential')))
    .get();

  if (!account || !account.password) {
    return c.json({ error: 'Password authentication not configured for this account. Try social login or register.' }, 401);
  }

  const valid = await verifyPassword(body.password, account.password);
  if (!valid) {
    return c.json({ error: 'Invalid email or password.' }, 401);
  }

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  await db.insert(schema.sessions).values({
    id: crypto.randomUUID(),
    userId: user.id,
    token: sessionToken,
    expiresAt,
    ipAddress: c.req.header('cf-connecting-ip') || null,
    userAgent: c.req.header('user-agent') || null,
    createdAt: now,
    updatedAt: now,
  });

  setSessionCookie(c, sessionToken);

  return c.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      image: user.image,
    },
    token: sessionToken,
  });
});

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  const db = c.get('db');
  const cookie = c.req.header('cookie') || '';
  const match = cookie.match(/sw_session=([^;]+)/);
  const authHeader = c.req.header('authorization');
  const token = match?.[1] || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (token) {
    await db.delete(schema.sessions).where(eq(schema.sessions.token, token)).run().catch(() => {});
  }

  c.header('Set-Cookie', 'sw_session=; Path=/; HttpOnly; Max-Age=0');
  return c.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me - Read current live session
authRoutes.get('/me', async (c) => {
  const db = c.get('db');
  const cookie = c.req.header('cookie') || '';
  const match = cookie.match(/sw_session=([^;]+)/);
  const authHeader = c.req.header('authorization');
  const token = match?.[1] || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!token) {
    return c.json({ user: null });
  }

  const session = await db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.token, token), sql`${schema.sessions.expiresAt} > unixepoch()`))
    .get();

  if (!session) {
    return c.json({ user: null });
  }

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .get();

  if (!user) {
    return c.json({ user: null });
  }

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      image: user.image,
    },
  });
});
