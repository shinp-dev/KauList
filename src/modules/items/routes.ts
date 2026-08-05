import { Hono } from 'hono'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListMember } from '../../middleware/auth'
import { ItemService } from './service'
import { csrfProtection } from '../../middleware/csrf'

const itemsRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

itemsRoutes.use('*', requireAuth)

itemsRoutes.get('/:listId/items', requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const service = new ItemService(c.env.DB)
  const items = await service.getListItems(listId)
  return c.json({ success: true, items })
})

itemsRoutes.post('/:listId/items', csrfProtection, requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const user = c.get('user')!
  const body = await c.req.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const count = typeof body.count === 'number' ? body.count : 1
  const unit = typeof body.unit === 'string' ? body.unit.trim() : '個'
  const category = typeof body.category === 'string' ? body.category.trim() : 'other'
  const imageId = typeof body.image_id === 'number' ? body.image_id : undefined

  if (!name || name.length > 100) return c.json({ success: false, error: 'Invalid name' }, 400)
  if (count < 1 || count > 99) return c.json({ success: false, error: 'Invalid count' }, 400)
  if (!unit || unit.length > 20) return c.json({ success: false, error: 'Invalid unit' }, 400)
  if (!['food', 'daily', 'medicine', 'other'].includes(category)) return c.json({ success: false, error: 'Invalid category' }, 400)

  const service = new ItemService(c.env.DB)
  
  try {
    const item = await service.createItem(listId, user.id, name, count, unit, category, imageId)
    return c.json({ success: true, item }, 201)
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400)
  }
})

itemsRoutes.patch('/:listId/items/:itemId', csrfProtection, requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const itemId = Number(c.req.param('itemId'))
  const user = c.get('user')!
  const body = await c.req.json()

  if (typeof body.bought !== 'boolean') return c.json({ success: false, error: 'Invalid payload' }, 400)

  const service = new ItemService(c.env.DB)
  await service.updateBoughtStatus(listId, itemId, body.bought, user.id)

  return c.json({ success: true })
})

itemsRoutes.delete('/:listId/items/:itemId', csrfProtection, requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const itemId = Number(c.req.param('itemId'))

  const repo = new (await import('./repository')).ItemRepository(c.env.DB)
  const exists = await repo.checkItemExists(itemId, listId)
  if (!exists) return c.json({ success: false, error: 'Item not found' }, 404)

  const imgService = new (await import('../images/service')).ImageService(c.env.DB, c.env)
  const { imageDeleted, imageDeletionPending, cloudinaryResult } = await imgService.deleteItemImageInternal(listId, itemId)

  await repo.deleteItem(itemId, listId)

  return c.json({ success: true, imageDeleted, imageDeletionPending, cloudinaryResult })
})

export { itemsRoutes }
