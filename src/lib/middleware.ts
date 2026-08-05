import { getSignedCookie } from 'hono/cookie'
import type { Context, Next } from 'hono'
import type { Bindings, Variables } from '../types'

export const getCookieSecret = (c: Context<{ Bindings: Bindings, Variables: any }>): string => {
  const secret = c.env.COOKIE_SECRET
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    throw new Error('COOKIE_SECRET_MISSING')
  }
  return secret
}

export const authMiddleware = async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
  let secret: string
  try {
    secret = getCookieSecret(c)
  } catch (e) {
    return c.json({ success: false, error: 'サーバー設定エラーが発生しました。' }, 500)
  }

  const session = await getSignedCookie(c, secret, 'session')
  const familyIdFromCookie = await getSignedCookie(c, secret, 'family_id')
  
  const isAuthenticated = typeof session === 'string' && session.length > 0
  
  if (!isAuthenticated && !c.req.path.startsWith('/login') && c.req.path !== '/api/login' && c.req.path !== '/api/register-family') {
    return c.redirect('/login')
  }
  
  if (isAuthenticated && typeof familyIdFromCookie === 'string') {
    c.set('family_id', parseInt(familyIdFromCookie, 10))
  }
  
  await next()
}

export const adminMiddleware = async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
  let secret: string
  try {
    secret = getCookieSecret(c)
  } catch (e) {
    return c.json({ success: false, error: 'サーバー設定エラーが発生しました。' }, 500)
  }

  const role = await getSignedCookie(c, secret, 'role')
  if (role !== 'admin') {
    return c.text('Forbidden', 403)
  }
  await next()
}
