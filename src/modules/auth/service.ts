import type { Bindings, User, ShoppingList } from '../../types'
import { hashPassword, verifyPassword, generateToken, hashToken } from '../../lib/crypto'

export class AuthService {
  constructor(private db: D1Database) {}

  async registerUser(loginId: string, displayName: string, passwordHash: string): Promise<{ user: User, list: ShoppingList }> {
    // We cannot use D1 transaction easily if it's not supported in this environment without specific flags,
    // but D1 supports batched execution or manual transactions. We'll use batch.
    
    // Actually D1 doesn't return auto-increment IDs easily from batch.
    // We'll execute them sequentially, but handle rollback manually if needed, or rely on them succeeding.
    
    const userRes = await this.db.prepare(
      'INSERT INTO users (login_id, display_name, password_hash) VALUES (?, ?, ?) RETURNING *'
    ).bind(loginId, displayName, passwordHash).first<User>()

    if (!userRes) throw new Error('Failed to create user')

    try {
      const listRes = await this.db.prepare(
        'INSERT INTO shopping_lists (name, created_by_user_id) VALUES (?, ?) RETURNING *'
      ).bind('買い物リスト', userRes.id).first<ShoppingList>()

      if (!listRes) throw new Error('Failed to create default list')

      await this.db.prepare(
        'INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)'
      ).bind(listRes.id, userRes.id, 'owner').run()

      return { user: userRes, list: listRes }
    } catch (e) {
      // Manual rollback
      await this.db.prepare('DELETE FROM users WHERE id = ?').bind(userRes.id).run()
      throw e
    }
  }

  async login(loginId: string, passwordText: string): Promise<User | null> {
    const user = await this.db.prepare('SELECT * FROM users WHERE login_id = ? COLLATE NOCASE').bind(loginId).first<User>()
    if (!user) return null

    const match = await verifyPassword(passwordText, user.password_hash)
    if (!match) return null

    return user
  }

  async createSession(userId: number): Promise<string> {
    const token = generateToken(32)
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await this.db.prepare(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(tokenHash, userId, expiresAt.toISOString()).run()

    return token
  }

  async revokeSession(token: string): Promise<void> {
    const tokenHash = await hashToken(token)
    await this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run()
  }
}
