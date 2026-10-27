import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';

export const billingRoutes = new Hono<AppContext>();

const createCheckoutSchema = z.object({
  tier: z.enum(['pro_monthly', 'pro_annual']),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

// POST /api/billing/create-checkout-session
billingRoutes.post('/create-checkout-session', zValidator('json', createCheckoutSchema), async (c) => {
  const db = c.get('db');
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Please log in to upgrade to Pro.' }, 401);
  }

  const { tier, successUrl, cancelUrl } = c.req.valid('json');
  const stripeSecretKey = (c.env as any).STRIPE_SECRET_KEY;
  const baseUrl = (c.env as any).BETTER_AUTH_URL || 'http://localhost:5173';

  const isAnnual = tier === 'pro_annual';
  const priceAmount = isAnnual ? 10000 : 1000; // in cents
  const interval = isAnnual ? 'year' : 'month';

  // If real Stripe secret key is configured in Cloudflare environment
  if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
    try {
      const params = new URLSearchParams();
      params.append('payment_method_types[0]', 'card');
      params.append('mode', 'subscription');
      params.append('client_reference_id', user.id);
      params.append('customer_email', user.email);
      params.append(
        'success_url',
        successUrl || `${baseUrl}/?upgraded=true&session_id={CHECKOUT_SESSION_ID}`
      );
      params.append('cancel_url', cancelUrl || `${baseUrl}/`);

      params.append('line_items[0][price_data][currency]', 'usd');
      params.append('line_items[0][price_data][product_data][name]', `Southwest Iowa Pro Tier (${isAnnual ? 'Annual' : 'Monthly'})`);
      params.append(
        'line_items[0][price_data][product_data][description]',
        'Unlimited active listings, top featured placement, 24/7 emergency dispatch pills, and verified badge.'
      );
      params.append('line_items[0][price_data][unit_amount]', priceAmount.toString());
      params.append('line_items[0][price_data][recurring][interval]', interval);
      params.append('line_items[0][quantity]', '1');

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const session = await response.json() as any;

      if (!response.ok) {
        throw new Error(session.error?.message || 'Stripe session creation failed');
      }

      return c.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (err: any) {
      console.error('Stripe error:', err);
      return c.json({ error: err.message || 'Payment provider error' }, 500);
    }
  }

  // Fallback: If Stripe key not yet added to Cloudflare Pages dashboard, grant immediate test upgrade
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (isAnnual ? 365 : 30) * 86400000);

  await db
    .update(schema.users)
    .set({
      tier: tier as any,
      tierExpiresAt: expiresAt,
      updatedAt: now,
    })
    .where(eq(schema.users.id, user.id));

  return c.json({
    checkoutUrl: null,
    mockUpgraded: true,
    message: `Test mode: Upgraded to ${isAnnual ? '$100/yr Annual Pro' : '$10/mo Monthly Pro'}. (Add STRIPE_SECRET_KEY to Pages dashboard for live billing).`,
    tier,
    tierExpiresAt: expiresAt,
  });
});

// POST /api/billing/webhook - Stripe Webhook Handler
billingRoutes.post('/webhook', async (c) => {
  const db = c.get('db');
  let event: any;

  try {
    event = await c.req.json();
  } catch {
    return c.text('Invalid webhook payload', 400);
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object;
    const userId = session?.client_reference_id;

    if (userId) {
      const isAnnual = session.amount_total === 10000;
      const tier = isAnnual ? 'pro_annual' : 'pro_monthly';
      const expiresAt = new Date(Date.now() + (isAnnual ? 365 : 30) * 86400000);

      await db
        .update(schema.users)
        .set({
          tier,
          tierExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));
    }
  }

  // Handle cancelled subscription
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data?.object;
    // Downgrade user back to free tier
    const customerEmail = subscription?.customer_email;
    if (customerEmail) {
      await db
        .update(schema.users)
        .set({
          tier: 'free',
          tierExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.email, customerEmail));
    }
  }

  return c.json({ received: true });
});
