import type { User, Session } from '../../types'

export class AuthRepository {
  constructor(private db: D1Database) {}

  async getUserByLoginId(loginId: string): Promise<User | null> {
    return await this.db.prepare('SELECT * FROM users WHERE login_id = ?').bind(loginId).first<User>()
  }

  async createUser(loginId: string, displayName: string, passwordHash: string): Promise<User> {
    const user = await this.db.prepare(
      'INSERT INTO users (login_id, display_name, password_hash) VALUES (?, ?, ?) RETURNING *'
    ).bind(loginId, displayName, passwordHash).first<User>()
    if (!user) throw new Error('Failed to create user')
    return user
  }

  async deleteUser(userId: number): Promise<void> {
    await this.db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
  }

  async createSession(userId: number, tokenHash: string, expiresAt: string): Promise<Session> {
    const session = await this.db.prepare(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?) RETURNING *'
    ).bind(userId, tokenHash, expiresAt).first<Session>()
    if (!session) throw new Error('Failed to create session')
    return session
  }

  async deleteSessionByHash(tokenHash: string): Promise<void> {
    await this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run()
  }

  async deleteSession(sessionId: number): Promise<void> {
    await this.db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  }

  async cleanupSessions(now: string): Promise<void> {
    await this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run()
  }
}
