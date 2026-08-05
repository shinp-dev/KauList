import type { Item } from '../../types'

export class ItemRepository {
  constructor(private db: D1Database) {}

  async getListItems(listId: number): Promise<Item[]> {
    const res = await this.db.prepare(`
      SELECT i.*, u.secure_url as image_url 
      FROM items i
      LEFT JOIN uploaded_images u ON u.item_id = i.id
      WHERE i.list_id = ? 
      ORDER BY i.created_at DESC
    `).bind(listId).all<Item>()
    return res.results || []
  }

  async createItem(listId: number, userId: number, name: string, count: number, unit: string, category: string): Promise<Item> {
    const item = await this.db.prepare(
      'INSERT INTO items (list_id, created_by_user_id, name, count, unit, category) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(listId, userId, name, count, unit, category).first<Item>()
    if (!item) throw new Error('Failed to create item')
    return item
  }

  async deleteItem(itemId: number, listId: number): Promise<boolean> {
    const res = await this.db.prepare('DELETE FROM items WHERE id = ? AND list_id = ?').bind(itemId, listId).run()
    return !!res.meta.changes && res.meta.changes > 0
  }

  async updateBoughtStatus(listId: number, itemId: number, bought: boolean, userId: number, now: string): Promise<boolean> {
    const val = bought ? 1 : 0
    const boughtBy = bought ? userId : null
    
    const res = await this.db.prepare(
      'UPDATE items SET bought = ?, bought_by_user_id = ?, updated_at = ? WHERE id = ? AND list_id = ?'
    ).bind(val, boughtBy, now, itemId, listId).run()
    return !!res.meta.changes && res.meta.changes > 0
  }

  async checkItemExists(itemId: number, listId: number): Promise<boolean> {
    const item = await this.db.prepare('SELECT id FROM items WHERE id = ? AND list_id = ?').bind(itemId, listId).first()
    return !!item
  }
}
