import { Hono } from 'hono'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListOwner, requireListMember } from '../../middleware/auth'
import { csrfProtection } from '../../middleware/csrf'
import { MemberRepository } from './repository'

const membersRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

membersRoutes.use('*', requireAuth)

membersRoutes.get('/:listId/members', requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const repo = new MemberRepository(c.env.DB)
  const members = await repo.getMembers(listId)
  return c.json({ success: true, members })
})

membersRoutes.delete('/:listId/members/:userId', csrfProtection, requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const targetUserId = Number(c.req.param('userId'))
  const user = c.get('user')!

  if (targetUserId === user.id) {
    return c.json({ success: false, error: 'Cannot remove yourself' }, 400)
  }

  const repo = new MemberRepository(c.env.DB)
  const member = await repo.getMember(listId, targetUserId)
  if (!member) {
    return c.json({ success: false, error: 'Member not found' }, 404)
  }

  await repo.removeMember(listId, targetUserId)
  return c.json({ success: true })
})

export { membersRoutes }
