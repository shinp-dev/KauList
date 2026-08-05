export type Bindings = {
  DB: D1Database
  CLOUD_NAME: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  ENVIRONMENT?: string
}

export type Variables = {
  user: UserSession | null
}

export interface UserSession {
  id: number
  login_id: string
  display_name: string
}

export interface User {
  id: number
  login_id: string
  display_name: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: number
  token_hash: string
  user_id: number
  expires_at: string
  created_at: string
  last_seen_at: string | null
}

export interface ShoppingList {
  id: number
  name: string
  created_by_user_id: number
  created_at: string
  updated_at: string
}

export interface ListMember {
  list_id: number
  user_id: number
  role: 'owner' | 'member'
  joined_at: string
}

export interface InviteCode {
  id: number
  list_id: number
  token_hash: string
  created_by_user_id: number
  expires_at: string
  max_uses: number
  use_count: number
  revoked_at: string | null
  created_at: string
}

export interface Item {
  id: number
  list_id: number
  created_by_user_id: number
  name: string
  count: number
  unit: string
  category: 'food' | 'daily' | 'medicine' | 'other'
  bought: number
  bought_by_user_id: number | null
  image_url?: string // Joined from uploaded_images
  created_at: string
  updated_at: string
}

export interface UploadedImage {
  id: number
  public_id: string
  secure_url: string
  list_id: number
  uploaded_by_user_id: number | null
  status: 'reserved' | 'temporary' | 'attached' | 'deletion_pending'
  item_id: number | null
  retry_count: number
  next_retry_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface CloudinaryResponse {
  result: string
  error?: { message: string }
}
