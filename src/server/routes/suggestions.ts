import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';

const createSuggestionSchema = z.object({
  type: z.enum(['new_listing', 'edit_suggestion']),
  listingId: z.string().optional(),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email().optional(),
  title: z.string().min(3).max(120),
  town: z.string().optional(),
  categoryType: z.enum(['rental', 'service', 'event']).optional(),
  details: z.string().min(5).max(3000),
});

export const suggestionRoutes = new Hono<AppContext>();

// POST /api/suggestions - Public submission of a new suggestion or edit
suggestionRoutes.post('/', zValidator('json', createSuggestionSchema), async (c) => {
  const db = c.get('db');
  const body = c.req.valid('json');

  const id = crypto.randomUUID();

  await db.insert(schema.suggestions).values({
    id,
    type: body.type,
    listingId: body.listingId || null,
    submitterName: body.submitterName || null,
    submitterEmail: body.submitterEmail || null,
    title: body.title,
    town: body.town || null,
    categoryType: body.categoryType || null,
    details: body.details,
    status: 'pending',
  });

  return c.json({
    success: true,
    message: body.type === 'new_listing'
      ? 'Thank you! Your business/service suggestion has been submitted for community verification.'
      : 'Thank you! Your edit suggestion has been submitted to the listing administrator.',
    suggestionId: id,
  }, 201);
});

// GET /api/suggestions - Admin review list
suggestionRoutes.get('/', async (c) => {
  const db = c.get('db');
  const user = c.get('user');

  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403);
  }

  const items = await db
    .select()
    .from(schema.suggestions)
    .orderBy(desc(schema.suggestions.createdAt))
    .limit(50);

  return c.json({ suggestions: items });
});

// PATCH /api/suggestions/:id - Admin approve or dismiss
suggestionRoutes.patch('/:id', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const status = body.status as 'approved' | 'rejected';

  if (!['approved', 'rejected'].includes(status)) {
    return c.json({ error: 'Invalid status. Must be approved or rejected.' }, 400);
  }

  await db
    .update(schema.suggestions)
    .set({ status })
    .where(eq(schema.suggestions.id, id));

  return c.json({ success: true, status });
});
