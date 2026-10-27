import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import type { AppContext } from './types';
import { createAuth } from './auth';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { billingRoutes } from './routes/billing';
import { listingRoutes } from './routes/listings';
import { mediaRoutes } from './routes/media';
import { eventRoutes } from './routes/events';
import { cronRoutes } from './routes/cron';
import { categoryRoutes } from './routes/categories';
import { suggestionRoutes } from './routes/suggestions';

const app = new Hono<AppContext>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Setup Drizzle ORM and Authenticated Session in request context
app.use('*', async (c, next) => {
  if (c.env?.DB) {
    const db = drizzle(c.env.DB, { schema });
    c.set('db', db);

    // 1. Check session via cookie sw_session or Authorization header
    const cookie = c.req.header('cookie') || '';
    const match = cookie.match(/sw_session=([^;]+)/);
    const authHeader = c.req.header('authorization');
    const token = match?.[1] || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (token) {
      try {
        const session = await db
          .select()
          .from(schema.sessions)
          .where(and(eq(schema.sessions.token, token), sql`${schema.sessions.expiresAt} > unixepoch()`))
          .get();

        if (session) {
          const user = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, session.userId))
            .get();

          if (user) {
            // Curtis always has admin role and pro_annual tier
            if (user.email === 'curtis@builtnetworks.com') {
              user.role = 'admin';
              user.tier = 'pro_annual';
            }
            c.set('user', user);
            c.set('session', session);
          }
        }
      } catch (err) {
        // Fallback to Better Auth session if any
      }
    }

    // 2. Also support Better Auth session token if present
    if (!c.get('user')) {
      try {
        const auth = createAuth(db, {
          BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
          BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
          GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
          FACEBOOK_CLIENT_ID: c.env.FACEBOOK_CLIENT_ID,
          FACEBOOK_CLIENT_SECRET: c.env.FACEBOOK_CLIENT_SECRET,
        });

        const betterSession = await auth.api.getSession({
          headers: c.req.raw.headers,
        });
        if (betterSession) {
          const currentUser = betterSession.user as any;
          if (currentUser.email === 'curtis@builtnetworks.com') {
            currentUser.role = 'admin';
            currentUser.tier = 'pro_annual';
          }
          c.set('user', currentUser);
          c.set('session', betterSession.session as any);
        }
      } catch {}
    }
  }

  await next();
});

// Better Auth endpoint handler (Google, Facebook, OAuth handlers)
app.on(['POST', 'GET'], '/api/auth/social/*', async (c) => {
  const db = c.get('db');
  if (!db) {
    return c.json({ error: 'Database binding unavailable' }, 503);
  }
  const auth = createAuth(db, {
    BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID: c.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: c.env.FACEBOOK_CLIENT_SECRET,
  });
  return auth.handler(c.req.raw);
});

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/billing', billingRoutes);
app.route('/api/listings', listingRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/events', eventRoutes);
app.route('/api/cron', cronRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/suggestions', suggestionRoutes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    region: 'Southwest Iowa (Union, Adams, Adair, Clarke, Montgomery, Page, Cass, Ringgold)',
  });
});

export default app;
