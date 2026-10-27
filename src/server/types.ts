import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  FACEBOOK_CLIENT_ID?: string;
  FACEBOOK_CLIENT_SECRET?: string;
};

export type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof schema.users.$inferSelect | null;
  session?: typeof schema.sessions.$inferSelect | null;
};

export type AppContext = {
  Bindings: Bindings;
  Variables: Variables;
};
