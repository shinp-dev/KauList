import type { Context } from 'hono'
import type { Bindings } from '../types'

export interface RateLimitOptions {
  action: string
  limit: number
  windowSeconds: number
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function checkRateLimit(
  c: Context<{ Bindings: Bindings, Variables: any }>,
  options: RateLimitOptions,
  extraKeys: string[] = [] // Example: ['familyName:user', 'ip:familyName:user']
): Promise<{ success: boolean }> {
  try {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
    const now = Math.floor(Date.now() / 1000)
    const newResetAt = now + options.windowSeconds

    // Clean up expired records sporadically (10% chance, max 5 records)
    if (Math.random() < 0.1) {
      const cleanup = c.env.DB.prepare('DELETE FROM rate_limits WHERE reset_at <= ? LIMIT 5').bind(now).run().catch((e: any) => console.warn('Rate limit cleanup failed', e))
      try {
        if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
          c.executionCtx.waitUntil(cleanup)
        } else {
          await cleanup
        }
      } catch (e) {
        // Ignore execution context errors
      }
    }

    const keysToVerify = [ip, ...extraKeys]
    
    // Process each key independently
    for (const rawKey of keysToVerify) {
      const hashedKey = await sha256(`${options.action}:${rawKey}`)
      const dbKey = `rl:${hashedKey}`.slice(0, 100)

      const result = await c.env.DB.prepare(`
        INSERT INTO rate_limits (key, count, reset_at)
        VALUES (?1, 1, ?2)
        ON CONFLICT(key) DO UPDATE SET 
          count = CASE WHEN rate_limits.reset_at <= ?3 THEN 1 ELSE rate_limits.count + 1 END,
          reset_at = CASE WHEN rate_limits.reset_at <= ?3 THEN ?2 ELSE rate_limits.reset_at END
        RETURNING count, reset_at
      `).bind(dbKey, newResetAt, now).first<{ count: number; reset_at: number }>()

      if (result && result.count > options.limit) {
        return { success: false } // Fast fail if any key exceeds limit
      }
    }

    return { success: true }
  } catch (err) {
    // If rate_limits table doesn't exist or DB errors, fail open with warning log
    console.warn('Rate limiting check warning:', err)
    return { success: true }
  }
}
