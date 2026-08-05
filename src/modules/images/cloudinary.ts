import type { Bindings } from '../../types'

export async function deleteCloudinaryImage(env: Bindings, publicId: string): Promise<string> {
  if (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return 'no_creds'
  }
  const timestamp = Math.round(new Date().getTime() / 1000)
  const str = `public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`
  const signature = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str)))).map(b => b.toString(16).padStart(2, '0')).join('')

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId, timestamp, api_key: env.CLOUDINARY_API_KEY, signature })
    })
    const data = await res.json() as any
    return data.result || 'error'
  } catch (e) {
    return 'error'
  }
}
