import { Hono } from 'hono'
import { parsePositiveInt } from '../../lib/validators'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListMember } from '../../middleware/auth'
import { ItemService } from './service'
import { csrfProtection } from '../../middleware/csrf'

const itemsRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

itemsRoutes.use('*', requireAuth)

itemsRoutes.get('/:listId/items', requireListMember(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  if (!listId) return c.json({ success: false, error: 'Invalid list ID' }, 400)
  
  const service = new ItemService(c.env.DB)
  const items = await service.getListItems(listId)
  return c.json({ success: true, items })
})

itemsRoutes.post('/:listId/items', csrfProtection, requireListMember(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  if (!listId) return c.json({ success: false, error: 'Invalid list ID' }, 400)
  
  const user = c.get('user')!
  const body = await c.req.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const count = typeof body.count === 'number' ? body.count : 1
  const unit = typeof body.unit === 'string' ? body.unit.trim() : '個'
  const category = typeof body.category === 'string' ? body.category.trim() : 'other'
  let imageId: number | undefined
  if (body.image_id !== undefined && body.image_id !== null) {
    const parsedImageId = parsePositiveInt(body.image_id)
    if (!parsedImageId) {
      return c.json({ success: false, error: 'Invalid image ID' }, 400)
    }
    imageId = parsedImageId
  }

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
  const listId = parsePositiveInt(c.req.param('listId'))
  const itemId = parsePositiveInt(c.req.param('itemId'))
  if (!listId || !itemId) return c.json({ success: false, error: 'Invalid ID' }, 400)
  
  const user = c.get('user')!
  const body = await c.req.json()

  if (typeof body.bought !== 'boolean') return c.json({ success: false, error: 'Invalid payload' }, 400)

  const service = new ItemService(c.env.DB)
  const success = await service.updateBoughtStatus(listId, itemId, body.bought, user.id)
  
  if (!success) {
    return c.json({ success: false, error: 'Item not found' }, 404)
  }

  return c.json({ success: true })
})

itemsRoutes.delete('/:listId/items/:itemId', csrfProtection, requireListMember(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  const itemId = parsePositiveInt(c.req.param('itemId'))
  if (!listId || !itemId) return c.json({ success: false, error: 'Invalid ID' }, 400)

  const repo = new (await import('./repository')).ItemRepository(c.env.DB)
  const exists = await repo.checkItemExists(itemId, listId)
  if (!exists) return c.json({ success: false, error: 'Item not found' }, 404)

  const imgService = new (await import('../images/service')).ImageService(c.env.DB, c.env)
  const { imageDeleted, imageDeletionPending, cloudinaryResult } = await imgService.deleteItemImageInternal(listId, itemId)

  const success = await repo.deleteItem(itemId, listId)
  if (!success) {
    return c.json({ success: false, error: 'Item not found' }, 404)
  }

  return c.json({ success: true, imageDeleted, imageDeletionPending, cloudinaryResult })
})

export { itemsRoutes }
