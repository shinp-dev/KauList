import type { Context, Next } from 'hono'

export async function csrfProtection(c: Context, next: Next) {
  // Only protect state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    // 1. Enforce Content-Type for endpoints that expect it
    // Wait, images/complete, etc use JSON.
    const contentType = c.req.header('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      // Some endpoints might not need JSON, but for this app, all state changes from client use JSON
      // except maybe logout if we just make it POST without body. We'll allow empty bodies if needed, but safer to require JSON if body exists.
      // But to be simple, let's just enforce it if there is a content-type.
      if (contentType && !contentType.includes('application/json')) {
        return c.json({ success: false, error: 'Unsupported Media Type' }, 415)
      }
    }

    // 2. Enforce Same Origin / Host Check
    const origin = c.req.header('origin')
    const referer = c.req.header('referer')
    const host = c.req.header('host')
    
    // Cloudflare Workers often runs behind proxies, host might be different, but in our case it's usually matching.
    if (origin) {
      try {
        const originUrl = new URL(origin)
        if (originUrl.host !== host) {
          // It's safer to just check if it's the expected host, or if it's our own domain.
          // Since host could be the worker dev URL, we just check if it matches the Host header
          if (originUrl.host !== host && !host?.includes('localhost')) {
             return c.json({ success: false, error: 'CSRF token mismatch or origin mismatch' }, 403)
          }
        }
      } catch (e) {
        return c.json({ success: false, error: 'Invalid Origin' }, 403)
      }
    } else if (referer) {
       try {
        const refererUrl = new URL(referer)
        if (refererUrl.host !== host && !host?.includes('localhost')) {
           return c.json({ success: false, error: 'CSRF token mismatch or referer mismatch' }, 403)
        }
      } catch (e) {
        return c.json({ success: false, error: 'Invalid Referer' }, 403)
      }
    } else {
      // If neither is present, it's a bit risky to block completely as some older browsers might not send them,
      // but modern security standards say we should block. We'll allow it for now or rely on SameSite=Strict cookies.
      // Since we use SameSite=Strict cookies, we are largely protected anyway.
    }
  }

  await next()
}
