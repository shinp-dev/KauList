import type { ShoppingList } from '../../types'
import { ListRepository } from './repository'
import { MemberRepository } from '../members/repository'

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

  async softDeleteList(listId: number): Promise<void> {
    const now = new Date().toISOString()
    
    // 論理削除
    await this.listRepo.softDeleteList(listId, now)
    
    // 紐づく一時画像をすべて deletion_pending に変更
    // (これは images repository を呼ぶか、直接更新するか。責務的に Repositoryを呼ぶべきだが)
    await this.db.prepare(
      "UPDATE uploaded_images SET status = 'deletion_pending', updated_at = ? WHERE list_id = ? AND status IN ('reserved', 'temporary', 'attached')"
    ).bind(now, listId).run()
  }
}
