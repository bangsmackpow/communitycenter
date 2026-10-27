import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- Auth Tables (Better Auth specification for SQLite) ---

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role', { enum: ['user', 'landlord', 'business', 'admin'] }).notNull().default('user'),
  tier: text('tier', { enum: ['free', 'pro_monthly', 'pro_annual'] }).notNull().default('free'),
  tierExpiresAt: integer('tier_expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// --- Directory & Listing Tables ---

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['rental', 'service', 'event'] }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
});

export const listings = sqliteTable('listings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryType: text('category_type', { enum: ['rental', 'service', 'event'] }).notNull(),
  categoryId: text('category_id').references(() => categories.id),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents'), // Optional: rent per month, service rate, or ticket price in cents
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  status: text('status', { enum: ['active', 'pending', 'rented', 'expired', 'hidden'] }).notNull().default('active'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),

  // Location fields
  town: text('town').notNull(), // Creston, Corning, Afton, Greenfield, Osceola, Red Oak, etc.
  address: text('address'), // Optional for home-based contractors
  serviceRadiusMiles: integer('service_radius_miles'), // For mobile contractors
  zip: text('zip'),

  // Rental-specific fields
  bedrooms: integer('bedrooms'),
  bathrooms: real('bathrooms'),
  depositCents: integer('deposit_cents'),
  petsAllowed: integer('pets_allowed', { mode: 'boolean' }).default(false),
  utilitiesIncluded: text('utilities_included', { mode: 'json' }).$type<string[]>(), // ['electric', 'water', 'trash', 'gas', 'internet']
  laundryType: text('laundry_type', { enum: ['in_unit', 'hookups', 'shared', 'none'] }),
  parkingType: text('parking_type', { enum: ['garage', 'off_street', 'street'] }),

  // Service-specific fields
  emergencyAvailable: integer('emergency_available', { mode: 'boolean' }).default(false),
  insured: integer('insured', { mode: 'boolean' }).default(false),
  freeEstimates: integer('free_estimates', { mode: 'boolean' }).default(false),
  serviceOfferings: text('service_offerings', { mode: 'json' }).$type<string[]>(), // ['Snow Removal', 'Lawn Care', 'Gutter Cleaning']

  // Event-specific fields
  eventDate: text('event_date'), // ISO 8601 string or date
  eventEndDate: text('event_end_date'),
  locationVenue: text('location_venue'),
  ticketUrl: text('ticket_url'),
  isFree: integer('is_free', { mode: 'boolean' }).default(true),

  // Timestamps & Lifecycle
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const listingMedia = sqliteTable('listing_media', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const reportsAndFlags = sqliteTable('reports_and_flags', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  reason: text('reason', { enum: ['scam', 'outdated', 'duplicate', 'inappropriate'] }).notNull(),
  notes: text('notes'),
  status: text('status', { enum: ['open', 'resolved', 'dismissed'] }).notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const suggestions = sqliteTable('suggestions', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['new_listing', 'edit_suggestion'] }).notNull(),
  listingId: text('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  submitterName: text('submitter_name'),
  submitterEmail: text('submitter_email'),
  title: text('title').notNull(),
  town: text('town'),
  categoryType: text('category_type', { enum: ['rental', 'service', 'event'] }),
  details: text('details').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;
export type ListingMedia = typeof listingMedia.$inferSelect;
export type InsertListingMedia = typeof listingMedia.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type ReportAndFlag = typeof reportsAndFlags.$inferSelect;
export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = typeof suggestions.$inferInsert;
