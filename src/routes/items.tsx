import { Hono } from 'hono'
import { getSignedCookie } from 'hono/cookie'
import { ShoppingList } from '../components/ShoppingList'
import { authMiddleware, getCookieSecret } from '../lib/middleware'
import { checkRateLimit } from '../lib/rateLimit'
import type { Bindings, Variables, Item, Family, User, CloudinaryResponse } from '../types'

const items = new Hono<{ Bindings: Bindings, Variables: Variables }>()

items.use('*', authMiddleware)

async function getUserId(c: import('hono').Context<{ Bindings: Bindings, Variables: Variables }>, username: string, familyId: number) {
  const user = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? AND family_id = ?').bind(username, familyId).first<User>()
  return user?.id || 0
}

async function cleanupImages(c: import('hono').Context<{ Bindings: Bindings, Variables: Variables }>, familyId: number) {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  
  // Cleanup temporary images older than 24h
  const toDelete = await c.env.DB.prepare(`
    SELECT id, public_id FROM uploaded_images 
    WHERE status IN ('temporary', 'deletion_pending') AND created_at < ? LIMIT 5
  `).bind(yesterday).all<{id: number, public_id: string}>()

  if (toDelete.results && toDelete.results.length > 0) {
    for (const img of toDelete.results) {
      if (c.env.CLOUDINARY_API_KEY && c.env.CLOUDINARY_API_SECRET) {
        const timestamp = Math.round(new Date().getTime() / 1000)
        const str = `public_id=${img.public_id}&timestamp=${timestamp}${c.env.CLOUDINARY_API_SECRET}`
        const signature = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str)))).map(b => b.toString(16).padStart(2, '0')).join('')

        try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${c.env.CLOUD_NAME}/image/destroy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_id: img.public_id, timestamp, api_key: c.env.CLOUDINARY_API_KEY, signature })
          })
          const data = await res.json<CloudinaryResponse>()
          if (data.result === 'ok' || data.result === 'not found') {
            await c.env.DB.prepare('DELETE FROM uploaded_images WHERE id = ?').bind(img.id).run()
          } else {
             await c.env.DB.prepare('UPDATE uploaded_images SET status = ? WHERE id = ?').bind('deletion_pending', img.id).run()
          }
        } catch (e) {
           await c.env.DB.prepare('UPDATE uploaded_images SET status = ? WHERE id = ?').bind('deletion_pending', img.id).run()
        }
      }
    }
  }
}

items.get('/', async (c) => {
  let secret: string
  try {
    secret = getCookieSecret(c)
  } catch (e) {
    return c.json({ success: false, error: 'サーバー設定エラーが発生しました。' }, 500)
  }

  const user = (await getSignedCookie(c, secret, 'session')) || ''
  const role = (await getSignedCookie(c, secret, 'role')) || ''

  if (user === c.env.ADMIN_USER && role === 'admin') {
    return c.redirect('/admin')
  }

  const familyId = c.get('family_id')
  const family = await c.env.DB.prepare('SELECT name FROM families WHERE id = ?').bind(familyId).first<Family>()

  return c.render(
    <ShoppingList 
      familyName={family?.name || ''} 
      user={user} 
      role={role} 
      cloudName={c.env.CLOUD_NAME} 
      uploadPreset={c.env.UPLOAD_PRESET} 
    />
  )
})

items.get('/api/items', async (c) => {
  const familyId = c.get('family_id')
  
  if (Math.random() < 0.1) {
    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
      c.executionCtx.waitUntil(cleanupImages(c, familyId))
    } else {
      await cleanupImages(c, familyId)
    }
  }

  const { results } = await c.env.DB.prepare(`
    SELECT i.id, i.name, i.count, i.unit, i.bought, i.category, u.secure_url as image_url 
    FROM items i
    LEFT JOIN uploaded_images u ON u.item_id = i.id
    WHERE i.family_id = ? ORDER BY i.created_at DESC
  `).bind(familyId).all<Item>()
  return c.json(results || [])
})

