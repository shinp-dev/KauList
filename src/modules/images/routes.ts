import { Hono } from 'hono'
import { parsePositiveInt } from '../../lib/validators'
import type { Bindings, Variables } from '../../types'
import { requireAuth, requireListMember } from '../../middleware/auth'
import { ImageService } from './service'
import { checkRateLimit } from '../../lib/rateLimit'
import { csrfProtection } from '../../middleware/csrf'
import { generateCloudinarySignature } from './cloudinary'
import { ImageRepository } from './repository'

const imagesRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

imagesRoutes.use('*', requireAuth)

imagesRoutes.post('/:listId/images/signature', csrfProtection, requireListMember(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  if (!listId) return c.json({ success: false, error: 'Invalid list ID' }, 400)
  
  const user = c.get('user')!

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'image-signature', limit: 10, windowSeconds: 60 }, [
    { scope: 'userId', value: user.id.toString() },
    { scope: 'listId', value: listId.toString() },
    { scope: 'ip-userId-listId', value: `${ip}:${user.id}:${listId}` }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  if (!c.env.CLOUDINARY_API_KEY || !c.env.CLOUDINARY_API_SECRET || !c.env.CLOUD_NAME) {
    return c.json({ success: false, error: 'Cloudinary credentials missing' }, 500)
  }

  const { signature, timestamp, publicId } = await generateCloudinarySignature(c.env, listId)

  const repo = new ImageRepository(c.env.DB)
  const imageId = await repo.reserveImage(publicId, listId, user.id)

  return c.json({ success: true, signature, timestamp, public_id: publicId, api_key: c.env.CLOUDINARY_API_KEY, image_id: imageId })
})

imagesRoutes.post('/:listId/images/complete', csrfProtection, requireListMember(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  if (!listId) return c.json({ success: false, error: 'Invalid list ID' }, 400)

  const user = c.get('user')!
  const body = await c.req.json()

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'image-complete', limit: 10, windowSeconds: 60 }, [
    { scope: 'userId', value: user.id.toString() },
    { scope: 'listId', value: listId.toString() },
    { scope: 'ip-userId-listId', value: `${ip}:${user.id}:${listId}` }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  if (!c.env.CLOUDINARY_API_SECRET) {
    return c.json({ success: false, error: 'Config missing' }, 500)
  }

  const { public_id, version, signature } = body
  if (!public_id || !version || !signature) {
    return c.json({ success: false, error: 'Missing params' }, 400)
  }

  const strToSign = `public_id=${public_id}&version=${version}${c.env.CLOUDINARY_API_SECRET}`
  const expectedSigBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(strToSign))
  const expectedSig = Array.from(new Uint8Array(expectedSigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (signature !== expectedSig) {
    return c.json({ success: false, error: 'Invalid signature' }, 403)
  }

  const service = new ImageService(c.env.DB, c.env)
  const result = await service.verifyAndCompleteImage(public_id, listId, user.id, version, signature)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, secure_url: result.secureUrl, image_id: result.imageId })
})

imagesRoutes.delete('/:listId/images/:imageId', csrfProtection, requireListMember(), async (c) => {
  const listId = parsePositiveInt(c.req.param('listId'))
  const imageId = parsePositiveInt(c.req.param('imageId'))
  if (!listId || !imageId) return c.json({ success: false, error: 'Invalid ID' }, 400)
  
  const user = c.get('user')!

  const service = new ImageService(c.env.DB, c.env)
  const result = await service.deleteTemporaryImage(imageId, listId, user.id)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, imageDeleted: true })
})

export { imagesRoutes }
