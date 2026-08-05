import { Hono } from 'hono'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListMember, requireListOwner } from '../../middleware/auth'
import { ListService } from './service'
import { csrfProtection } from '../../middleware/csrf'

const listsRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

listsRoutes.use('*', requireAuth)

listsRoutes.get('/', async (c) => {
  const user = c.get('user')!
  const service = new ListService(c.env.DB)
  const lists = await service.getUserLists(user.id)
  return c.json({ success: true, lists })
})

listsRoutes.post('/', csrfProtection, async (c) => {
  const user = c.get('user')!
  const body = await c.req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!name || name.length < 1 || name.length > 50) {
    return c.json({ success: false, error: 'Invalid list name' }, 400)
  }

  const service = new ListService(c.env.DB)
  const list = await service.createList(user.id, name)
  return c.json({ success: true, list }, 201)
})

listsRoutes.get('/:listId', requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  // Already verified access
  const list = await c.env.DB.prepare('SELECT * FROM shopping_lists WHERE id = ?').bind(listId).first()
  return c.json({ success: true, list })
})

listsRoutes.patch('/:listId', csrfProtection, requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const body = await c.req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!name || name.length < 1 || name.length > 50) {
    return c.json({ success: false, error: 'Invalid list name' }, 400)
  }

  const service = new ListService(c.env.DB)
  await service.updateList(listId, name)
  return c.json({ success: true })
})

listsRoutes.delete('/:listId', csrfProtection, requireListOwner(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const service = new ListService(c.env.DB)
  await service.deleteList(listId)
  return c.json({ success: true })
})

listsRoutes.post('/:listId/leave', csrfProtection, requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const user = c.get('user')!
  
  const member = await c.env.DB.prepare('SELECT role FROM list_members WHERE list_id = ? AND user_id = ?').bind(listId, user.id).first<{role: string}>()
  if (member?.role === 'owner') {
    return c.json({ success: false, error: 'Owner cannot leave the list' }, 400)
  }

  await c.env.DB.prepare('DELETE FROM list_members WHERE list_id = ? AND user_id = ?').bind(listId, user.id).run()
  return c.json({ success: true })
})

export { listsRoutes }