items.post('/api/images/signature', async (c) => {
  const rl = await checkRateLimit(c, { action: 'image-sig', limit: 20, windowSeconds: 60 })
  if (!rl.success) return c.json({ success: false, error: 'Rate limit exceeded' }, 429)

  const familyId = c.get('family_id')
  const secret = getCookieSecret(c)
  const username = (await getSignedCookie(c, secret, 'session')) || ''
  const userId = await getUserId(c, username, familyId)
  
  const timestamp = Math.round(new Date().getTime() / 1000)
  const folder = `family_${familyId}`
  const nonce = Math.random().toString(36).substring(2, 10)
  const public_id = `img_${timestamp}_${nonce}`
  const full_public_id = `${folder}/${public_id}`

  const str = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${c.env.CLOUDINARY_API_SECRET}`
  const signature = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str)))).map(b => b.toString(16).padStart(2, '0')).join('')

  await c.env.DB.prepare(
    'INSERT INTO uploaded_images (public_id, secure_url, family_id, uploaded_by_user_id, status) VALUES (?, ?, ?, ?, ?)'
  ).bind(full_public_id, '', familyId, userId, 'reserved').run()

  return c.json({
    signature,
    timestamp,
    public_id,
    folder,
    api_key: c.env.CLOUDINARY_API_KEY
  })
})

items.post('/api/images/complete', async (c) => {
  const rl = await checkRateLimit(c, { action: 'image-complete', limit: 20, windowSeconds: 60 })
  if (!rl.success) return c.json({ success: false, error: 'Rate limit exceeded' }, 429)

  const { public_id, version, signature, secure_url } = await c.req.json()
  const familyId = c.get('family_id')
  
  const expectedStr = `public_id=${public_id}&version=${version}${c.env.CLOUDINARY_API_SECRET}`
  const expectedSig = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(expectedStr)))).map(b => b.toString(16).padStart(2, '0')).join('')

  if (expectedSig !== signature) {
    return c.json({ success: false, error: 'Invalid signature' }, 403)
  }

  const record = await c.env.DB.prepare('SELECT id FROM uploaded_images WHERE public_id = ? AND family_id = ? AND status = ?').bind(public_id, familyId, 'reserved').first()
  if (!record) return c.json({ success: false, error: 'Image not found or not reserved' }, 404)

  await c.env.DB.prepare('UPDATE uploaded_images SET status = ?, secure_url = ? WHERE id = ?').bind('temporary', secure_url, record.id).run()

  return c.json({ success: true, image_id: record.id })
})

items.post('/api/items', async (c) => {
  const { name, count, unit, category, image_id } = await c.req.json()
  
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return c.json({ success: false, error: '商品名は必須です。' }, 400)
  }
  if (name.length > 100) return c.json({ success: false, error: '商品名は100文字以内で入力してください。' }, 400)
  
  const parsedCount = parseInt(count, 10)
  if (isNaN(parsedCount) || parsedCount <= 0) return c.json({ success: false, error: '個数は1以上の数値で指定してください。' }, 400)
  if (unit && (typeof unit !== 'string' || unit.length > 20)) return c.json({ success: false, error: '単位は20文字以内で入力してください。' }, 400)
  
  const validCategories = ['dad', 'mom', 'kids', 'other']
  if (!validCategories.includes(category)) return c.json({ success: false, error: '無効なカテゴリです。' }, 400)

  const familyId = c.get('family_id')
  
  const res = await c.env.DB.prepare('INSERT INTO items (name, count, unit, category, family_id) VALUES (?, ?, ?, ?, ?) RETURNING id')
    .bind(name, parsedCount, unit || '個', category, familyId).first<{id: number}>()
    
  if (image_id) {
    const imgCheck = await c.env.DB.prepare('SELECT id FROM uploaded_images WHERE id = ? AND family_id = ? AND status = ?').bind(image_id, familyId, 'temporary').first()
    if (imgCheck && res) {
      await c.env.DB.prepare('UPDATE uploaded_images SET status = ?, item_id = ? WHERE id = ?').bind('attached', res.id, image_id).run()
    }
  }

  return c.json({ success: true }, 201)
})

items.patch('/api/items/:id', async (c) => {
  const id = c.req.param('id')
  const { bought } = await c.req.json()
  const familyId = c.get('family_id')
  await c.env.DB.prepare('UPDATE items SET bought = ? WHERE id = ? AND family_id = ?').bind(bought ? 1 : 0, id, familyId).run()
  return c.json({ success: true })
})

items.delete('/api/items/:id', async (c) => {
  const id = c.req.param('id')
  const familyId = c.get('family_id')
  
  const item = await c.env.DB.prepare('SELECT id FROM items WHERE id = ? AND family_id = ?').bind(id, familyId).first<Item>()
  if (!item) return c.json({ success: false, error: '対象の商品が見つかりません。' }, 404)

  let imageDeleted = true
  let imageDeletionPending = false
  let cloudinaryResult = 'no_image'

  const img = await c.env.DB.prepare('SELECT id, public_id FROM uploaded_images WHERE item_id = ? AND family_id = ?').bind(id, familyId).first<{id: number, public_id: string}>()
  
  if (img) {
    if (c.env.CLOUDINARY_API_KEY && c.env.CLOUDINARY_API_SECRET) {
      const timestamp = Math.round(new Date().getTime() / 1000)
      const str = `public_id=${img.public_id}&timestamp=${timestamp}${c.env.CLOUDINARY_API_SECRET}`
      const signature = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str)))).map(b => b.toString(16).padStart(2, '0')).join('')

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${c.env.CLOUD_NAME}/image/destroy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: img.public_id, timestamp, api_key: c.env.CLOUDINARY_API_KEY, signature })
        })
        const data = await res.json<CloudinaryResponse>()
        cloudinaryResult = data.result
        if (data.result === 'ok' || data.result === 'not found') {
          await c.env.DB.prepare('DELETE FROM uploaded_images WHERE id = ?').bind(img.id).run()
        } else {
          imageDeleted = false
          imageDeletionPending = true
          await c.env.DB.prepare('UPDATE uploaded_images SET status = ?, item_id = NULL WHERE id = ?').bind('deletion_pending', img.id).run()
        }
      } catch (err) {
        imageDeleted = false
        imageDeletionPending = true
        cloudinaryResult = 'error'
        await c.env.DB.prepare('UPDATE uploaded_images SET status = ?, item_id = NULL WHERE id = ?').bind('deletion_pending', img.id).run()
      }
    } else {
       imageDeleted = false
       imageDeletionPending = true
       cloudinaryResult = 'no_creds'
       await c.env.DB.prepare('UPDATE uploaded_images SET status = ?, item_id = NULL WHERE id = ?').bind('deletion_pending', img.id).run()
    }
  }

  // Delete DB record
  await c.env.DB.prepare('DELETE FROM items WHERE id = ? AND family_id = ?').bind(id, familyId).run()

  return c.json({
    success: true,
    itemDeleted: true,
    imageDeleted,
    imageDeletionPending,
    cloudinaryResult
  })
})

export default items
