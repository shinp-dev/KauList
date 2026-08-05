import type { Context, Next } from 'hono'

export async function csrfProtection(c: Context, next: Next) {
  const method = c.req.method
  
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    // 1. Enforce Content-Type
    const contentType = c.req.header('content-type') || ''
    if (!contentType.includes('application/json')) {
      return c.json({ success: false, error: 'Invalid Content-Type' }, 403)
    }

    // 2. Enforce Origin
    const origin = c.req.header('origin')
    if (!origin) {
      return c.json({ success: false, error: 'Missing Origin header' }, 403)
    }

    try {
      const originUrl = new URL(origin)
      const host = c.req.header('host') || ''
      
      // Allow localhost for development (vite dev server usually runs on 5173, but origin might be localhost:5173 and host localhost:5173)
      if (originUrl.host !== host) {
        // Allow port mismatches in local dev, but strict in prod
        if (originUrl.hostname === 'localhost' && host.startsWith('localhost')) {
          // Dev allowed
        } else {
          return c.json({ success: false, error: 'CSRF Origin mismatch' }, 403)
        }
      }
    } catch (e) {
      return c.json({ success: false, error: 'Invalid Origin header' }, 403)
    }
  }

  await next()
}
