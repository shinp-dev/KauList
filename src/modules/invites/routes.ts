import { Hono } from 'hono'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListOwner } from '../../middleware/auth'
import { InviteService } from './service'
import { checkRateLimit } from '../../lib/rateLimit'
import { csrfProtection } from '../../middleware/csrf'
import { hashToken } from '../../lib/crypto'

const invitesRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

invitesRoutes.use('*', requireAuth)

invitesRoutes.get('/:listId/invites', requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const service = new InviteService(c.env.DB)
  const invites = await service.getInvites(listId)
  return c.json({ success: true, invites })
})

invitesRoutes.post('/:listId/invites', csrfProtection, requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const user = c.get('user')!

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'create-invite', limit: 10, windowSeconds: 3600 }, [
    { scope: 'userId', value: user.id.toString() },
    { scope: 'listId', value: listId.toString() },
    { scope: 'ip-userId', value: `${ip}:${user.id}` }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  const service = new InviteService(c.env.DB)
  const { token, code } = await service.createInvite(listId, user.id)

  return c.json({ success: true, token, code }, 201)
})

invitesRoutes.delete('/:listId/invites/:inviteId', csrfProtection, requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const inviteId = Number(c.req.param('inviteId'))

  const service = new InviteService(c.env.DB)
  await service.revokeInvite(inviteId, listId)

  return c.json({ success: true })
})

// Accept invite
const inviteAcceptRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

inviteAcceptRoutes.post('/invites/accept', csrfProtection, requireAuth, async (c) => {
  const body = await c.req.json()
  const token = body.token

  if (!token || typeof token !== 'string') return c.json({ success: false, error: 'Invalid token' }, 400)

  const user = c.get('user')!
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'

  // Hash token for rate limit key
  const tokenHash = await hashToken(token)

  const rl = await checkRateLimit(c, { action: 'accept-invite', limit: 5, windowSeconds: 300 }, [
    { scope: 'userId', value: user.id.toString() },
    { scope: 'tokenHash', value: tokenHash }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  const service = new InviteService(c.env.DB)
  try {
    const { listId } = await service.acceptInvite(user.id, token)
    return c.json({ success: true, list_id: listId })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400)
  }
})

export { invitesRoutes, inviteAcceptRoutes }
