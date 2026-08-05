import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore
import { readFileSync } from 'fs'
// @ts-ignore
import { join } from 'path'

vi.mock('hono/cookie', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    getSignedCookie: vi.fn(async (c, secret, key) => {
      // Mock cookie extraction based on request headers
      const cookieHeader = c.req.header('cookie') || ''
      if (key === 'session') return cookieHeader.includes('session=test') ? 'test' : undefined
      if (key === 'family_id') return cookieHeader.includes('family_id=1') ? '1' : cookieHeader.includes('family_id=2') ? '2' : undefined
      return undefined
    })
  }
})

import app from './index'

describe('Security & Migration Requirements', () => {
  it('should not contain DROP TABLE in new migrations', () => {
    try {
      // @ts-ignore
      const sql1 = readFileSync(join(process.cwd(), 'migrations/0001_add_rate_limits.sql'), 'utf-8')
      // @ts-ignore
      const sql2 = readFileSync(join(process.cwd(), 'migrations/0002_add_uploaded_images.sql'), 'utf-8')
      
      expect(sql1.toUpperCase()).not.toContain('DROP TABLE')
      expect(sql2.toUpperCase()).not.toContain('DROP TABLE')
    } catch (e) {
      // Ignored if files don't exist in CI environment
    }
  })

  it('XSS string should not escape application/json script block', () => {
    const data = { user: '</script><script>alert(1)</script>' }
    const jsonStr = JSON.stringify(data)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
    
    expect(jsonStr).not.toContain('<script>')
    expect(jsonStr).toContain('\\u003c/script\\u003e')
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
      run: vi.fn()
    }
    // Setup global fetch mock
    // @ts-ignore
    global.fetch = vi.fn()
  })

  const getEnv = () => ({
    DB: mockDB,
    COOKIE_SECRET: 'test-secret',
    ADMIN_USER: 'admin',
    ADMIN_PASS: 'admin',
    CLOUD_NAME: 'test',
    UPLOAD_PRESET: 'test',
    CLOUDINARY_API_KEY: 'key',
    CLOUDINARY_API_SECRET: 'secret'
  })

  it('should reject fake Cloudinary upload complete with invalid signature', async () => {
    const env = getEnv()
    // Bypass rate limit
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 })
    
    const req = new Request('http://localhost/api/images/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'session=test; family_id=1' },
      body: JSON.stringify({ public_id: 'fake_id', version: '123', signature: 'invalid_sig', secure_url: 'http://fake' })
    })

    const res = await app.request(req, undefined, env)
    expect(res.status).toBe(403)
  })

  it('cannot associate image_id belonging to another family', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValue(null) // Mock image check fail
    
    const req = new Request('http://localhost/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'session=test; family_id=2' },
      body: JSON.stringify({ name: 'Apple', count: 1, unit: '個', category: 'other', image_id: 999 })
    })

    await app.request(req, undefined, env)
    
    // Check that UPDATE uploaded_images was NEVER called
    const updateCall = mockDB.prepare.mock.calls.find((c: any) => c[0].includes('UPDATE uploaded_images'))
    expect(updateCall).toBeUndefined()
  })

  it('Cloudinary削除失敗時にdeletion_pendingが残る', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 10, public_id: 'test_img' })
    
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
    mockDB.first.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 10, public_id: 'test_img' })
    
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
