import type { ShoppingList } from '../../types'
import { ListRepository } from './repository'
import { MemberRepository } from '../members/repository'
import { InviteRepository } from '../invites/repository'
import { ImageRepository } from '../images/repository'

export class ListService {
  private listRepo: ListRepository
  private memberRepo: MemberRepository

  constructor(private db: D1Database) {
    this.listRepo = new ListRepository(db)
    this.memberRepo = new MemberRepository(db)
  }

  async getUserLists(userId: number): Promise<ShoppingList[]> {
    return await this.listRepo.getUserLists(userId)
  }

  async getListById(listId: number): Promise<ShoppingList | null> {
    return await this.listRepo.getListById(listId)
  }

  async createList(name: string, userId: number): Promise<ShoppingList> {
    let list: ShoppingList | undefined

    try {
      list = await this.listRepo.createList(name, userId)
      await this.memberRepo.addMember(list.id, userId, 'owner')
      return list
    } catch (e) {
      if (list) {
        try { await this.memberRepo.removeMember(list.id, userId) } catch (err) {}
        try { await this.listRepo.deleteList(list.id) } catch (err) {}
      }
      throw e
    }
  }

  async renameList(listId: number, name: string): Promise<void> {
    await this.listRepo.updateListName(listId, name)
  }

  async softDeleteList(listId: number): Promise<boolean> {
    const now = new Date().toISOString()
    
    // アトミックなバッチ実行
    const results = await this.db.batch([
      this.db.prepare(`
        UPDATE shopping_lists
        SET deleted_at = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `).bind(now, now, listId),

      this.db.prepare(`
        UPDATE invite_codes
        SET revoked_at = ?
        WHERE list_id = ? AND revoked_at IS NULL
      `).bind(now, listId),

      this.db.prepare(`
        UPDATE uploaded_images
        SET status = 'deletion_pending', updated_at = ?, next_retry_at = NULL
        WHERE list_id = ? AND status IN ('reserved', 'temporary', 'attached')
      `).bind(now, listId)
    ])

    // リストが既に削除済みだったか存在しない場合
    if (!results[0].meta.changes || results[0].meta.changes === 0) {
      return false
    }
    
    // 画像が0件なら即時物理削除
    await this.listRepo.deleteLogicallyDeletedListIfEmpty(listId)
    return true
  }
}
