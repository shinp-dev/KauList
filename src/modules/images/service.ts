import type { Bindings } from '../../types'
import { deleteCloudinaryImage } from './cloudinary'

export class ImageService {
  constructor(private db: D1Database, private env: Bindings) {}

  async markAsDeletionPending(imageId: number, error: string): Promise<void> {
    await this.db.prepare(
      'UPDATE uploaded_images SET status = ?, item_id = NULL, last_error = ?, updated_at = ? WHERE id = ?'
    ).bind('deletion_pending', error, new Date().toISOString(), imageId).run()
  }

  async deleteImageRecord(imageId: number): Promise<void> {
    await this.db.prepare('DELETE FROM uploaded_images WHERE id = ?').bind(imageId).run()
  }

  async processCleanup(): Promise<void> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const toClean = await this.db.prepare(`
      SELECT id, public_id, status, retry_count 
      FROM uploaded_images 
      WHERE (status = 'reserved' AND created_at < ?)
         OR (status = 'temporary' AND created_at < ? AND item_id IS NULL)
         OR (status = 'deletion_pending' AND (next_retry_at IS NULL OR next_retry_at <= ?))
      LIMIT 10
    `).bind(oneHourAgo, oneDayAgo, now.toISOString()).all<{id: number, public_id: string, status: string, retry_count: number}>()

    if (toClean.results && toClean.results.length > 0) {
      for (const img of toClean.results) {
        const result = await deleteCloudinaryImage(this.env, img.public_id)
        if (result === 'ok' || result === 'not found') {
          await this.deleteImageRecord(img.id)
        } else {
          const nextRetry = new Date(now.getTime() + Math.pow(2, img.retry_count) * 60 * 60 * 1000).toISOString()
          await this.db.prepare(
            'UPDATE uploaded_images SET status = ?, retry_count = retry_count + 1, next_retry_at = ?, last_error = ?, updated_at = ? WHERE id = ?'
          ).bind('deletion_pending', nextRetry, result, now.toISOString(), img.id).run()
        }
      }
    }
  }

  async deleteItemImage(listId: number, itemId: number): Promise<{ imageDeleted: boolean, imageDeletionPending: boolean, cloudinaryResult: string }> {
    let imageDeleted = true
    let imageDeletionPending = false
    let cloudinaryResult = 'no_image'

    const img = await this.db.prepare(
      'SELECT id, public_id FROM uploaded_images WHERE item_id = ? AND list_id = ?'
    ).bind(itemId, listId).first<{id: number, public_id: string}>()

    if (img) {
      cloudinaryResult = await deleteCloudinaryImage(this.env, img.public_id)
      if (cloudinaryResult === 'ok' || cloudinaryResult === 'not found') {
        await this.deleteImageRecord(img.id)
      } else {
        imageDeleted = false
        imageDeletionPending = true
        await this.markAsDeletionPending(img.id, cloudinaryResult)
      }
    }

    return { imageDeleted, imageDeletionPending, cloudinaryResult }
  }
}
