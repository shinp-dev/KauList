import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore
import { readFileSync, existsSync } from 'fs'
// @ts-ignore
import { join } from 'path'
import { ShoppingList } from './components/ShoppingList'
import { jsx } from 'hono/jsx'

vi.mock('hono/cookie', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    getSignedCookie: vi.fn(async (c, secret, key) => {
      const cookieHeader = c.req.header('cookie') || ''
      if (key === 'session') return cookieHeader.includes('session=test') ? 'test' : undefined
      if (key === 'family_id') return cookieHeader.includes('family_id=1') ? '1' : cookieHeader.includes('family_id=2') ? '2' : undefined
      return undefined
    })
  }
})

import app from './index'

describe('Security & Migration Requirements', () => {
  it('migration files must exist and be readable', () => {
    const files = [
      'migrations/0001_add_rate_limits.sql',
      'migrations/0002_add_uploaded_images.sql',
      'migrations/0003_harden_uploaded_images.sql'
    ]
    
    for (const file of files) {
      // @ts-ignore
      const p = join(process.cwd(), file)
      expect(existsSync(p)).toBe(true)
      const content = readFileSync(p, 'utf-8')
      expect(content.length).toBeGreaterThan(0)
    }
  })

  it('XSS testing via ShoppingList component rendering', async () => {
    const maliciousName = '</script><script>alert(1)</script>'
    const element = ShoppingList({
      familyName: maliciousName,
      user: 'test_user',
      role: 'member',
      cloudName: 'test_cloud'
    })
    
    // Convert the rendered node to string to check how it will be output
    const htmlString = element.toString()
    
    // The rendered HTML for the script tag should properly escape the malicious string
    expect(htmlString).not.toContain('</script><script>alert(1)</script>')
    expect(htmlString).toContain('\\u003c/script\\u003e')
  })
})

describe('Image & Family Logic Integration', () => {
  let mockDB: any

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn(),
      run: vi.fn().mockResolvedValue({ success: true })
    }
    // @ts-ignore
    global.fetch = vi.fn()
  })

  const getEnv = () => ({
    DB: mockDB,
    COOKIE_SECRET: 'test-secret',
    ADMIN_USER: 'admin',
    ADMIN_PASS: 'admin',
    CLOUD_NAME: 'test',
    CLOUDINARY_API_KEY: 'key',
    CLOUDINARY_API_SECRET: 'secret'
  })

  it('should reject fake Cloudinary upload complete with invalid signature', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ id: 1 }) // UserId check
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 }) // Rate limit bypass
    
    const req = new Request('http://localhost/api/images/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'session=test; family_id=1' },
      body: JSON.stringify({ public_id: 'fake_id', version: '123', signature: 'invalid_sig' })
    })

    const res = await app.request(req, undefined, env)
    expect(res.status).toBe(403)
  })

  it('cannot associate image_id belonging to another family or user', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ id: 1 }) // User ID check
    mockDB.first.mockResolvedValueOnce(null) // Mock image check fail (wrong owner/family)
    
    const req = new Request('http://localhost/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'session=test; family_id=2' },
      body: JSON.stringify({ name: 'Apple', count: 1, unit: '個', category: 'other', image_id: 999 })
    })

    const res = await app.request(req, undefined, env)
    
    // Check that it failed with 400 because image validation failed
    expect(res.status).toBe(400)
    
    // Check that INSERT items was NEVER called
    const insertCall = mockDB.prepare.mock.calls.find((c: any) => c[0].includes('INSERT INTO items'))
    expect(insertCall).toBeUndefined()
  })

  it('Cloudinary削除失敗時にdeletion_pendingが残る', async () => {
    const env = getEnv()
    // User check -> Item check -> Image check
    mockDB.first.mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 1 }) 
      .mockResolvedValueOnce({ id: 10, public_id: 'test_img' })
    
    // @ts-ignore
    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ result: 'error' })
    })

    const req = new Request('http://localhost/api/items/1', {
      method: 'DELETE',
      headers: { 'Cookie': 'session=test; family_id=1' }
    })
    
    const res = await app.request(req, undefined, env)
    const json = (await res.json()) as any

    expect(json.imageDeleted).toBe(false)
    expect(json.imageDeletionPending).toBe(true)
    
    const statusUpdateCall = mockDB.bind.mock.calls.find((c: any) => c[0] === 'deletion_pending')
    expect(statusUpdateCall).toBeDefined()
  })

  it('okとnot foundは削除完了として扱う', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 10, public_id: 'test_img' })
    
    // @ts-ignore
    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ result: 'not found' })
    })

    const req = new Request('http://localhost/api/items/1', {
      method: 'DELETE',
      headers: { 'Cookie': 'session=test; family_id=1' }
    })
    
    const res = await app.request(req, undefined, env)
    const json = (await res.json()) as any

    expect(json.imageDeleted).toBe(true)
    
    const deleteImgCall = mockDB.prepare.mock.calls.find((c: any) => c[0].includes('DELETE FROM uploaded_images'))
    expect(deleteImgCall).toBeDefined()
  })
})

describe('Rate Limiting', () => {
  let mockDB: any

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn()
    }
  })

  const getEnv = () => ({
    DB: mockDB,
    COOKIE_SECRET: 'test-secret'
  })

  it('Rate limit threshold triggers 429', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ count: 11, reset_at: 9999999999 })
    
    const req = new Request('http://localhost/api/register-family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyName: 'test', username: 'test', password: 'password123' })
    })

    const res = await app.request(req, undefined, env)
    expect(res.status).toBe(429)
  })
})
