import type { UploadedImage } from '../../types'

export class ImageRepository {
  constructor(private db: D1Database) {}

  async reserveImage(publicId: string, listId: number, userId: number): Promise<number> {
    const res = await this.db.prepare(
      'INSERT INTO uploaded_images (public_id, list_id, uploaded_by_user_id, status) VALUES (?, ?, ?, ?) RETURNING id'
    ).bind(publicId, listId, userId, 'reserved').first<{id: number}>()
    if (!res) throw new Error('Failed to reserve image')
    return res.id
  }

  async getReservedImage(publicId: string, listId: number, userId: number): Promise<UploadedImage | null> {
    return await this.db.prepare(
      'SELECT * FROM uploaded_images WHERE public_id = ? AND list_id = ? AND uploaded_by_user_id = ? AND status = ?'
    ).bind(publicId, listId, userId, 'reserved').first<UploadedImage>()
  }

  async markAsTemporary(imageId: number, secureUrl: string, now: string): Promise<void> {
    await this.db.prepare(
      'UPDATE uploaded_images SET status = ?, secure_url = ?, updated_at = ? WHERE id = ?'
    ).bind('temporary', secureUrl, now, imageId).run()
  }

  async attachImage(imageId: number, listId: number, userId: number, itemId: number, now: string): Promise<boolean> {
    const res = await this.db.prepare(
      `UPDATE uploaded_images 
       SET status = 'attached', item_id = ?, updated_at = ? 
       WHERE id = ? AND list_id = ? AND uploaded_by_user_id = ? AND status = 'temporary' AND item_id IS NULL 
       RETURNING id`
    ).bind(itemId, now, imageId, listId, userId).first()
    return !!res
  }

  async markAsDeletionPending(imageId: number, error: string, now: string): Promise<void> {
    await this.db.prepare(
      'UPDATE uploaded_images SET status = ?, item_id = NULL, last_error = ?, updated_at = ? WHERE id = ?'
    ).bind('deletion_pending', error, now, imageId).run()
  }

  async deleteImageRecord(imageId: number): Promise<void> {
    await this.db.prepare('DELETE FROM uploaded_images WHERE id = ?').bind(imageId).run()
  }

  async getImageForDeletion(imageId: number, listId: number): Promise<{id: number, public_id: string, uploaded_by_user_id: number, status: string, item_id: number | null} | null> {
    return await this.db.prepare(
      'SELECT id, public_id, uploaded_by_user_id, status, item_id FROM uploaded_images WHERE id = ? AND list_id = ?'
    ).bind(imageId, listId).first()
  }

  async getImageByItemId(itemId: number, listId: number): Promise<{id: number, public_id: string} | null> {
    return await this.db.prepare(
      'SELECT id, public_id FROM uploaded_images WHERE item_id = ? AND list_id = ?'
    ).bind(itemId, listId).first<{id: number, public_id: string}>()
  }

  async getImagesForCleanup(oneHourAgo: string, oneDayAgo: string, now: string): Promise<any[]> {
    const res = await this.db.prepare(`
      SELECT id, public_id, status, retry_count 
      FROM uploaded_images 
      WHERE (status = 'reserved' AND created_at < ?)
         OR (status = 'temporary' AND created_at < ? AND item_id IS NULL)
         OR (status = 'deletion_pending' AND (next_retry_at IS NULL OR next_retry_at <= ?))
      LIMIT 10
    `).bind(oneHourAgo, oneDayAgo, now).all()
    return res.results || []
  }

  async updateRetryStatus(imageId: number, status: string, retryCount: number, nextRetryAt: string, lastError: string, now: string): Promise<void> {
    await this.db.prepare(
      'UPDATE uploaded_images SET status = ?, retry_count = ?, next_retry_at = ?, last_error = ?, updated_at = ? WHERE id = ?'
    ).bind(status, retryCount, nextRetryAt, lastError, now, imageId).run()
  }
}
