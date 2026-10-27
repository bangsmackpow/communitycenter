import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, sql, gte, lte, like } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';
import { SW_IOWA_TOWNS } from '../../db/constants';

const createListingSchema = z.object({
  categoryType: z.enum(['rental', 'service', 'event']),
  categoryId: z.string().optional(),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  priceCents: z.number().int().nonnegative().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  isFeatured: z.boolean().optional().default(false),

  // Location
  town: z.string().refine((val) => (SW_IOWA_TOWNS as readonly string[]).includes(val), {
    message: 'Must be a valid Southwest Iowa town',
  }),
  address: z.string().optional(),
  serviceRadiusMiles: z.number().int().positive().optional(),
  zip: z.string().optional(),

  // Rental specific
  bedrooms: z.number().int().min(0).max(10).optional(),
  bathrooms: z.number().min(0).max(10).optional(),
  depositCents: z.number().int().nonnegative().optional(),
  petsAllowed: z.boolean().optional(),
  utilitiesIncluded: z.array(z.string()).optional(),
  laundryType: z.enum(['in_unit', 'hookups', 'shared', 'none']).optional(),
  parkingType: z.enum(['garage', 'off_street', 'street']).optional(),

  // Service specific
  emergencyAvailable: z.boolean().optional(),
  insured: z.boolean().optional(),
  freeEstimates: z.boolean().optional(),
  serviceOfferings: z.array(z.string()).optional(),

  // Event specific
  eventDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  locationVenue: z.string().optional(),
  ticketUrl: z.string().url().optional(),
  isFree: z.boolean().optional(),

  // Photos/Media uploaded beforehand or passed as keys
  media: z.array(z.object({
    r2Key: z.string(),
    url: z.string(),
    altText: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })).optional(),
});

const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(['active', 'pending', 'rented', 'expired', 'hidden']).optional(),
});

export const listingRoutes = new Hono<AppContext>();

