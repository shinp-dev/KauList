import { Hono } from 'hono'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListMember } from '../../middleware/auth'
import { ItemService } from './service'
import { ImageService } from '../images/service'
import { checkRateLimit } from '../../lib/rateLimit'
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
  const category = ['food', 'daily', 'medicine', 'other'].includes(body.category) ? body.category : 'other'
  const image_id = typeof body.image_id === 'number' ? body.image_id : undefined

  if (!name || name.length > 100 || unit.length > 20 || count < 1) {
    return c.json({ success: false, error: 'Invalid input' }, 400)
  }

  const service = new ItemService(c.env.DB)

  try {
    const item = await service.createItem(listId, user.id, name, count, unit, category, image_id)
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

  if (typeof body.bought !== 'boolean') {
    return c.json({ success: false, error: 'Invalid payload' }, 400)
  }

  const service = new ItemService(c.env.DB)
  await service.updateBoughtStatus(listId, itemId, body.bought, user.id)

  return c.json({ success: true })
})

itemsRoutes.delete('/:listId/items/:itemId', csrfProtection, requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const itemId = Number(c.req.param('itemId'))

  const imgService = new ImageService(c.env.DB, c.env)
  const { imageDeleted, imageDeletionPending, cloudinaryResult } = await imgService.deleteItemImage(listId, itemId)

  const itemService = new ItemService(c.env.DB)
  await itemService.deleteItem(listId, itemId) // Currently just a dummy since deleteItem in service doesn't actually delete in our logic there? Wait, the service deleteItem just checks existence. I should write the DELETE query.
  
  // Actually, deleteItem in service currently doesn't run the delete query. I'll just run it here or fix the service.
  await c.env.DB.prepare('DELETE FROM items WHERE id = ? AND list_id = ?').bind(itemId, listId).run()

  return c.json({ success: true, imageDeleted, imageDeletionPending, cloudinaryResult })
})

export { itemsRoutes }
