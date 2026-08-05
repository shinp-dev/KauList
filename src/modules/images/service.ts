import type { Bindings } from '../../types'
import { deleteCloudinaryImage, checkCloudinaryImageExists } from './cloudinary'
import { ImageRepository } from './repository'

export class ImageService {
  private imageRepo: ImageRepository

  constructor(private db: D1Database, private env: Bindings) {
    this.imageRepo = new ImageRepository(db)
  }

  async markAsDeletionPending(imageId: number, error: string): Promise<void> {
    await this.imageRepo.markAsDeletionPending(imageId, error, new Date().toISOString())
  }

  async deleteImageRecord(imageId: number): Promise<void> {
    await this.imageRepo.deleteImageRecord(imageId)
  }

  async processCleanup(): Promise<void> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const toClean = await this.imageRepo.getImagesForCleanup(oneHourAgo, oneDayAgo, now.toISOString())

    for (const img of toClean) {
      const result = await deleteCloudinaryImage(this.env, img.public_id)
      if (result === 'ok' || result === 'not found') {
        await this.deleteImageRecord(img.id)
      } else {
        const nextRetry = new Date(now.getTime() + Math.pow(2, img.retry_count) * 60 * 60 * 1000).toISOString()
        await this.imageRepo.updateRetryStatus(img.id, 'deletion_pending', img.retry_count + 1, nextRetry, result, now.toISOString())
      }
    }
  }

  async verifyAndCompleteImage(publicId: string, listId: number, userId: number, version: string, signature: string): Promise<{ success: boolean, secureUrl?: string, imageId?: number, error?: string }> {
    // 1. Signature validation is done in routes
    // 2. Public ID prefix validation
    if (!publicId.startsWith(`lists/${listId}/`)) {
      return { success: false, error: 'Invalid public_id prefix' }
    }

    // 3. Check reserved state
    const img = await this.imageRepo.getReservedImage(publicId, listId, userId)
    if (!img) {
      return { success: false, error: 'Invalid image record or unauthorized' }
    }

    // 4. Check Cloudinary actual existence
    const exists = await checkCloudinaryImageExists(this.env, publicId)
    if (!exists.success) {
      return { success: false, error: 'Image does not exist on Cloudinary or is not an image' }
    }

    // 5. Update state
    await this.imageRepo.markAsTemporary(img.id, exists.secureUrl!, new Date().toISOString())

    return { success: true, secureUrl: exists.secureUrl, imageId: img.id }
  }

  async deleteTemporaryImage(imageId: number, listId: number, userId: number): Promise<{ success: boolean, error?: string }> {
    const img = await this.imageRepo.getImageForDeletion(imageId, listId)
    if (!img) return { success: false, error: 'Not found' }
    if (img.uploaded_by_user_id !== userId) return { success: false, error: 'Forbidden' }
    if (img.item_id !== null) return { success: false, error: 'Image is attached to an item' }
    if (img.status !== 'reserved' && img.status !== 'temporary') return { success: false, error: 'Image cannot be deleted' }

    const cloudinaryResult = await deleteCloudinaryImage(this.env, img.public_id)
    if (cloudinaryResult === 'ok' || cloudinaryResult === 'not found') {
      await this.deleteImageRecord(img.id)
      return { success: true }
    } else {
      await this.markAsDeletionPending(img.id, cloudinaryResult)
      return { success: false, error: 'Cloudinary deletion failed, marked as pending' }
    }
  }

  async deleteItemImageInternal(listId: number, itemId: number): Promise<{ imageDeleted: boolean, imageDeletionPending: boolean, cloudinaryResult: string }> {
    let imageDeleted = true
    let imageDeletionPending = false
    let cloudinaryResult = 'no_image'

    const img = await this.imageRepo.getImageByItemId(itemId, listId)

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
