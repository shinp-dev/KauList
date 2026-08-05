import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Bindings, Variables, UserSession, ListMember } from '../types'
import { hashToken } from '../lib/crypto'

export async function requireAuth(c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) {
  if (c.get('user')) {
    await next()
    return
  }

  const token = getCookie(c, 'session_token')
  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const tokenHash = await hashToken(token)
  
  // Cleanup old sessions probabilistically
  if (Math.random() < 0.05) {
    const cleanup = c.env.DB.prepare('DELETE FROM sessions WHERE expires_at < ? LIMIT 10').bind(new Date().toISOString()).run()
    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
      c.executionCtx.waitUntil(cleanup)
    }
  }

  const session = await c.env.DB.prepare(`
    SELECT u.id, u.login_id, u.display_name, s.expires_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ?
  `).bind(tokenHash).first<{id: number, login_id: string, display_name: string, expires_at: string}>()

  if (!session) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  if (new Date(session.expires_at) < new Date()) {
    // Delete expired session
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run()
    return c.json({ success: false, error: 'Session expired' }, 401)
  }

  // Update last seen occasionally
  if (Math.random() < 0.1) {
    const update = c.env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').bind(new Date().toISOString(), tokenHash).run()
    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
      c.executionCtx.waitUntil(update)
    }
  }

  c.set('user', {
    id: session.id,
    login_id: session.login_id,
    display_name: session.display_name
  })

  await next()
}

export function requireListMember() {
  return async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
    const user = c.get('user')
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401)

    const listId = c.req.param('listId')
    if (!listId) return c.json({ success: false, error: 'List ID required' }, 400)

    const member = await c.env.DB.prepare(`
      SELECT lm.role 
      FROM list_members lm
      JOIN shopping_lists sl ON sl.id = lm.list_id
      WHERE lm.list_id = ? AND lm.user_id = ? AND sl.deleted_at IS NULL
    `).bind(listId, user.id).first<ListMember>()
    
    if (!member) {
      return c.json({ success: false, error: 'Not found' }, 404) // Hide existence
    }

    await next()
  }
}

export function requireListOwner() {
  return async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
    const user = c.get('user')
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401)

    const listId = c.req.param('listId')
    if (!listId) return c.json({ success: false, error: 'List ID required' }, 400)

    const member = await c.env.DB.prepare(`
      SELECT lm.role 
      FROM list_members lm
      JOIN shopping_lists sl ON sl.id = lm.list_id
      WHERE lm.list_id = ? AND lm.user_id = ? AND sl.deleted_at IS NULL
    `).bind(listId, user.id).first<ListMember>()
    
    if (!member) {
      return c.json({ success: false, error: 'Not found' }, 404) // Hide existence
    }

    if (member.role !== 'owner') {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }

    await next()
  }
}
