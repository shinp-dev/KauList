import type { InviteCode } from '../../types'

export class InviteRepository {
  constructor(private db: D1Database) {}

  async createInvite(listId: number, tokenHash: string, createdByUserId: number, expiresAt: string): Promise<InviteCode> {
    const code = await this.db.prepare(`
      INSERT INTO invite_codes (list_id, token_hash, created_by_user_id, expires_at, max_uses)
      VALUES (?, ?, ?, ?, ?) RETURNING *
    `).bind(listId, tokenHash, createdByUserId, expiresAt, 1).first<InviteCode>()
    if (!code) throw new Error('Failed to create invite')
    return code
  }

  async revokeInvite(inviteId: number, listId: number, now: string): Promise<void> {
    await this.db.prepare(
      'UPDATE invite_codes SET revoked_at = ? WHERE id = ? AND list_id = ?'
    ).bind(now, inviteId, listId).run()
  }

  async getValidInviteByHash(tokenHash: string, now: string): Promise<InviteCode | null> {
    return await this.db.prepare(`
      SELECT * FROM invite_codes
      WHERE token_hash = ? AND revoked_at IS NULL AND use_count < max_uses AND expires_at > ?
    `).bind(tokenHash, now).first<InviteCode>()
  }

  async incrementUseCount(inviteId: number, now: string): Promise<boolean> {
    const res = await this.db.prepare(`
      UPDATE invite_codes
      SET use_count = use_count + 1
      WHERE id = ? AND revoked_at IS NULL AND use_count < max_uses AND expires_at > ?
      RETURNING id
    `).bind(inviteId, now).first()
    return !!res
  }

  async decrementUseCount(inviteId: number): Promise<void> {
    await this.db.prepare(`
      UPDATE invite_codes SET use_count = use_count - 1 WHERE id = ?
    `).bind(inviteId).run()
  }

  async getInvites(listId: number): Promise<InviteCode[]> {
    const res = await this.db.prepare(
      'SELECT * FROM invite_codes WHERE list_id = ? ORDER BY created_at DESC'
    ).bind(listId).all<InviteCode>()
    return res.results || []
  }
}
