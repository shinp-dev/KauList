import type { User, ShoppingList } from '../../types'
import { hashPassword, verifyPassword, generateToken, hashToken } from '../../lib/crypto'
import { AuthRepository } from './repository'
import { ListRepository } from '../lists/repository'
import { MemberRepository } from '../members/repository'

export class AuthService {
  private authRepo: AuthRepository
  private listRepo: ListRepository
  private memberRepo: MemberRepository

  constructor(private db: D1Database) {
    this.authRepo = new AuthRepository(db)
    this.listRepo = new ListRepository(db)
    this.memberRepo = new MemberRepository(db)
  }

  async registerUser(loginId: string, displayName: string, passwordHash: string): Promise<{ user: User, list: ShoppingList }> {
    let user: User | undefined
    let list: ShoppingList | undefined

    try {
      user = await this.authRepo.createUser(loginId, displayName, passwordHash)
      
      list = await this.listRepo.createList('買い物リスト', user.id)
      
      await this.memberRepo.addMember(list.id, user.id, 'owner')

      return { user, list }
    } catch (e) {
      // Reverse compensation
      if (list) {
        try { await this.memberRepo.removeMember(list.id, user!.id) } catch (err) {}
        try { await this.listRepo.deleteList(list.id) } catch (err) {}
      }
      if (user) {
        try { await this.authRepo.deleteUser(user.id) } catch (err) {}
      }
      throw e
    }
  }

  async login(loginId: string, passwordText: string): Promise<User | null> {
    const user = await this.authRepo.getUserByLoginId(loginId)
    if (!user) return null

    const match = await verifyPassword(passwordText, user.password_hash)
    if (!match) return null

    return user
  }

  async createSession(userId: number): Promise<string> {
    const token = generateToken(32)
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await this.authRepo.createSession(userId, tokenHash, expiresAt.toISOString())
    return token
  }

  async revokeSession(token: string): Promise<void> {
    const tokenHash = await hashToken(token)
    await this.authRepo.deleteSessionByHash(tokenHash)
  }
}
