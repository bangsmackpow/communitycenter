import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';
import { DEFAULT_CATEGORIES } from '../../db/constants';

export const categoryRoutes = new Hono<AppContext>();

categoryRoutes.get('/', async (c) => {
  const db = c.get('db');
  const type = c.req.query('type');

  let list = await db.select().from(schema.categories);

  // If table is empty, auto-seed default categories
  if (list.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.insert(schema.categories).values(cat).onConflictDoNothing();
    }
    list = await db.select().from(schema.categories);
  }

  if (type) {
    list = list.filter((cat) => cat.type === type);
  }

  return c.json({ categories: list });
});
