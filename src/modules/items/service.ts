import type { Item } from '../../types'
import { ItemRepository } from './repository'
import { ImageRepository } from '../images/repository'

export class ItemService {
  private itemRepo: ItemRepository
  private imageRepo: ImageRepository

  constructor(private db: D1Database) {
    this.itemRepo = new ItemRepository(db)
    this.imageRepo = new ImageRepository(db)
  }

  async getListItems(listId: number): Promise<Item[]> {
    return await this.itemRepo.getListItems(listId)
  }

  async createItem(
    listId: number, 
    userId: number, 
    name: string, 
    count: number, 
    unit: string, 
    category: string,
    imageId?: number
  ): Promise<Item> {
    if (imageId) {
      // 1. 画像の事前確認 (必須ではないが、存在しないIDで無駄なアイテム作成を防ぐため)
      const img = await this.db.prepare(
        "SELECT id FROM uploaded_images WHERE id = ? AND list_id = ? AND uploaded_by_user_id = ? AND status = 'temporary' AND item_id IS NULL"
      ).bind(imageId, listId, userId).first()
      
      if (!img) {
        throw new Error('Invalid image specified')
      }
    }

    // 2. 商品をINSERT
    const item = await this.itemRepo.createItem(listId, userId, name, count, unit, category)

    // 3. 画像がある場合はCASでattach
    if (imageId) {
      const now = new Date().toISOString()
      const attached = await this.imageRepo.attachImage(imageId, listId, userId, item.id, now)
      
      if (!attached) {
        // 4. attachに失敗した場合（競合等）は商品を補償削除
        await this.itemRepo.deleteItem(item.id, listId)
        throw new Error('Failed to attach image (conflict or invalid state). Item creation rolled back.')
      }
    }

    return item
  }

  async updateBoughtStatus(listId: number, itemId: number, bought: boolean, userId: number): Promise<boolean> {
    return await this.itemRepo.updateBoughtStatus(listId, itemId, bought, userId, new Date().toISOString())
  }
}
