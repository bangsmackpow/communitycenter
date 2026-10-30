import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import type { AppContext } from '../types';
import * as schema from '../../db/schema';
import { hashPassword, verifyPassword } from '../crypto';

export const authRoutes = new Hono<AppContext>();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['user', 'landlord', 'business']).optional().default('user'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setSessionCookie(c: any, token: string) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  c.header(
    'Set-Cookie',
    `sw_session=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`
  );
}

// POST /api/auth/register
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const db = c.get('db');
  const body = c.req.valid('json');
  const email = body.email.toLowerCase().trim();

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();

  if (existing) {
    return c.json({ error: 'An account with this email already exists. Please sign in.' }, 400);
  }

  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(body.password);
  const now = new Date();

  // Check if email matches configured admin email(s) via environment variable
  const adminEmailConfig = (c.env as any)?.ADMIN_EMAIL || (c.env as any)?.ADMIN_EMAILS || '';
  const adminEmails = adminEmailConfig.toLowerCase().split(',').map((e: string) => e.trim()).filter(Boolean);
  const isAdmin = adminEmails.includes(email);

  const role = isAdmin ? 'admin' : body.role;
  const tier = isAdmin ? 'pro_annual' : 'free';

  await db.insert(schema.users).values({
    id: userId,
    name: body.name.trim(),
    email,
    emailVerified: false,
    role: role as any,
    tier: tier as any,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.accounts).values({
    id: crypto.randomUUID(),
    userId,
    accountId: email,
    providerId: 'credential',
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(schema.sessions).values({
    id: crypto.randomUUID(),
    userId,
    token: sessionToken,
    expiresAt,
    ipAddress: c.req.header('cf-connecting-ip') || null,
    userAgent: c.req.header('user-agent') || null,
    createdAt: now,
    updatedAt: now,
  });

  setSessionCookie(c, sessionToken);

  return c.json({
    success: true,
    user: {
      id: userId,
      name: body.name.trim(),
      email,
      role,
      tier,
    },
    token: sessionToken,
  }, 201);
});

// POST /api/auth/login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const db = c.get('db');
  const body = c.req.valid('json');
  const email = body.email.toLowerCase().trim();

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();

  if (!user) {
    return c.json({ error: 'Invalid email or password.' }, 401);
  }

  const account = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.providerId, 'credential')))
    .get();

  if (!account || !account.password) {
    return c.json({ error: 'Password authentication not configured for this account. Try social login or register.' }, 401);
  }

  const valid = await verifyPassword(body.password, account.password);
  if (!valid) {
    return c.json({ error: 'Invalid email or password.' }, 401);
  }

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  await db.insert(schema.sessions).values({
    id: crypto.randomUUID(),
    userId: user.id,
    token: sessionToken,
    expiresAt,
    ipAddress: c.req.header('cf-connecting-ip') || null,
    userAgent: c.req.header('user-agent') || null,
    createdAt: now,
    updatedAt: now,
  });

  setSessionCookie(c, sessionToken);

  return c.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      image: user.image,
    },
    token: sessionToken,
  });
});

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  const db = c.get('db');
  const cookie = c.req.header('cookie') || '';
  const match = cookie.match(/sw_session=([^;]+)/);
  const authHeader = c.req.header('authorization');
  const token = match?.[1] || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (token) {
    await db.delete(schema.sessions).where(eq(schema.sessions.token, token)).run().catch(() => {});
  }

  c.header('Set-Cookie', 'sw_session=; Path=/; HttpOnly; Max-Age=0');
  return c.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me - Read current live session
authRoutes.get('/me', async (c) => {
  const db = c.get('db');
  const cookie = c.req.header('cookie') || '';
  const match = cookie.match(/sw_session=([^;]+)/);
  const authHeader = c.req.header('authorization');
  const token = match?.[1] || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!token) {
    return c.json({ user: null });
  }

  const session = await db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.token, token), sql`${schema.sessions.expiresAt} > unixepoch()`))
    .get();

  if (!session) {
    return c.json({ user: null });
  }

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .get();

  if (!user) {
    return c.json({ user: null });
  }

  // Ensure configured admin email(s) have admin role and pro_annual tier
  const adminEmailConfig = (c.env as any)?.ADMIN_EMAIL || (c.env as any)?.ADMIN_EMAILS || '';
  const adminEmails = adminEmailConfig.toLowerCase().split(',').map((e: string) => e.trim()).filter(Boolean);
  if (adminEmails.includes(user.email.toLowerCase())) {
    user.role = 'admin';
    user.tier = 'pro_annual';
  }

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      image: user.image,
    },
  });
});

