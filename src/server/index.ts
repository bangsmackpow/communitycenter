import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import type { AppContext } from './types';
import { createAuth } from './auth';
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

// Setup Drizzle ORM and Better Auth in request context
app.use('*', async (c, next) => {
  if (c.env?.DB) {
    const db = drizzle(c.env.DB, { schema });
    c.set('db', db);

    // Initialize auth instance
    const auth = createAuth(db, {
      BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
      GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
      FACEBOOK_CLIENT_ID: c.env.FACEBOOK_CLIENT_ID,
      FACEBOOK_CLIENT_SECRET: c.env.FACEBOOK_CLIENT_SECRET,
    });

    // Check session if Authorization header or cookie present
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
      if (session) {
        const currentUser = session.user as any;
        // Ensure curtis@builtnetworks.com has admin and pro tier automatically
        if (currentUser.email === 'curtis@builtnetworks.com') {
          currentUser.role = 'admin';
          currentUser.tier = 'pro_annual';
        }
        c.set('user', currentUser);
        c.set('session', session.session as any);
      }
    } catch {
      // Session extraction optional for public requests
    }
  }

  await next();
});

// Better Auth endpoint handler (Google, Facebook, Email/Password)
app.on(['POST', 'GET'], '/api/auth/*', async (c) => {
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

// Quick endpoint to get current authenticated user status
app.get('/api/auth/me', (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ user: null });
  }
  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: (user as any).tier || 'free',
      image: user.image,
    },
  });
});

// API Routes
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
