import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';

export const eventRoutes = new Hono<AppContext>();

function formatIcsDate(dateStr?: string | null): string {
  if (!dateStr) {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// GET /api/events/calendar.ics - Standard iCalendar format
eventRoutes.get('/calendar.ics', async (c) => {
  const db = c.get('db');
  const listingId = c.req.query('id');

  let eventListings: schema.Listing[] = [];

  if (listingId) {
    const item = await db
      .select()
      .from(schema.listings)
      .where(and(eq(schema.listings.id, listingId), eq(schema.listings.categoryType, 'event')))
      .get();
    if (item) eventListings = [item];
  } else {
    // Export upcoming active community events
    eventListings = await db
      .select()
      .from(schema.listings)
      .where(and(eq(schema.listings.categoryType, 'event'), eq(schema.listings.status, 'active')))
      .limit(50);
  }

  const icsLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Southwest Iowa Community Central//Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Southwest Iowa Community Events',
    'X-WR-TIMEZONE:America/Chicago',
  ];

  for (const ev of eventListings) {
    const dtStart = formatIcsDate(ev.eventDate);
    // End date defaults to +2 hours if not given
    const dtEnd = ev.eventEndDate
      ? formatIcsDate(ev.eventEndDate)
      : formatIcsDate(
          ev.eventDate
            ? new Date(new Date(ev.eventDate).getTime() + 2 * 60 * 60 * 1000).toISOString()
            : undefined
        );
    const dtStamp = formatIcsDate(ev.createdAt?.toISOString());

    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@southwest-iowa-community`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(ev.title)}`,
      `DESCRIPTION:${escapeIcsText(ev.description)}`,
      `LOCATION:${escapeIcsText(`${ev.locationVenue ? ev.locationVenue + ', ' : ''}${ev.town}, IA`)}`,
      `URL:${ev.ticketUrl ? escapeIcsText(ev.ticketUrl) : `https://southwestiowa.community/events/${ev.id}`}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  icsLines.push('END:VCALENDAR');
  const icsContent = icsLines.join('\r\n');

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="sw-iowa-events${listingId ? '-' + listingId : ''}.ics"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
});
