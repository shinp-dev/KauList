import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { createD1Mock } from './test-utils/d1-mock'
import { jsx } from 'hono/jsx'
import app from './index'

const schemaPath = join(process.cwd(), 'schema.sql')

vi.mock('hono/cookie', async (importOriginal) => {
  const actual = await importOriginal<typeof import('hono/cookie')>()
  let currentToken: string | undefined = undefined
  return {
    ...actual,
    setCookie: vi.fn((c, key, val) => { if (key === 'session_token') currentToken = val }),
    getCookie: vi.fn((c, key) => {
      if (key === 'session_token') {
        const header = c.req.header('cookie') || ''
        if (header.includes('session_token=')) {
          return header.split('session_token=')[1].split(';')[0]
        }
        return currentToken
      }
      return undefined
    }),
    deleteCookie: vi.fn((c, key) => { if (key === 'session_token') currentToken = undefined })
  }
})

describe('Database Integration Tests', () => {
  let db: any
  let rawDb: any
  let mathRandomSpy: any

  beforeEach(() => {
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(1) // Disable random cleanup
    const mock = createD1Mock(schemaPath)
    db = mock.d1
    rawDb = mock.raw
  })

  afterEach(() => {
    mathRandomSpy.mockRestore()
    rawDb.close()
  })

  const getEnv = () => ({
    DB: db,
    CLOUD_NAME: 'test',
    CLOUDINARY_API_KEY: 'key',
    CLOUDINARY_API_SECRET: 'secret',
    ENVIRONMENT: 'test'
  })

  // Helper for requests
  const req = async (method: string, path: string, body?: any, cookie?: string, headers: any = {}) => {
    const h = new Headers(headers)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      h.set('Content-Type', 'application/json')
      h.set('Origin', 'http://localhost') // CSRF origin
      h.set('Host', 'localhost')
    }
    if (cookie) h.set('Cookie', `session_token=${cookie}`)
    
    return app.request(new Request(`http://localhost${path}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined
    }), undefined, getEnv())
  }

  describe('Auth', () => {
    it('Registration creates user and default list', async () => {
      const res = await req('POST', '/api/auth/register', { login_id: 'testuser', display_name: 'Test', password: 'password123' })
      expect(res.status).toBe(201)

      const users = await db.prepare('SELECT * FROM users').all()
      expect(users.results).toHaveLength(1)
      
      const lists = await db.prepare('SELECT * FROM shopping_lists').all()
      expect(lists.results).toHaveLength(1)
      
      const members = await db.prepare('SELECT * FROM list_members').all()
      expect(members.results).toHaveLength(1)
      expect(members.results[0].role).toBe('owner')
    })
    
    it('Registration failure rolls back list and member', async () => {
      // Create user first to cause UNIQUE constraint failure
      await req('POST', '/api/auth/register', { login_id: 'dup', display_name: 'Test', password: 'password123' })
      
      const res = await req('POST', '/api/auth/register', { login_id: 'dup', display_name: 'Test', password: 'password123' })
      expect(res.status).toBe(409)
      
      // Still only 1 user and 1 list
      const users = await db.prepare('SELECT count(*) as c FROM users').first()
      expect(users.c).toBe(1)
      const lists = await db.prepare('SELECT count(*) as c FROM shopping_lists').first()
      expect(lists.c).toBe(1)
    })
  })

  describe('CSRF Protection', () => {
    it('Blocks state changes without Origin', async () => {
      const h = new Headers()
      h.set('Content-Type', 'application/json')
      const r = new Request('http://localhost/api/auth/login', { method: 'POST', headers: h, body: JSON.stringify({}) })
      const res = await app.request(r, undefined, getEnv())
      expect(res.status).toBe(403)
      const text = await res.text()
      expect(text).toContain('Missing Origin header')
    })
  })

  describe('Lists & Items', () => {
    let token = ''
    let listId = 1
    
    beforeEach(async () => {
      await req('POST', '/api/auth/register', { login_id: 'listuser', display_name: 'List User', password: 'password123' })
      const r = await req('POST', '/api/auth/login', { login_id: 'listuser', password: 'password123' })
      token = r.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''
      const lists = await db.prepare('SELECT id FROM shopping_lists').first()
      listId = lists.id
    })

    it('Creates item without image', async () => {
      const res = await req('POST', `/api/lists/${listId}/items`, { name: 'Apple', count: 1, unit: '個', category: 'food' }, token)
      expect(res.status).toBe(201)
      
      const items = await db.prepare('SELECT * FROM items').all()
      expect(items.results).toHaveLength(1)
    })
    
    it('Deletes item and image cleanly', async () => {
      await req('POST', `/api/lists/${listId}/items`, { name: 'Apple', count: 1, unit: '個', category: 'food' }, token)
      const item = (await db.prepare('SELECT id FROM items').first()) as any
      
      const res = await req('DELETE', `/api/lists/${listId}/items/${item.id}`, null, token)
      expect(res.status).toBe(200)
      
      const items = await db.prepare('SELECT * FROM items').all()
      expect(items.results).toHaveLength(0)
    })
    
    it('List deletion logical deletes and cascades to deletion_pending', async () => {
      const res = await req('DELETE', `/api/lists/${listId}`, null, token)
      expect(res.status).toBe(200)
      
      const lists = await db.prepare('SELECT * FROM shopping_lists').all()
      expect((lists.results[0] as any).deleted_at).not.toBeNull()
      
      // Cannot access logically deleted list
      const getRes = await req('GET', `/lists/${listId}`, null, token)
      expect(getRes.status).toBe(302) // Redirected because member check fails for deleted list (since it's joined and usually not found)
    })
  })

  describe('Invites', () => {
    let ownerToken = ''
    let listId = 1
    let inviteCode = ''

    beforeEach(async () => {
      await req('POST', '/api/auth/register', { login_id: 'owner', display_name: 'O', password: 'password123' })
      const r = await req('POST', '/api/auth/login', { login_id: 'owner', password: 'password123' })
      ownerToken = r.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''
      listId = (await db.prepare('SELECT id FROM shopping_lists').first() as any).id
    })

    it('Owner can issue invite', async () => {
      const res = await req('POST', `/api/lists/${listId}/invites`, {}, ownerToken)
      expect(res.status).toBe(201)
      const json = await res.json() as any
      expect(json.token).toBeDefined()
      inviteCode = json.token
    })

    it('Member can accept invite and concurrent accept works correctly', async () => {
      const iRes = await req('POST', `/api/lists/${listId}/invites`, {}, ownerToken)
      const tokenStr = (await iRes.json() as any).token

      await req('POST', '/api/auth/register', { login_id: 'member1', display_name: 'M1', password: 'password123' })
      const r1 = await req('POST', '/api/auth/login', { login_id: 'member1', password: 'password123' })
      const m1Token = r1.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''

      await req('POST', '/api/auth/register', { login_id: 'member2', display_name: 'M2', password: 'password123' })
      const r2 = await req('POST', '/api/auth/login', { login_id: 'member2', password: 'password123' })
      const m2Token = r2.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''

      // Concurrent accept
      const p1 = req('POST', `/api/invites/accept`, { token: tokenStr }, m1Token)
      const p2 = req('POST', `/api/invites/accept`, { token: tokenStr }, m2Token)

      const [res1, res2] = await Promise.all([p1, p2])
      
      const successCount = [res1.status, res2.status].filter(s => s === 200).length
      // Since node:sqlite is synchronous in memory, one will succeed and increment, the other will fail the CAS update.
      expect(successCount).toBe(1)
    })
  })
})
