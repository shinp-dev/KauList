import { Hono } from 'hono'
import { parsePositiveInt } from '../../lib/validators'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListOwner, requireListMember } from '../../middleware/auth'
import { ListService } from './service'
import { csrfProtection } from '../../middleware/csrf'
import { MemberRepository } from '../members/repository'
import { OwnedListLimitError } from '../../config/planLimits'

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
  const name = typeof body.name === 'string' ? body.name.trim() : '買い物リスト'
  if (!name || name.length > 50) return c.json({ success: false, error: 'Invalid name' }, 400)

  const service = new ListService(c.env.DB)
  try {
    const list = await service.createList(name, user.id)
    return c.json({ success: true, list }, 201)
  } catch (err: any) {
    if (err instanceof OwnedListLimitError) {
      return c.json({
        success: false,
        code: err.code,
        error: err.message,
        current: err.current,
        limit: err.limit
      }, 403)
    }
    return c.json({ success: false, error: err.message }, 500)
  }
})

listsRoutes.patch('/:listId', csrfProtection, requireListOwner(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  if (!listId) return c.json({ success: false, error: 'Invalid list ID' }, 400)
  
  const body = await c.req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 50) return c.json({ success: false, error: 'Invalid name' }, 400)

  const service = new ListService(c.env.DB)
  await service.renameList(listId, name)
  return c.json({ success: true })
})

listsRoutes.delete('/:listId', csrfProtection, requireListOwner(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  if (!listId) return c.json({ success: false, error: 'Invalid list ID' }, 400)

  const service = new ListService(c.env.DB)
  
  try {
    const success = await service.softDeleteList(listId)
    if (!success) {
      return c.json({ success: false, error: 'List not found or already deleted' }, 404)
    }
    return c.json({ success: true })
  } catch (err) {
    return c.json({ success: false, error: 'Failed to delete list' }, 500)
  }
})

listsRoutes.delete('/:listId/leave', csrfProtection, requireListMember(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  if (!listId) return c.json({ success: false, error: 'Invalid list ID' }, 400)

  const user = c.get('user')!

  const repo = new MemberRepository(c.env.DB)
  const member = await repo.getMember(listId, user.id)
  
  if (member?.role === 'owner') {
    return c.json({ success: false, error: 'Owner cannot leave the list' }, 400)
  }

  await repo.removeMember(listId, user.id)
  return c.json({ success: true })
})

export { listsRoutes }
