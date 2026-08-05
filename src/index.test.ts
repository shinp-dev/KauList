import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { ShoppingListPage } from './components/ShoppingListPage'
import { jsx } from 'hono/jsx'
import app from './index'

vi.mock('hono/cookie', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    getCookie: vi.fn((c, key) => {
      if (key === 'session_token') return c.req.header('cookie')?.includes('session_token=test') ? 'test' : undefined
      return undefined
    })
  }
})

vi.mock('./lib/crypto', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    hashToken: vi.fn(async (t) => t === 'test' ? 'testhash' : 'otherhash'),
    hashPassword: vi.fn(async (p) => 'hashed_' + p),
    verifyPassword: vi.fn(async (p, h) => h === 'hashed_' + p)
  }
})

describe('Security & Migration Requirements', () => {
  it('migration files must exist and be readable', () => {
    // @ts-ignore
    const p = join(process.cwd(), 'migrations/0004_rebuild_to_shared_lists.sql')
    expect(existsSync(p)).toBe(true)
    const content = readFileSync(p, 'utf-8')
    expect(content).toContain('CREATE TABLE shopping_lists')
  })

  it('XSS testing via ShoppingListPage component rendering', async () => {
    const maliciousName = '</script><script>alert(1)</script>'
    const element = ShoppingListPage({
      currentList: { id: 1, name: maliciousName },
      user: { id: 1, display_name: 'test' },
      lists: [],
      members: [],
      role: 'owner',
      cloudName: 'test_cloud'
    })
    
    const htmlString = element.toString()
    expect(htmlString).not.toContain('</script><script>alert(1)</script>')
    expect(htmlString).toContain('&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt;')
  })
})

describe('API Integration Tests', () => {
  let mockDB: any
  let mathRandomSpy: any

  beforeEach(() => {
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(1) // Disable random cleanup
    
    mockDB = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn(),
      run: vi.fn().mockResolvedValue({ success: true })
    }
  })

  afterEach(() => {
    mathRandomSpy.mockRestore()
  })

  const getEnv = () => ({
    DB: mockDB,
    CLOUD_NAME: 'test',
    CLOUDINARY_API_KEY: 'key',
    CLOUDINARY_API_SECRET: 'secret'
  })

  it('Cannot associate image_id belonging to another user', async () => {
    const env = getEnv()
    
    mockDB.first.mockResolvedValueOnce({ id: 1, login_id: 'test', display_name: 'test', expires_at: '2999-01-01T00:00:00Z' }) // Session
    mockDB.first.mockResolvedValueOnce({ role: 'member' }) // List membership
    mockDB.first.mockResolvedValueOnce(null) // Image ownership check fails
    
    const req = new Request('http://localhost/api/lists/1/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'session_token=test' },
      body: JSON.stringify({ name: 'Apple', count: 1, unit: '個', category: 'other', image_id: 999 })
    })

    const res = await app.request(req, undefined, env)
    expect(res.status).toBe(400) // Invalid image
  })
  
  it('Authentication failure does not leak user existence', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 }) // rl IP
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 }) // rl loginId
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 }) // rl ip-loginId
    mockDB.first.mockResolvedValueOnce(null) // User not found
    
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: 'nonexistent', password: 'password123' })
    })

    const res = await app.request(req, undefined, env)
    const data = await res.json() as any
    expect(res.status).toBe(401)
    expect(data.error).toBe('ログインIDまたはパスワードが正しくありません。')
  })
  
  it('Rate limit threshold triggers 429', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ count: 11, reset_at: 9999999999 }) // Exceeded
    
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: 'test', password: 'password123' })
    })

    const res = await app.request(req, undefined, env)
    expect(res.status).toBe(429)
  })
  
  it('Owner can issue invite', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ id: 1, login_id: 'test', display_name: 'test', expires_at: '2999-01-01T00:00:00Z' }) // Session
    mockDB.first.mockResolvedValueOnce({ role: 'owner' }) // Owner check
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 }) // rl IP
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 }) // rl userId
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 }) // rl listId
    mockDB.first.mockResolvedValueOnce({ count: 1, reset_at: 9999999999 }) // rl ip-userId
    mockDB.first.mockResolvedValueOnce({ id: 123, expires_at: '2999-01-01T00:00:00Z' }) // Created invite
    
    const req = new Request('http://localhost/api/lists/1/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'session_token=test' }
    })

    const res = await app.request(req, undefined, env)
    expect(res.status).toBe(201)
  })
  
  it('Member cannot issue invite', async () => {
    const env = getEnv()
    mockDB.first.mockResolvedValueOnce({ id: 1, login_id: 'test', display_name: 'test', expires_at: '2999-01-01T00:00:00Z' }) // Session
    mockDB.first.mockResolvedValueOnce({ role: 'member' }) // Member check -> not owner
    
    const req = new Request('http://localhost/api/lists/1/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'session_token=test' }
    })

    const res = await app.request(req, undefined, env)
    expect(res.status).toBe(403)
  })
})
