import type { InviteCode } from '../../types'
import { generateToken, hashToken } from '../../lib/crypto'

export class InviteService {
  constructor(private db: D1Database) {}

  async createInvite(listId: number, createdByUserId: number): Promise<{ token: string, code: InviteCode }> {
    const token = generateToken(24) // 24 bytes
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const code = await this.db.prepare(`
      INSERT INTO invite_codes (list_id, token_hash, created_by_user_id, expires_at, max_uses)
      VALUES (?, ?, ?, ?, ?) RETURNING *
    `).bind(listId, tokenHash, createdByUserId, expiresAt.toISOString(), 1).first<InviteCode>()

    if (!code) throw new Error('Failed to create invite')

    return { token, code }
  }

  async revokeInvite(inviteId: number, listId: number): Promise<void> {
    await this.db.prepare(
      'UPDATE invite_codes SET revoked_at = ? WHERE id = ? AND list_id = ?'
    ).bind(new Date().toISOString(), inviteId, listId).run()
  }

  async acceptInvite(userId: number, token: string): Promise<{ listId: number }> {
    const tokenHash = await hashToken(token)

    // Check if invite is valid
    const invite = await this.db.prepare(`
      SELECT * FROM invite_codes
      WHERE token_hash = ? AND revoked_at IS NULL AND use_count < max_uses AND expires_at > ?
    `).bind(tokenHash, new Date().toISOString()).first<InviteCode>()

    if (!invite) throw new Error('Invalid or expired invite code')

    // Check if already a member
    const existing = await this.db.prepare('SELECT role FROM list_members WHERE list_id = ? AND user_id = ?').bind(invite.list_id, userId).first()
    if (existing) {
      return { listId: invite.list_id } // Idempotent success
    }

    // Since we don't have true transactions, we increment use_count and insert member.
    // If use_count increment returns that it updated exactly 1 row, we proceed.
    // D1 UPDATE RETURNING can help ensure atomic check-and-update.
    const updated = await this.db.prepare(`
      UPDATE invite_codes
      SET use_count = use_count + 1
      WHERE id = ? AND revoked_at IS NULL AND use_count < max_uses AND expires_at > ?
      RETURNING id
    `).bind(invite.id, new Date().toISOString()).first()

    if (!updated) {
      throw new Error('Invalid or expired invite code') // Race condition lost
    }

    await this.db.prepare(
      'INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)'
    ).bind(invite.list_id, userId, 'member').run()

    return { listId: invite.list_id }
  }
}
