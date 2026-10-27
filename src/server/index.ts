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
    });

    // Check session if Authorization header or cookie present
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
      if (session) {
        c.set('user', session.user as any);
        c.set('session', session.session as any);
      }
    } catch {
      // Session extraction optional for public requests
    }
  }

  await next();
});

// Better Auth endpoint handler
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
  });
  return auth.handler(c.req.raw);
});

// API Routes
app.route('/api/listings', listingRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/events', eventRoutes);
app.route('/api/cron', cronRoutes);
app.route('/api/categories', categoryRoutes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    region: 'Southwest Iowa (Union, Adams, Adair, Clarke, Montgomery, Page, Cass, Ringgold)',
  });
});

export default app;