// POST /api/auth/change-password - Change password for the authenticated user
const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

authRoutes.post('/change-password', zValidator('json', changePasswordSchema), async (c) => {
  const db = c.get('db');
  let user = c.get('user');

  // If user not in context via middleware, check sw_session cookie
  if (!user) {
    const cookie = c.req.header('cookie') || '';
    const match = cookie.match(/sw_session=([^;]+)/);
    const authHeader = c.req.header('authorization');
    const token = match?.[1] || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (token) {
      const session = await db
        .select()
        .from(schema.sessions)
        .where(and(eq(schema.sessions.token, token), sql`${schema.sessions.expiresAt} > unixepoch()`))
        .get();

      if (session) {
        user = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, session.userId))
          .get() as any;
      }
    }
  }

  if (!user) {
    return c.json({ error: 'Authentication required. Please sign in.' }, 401);
  }

  const { currentPassword, newPassword } = c.req.valid('json');

  // Check if user has an existing credential account
  const account = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.providerId, 'credential')))
    .get();

  if (account && account.password) {
    if (!currentPassword) {
      return c.json({ error: 'Current password is required to change password.' }, 400);
    }
    const isValid = await verifyPassword(currentPassword, account.password);
    if (!isValid) {
      return c.json({ error: 'Current password does not match.' }, 400);
    }
  }

  const hashedPassword = await hashPassword(newPassword);
  const now = new Date();

  if (account) {
    await db
      .update(schema.accounts)
      .set({ password: hashedPassword, updatedAt: now })
      .where(eq(schema.accounts.id, account.id));
  } else {
    // If user originally signed up via OAuth, create credential account for password access
    await db.insert(schema.accounts).values({
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: user.email,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
  }

  return c.json({
    success: true,
    message: 'Your password has been changed successfully.',
  });
});

// --- OAuth: Google ---
authRoutes.get('/oauth/google', (c) => {
  const clientId = (c.env as any).GOOGLE_CLIENT_ID;
  const baseUrl = (c.env as any).BETTER_AUTH_URL || new URL(c.req.url).origin;

  if (!clientId) {
    return c.html(`
      <div style="font-family:sans-serif; max-width:500px; margin:50px auto; padding:24px; border:1px solid #e2e8f0; border-radius:16px;">
        <h2 style="color:#1e293b; margin-top:0;">Google OAuth Setup Required</h2>
        <p style="color:#64748b; font-size:14px; line-height:1.5;">To enable 1-click Google login, add these environment variables in your Cloudflare Pages Dashboard (under <strong>Settings &gt; Environment Variables</strong>):</p>
        <ul style="font-size:13px; color:#334155;">
          <li><code>GOOGLE_CLIENT_ID</code></li>
          <li><code>GOOGLE_CLIENT_SECRET</code></li>
        </ul>
        <p style="font-size:13px; color:#64748b;">Authorized redirect URI in Google Cloud Console:</p>
        <code style="background:#f1f5f9; padding:6px 10px; border-radius:8px; font-size:12px; display:block; word-break:break-all;">${baseUrl}/api/auth/oauth/google/callback</code>
        <br/>
        <a href="/" style="display:inline-block; background:#5e8053; color:#fff; padding:10px 18px; border-radius:10px; text-decoration:none; font-size:13px; font-weight:bold;">Return to Community Central</a>
      </div>
    `, 503);
  }

  const redirectUri = `${baseUrl}/api/auth/oauth/google/callback`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

  return c.redirect(googleAuthUrl);
});

