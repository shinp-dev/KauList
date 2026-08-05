import type { ShoppingList, ListMember } from '../../types'

export class ListService {
  constructor(private db: D1Database) {}

  async getUserLists(userId: number): Promise<ShoppingList[]> {
    const { results } = await this.db.prepare(`
      SELECT sl.* 
      FROM shopping_lists sl
      JOIN list_members lm ON sl.id = lm.list_id
      WHERE lm.user_id = ?
      ORDER BY sl.created_at DESC
    `).bind(userId).all<ShoppingList>()
    return results || []
  }

  async createList(userId: number, name: string): Promise<ShoppingList> {
    const res = await this.db.prepare(
      'INSERT INTO shopping_lists (name, created_by_user_id) VALUES (?, ?) RETURNING *'
    ).bind(name, userId).first<ShoppingList>()
    
    if (!res) throw new Error('Failed to create list')

    await this.db.prepare(
      'INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)'
    ).bind(res.id, userId, 'owner').run()

    return res
  }

  async updateList(listId: number, name: string): Promise<void> {
    await this.db.prepare(
      'UPDATE shopping_lists SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name, listId).run()
  }

  async deleteList(listId: number): Promise<void> {
    await this.db.prepare('DELETE FROM shopping_lists WHERE id = ?').bind(listId).run()
  }
}
