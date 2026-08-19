import type { CreateShareInput, ShareKind, ShareRole, SharedRow, PublicShare } from '@/lib/share-types'
import { getCurrentUser } from '@/lib/local-auth'
import { parseArtifacts, type ArtifactMeta } from '@/lib/artifact-store'
import { supabase } from '@/lib/supabase'

export type { PublicShare, ShareKind, ShareRole }

const EMAIL_KEY = (token: string) => `qa-share-email:${token}`

export class ShareAccessError extends Error {
  requiresEmail = false
  constructor(message: string, requiresEmail = false) {
    super(message)
    this.name = 'ShareAccessError'
    this.requiresEmail = requiresEmail
  }
}

export function getShareEmail(token: string) {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(EMAIL_KEY(token)) || ''
}

export function setShareEmail(token: string, email: string) {
  sessionStorage.setItem(EMAIL_KEY(token), email.trim().toLowerCase())
}

function shareHeaders(token?: string, extra?: Record<string, string>) {
  const headers: Record<string, string> = { ...extra }
  const user = getCurrentUser()
  if (user?.id) headers['x-share-actor'] = user.id
  if (token) {
    const email = getShareEmail(token)
    if (email) headers['x-share-email'] = email
  }
  return headers
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const data = payload as { error?: string; requiresEmail?: boolean }
    if (response.status === 401 && data.requiresEmail) {
      throw new ShareAccessError(data.error || 'Enter an invited email to open this share', true)
    }
    throw new Error(data.error || 'Share request failed')
  }
  return payload as T
}

export async function createShare(input: CreateShareInput) {
  return readJson<{ share: PublicShare; url: string }>(
    await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  )
}

export async function fetchShare(token: string) {
  return readJson<{ share: PublicShare }>(
    await fetch(`/api/share/${token}`, {
      cache: 'no-store',
      headers: shareHeaders(token),
    })
  )
}

export async function fetchExistingShare(options: {
  createdBy: string
  projectId: string
  kind: ShareKind
  suiteId?: string
}) {
  const params = new URLSearchParams({
    createdBy: options.createdBy,
    projectId: options.projectId,
    kind: options.kind,
  })
  if (options.suiteId) params.set('suiteId', options.suiteId)
  return readJson<{ share: PublicShare | null }>(await fetch(`/api/share?${params}`, { cache: 'no-store' }))
}

export async function revokeShare(token: string, createdBy: string) {
  return readJson<{ ok: boolean }>(
    await fetch(`/api/share/${token}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createdBy }),
    })
  )
}

export async function patchShareRows(
  token: string,
  patch:
    | { action: 'create'; row: SharedRow }
    | { action: 'update'; id: string; dynamicFields?: SharedRow['dynamicFields']; position?: number }
    | { action: 'delete'; ids: string[] }
    | { action: 'reorder'; ids: string[] }
) {
  return readJson<{ share: PublicShare }>(
    await fetch(`/api/share/${token}/rows`, {
      method: 'PATCH',
      headers: {
        ...shareHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...patch, actorId: getCurrentUser()?.id, email: getShareEmail(token) }),
    })
  )
}

export async function uploadShareArtifact(token: string, meta: ArtifactMeta, file: Blob) {
  const form = new FormData()
  form.set('file', file, meta.name)
  form.set('id', meta.id)
  form.set('name', meta.name)
  form.set('kind', meta.kind)
  form.set('mime', meta.mime || file.type || '')
  form.set('actorId', getCurrentUser()?.id || '')
  form.set('email', getShareEmail(token))
  const response = await fetch(`/api/share/${token}/artifacts`, {
    method: 'POST',
    headers: shareHeaders(token),
    body: form,
  })
  return readJson<{ ok: boolean; meta: ArtifactMeta }>(response)
}

export async function fetchShareArtifact(token: string, id: string): Promise<Blob | null> {
  const response = await fetch(`/api/share/${token}/artifacts/${id}`, {
    cache: 'no-store',
    headers: shareHeaders(token),
  })
  if (response.status === 404) return null
  if (!response.ok) return null
  return response.blob()
}

export async function deleteShareArtifact(token: string, id: string) {
  await fetch(`/api/share/${token}/artifacts/${id}`, {
    method: 'DELETE',
    headers: {
      ...shareHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ actorId: getCurrentUser()?.id, email: getShareEmail(token) }),
  }).catch(() => undefined)
}

export async function uploadArtifactsForRows(
  token: string,
  rows: Array<{ dynamicFields?: Record<string, unknown> }>,
  getLocalFile: (id: string) => Promise<Blob | null>
) {
  const items = rows.flatMap((row) => parseArtifacts(row.dynamicFields?.artifacts))
  const user = getCurrentUser()

  for (const item of items) {
    let blob = await getLocalFile(item.id)
    if (!blob && user?.id) {
      const { data } = await supabase.storage.from('artifacts').download(`${user.id}/${item.id}`)
      blob = data || null
    }
    if (!blob) continue
    const { error } = await supabase.storage.from('artifacts').upload(`shares/${token}/${item.id}`, blob, {
      contentType: item.mime || blob.type || 'application/octet-stream',
      upsert: true,
    })
    if (error) {
      await uploadShareArtifact(token, item, blob).catch(() => undefined)
    }
  }
}

const INDEX_KEY = 'qa-share-index'

export type LocalShareIndexEntry = {
  token: string
  kind: ShareKind
  role: ShareRole
  projectId: string
  suiteId?: string
}

function readIndex(): LocalShareIndexEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]')
  } catch {
    return []
  }
}

function writeIndex(entries: LocalShareIndexEntry[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries))
}

export function rememberLocalShare(entry: LocalShareIndexEntry) {
  const next = readIndex().filter((item) => {
    if (item.projectId !== entry.projectId) return true
    if (entry.kind === 'project') return item.kind !== 'project'
    return !(item.kind === 'list' && item.suiteId === entry.suiteId)
  })
  next.push(entry)
  writeIndex(next)
}

export function forgetLocalShare(token: string) {
  writeIndex(readIndex().filter((item) => item.token !== token))
}

export function getLocalShare(projectId: string, suiteId?: string | null) {
  const entries = readIndex()
  const projectShare = entries.find((item) => item.projectId === projectId && item.kind === 'project')
  if (projectShare) return projectShare
  if (!suiteId) return null
  return entries.find((item) => item.projectId === projectId && item.kind === 'list' && item.suiteId === suiteId) || null
}
