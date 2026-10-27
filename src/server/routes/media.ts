import { Hono } from 'hono';
import type { AppContext } from '../types';

export const mediaRoutes = new Hono<AppContext>();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// POST /api/media/upload - Direct multipart upload to R2
mediaRoutes.post('/upload', async (c) => {
  try {
    const formData = await c.req.parseBody({ all: true });
    const file = formData['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No valid image file uploaded under field "file"' }, 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json({
        error: `Invalid file type: ${file.type}. Allowed formats: WebP, JPEG, PNG.`,
      }, 400);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return c.json({
        error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      }, 400);
    }

    const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
    const r2Key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

    const bucket = c.env.BUCKET;
    if (bucket && typeof bucket.put === 'function') {
      const buffer = await file.arrayBuffer();
      await bucket.put(r2Key, buffer, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
    }

    // Return the URL to access the media
    const url = `/api/media/${r2Key}`;

    return c.json({
      success: true,
      r2Key,
      url,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Media upload failed' }, 500);
  }
});

// GET /api/media/:key - Serve image from R2 with edge cache headers
mediaRoutes.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const bucket = c.env.BUCKET;

  if (!bucket || typeof bucket.get !== 'function') {
    // If running in development without live R2, return a fallback SVG placeholder
    return c.text('R2 bucket binding not configured for local direct serving', 404);
  }

  const object = await bucket.get(key);
  if (!object) {
    return c.text('Media not found', 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body as any, { headers });
});

// POST /api/media/upload-url - S3-compatible presigned URL workflow
mediaRoutes.post('/upload-url', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const filename = body.filename || 'photo.webp';
  const contentType = body.contentType || 'image/webp';

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return c.json({ error: 'Unsupported media type. Use WebP, JPEG, or PNG.' }, 400);
  }

  const ext = contentType === 'image/webp' ? 'webp' : contentType === 'image/png' ? 'png' : 'jpg';
  const r2Key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  // For Cloudflare Worker R2 direct upload or custom domain presigned URL:
  return c.json({
    uploadUrl: `/api/media/upload`,
    r2Key,
    publicUrl: `/api/media/${r2Key}`,
    fields: {
      key: r2Key,
      'Content-Type': contentType,
    },
  });
});
