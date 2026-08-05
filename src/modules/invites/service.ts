import type { InviteCode } from '../../types'
import { generateToken, hashToken } from '../../lib/crypto'
import { InviteRepository } from './repository'
import { MemberRepository } from '../members/repository'

export class InviteService {
  private inviteRepo: InviteRepository
  private memberRepo: MemberRepository

  constructor(private db: D1Database) {
    this.inviteRepo = new InviteRepository(db)
    this.memberRepo = new MemberRepository(db)
  }

  async createInvite(listId: number, createdByUserId: number): Promise<{ token: string, code: InviteCode }> {
    const token = generateToken(24) // 24 bytes
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const code = await this.inviteRepo.createInvite(listId, tokenHash, createdByUserId, expiresAt.toISOString())
    return { token, code }
  }

  async revokeInvite(inviteId: number, listId: number): Promise<void> {
    await this.inviteRepo.revokeInvite(inviteId, listId, new Date().toISOString())
  }

  async acceptInvite(userId: number, token: string): Promise<{ listId: number }> {
    const tokenHash = await hashToken(token)
    const now = new Date().toISOString()

    const invite = await this.inviteRepo.getValidInviteByHash(tokenHash, now)
    if (!invite) throw new Error('Invalid or expired invite code')

    // Check if already a member
    const existing = await this.memberRepo.getMember(invite.list_id, userId)
    if (existing) {
      return { listId: invite.list_id } // Idempotent success
    }

    const updated = await this.inviteRepo.incrementUseCount(invite.id, now)
    if (!updated) {
      throw new Error('Invalid or expired invite code') // Race condition lost
    }

    try {
      await this.memberRepo.addMember(invite.list_id, userId, 'member')
      return { listId: invite.list_id }
    } catch (e) {
      // 補償処理
      await this.inviteRepo.decrementUseCount(invite.id)
      throw new Error('Failed to join list')
    }
  }

  async getInvites(listId: number): Promise<InviteCode[]> {
    return await this.inviteRepo.getInvites(listId)
  }
}
