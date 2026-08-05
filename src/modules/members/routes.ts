import { Hono } from 'hono'
import type { Bindings, Variables, User } from '../../types'
import { requireAuth, requireListMember, requireListOwner } from '../../middleware/auth'
import { csrfProtection } from '../../middleware/csrf'

const membersRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

membersRoutes.use('*', requireAuth)

membersRoutes.get('/:listId/members', requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const { results } = await c.env.DB.prepare(`
    SELECT u.id, u.login_id, u.display_name, lm.role, lm.joined_at
    FROM list_members lm
    JOIN users u ON lm.user_id = u.id
    WHERE lm.list_id = ?
    ORDER BY lm.joined_at ASC
  `).bind(listId).all()
  return c.json({ success: true, members: results || [] })
})

membersRoutes.delete('/:listId/members/:userId', csrfProtection, requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const targetUserId = Number(c.req.param('userId'))
  const currentUser = c.get('user')!

  if (targetUserId === currentUser.id) {
    return c.json({ success: false, error: 'Cannot remove yourself' }, 400)
  }

  await c.env.DB.prepare('DELETE FROM list_members WHERE list_id = ? AND user_id = ?').bind(listId, targetUserId).run()
  return c.json({ success: true })
})

export { membersRoutes }
