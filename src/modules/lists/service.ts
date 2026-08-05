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

  async softDeleteList(listId: number): Promise<void> {
    const now = new Date().toISOString()
    
    // 論理削除
    await this.listRepo.softDeleteList(listId, now)
    
    // 招待を失効させる
    const inviteRepo = new InviteRepository(this.db)
    await inviteRepo.revokeAllInvites(listId, now)
    
    // 画像ステータスを更新する
    const imageRepo = new ImageRepository(this.db)
    await imageRepo.markListImagesAsDeletionPending(listId, now)

    // 画像が0件なら即時物理削除
    await this.listRepo.deleteLogicallyDeletedListIfEmpty(listId)
  }
}
