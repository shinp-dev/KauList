import { describe, it, expect, vi } from 'vitest'
import { renderer } from './renderer'
import { hashPassword, verifyPassword } from './lib/utils'
import { getCookieSecret, adminMiddleware } from './lib/middleware'

describe('Renderer', () => {
  it('should be a function', () => {
    expect(typeof renderer).toBe('function')
  })
})

describe('COOKIE_SECRET Fallback Removal Test', () => {
  it('should throw Error if COOKIE_SECRET is missing or empty', () => {
    const fakeContextEmpty = { env: { COOKIE_SECRET: '' } } as any
    const fakeContextUndefined = { env: {} } as any

    expect(() => getCookieSecret(fakeContextEmpty)).toThrow('COOKIE_SECRET_MISSING')
    expect(() => getCookieSecret(fakeContextUndefined)).toThrow('COOKIE_SECRET_MISSING')
  })

  it('should return COOKIE_SECRET when set', () => {
    const fakeContext = { env: { COOKIE_SECRET: 'my-custom-secret-key-123456789' } } as any
    expect(getCookieSecret(fakeContext)).toBe('my-custom-secret-key-123456789')
  })
})

describe('Password Hashing & Password Length Utility', () => {
  it('should generate hash starting with pbkdf2_sha256$', async () => {
    const pass = 'super-secret-password-123'
    const hash = await hashPassword(pass)
    expect(hash.startsWith('pbkdf2_sha256$100000$')).toBe(true)
    
    const parts = hash.split('$')
    expect(parts.length).toBe(4)
  })

  it('should verify correct password using new PBKDF2 hash', async () => {
    const pass = 'my-secure-password'
    const hash = await hashPassword(pass)
    const result = await verifyPassword(pass, hash)
    expect(result).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const pass = 'my-secure-password'
    const hash = await hashPassword(pass)
    const result = await verifyPassword('wrong-password', hash)
    expect(result).toBe(false)
  })

  it('should fall back and verify short existing legacy SHA-256 password for backward compatibility', async () => {
    // Legacy short password '1234'
    const legacyHashShort = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
    const result = await verifyPassword('1234', legacyHashShort)
    expect(result).toBe(true)
  })

  it('should verify short existing PBKDF2 password for backward compatibility', async () => {
    const shortPass = 'pass'
    const hash = await hashPassword(shortPass)
    const result = await verifyPassword(shortPass, hash)
    expect(result).toBe(true)
  })
})

describe('Admin Middleware Authorization Test', () => {
  it('should return 403 Forbidden if user role is not admin', async () => {
    const nextFn = vi.fn()
    const fakeContext = {
      env: { COOKIE_SECRET: 'test-secret' },
      req: {
        header: () => undefined
      },
      text: (msg: string, status: number) => ({ msg, status })
    } as any

    // Mock getSignedCookie to return 'member'
    vi.mock('hono/cookie', () => ({
      getSignedCookie: async () => 'member'
    }))

    const res = await adminMiddleware(fakeContext, nextFn)
    expect(res).toEqual({ msg: 'Forbidden', status: 403 })
    expect(nextFn).not.toHaveBeenCalled()
  })
})
