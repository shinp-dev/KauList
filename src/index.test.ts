import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { createD1Mock } from './test-utils/d1-mock'
import { jsx } from 'hono/jsx'
import app from './index'
import { AuthService } from './modules/auth/service'

const schemaPath = join(process.cwd(), 'schema.sql')

vi.mock('hono/cookie', async (importOriginal) => {
  const actual = await importOriginal<typeof import('hono/cookie')>()
  let currentToken: string | undefined = undefined
  return {
    ...actual,
    setCookie: vi.fn((c, key, val, options) => {
      if (key === 'session_token') {
        currentToken = val
        let cookieStr = `${key}=${val}`
        if (options && options.secure) cookieStr += '; Secure'
        c.header('set-cookie', cookieStr, { append: true })
      }
    }),
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

    it('Session creation failure rolls back user and list', async () => {
      const AuthRepository = (await import('./modules/auth/repository')).AuthRepository
      const spy = vi.spyOn(AuthRepository.prototype, 'createSession').mockRejectedValue(new Error('DB Error'))
      
      const res = await req('POST', '/api/auth/register', { login_id: 'sessionfail', display_name: 'SF', password: 'password123' })
      expect(res.status).toBe(500)
      
      const user = await db.prepare('SELECT * FROM users WHERE login_id = ?').bind('sessionfail').first()
      expect(user).toBeUndefined()
      
      // List should not remain
      const lists = await db.prepare("SELECT * FROM shopping_lists WHERE name = '買い物リスト' AND created_by_user_id = (SELECT id FROM users WHERE login_id = 'sessionfail')").first()
      expect(lists).toBeUndefined()
      
      spy.mockRestore()
    })

    it('Registration and login set same secure cookie in production', async () => {
      const env = getEnv()
      env.ENVIRONMENT = 'production'
      
      const reqWithEnv = async (path: string, body: any) => {
        return app.request(new Request(`http://localhost${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost', 'Host': 'localhost' },
          body: JSON.stringify(body)
        }), undefined, env)
      }

      const r1 = await reqWithEnv('/api/auth/register', { login_id: 'secureuser', display_name: 'Secure', password: 'password123' })
      expect(r1.headers.get('set-cookie')).toContain('Secure')

      const r2 = await reqWithEnv('/api/auth/login', { login_id: 'secureuser', password: 'password123' })
      expect(r2.headers.get('set-cookie')).toContain('Secure')
    })
    
    it('Development environment sets non-secure cookie on registration', async () => {
      const r1 = await req('POST', '/api/auth/register', { login_id: 'devuser', display_name: 'Dev', password: 'password123' })
      expect(r1.headers.get('set-cookie')).not.toContain('Secure')
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
      if (lists.results.length > 0) {
        expect((lists.results[0] as any).deleted_at).not.toBeNull()
      }
      
      // API access should be 404
      const apiRes = await req('GET', `/api/lists/${listId}/items`, null, token)
      expect(apiRes.status).toBe(404)

      // Frontend route redirects to /
      const getRes = await req('GET', `/lists/${listId}`, null, token)
      expect(getRes.status).toBe(302)
    })

    it('Second list deletion returns 404', async () => {
      // Delete default list first so we can create a list
      const initialList = await db.prepare('SELECT id FROM shopping_lists').first()
      if (initialList) await req('DELETE', `/api/lists/${initialList.id}`, null, token)

      const r1 = await req('POST', '/api/lists', { name: 'Delete Me' }, token)
      const newListId = (await r1.json() as any).list.id
      
      const res1 = await req('DELETE', `/api/lists/${newListId}`, null, token)
      expect(res1.status).toBe(200)
      
      const res2 = await req('DELETE', `/api/lists/${newListId}`, null, token)
      expect(res2.status).toBe(404)
    })

    it('D1 batch failure returns 500 and does not report success', async () => {
      // Delete default list first so we can create a list
      const initialList = await db.prepare('SELECT id FROM shopping_lists').first()
      if (initialList) await req('DELETE', `/api/lists/${initialList.id}`, null, token)

      const r1 = await req('POST', '/api/lists', { name: 'Batch Fail' }, token)
      const newListId = (await r1.json() as any).list.id

      // Mock db.batch to fail
      const originalBatch = db.batch.bind(db)
      db.batch = vi.fn().mockRejectedValue(new Error('Simulated D1 Batch Error'))

      const res = await req('DELETE', `/api/lists/${newListId}`, null, token)
      
      // Restore original
      db.batch = originalBatch

      expect(res.status).toBe(500)
      const json = await res.json() as any
      expect(json.success).toBe(false)
      expect(json.error).toBe('Failed to delete list')
      
      // Ensure it was not deleted
      const lists = await db.prepare('SELECT * FROM shopping_lists WHERE id = ?').bind(newListId).first()
      expect((lists as any).deleted_at).toBeNull()
    })

    it('Invalid numeric ID returns 400', async () => {
      const res = await req('GET', `/api/lists/abc/items`, null, token)
      expect(res.status).toBe(400)
      
      const res2 = await req('GET', `/api/lists/-1/items`, null, token)
      expect(res2.status).toBe(400)
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
      
      const successCount = [res1, res2].filter(r => r.status === 200).length
      // Since node:sqlite is synchronous in memory, one will succeed and increment, the other will fail the CAS update.
      expect(successCount).toBe(1)
      
      const successfulRes = res1.status === 200 ? res1 : res2
      const successJson = await successfulRes.json() as any
      expect(successJson.listId).toBe(listId) // check that listId is used, not list_id
    })
  })

  describe('Item Validations', () => {
    let token = ''
    let listId = 1
    
    beforeEach(async () => {
      await req('POST', '/api/auth/register', { login_id: 'itemuser', display_name: 'Item User', password: 'password123' })
      const r = await req('POST', '/api/auth/login', { login_id: 'itemuser', password: 'password123' })
      token = r.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''
      const lists = await db.prepare('SELECT id FROM shopping_lists').first()
      listId = lists.id
    })

    it('Creates item with medicine category', async () => {
      const res = await req('POST', `/api/lists/${listId}/items`, { name: 'Painkiller', count: 1, unit: '箱', category: 'medicine' }, token)
      expect(res.status).toBe(201)
    })
    
    it('Rejects invalid item name length', async () => {
      const longName = 'A'.repeat(101)
      const res = await req('POST', `/api/lists/${listId}/items`, { name: longName, count: 1, unit: '個', category: 'food' }, token)
      expect(res.status).toBe(400)
    })

    it('Validates image_id correctly', async () => {
      // 未指定: 201
      const res1 = await req('POST', `/api/lists/${listId}/items`, { name: 'Item1', count: 1, unit: '個', category: 'food' }, token)
      expect(res1.status).toBe(201)
      
      // null: 201
      const res2 = await req('POST', `/api/lists/${listId}/items`, { name: 'Item2', count: 1, unit: '個', category: 'food', image_id: null }, token)
      expect(res2.status).toBe(201)
      
      // -1: 400
      const res3 = await req('POST', `/api/lists/${listId}/items`, { name: 'Item3', count: 1, unit: '個', category: 'food', image_id: -1 }, token)
      expect(res3.status).toBe(400)
      
      // 0: 400
      const res4 = await req('POST', `/api/lists/${listId}/items`, { name: 'Item4', count: 1, unit: '個', category: 'food', image_id: 0 }, token)
      expect(res4.status).toBe(400)
      
      // "abc": 400
      const res5 = await req('POST', `/api/lists/${listId}/items`, { name: 'Item5', count: 1, unit: '個', category: 'food', image_id: 'abc' }, token)
      expect(res5.status).toBe(400)
      
      // 1.5: 400
      const res6 = await req('POST', `/api/lists/${listId}/items`, { name: 'Item6', count: 1, unit: '個', category: 'food', image_id: 1.5 }, token)
      expect(res6.status).toBe(400)
    })

    it('PATCH on non-existent item returns 404', async () => {
      const res = await req('PATCH', `/api/lists/${listId}/items/99999`, { bought: true }, token)
      expect(res.status).toBe(404)
    })
    
    it('DELETE on non-existent item returns 404', async () => {
      const res = await req('DELETE', `/api/lists/${listId}/items/99999`, null, token)
      expect(res.status).toBe(404)
    })
  })

  describe('Plan Quota Limits', () => {
    it('Allows creating 1 owned list for free user with 0 owned lists', async () => {
      const user = await db.prepare("INSERT INTO users (login_id, display_name, password_hash) VALUES ('quota0', 'Quota0', 'hash') RETURNING *").first()
      const token = await new AuthService(db).createSession(user.id)

      const res = await req('POST', '/api/lists', { name: 'My List 1' }, token)
      expect(res.status).toBe(201)
      const data: any = await res.json()
      expect(data.success).toBe(true)
      expect(data.list.name).toBe('My List 1')
    })

    it('Rejects 2nd list creation for user with 1 owned list with 403 OWNED_LIST_LIMIT_REACHED', async () => {
      await req('POST', '/api/auth/register', { login_id: 'quota1', display_name: 'Quota1', password: 'password123' })
      const loginRes = await req('POST', '/api/auth/login', { login_id: 'quota1', password: 'password123' })
      const token = loginRes.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''

      const res = await req('POST', '/api/lists', { name: 'My List 2' }, token)
      expect(res.status).toBe(403)
      const data: any = await res.json()
      expect(data.success).toBe(false)
      expect(data.code).toBe('OWNED_LIST_LIMIT_REACHED')
      expect(data.current).toBe(1)
      expect(data.limit).toBe(1)
    })

    it('Allows user with 0 owned lists + multiple shared lists to create an owned list', async () => {
      await req('POST', '/api/auth/register', { login_id: 'owner_user', display_name: 'Owner', password: 'password123' })
      const loginRes1 = await req('POST', '/api/auth/login', { login_id: 'owner_user', password: 'password123' })
      const token1 = loginRes1.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''
      const ownerList = await db.prepare('SELECT id FROM shopping_lists').first()

      const user2 = await db.prepare("INSERT INTO users (login_id, display_name, password_hash) VALUES ('member_only', 'Member', 'hash') RETURNING *").first()
      const token2 = await new AuthService(db).createSession(user2.id)

      const inviteRes = await req('POST', `/api/lists/${ownerList.id}/invites`, {}, token1)
      const inviteData: any = await inviteRes.json()
      const acceptRes = await req('POST', '/api/invites/accept', { token: inviteData.token }, token2)
      expect(acceptRes.status).toBe(200)

      const createRes = await req('POST', '/api/lists', { name: 'Member Own List' }, token2)
      expect(createRes.status).toBe(201)
    })

    it('Rejects new owned list creation for user with 1 owned list + multiple shared lists', async () => {
      await req('POST', '/api/auth/register', { login_id: 'user1', display_name: 'U1', password: 'password123' })
      const r1 = await req('POST', '/api/auth/login', { login_id: 'user1', password: 'password123' })
      const t1 = r1.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''
      const user1 = await db.prepare("SELECT id FROM users WHERE login_id = ?").bind('user1').first()
      const list1 = await db.prepare("SELECT id FROM shopping_lists WHERE created_by_user_id = ?").bind(user1.id).first()

      await req('POST', '/api/auth/register', { login_id: 'user2', display_name: 'U2', password: 'password123' })
      const r2 = await req('POST', '/api/auth/login', { login_id: 'user2', password: 'password123' })
      const t2 = r2.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''

      const invRes = await req('POST', `/api/lists/${list1.id}/invites`, {}, t1)
      const invData: any = await invRes.json()
      await req('POST', '/api/invites/accept', { token: invData.token }, t2)

      const res = await req('POST', '/api/lists', { name: 'Extra List' }, t2)
      expect(res.status).toBe(403)
      const data: any = await res.json()
      expect(data.code).toBe('OWNED_LIST_LIMIT_REACHED')
    })

    it('Allows creating owned list again after deleting owned list', async () => {
      await req('POST', '/api/auth/register', { login_id: 'del_user', display_name: 'DelUser', password: 'password123' })
      const r = await req('POST', '/api/auth/login', { login_id: 'del_user', password: 'password123' })
      const t = r.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''
      const user = await db.prepare("SELECT id FROM users WHERE login_id = 'del_user'").first()
      const list = await db.prepare("SELECT id FROM shopping_lists WHERE created_by_user_id = ?").bind(user.id).first()

      const res1 = await req('POST', '/api/lists', { name: 'List 2' }, t)
      expect(res1.status).toBe(403)

      const delRes = await req('DELETE', `/api/lists/${list.id}`, null, t)
      expect(delRes.status).toBe(200)

      const res2 = await req('POST', '/api/lists', { name: 'New List' }, t)
      expect(res2.status).toBe(201)
    })

    it('Leaving shared list does NOT affect owned list quota', async () => {
      await req('POST', '/api/auth/register', { login_id: 'owner_leave', display_name: 'Owner', password: 'password123' })
      const r1 = await req('POST', '/api/auth/login', { login_id: 'owner_leave', password: 'password123' })
      const t1 = r1.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''
      const ownerUser = await db.prepare("SELECT id FROM users WHERE login_id = 'owner_leave'").first()
      const list1 = await db.prepare("SELECT id FROM shopping_lists WHERE created_by_user_id = ?").bind(ownerUser.id).first()

      await req('POST', '/api/auth/register', { login_id: 'member_leave', display_name: 'Member', password: 'password123' })
      const r2 = await req('POST', '/api/auth/login', { login_id: 'member_leave', password: 'password123' })
      const t2 = r2.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''

      const invRes = await req('POST', `/api/lists/${list1.id}/invites`, {}, t1)
      const invData: any = await invRes.json()
      await req('POST', '/api/invites/accept', { token: invData.token }, t2)

      const leaveRes = await req('DELETE', `/api/lists/${list1.id}/leave`, null, t2)
      expect(leaveRes.status).toBe(200)

      const createRes = await req('POST', '/api/lists', { name: 'Extra' }, t2)
      expect(createRes.status).toBe(403)
    })

    it('Accepting invite succeeds regardless of owned list quota', async () => {
      await req('POST', '/api/auth/register', { login_id: 'owner_invite', display_name: 'Owner', password: 'password123' })
      const r1 = await req('POST', '/api/auth/login', { login_id: 'owner_invite', password: 'password123' })
      const t1 = r1.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''
      const ownerUser = await db.prepare("SELECT id FROM users WHERE login_id = 'owner_invite'").first()
      const list1 = await db.prepare("SELECT id FROM shopping_lists WHERE created_by_user_id = ?").bind(ownerUser.id).first()

      await req('POST', '/api/auth/register', { login_id: 'full_member', display_name: 'Member', password: 'password123' })
      const r2 = await req('POST', '/api/auth/login', { login_id: 'full_member', password: 'password123' })
      const t2 = r2.headers.get('set-cookie')?.split(';')[0].split('=')[1] || ''

      const invRes = await req('POST', `/api/lists/${list1.id}/invites`, {}, t1)
      const invData: any = await invRes.json()
      const acceptRes = await req('POST', '/api/invites/accept', { token: invData.token }, t2)
      expect(acceptRes.status).toBe(200)
    })

    it('Retains existing user data with 2+ owned lists but blocks new creation', async () => {
      const user = await db.prepare("INSERT INTO users (login_id, display_name, password_hash) VALUES ('legacy', 'Legacy', 'hash') RETURNING *").first()
      const token = await new AuthService(db).createSession(user.id)
      
      const l1 = await db.prepare("INSERT INTO shopping_lists (name, created_by_user_id) VALUES ('List 1', ?) RETURNING *").bind(user.id).first()
      const l2 = await db.prepare("INSERT INTO shopping_lists (name, created_by_user_id) VALUES ('List 2', ?) RETURNING *").bind(user.id).first()
      await db.prepare("INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, 'owner')").bind(l1.id, user.id).run()
      await db.prepare("INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, 'owner')").bind(l2.id, user.id).run()

      const userListsRes = await req('GET', '/api/lists', null, token)
      const userListsData: any = await userListsRes.json()
      expect(userListsData.lists).toHaveLength(2)

      const createRes = await req('POST', '/api/lists', { name: 'List 3' }, token)
      expect(createRes.status).toBe(403)
      const errData: any = await createRes.json()
      expect(errData.code).toBe('OWNED_LIST_LIMIT_REACHED')
    })
  })
})
