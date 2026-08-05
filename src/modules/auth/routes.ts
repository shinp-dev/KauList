import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import type { Bindings, Variables } from '../../types'
import { AuthService } from './service'
import { csrfProtection } from '../../middleware/csrf'
import { checkRateLimit } from '../../lib/rateLimit'

const authRoutes = new Hono<{ Bindings: Bindings, Variables: Variables }>()

authRoutes.post('/register', csrfProtection, async (c) => {
  const body = await c.req.json()
  const loginId = typeof body.login_id === 'string' ? body.login_id.trim() : ''
  const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!loginId || loginId.length < 3 || loginId.length > 50) return c.json({ success: false, error: 'Invalid login ID' }, 400)
  if (!displayName || displayName.length < 1 || displayName.length > 50) return c.json({ success: false, error: 'Invalid display name' }, 400)
  if (!password || password.length < 8) return c.json({ success: false, error: 'Invalid password' }, 400)

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'register', limit: 5, windowSeconds: 3600 }, [{ scope: 'ip', value: ip }])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  const { hashPassword } = await import('../../lib/crypto')
  const passwordHash = await hashPassword(password)

  const service = new AuthService(c.env.DB)
  try {
    const { user } = await service.registerUser(loginId, displayName, passwordHash)
    const token = await service.createSession(user.id)

    setCookie(c, 'session_token', token, {
      path: '/',
      httpOnly: true,
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60
    })

    return c.json({ success: true }, 201)
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, error: 'Login ID already exists' }, 409)
    }
    return c.json({ success: false, error: 'Registration failed' }, 500)
  }
})

authRoutes.post('/login', csrfProtection, async (c) => {
  const body = await c.req.json()
  const loginId = typeof body.login_id === 'string' ? body.login_id.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!loginId || !password) return c.json({ success: false, error: 'Missing credentials' }, 400)

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const rl = await checkRateLimit(c, { action: 'login', limit: 10, windowSeconds: 300 }, [
    { scope: 'loginId', value: loginId },
    { scope: 'ip-loginId', value: `${ip}:${loginId}` }
  ])
  if (!rl.success) return c.json({ success: false, error: 'Too Many Requests' }, 429)

  const service = new AuthService(c.env.DB)
  const user = await service.login(loginId, password)

  if (!user) {
    return c.json({ success: false, error: 'ログインIDまたはパスワードが正しくありません。' }, 401)
  }

  const token = await service.createSession(user.id)
  setCookie(c, 'session_token', token, {
    path: '/',
    httpOnly: true,
    secure: c.env.ENVIRONMENT === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60
  })

  return c.json({ success: true })
})

authRoutes.post('/logout', csrfProtection, async (c) => {
  const { getCookie } = await import('hono/cookie')
  const token = getCookie(c, 'session_token')
  if (token) {
    const service = new AuthService(c.env.DB)
    await service.revokeSession(token)
  }
  deleteCookie(c, 'session_token', { path: '/' })
  return c.json({ success: true })
})

export { authRoutes }
