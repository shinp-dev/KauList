import { Hono } from 'hono'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListOwner } from '../../middleware/auth'
import { InviteService } from './service'
import { csrfProtection } from '../../middleware/csrf'
import { checkRateLimit } from '../../lib/rateLimit'

const invitesRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

invitesRoutes.use('*', requireAuth)

invitesRoutes.post('/:listId/invites', csrfProtection, requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const user = c.get('user')!

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'invite-create', limit: 10, windowSeconds: 60 }, [
    { scope: 'userId', value: user.id.toString() },
    { scope: 'listId', value: listId.toString() },
    { scope: 'ip-userId', value: `${ip}:${user.id}` }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  const service = new InviteService(c.env.DB)
  const { token, code } = await service.createInvite(listId, user.id)
  
  return c.json({ success: true, invite: { id: code.id, token, expires_at: code.expires_at } }, 201)
})

invitesRoutes.delete('/:listId/invites/:inviteId', csrfProtection, requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const inviteId = Number(c.req.param('inviteId'))
  
  const service = new InviteService(c.env.DB)
  await service.revokeInvite(inviteId, listId)
  
  return c.json({ success: true })
})

// Special global route for accepting invites, not under /:listId/
const globalInvitesRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()
globalInvitesRoutes.use('*', requireAuth)

globalInvitesRoutes.post('/invites/accept', csrfProtection, async (c) => {
  const user = c.get('user')!
  const body = await c.req.json()
  const token = typeof body.token === 'string' ? body.token.trim() : ''

  if (!token) return c.json({ success: false, error: 'Token is required' }, 400)

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'invite-accept', limit: 10, windowSeconds: 60 }, [
    { scope: 'ip', value: ip },
    { scope: 'userId', value: user.id.toString() },
    { scope: 'token', value: token }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  const service = new InviteService(c.env.DB)
  try {
    const { listId } = await service.acceptInvite(user.id, token)
    return c.json({ success: true, listId })
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to accept invite' }, 400)
  }
})

export { invitesRoutes, globalInvitesRoutes }
