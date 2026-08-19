import { createId } from '@/lib/local-db'
import { getCurrentUser } from '@/lib/local-auth'
import { supabase } from '@/lib/supabase'

const DB_NAME = 'qa-artifacts'
const STORE = 'files'
const DB_VERSION = 1
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ARTIFACT_BUCKET = 'artifacts'
const MAX_IMAGE_EDGE = 1920

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type ArtifactKind = 'image' | 'video'

export type ArtifactMeta = {
  id: string
  name: string
  kind: ArtifactKind
  mime: string
  size: number
}

function isMeta(value: unknown): value is ArtifactMeta {
  if (!value || typeof value !== 'object') return false
  const item = value as ArtifactMeta
  return Boolean(item.id && item.name && (item.kind === 'image' || item.kind === 'video'))
}

export function parseArtifacts(value: unknown): ArtifactMeta[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(isMeta)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter(isMeta) : []
    } catch {
      return []
    }
  }
  return []
}

export function serializeArtifacts(items: ArtifactMeta[]): string {
  return JSON.stringify(items)
}

export function artifactKindFromFile(file: File): ArtifactKind | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  const name = file.name.toLowerCase()
  if (/\.(png|jpe?g|gif|webp|bmp|svg|heic)$/.test(name)) return 'image'
  if (/\.(mp4|webm|mov|m4v|ogg)$/.test(name)) return 'video'
  return null
}

async function compressImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  if (typeof createImageBitmap !== 'function' && typeof Image === 'undefined') return file

  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    image.src = url
  }).catch(() => null)

  if (!source) return file

  let width = source.naturalWidth || source.width
  let height = source.naturalHeight || source.height
  if (!width || !height) return file
  if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE) {
    const scale = Math.min(MAX_IMAGE_EDGE / width, MAX_IMAGE_EDGE / height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(source, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), 'image/jpeg', 0.82)
  })
  return blob && blob.size < file.size ? blob : file
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('File storage is not available in this browser'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open artifact storage'))
  })
}

export async function putArtifactFile(id: string, blob: Blob) {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('Could not cache file'))
      tx.objectStore(STORE).put(blob, id)
    })
  } finally {
    db.close()
  }
}

export async function getLocalArtifactFile(id: string): Promise<Blob | null> {
  const db = await openDb()
  const file = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).get(id)
    request.onsuccess = () => resolve((request.result as Blob) || null)
    request.onerror = () => reject(request.error || new Error('Could not read file'))
  })
  db.close()
  return file
}

function storagePath(id: string, userId?: string | null) {
  const owner = userId || getCurrentUser()?.id
  if (!owner) return null
  return `${owner}/${id}`
}

async function uploadToSupabase(id: string, blob: Blob, mime: string) {
  const path = storagePath(id)
  if (!path) throw new Error('Sign in to upload files')
  const { error } = await supabase.storage.from(ARTIFACT_BUCKET).upload(path, blob, {
    contentType: mime || blob.type || 'application/octet-stream',
    upsert: true,
  })
  if (error) throw new Error(error.message)
}

async function downloadFromSupabase(id: string): Promise<Blob | null> {
  const path = storagePath(id)
  if (!path) return null
  const { data, error } = await supabase.storage.from(ARTIFACT_BUCKET).download(path)
  if (error || !data) return null
  return data
}

export async function saveArtifactFile(file: File, shareToken?: string | null): Promise<ArtifactMeta> {
  const kind = artifactKindFromFile(file)
  if (!kind) throw new Error('Only images and videos can be added')

  const prepared = kind === 'image' ? await compressImage(file) : file
  const limit = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
  if (prepared.size > limit) {
    throw new Error(
      kind === 'image'
        ? `This image is ${formatBytes(prepared.size)}. Please use one under 15 MB.`
        : `This video is ${formatBytes(prepared.size)}. Please use one under 50 MB.`
    )
  }

  const id = createId()
  const mime = prepared.type || file.type || (kind === 'image' ? 'image/jpeg' : 'video/mp4')
  await putArtifactFile(id, prepared)
  await uploadToSupabase(id, prepared, mime)

  const meta = {
    id,
    name: file.name || (kind === 'image' ? 'image' : 'video'),
    kind,
    mime,
    size: prepared.size,
  }
  if (shareToken) {
    const { uploadShareArtifact } = await import('@/lib/share-client')
    await uploadShareArtifact(shareToken, meta, prepared)
  }
  return meta
}

export async function getArtifactFile(id: string, shareToken?: string | null): Promise<Blob | null> {
  const local = await getLocalArtifactFile(id)
  if (local) return local

  const cloud = await downloadFromSupabase(id)
  if (cloud) {
    await putArtifactFile(id, cloud).catch(() => undefined)
    return cloud
  }

  if (!shareToken) return null
  const { fetchShareArtifact } = await import('@/lib/share-client')
  const remote = await fetchShareArtifact(shareToken, id)
  if (remote) {
    await putArtifactFile(id, remote).catch(() => undefined)
  }
  return remote
}

export async function deleteArtifactFiles(ids: string[], shareToken?: string | null): Promise<void> {
  if (ids.length === 0) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('Could not delete files'))
    const store = tx.objectStore(STORE)
    ids.forEach((id) => store.delete(id))
  })
  db.close()

  const owner = getCurrentUser()?.id
  if (owner) {
    await Promise.all(
      ids.map(async (id) => {
        const path = storagePath(id, owner)
        if (!path) return
        await supabase.storage.from(ARTIFACT_BUCKET).remove([path])
      })
    )
  }

  if (shareToken) {
    const { deleteShareArtifact } = await import('@/lib/share-client')
    await Promise.all(ids.map((id) => deleteShareArtifact(shareToken, id)))
  }
}

export function artifactsFromRows(rows: Array<{ dynamicFields?: Record<string, unknown> }>): string[] {
  return rows.flatMap((row) => parseArtifacts(row.dynamicFields?.artifacts).map((item) => item.id))
}
