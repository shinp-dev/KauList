import type { Context } from 'hono'
import type { Bindings } from '../types'

interface RateLimitOptions {
  action: string
  limit: number
  windowSeconds: number
}

export async function checkRateLimit(
  c: Context<{ Bindings: Bindings, Variables: any }>,
  options: RateLimitOptions,
  extraKey: string = ''
): Promise<{ success: boolean; remaining: number }> {
  try {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
    const key = `rl:${options.action}:${ip}:${extraKey}`.slice(0, 150)
    const now = Math.floor(Date.now() / 1000)

    // Clean up expired entry or get current entry
    const record = await c.env.DB.prepare(
      'SELECT count, reset_at FROM rate_limits WHERE key = ?'
    ).bind(key).first<{ count: number; reset_at: number }>()

    if (!record || record.reset_at <= now) {
      const newResetAt = now + options.windowSeconds
      await c.env.DB.prepare(
        'INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = ?'
      ).bind(key, newResetAt, newResetAt).run()
      return { success: true, remaining: options.limit - 1 }
    }

    if (record.count >= options.limit) {
      return { success: false, remaining: 0 }
    }

    await c.env.DB.prepare(
      'UPDATE rate_limits SET count = count + 1 WHERE key = ?'
    ).bind(key).run()

    return { success: true, remaining: options.limit - (record.count + 1) }
  } catch (err) {
    // If rate_limits table doesn't exist or DB errors, fail open with warning log
    console.warn('Rate limiting check warning:', err)
    return { success: true, remaining: 1 }
  }
}
