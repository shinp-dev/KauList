import type { ShoppingList } from '../../types'

export class ListRepository {
  constructor(private db: D1Database) {}

  async createList(name: string, userId: number): Promise<ShoppingList> {
    const list = await this.db.prepare(
      'INSERT INTO shopping_lists (name, created_by_user_id) VALUES (?, ?) RETURNING *'
    ).bind(name, userId).first<ShoppingList>()
    if (!list) throw new Error('Failed to create list')
    return list
  }

  async deleteList(listId: number): Promise<void> {
    await this.db.prepare('DELETE FROM shopping_lists WHERE id = ?').bind(listId).run()
  }

  async softDeleteList(listId: number, now: string): Promise<void> {
    await this.db.prepare('UPDATE shopping_lists SET deleted_at = ? WHERE id = ?').bind(now, listId).run()
  }

  async deleteLogicallyDeletedListIfEmpty(listId: number): Promise<void> {
    // Only delete if NO images remain (count = 0) and deleted_at IS NOT NULL
    const count = await this.db.prepare('SELECT COUNT(*) as c FROM uploaded_images WHERE list_id = ?').bind(listId).first<{c: number}>()
    if (count && count.c === 0) {
      await this.db.prepare('DELETE FROM shopping_lists WHERE id = ? AND deleted_at IS NOT NULL').bind(listId).run()
    }
  }

  async getListById(listId: number): Promise<ShoppingList | null> {
    return await this.db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND deleted_at IS NULL').bind(listId).first<ShoppingList>()
  }

  async updateListName(listId: number, name: string): Promise<void> {
    await this.db.prepare('UPDATE shopping_lists SET name = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .bind(name, new Date().toISOString(), listId).run()
  }

  async getUserLists(userId: number): Promise<ShoppingList[]> {
    const res = await this.db.prepare(`
      SELECT sl.* FROM shopping_lists sl
      JOIN list_members lm ON sl.id = lm.list_id
      WHERE lm.user_id = ? AND sl.deleted_at IS NULL
      ORDER BY sl.created_at DESC
    `).bind(userId).all<ShoppingList>()
    return res.results || []
  }
}