authRoutes.get('/oauth/google/callback', async (c) => {
  const code = c.req.query('code');
  const db = c.get('db');
  const clientId = (c.env as any).GOOGLE_CLIENT_ID;
  const clientSecret = (c.env as any).GOOGLE_CLIENT_SECRET;
  const baseUrl = (c.env as any).BETTER_AUTH_URL || new URL(c.req.url).origin;
  const redirectUri = `${baseUrl}/api/auth/oauth/google/callback`;

  if (!code || !clientId || !clientSecret) {
    return c.redirect('/?oauth_error=missing_code_or_credentials');
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange Google token');
    }

    // Get user info
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = (await userinfoRes.json()) as any;
    const email = profile.email?.toLowerCase();
    if (!email) throw new Error('No email found in Google profile');

    let user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    const now = new Date();

    if (!user) {
      const userId = crypto.randomUUID();
      const adminEmailConfig = (c.env as any)?.ADMIN_EMAIL || (c.env as any)?.ADMIN_EMAILS || '';
      const adminEmails = adminEmailConfig.toLowerCase().split(',').map((e: string) => e.trim()).filter(Boolean);
      const isConfigAdmin = adminEmails.includes(email);
      const role = isConfigAdmin ? 'admin' : 'user';
      const tier = isConfigAdmin ? 'pro_annual' : 'free';
      await db.insert(schema.users).values({
        id: userId,
        name: profile.name || email.split('@')[0],
        email,
        emailVerified: true,
        image: profile.picture || null,
        role: role as any,
        tier: tier as any,
        createdAt: now,
        updatedAt: now,
      });
      user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(schema.sessions).values({
      id: crypto.randomUUID(),
      userId: user!.id,
      token: sessionToken,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    setSessionCookie(c, sessionToken);
    return c.redirect('/');
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return c.redirect('/?oauth_error=failed');
  }
});

// --- OAuth: Facebook ---
authRoutes.get('/oauth/facebook', (c) => {
  const clientId = (c.env as any).FACEBOOK_CLIENT_ID;
  const baseUrl = (c.env as any).BETTER_AUTH_URL || new URL(c.req.url).origin;

  if (!clientId) {
    return c.html(`
      <div style="font-family:sans-serif; max-width:500px; margin:50px auto; padding:24px; border:1px solid #e2e8f0; border-radius:16px;">
        <h2 style="color:#1e293b; margin-top:0;">Facebook OAuth Setup Required</h2>
        <p style="color:#64748b; font-size:14px; line-height:1.5;">To enable 1-click Facebook login, add these environment variables in your Cloudflare Pages Dashboard (under <strong>Settings &gt; Environment Variables</strong>):</p>
        <ul style="font-size:13px; color:#334155;">
          <li><code>FACEBOOK_CLIENT_ID</code></li>
          <li><code>FACEBOOK_CLIENT_SECRET</code></li>
        </ul>
        <p style="font-size:13px; color:#64748b;">Valid OAuth Redirect URI in Facebook Developer App:</p>
        <code style="background:#f1f5f9; padding:6px 10px; border-radius:8px; font-size:12px; display:block; word-break:break-all;">${baseUrl}/api/auth/oauth/facebook/callback</code>
        <br/>
        <a href="/" style="display:inline-block; background:#1877F2; color:#fff; padding:10px 18px; border-radius:10px; text-decoration:none; font-size:13px; font-weight:bold;">Return to Community Central</a>
      </div>
    `, 503);
  }

  const redirectUri = `${baseUrl}/api/auth/oauth/facebook/callback`;
  const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile`;

  return c.redirect(fbAuthUrl);
});

authRoutes.get('/oauth/facebook/callback', async (c) => {
  const code = c.req.query('code');
  const db = c.get('db');
  const clientId = (c.env as any).FACEBOOK_CLIENT_ID;
  const clientSecret = (c.env as any).FACEBOOK_CLIENT_SECRET;
  const baseUrl = (c.env as any).BETTER_AUTH_URL || new URL(c.req.url).origin;
  const redirectUri = `${baseUrl}/api/auth/oauth/facebook/callback`;

  if (!code || !clientId || !clientSecret) {
    return c.redirect('/?oauth_error=missing_code_or_credentials');
  }

  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(
        clientId
      )}&client_secret=${encodeURIComponent(clientSecret)}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&code=${encodeURIComponent(code)}`
    );
    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) {
      throw new Error(tokenData.error?.message || 'Failed to exchange Facebook token');
    }

    const userinfoRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
    );
    const profile = (await userinfoRes.json()) as any;
    const email = (profile.email || `${profile.id}@facebook.user`).toLowerCase();

    let user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    const now = new Date();

    if (!user) {
      const userId = crypto.randomUUID();
      const adminEmailConfig = (c.env as any)?.ADMIN_EMAIL || (c.env as any)?.ADMIN_EMAILS || '';
      const adminEmails = adminEmailConfig.toLowerCase().split(',').map((e: string) => e.trim()).filter(Boolean);
      const isConfigAdmin = adminEmails.includes(email);
      const role = isConfigAdmin ? 'admin' : 'user';
      const tier = isConfigAdmin ? 'pro_annual' : 'free';
      await db.insert(schema.users).values({
        id: userId,
        name: profile.name || 'Facebook User',
        email,
        emailVerified: true,
        image: profile.picture?.data?.url || null,
        role: role as any,
        tier: tier as any,
        createdAt: now,
        updatedAt: now,
      });
      user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(schema.sessions).values({
      id: crypto.randomUUID(),
      userId: user!.id,
      token: sessionToken,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    setSessionCookie(c, sessionToken);
    return c.redirect('/');
  } catch (err) {
    console.error('Facebook OAuth callback error:', err);
    return c.redirect('/?oauth_error=failed');
  }
});