// GET /api/listings - Search & filter with pagination
listingRoutes.get('/', async (c) => {
  const db = c.get('db');
  const query = c.req.query();

  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const filters = [];

  // Status defaults to active unless viewing own or explicitly specified
  if (query.status) {
    filters.push(eq(schema.listings.status, query.status as any));
  } else {
    filters.push(eq(schema.listings.status, 'active'));
  }

  // Category type filter (rental, service, event)
  if (query.categoryType) {
    filters.push(eq(schema.listings.categoryType, query.categoryType as any));
  }

  // Specific category id
  if (query.categoryId) {
    filters.push(eq(schema.listings.categoryId, query.categoryId));
  }

  // Town filter
  if (query.town) {
    filters.push(eq(schema.listings.town, query.town));
  }

  // Price range filters
  if (query.minPrice) {
    const minCents = parseInt(query.minPrice, 10);
    if (!isNaN(minCents)) filters.push(gte(schema.listings.priceCents, minCents));
  }
  if (query.maxPrice) {
    const maxCents = parseInt(query.maxPrice, 10);
    if (!isNaN(maxCents)) filters.push(lte(schema.listings.priceCents, maxCents));
  }

  // Rental specific filters
  if (query.bedrooms) {
    const beds = parseInt(query.bedrooms, 10);
    if (!isNaN(beds)) filters.push(gte(schema.listings.bedrooms, beds));
  }
  if (query.petsAllowed === 'true') {
    filters.push(eq(schema.listings.petsAllowed, true));
  }

  // Service specific filters
  if (query.emergencyAvailable === 'true') {
    filters.push(eq(schema.listings.emergencyAvailable, true));
  }

  // Search keyword (title or description)
  if (query.q) {
    const searchTerm = `%${query.q}%`;
    filters.push(
      sql`(${schema.listings.title} LIKE ${searchTerm} OR ${schema.listings.description} LIKE ${searchTerm})`
    );
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(schema.listings)
      .where(whereClause)
      .orderBy(desc(schema.listings.isFeatured), desc(schema.listings.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.listings)
      .where(whereClause),
  ]);

  const total = totalResult[0]?.count || 0;

  // Fetch primary media for each listing
  const listingIds = items.map((i) => i.id);
  const mediaMap: Record<string, schema.ListingMedia[]> = {};

  if (listingIds.length > 0) {
    const allMedia = await db
      .select()
      .from(schema.listingMedia)
      .where(sql`${schema.listingMedia.listingId} IN ${listingIds}`);

    for (const m of allMedia) {
      if (!mediaMap[m.listingId]) mediaMap[m.listingId] = [];
      mediaMap[m.listingId].push(m);
    }
  }

  const enrichedItems = items.map((item) => ({
    ...item,
    media: mediaMap[item.id] || [],
  }));

  return c.json({
    items: enrichedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /api/listings/:id - Detailed listing + media + landlord/contractor info
listingRoutes.get('/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const listing = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, id))
    .get();

  if (!listing) {
    return c.json({ error: 'Listing not found' }, 404);
  }

  const [mediaList, user] = await Promise.all([
    db
      .select()
      .from(schema.listingMedia)
      .where(eq(schema.listingMedia.listingId, id))
      .orderBy(schema.listingMedia.sortOrder),
    db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        role: schema.users.role,
        image: schema.users.image,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, listing.userId))
      .get(),
  ]);

  return c.json({
    listing,
    media: mediaList,
    author: user || null,
  });
});

// POST /api/listings - Authenticated listing creation with 30-day default expiration
listingRoutes.post('/', zValidator('json', createListingSchema), async (c) => {
  const db = c.get('db');
  const user = c.get('user');

  // Strict security: require logged-in session
  if (!user) {
    return c.json({
      error: 'Authentication required. Please sign in or register to post a listing.',
      code: 'AUTH_REQUIRED',
    }, 401);
  }

  const userId = user.id;

  // Tier limit enforcement: Free tier gets 1 active listing; Pro or Admin gets unlimited
  const isProOrAdmin = user.role === 'admin' || user.tier === 'pro_monthly' || user.tier === 'pro_annual';
  if (!isProOrAdmin) {
    const existingActive = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.listings)
      .where(and(eq(schema.listings.userId, userId), eq(schema.listings.status, 'active')))
      .get();

    if (existingActive && existingActive.count >= 1) {
      return c.json({
        error: 'Free Community tier is limited to 1 active listing. Upgrade to Pro ($10/mo or $100/yr) for unlimited rentals, contractor postings, and featured placement.',
        code: 'TIER_LIMIT_REACHED',
        activeCount: existingActive.count,
        limit: 1,
      }, 402);
    }
  }

  const body = c.req.valid('json');
  const listingId = crypto.randomUUID();
  const slug = `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${listingId.substring(0, 6)}`;

  // Pro or Admin can set isFeatured; Free tier cannot
  const isFeatured = isProOrAdmin ? (body.isFeatured || false) : false;

  // Default 30-day expiration
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const newListing: schema.InsertListing = {
    id: listingId,
    userId,
    categoryType: body.categoryType,
    categoryId: body.categoryId,
    title: body.title,
    slug,
    description: body.description,
    priceCents: body.priceCents,
    contactPhone: body.contactPhone,
    contactEmail: body.contactEmail || user.email,
    status: 'active',
    isFeatured,
    town: body.town,
    address: body.address,
    serviceRadiusMiles: body.serviceRadiusMiles,
    zip: body.zip,
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
    depositCents: body.depositCents,
    petsAllowed: body.petsAllowed,
    utilitiesIncluded: body.utilitiesIncluded,
    laundryType: body.laundryType,
    parkingType: body.parkingType,
    emergencyAvailable: isProOrAdmin ? body.emergencyAvailable : false, // Priority emergency badges for Pro tier
    insured: body.insured,
    freeEstimates: body.freeEstimates,
    serviceOfferings: body.serviceOfferings,
    eventDate: body.eventDate,
    eventEndDate: body.eventEndDate,
    locationVenue: body.locationVenue,
    ticketUrl: body.ticketUrl,
    isFree: body.isFree ?? true,
    expiresAt,
  };

  await db.insert(schema.listings).values(newListing);

  // Insert media items if any
  if (body.media && body.media.length > 0) {
    const mediaInserts: schema.InsertListingMedia[] = body.media.map((m, index) => ({
      id: crypto.randomUUID(),
      listingId,
      r2Key: m.r2Key,
      url: m.url,
      altText: m.altText || body.title,
      sortOrder: index,
      isPrimary: m.isPrimary ?? (index === 0),
    }));

    for (const m of mediaInserts) {
      await db.insert(schema.listingMedia).values(m);
    }
  }

  return c.json({ success: true, listingId, slug }, 201);
});

// PATCH /api/listings/:id - Authenticated update (or toggle status)
listingRoutes.patch('/:id', zValidator('json', updateListingSchema), async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) {
    return c.json({ error: 'Authentication required. Please log in.' }, 401);
  }

  const existing = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, id))
    .get();

  if (!existing) {
    return c.json({ error: 'Listing not found' }, 404);
  }

  // Strict Security: Only admin or the listing's verified owner can modify
  if (user.role !== 'admin' && existing.userId !== user.id) {
    return c.json({
      error: 'Forbidden: You do not have permission to modify listings or businesses that do not belong to you.',
    }, 403);
  }

  const body = c.req.valid('json');
  const { media, ...updateFields } = body;

  await db
    .update(schema.listings)
    .set({
      ...updateFields,
      updatedAt: new Date(),
    })
    .where(eq(schema.listings.id, id));

  return c.json({ success: true });
});

// DELETE /api/listings/:id - Soft-delete or owner deletion
listingRoutes.delete('/:id', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) {
    return c.json({ error: 'Authentication required.' }, 401);
  }

  const existing = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, id))
    .get();

  if (!existing) {
    return c.json({ error: 'Listing not found' }, 404);
  }

  if (user.role !== 'admin' && existing.userId !== user.id) {
    return c.json({
      error: 'Forbidden: You do not have permission to delete listings that do not belong to you.',
    }, 403);
  }

  // Soft delete by updating status to hidden
  await db
    .update(schema.listings)
    .set({ status: 'hidden', updatedAt: new Date() })
    .where(eq(schema.listings.id, id));

  return c.json({ success: true, message: 'Listing archived' });
});
