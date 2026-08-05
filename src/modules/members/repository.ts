export class MemberRepository {
  constructor(private db: D1Database) {}

  async addMember(listId: number, userId: number, role: 'owner' | 'member'): Promise<void> {
    await this.db.prepare(
      'INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)'
    ).bind(listId, userId, role).run()
  }

  async removeMember(listId: number, userId: number): Promise<void> {
    await this.db.prepare('DELETE FROM list_members WHERE list_id = ? AND user_id = ?').bind(listId, userId).run()
  }

  async getMember(listId: number, userId: number): Promise<{ role: string } | null> {
    return await this.db.prepare('SELECT role FROM list_members WHERE list_id = ? AND user_id = ?').bind(listId, userId).first<{ role: string }>()
  }

  async getMembers(listId: number): Promise<any[]> {
    const res = await this.db.prepare(`
      SELECT u.id, u.login_id, u.display_name, lm.role, lm.joined_at
      FROM list_members lm
      JOIN users u ON lm.user_id = u.id
      WHERE lm.list_id = ?
      ORDER BY lm.joined_at ASC
    `).bind(listId).all()
    return res.results || []
  }
}
