import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import type { Bindings, Variables } from '../../types'
import { AuthService } from './service'
import { hashPassword } from '../../lib/crypto'
import { checkRateLimit } from '../../lib/rateLimit'
import { requireAuth } from '../../middleware/auth'

const authRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

authRoutes.post('/register', async (c) => {
  const body = await c.req.json()
  const loginId = typeof body.login_id === 'string' ? body.login_id.trim() : ''
  const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  // Validations
  if (!loginId || loginId.length < 3 || loginId.length > 50) return c.json({ success: false, error: 'Invalid login_id' }, 400)
  if (!displayName || displayName.length < 1 || displayName.length > 50) return c.json({ success: false, error: 'Invalid display_name' }, 400)
  if (!password || password.length < 8 || password.length > 128) return c.json({ success: false, error: 'Invalid password' }, 400)

  // Rate Limit
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'register', limit: 5, windowSeconds: 60 }, [
    { scope: 'loginId', value: loginId },
    { scope: 'ip-loginId', value: `${ip}:${loginId}` }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  const service = new AuthService(c.env.DB)
  const passwordHash = await hashPassword(password)

  try {
    const { user } = await service.registerUser(loginId, displayName, passwordHash)
    const token = await service.createSession(user.id)
    setCookie(c, 'session_token', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Strict' })
    return c.json({ success: true })
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed: users.login_id')) {
      return c.json({ success: false, error: 'This login ID is already taken.' }, 400)
    }
    return c.json({ success: false, error: 'Registration failed' }, 500)
  }
})

authRoutes.post('/login', async (c) => {
  const body = await c.req.json()
  const loginId = typeof body.login_id === 'string' ? body.login_id.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!loginId || !password) return c.json({ success: false, error: 'ログインIDまたはパスワードが正しくありません。' }, 400)

  // Rate Limit
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'login', limit: 10, windowSeconds: 60 }, [
    { scope: 'loginId', value: loginId },
    { scope: 'ip-loginId', value: `${ip}:${loginId}` }
  ])
  if (!rl.success) return c.json({ success: false, error: 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。' }, 429)

  const service = new AuthService(c.env.DB)
  const user = await service.login(loginId, password)

  if (!user) {
    return c.json({ success: false, error: 'ログインIDまたはパスワードが正しくありません。' }, 401)
  }

  const token = await service.createSession(user.id)
  setCookie(c, 'session_token', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Strict' })
  return c.json({ success: true })
})

authRoutes.post('/logout', requireAuth, async (c) => {
  const token = getCookie(c, 'session_token')
  if (token) {
    const service = new AuthService(c.env.DB)
    await service.revokeSession(token)
  }
  deleteCookie(c, 'session_token', { path: '/' })
  return c.json({ success: true })
})

authRoutes.get('/me', requireAuth, (c) => {
  const user = c.get('user')
  return c.json({ success: true, user })
})

export { authRoutes }
