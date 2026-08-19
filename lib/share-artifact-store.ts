import { getShareDb } from '@/lib/supabase-admin'

const BUCKET = 'artifacts'

export type ShareArtifactMeta = {
  id: string
  name: string
  kind: 'image' | 'video'
  mime: string
  size: number
}

function safePart(value: string, label: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) throw new Error(`Invalid ${label}`)
  return value
}

function sharePath(token: string, id: string) {
  return `shares/${safePart(token, 'share')}/${safePart(id, 'artifact')}`
}

export const shareArtifactStore = {
  async save(token: string, meta: ShareArtifactMeta, bytes: Buffer) {
    const db = getShareDb()
    const path = sharePath(token, meta.id)
    const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
      contentType: meta.mime || 'application/octet-stream',
      upsert: true,
    })
    if (error) throw new Error(error.message)
    return { ...meta, size: bytes.length }
  },

  async get(
    token: string,
    id: string,
    ownerId?: string
  ): Promise<{ meta: ShareArtifactMeta; bytes: Buffer } | null> {
    const db = getShareDb()
    const candidates = [sharePath(token, safePart(id, 'artifact'))]
    if (ownerId && /^[a-zA-Z0-9._-]+$/.test(ownerId) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      candidates.push(`${ownerId}/${safePart(id, 'artifact')}`)
    }

    for (const path of candidates) {
      const { data, error } = await db.storage.from(BUCKET).download(path)
      if (error || !data) continue
      const bytes = Buffer.from(await data.arrayBuffer())
      return {
        meta: {
          id,
          name: id,
          kind: data.type.startsWith('video/') ? 'video' : 'image',
          mime: data.type || 'application/octet-stream',
          size: bytes.length,
        },
        bytes,
      }
    }
    return null
  },

  async signedUrl(token: string, id: string, ownerId?: string) {
    const db = getShareDb()
    const candidates = [sharePath(token, safePart(id, 'artifact'))]
    if (ownerId && /^[a-zA-Z0-9._-]+$/.test(ownerId) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      candidates.push(`${ownerId}/${safePart(id, 'artifact')}`)
    }
    for (const path of candidates) {
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 10)
      if (!error && data?.signedUrl) return data.signedUrl
    }
    return null
  },

  async remove(token: string, id: string) {
    const db = getShareDb()
    await db.storage.from(BUCKET).remove([sharePath(token, id)])
  },

  async removeAll(token: string) {
    const db = getShareDb()
    const folder = `shares/${safePart(token, 'share')}`
    const { data } = await db.storage.from(BUCKET).list(folder, { limit: 1000 })
    const names = (data || []).map((item) => `${folder}/${item.name}`)
    if (names.length) await db.storage.from(BUCKET).remove(names)
  },
}
