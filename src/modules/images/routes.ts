import { Hono } from 'hono'
import type { Bindings, Variables, UploadedImage } from '../../types'
import { requireAuth, requireListMember } from '../../middleware/auth'
import { ImageService } from './service'
import { checkRateLimit } from '../../lib/rateLimit'
import { csrfProtection } from '../../middleware/csrf'

const imagesRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

imagesRoutes.use('*', requireAuth)

imagesRoutes.post('/:listId/images/signature', csrfProtection, requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const user = c.get('user')!

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'image-signature', limit: 10, windowSeconds: 60 }, [
    { scope: 'ip-userId-listId', value: `${ip}:${user.id}:${listId}` }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  if (!c.env.CLOUDINARY_API_KEY || !c.env.CLOUDINARY_API_SECRET || !c.env.CLOUD_NAME) {
    return c.json({ success: false, error: 'Cloudinary credentials missing' }, 500)
  }

  const timestamp = Math.round(new Date().getTime() / 1000)
  const randomStr = crypto.randomUUID()
  const folder = `lists/${listId}`
  const publicId = `${folder}/${randomStr}`
  
  const strToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${c.env.CLOUDINARY_API_SECRET}`
  const signatureBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(strToSign))
  const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  const res = await c.env.DB.prepare(
    'INSERT INTO uploaded_images (public_id, list_id, uploaded_by_user_id, status) VALUES (?, ?, ?, ?) RETURNING id'
  ).bind(publicId, listId, user.id, 'reserved').first<{id: number}>()

  if (!res) return c.json({ success: false, error: 'Failed to reserve image' }, 500)

  return c.json({ success: true, signature, timestamp, public_id: publicId, folder, api_key: c.env.CLOUDINARY_API_KEY, image_id: res.id })
})

imagesRoutes.post('/:listId/images/complete', csrfProtection, requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const user = c.get('user')!
  const body = await c.req.json()

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

  const img = await c.env.DB.prepare(
    'SELECT * FROM uploaded_images WHERE public_id = ? AND list_id = ? AND uploaded_by_user_id = ? AND status = ?'
  ).bind(public_id, listId, user.id, 'reserved').first<UploadedImage>()

  if (!img) {
    return c.json({ success: false, error: 'Invalid image record' }, 404)
  }

  const secure_url = `https://res.cloudinary.com/${c.env.CLOUD_NAME}/image/upload/v${version}/${public_id}.jpg`

  await c.env.DB.prepare(
    'UPDATE uploaded_images SET status = ?, secure_url = ?, updated_at = ? WHERE id = ?'
  ).bind('temporary', secure_url, new Date().toISOString(), img.id).run()

  return c.json({ success: true, secure_url, image_id: img.id })
})

imagesRoutes.delete('/:listId/images/:imageId', csrfProtection, requireListMember(), async (c) => {
  const listId = Number(c.req.param('listId'))
  const imageId = Number(c.req.param('imageId'))
  const user = c.get('user')!

  const img = await c.env.DB.prepare('SELECT id, public_id, uploaded_by_user_id FROM uploaded_images WHERE id = ? AND list_id = ?').bind(imageId, listId).first<{id: number, public_id: string, uploaded_by_user_id: number}>()
  if (!img) return c.json({ success: false, error: 'Not found' }, 404)

  if (img.uploaded_by_user_id !== user.id) {
    return c.json({ success: false, error: 'Forbidden' }, 403)
  }

  const service = new ImageService(c.env.DB, c.env)
  
  // Custom logic for direct image deletion:
  const cloudinaryResult = await import('./cloudinary').then(m => m.deleteCloudinaryImage(c.env, img.public_id))
  
  if (cloudinaryResult === 'ok' || cloudinaryResult === 'not found') {
    await service.deleteImageRecord(img.id)
    return c.json({ success: true, imageDeleted: true })
  } else {
    await service.markAsDeletionPending(img.id, cloudinaryResult)
    return c.json({ success: true, imageDeleted: false, imageDeletionPending: true, error: cloudinaryResult })
  }
})

export { imagesRoutes }
