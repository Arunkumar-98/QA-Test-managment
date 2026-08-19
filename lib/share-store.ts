import type { CreateShareInput, ShareKind, SharePermissions, ShareRecord, ShareRole, SharedRow } from '@/lib/share-types'
import { canAccessShare } from '@/lib/share-access'
import { shareArtifactStore } from '@/lib/share-artifact-store'
import { getShareDb } from '@/lib/supabase-admin'

export type {
  CreateShareInput,
  ShareKind,
  SharePermissions,
  ShareRecord,
  ShareRole,
  SharedList,
  SharedRow,
} from '@/lib/share-types'

type ShareRow = {
  token: string
  kind: ShareKind
  title: string
  project_id: string
  project_name: string
  suite_id: string | null
  role: ShareRole
  permissions: SharePermissions
  created_by: string
  created_at: string
  updated_at: string
  revoked: boolean
  allowed_emails: string[]
  columns: ShareRecord['columns']
  lists: ShareRecord['lists']
  rows: SharedRow[]
}

function permissionsForRole(role: ShareRole): SharePermissions {
  if (role === 'view') {
    return { canView: true, canEdit: false, canCreate: false, canDelete: false, canExport: false }
  }
  if (role === 'edit') {
    return { canView: true, canEdit: true, canCreate: true, canDelete: false, canExport: false }
  }
  return { canView: true, canEdit: true, canCreate: true, canDelete: true, canExport: true }
}

function createToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '')
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

function fromRow(row: ShareRow): ShareRecord {
  return {
    token: row.token,
    kind: row.kind,
    title: row.title,
    projectId: row.project_id,
    projectName: row.project_name,
    suiteId: row.suite_id || undefined,
    role: row.role,
    permissions: row.permissions,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revoked: row.revoked,
    allowedEmails: row.allowed_emails || [],
    columns: row.columns || [],
    lists: row.lists || [],
    rows: row.rows || [],
  }
}

function parseShare(value: unknown): ShareRecord | null {
  if (!value || typeof value !== 'object') return null
  return fromRow(value as ShareRow)
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const db = getShareDb()
  const { data, error } = await db.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

function toInsert(share: ShareRecord) {
  return {
    token: share.token,
    kind: share.kind,
    title: share.title,
    project_id: share.projectId,
    project_name: share.projectName,
    suite_id: share.suiteId || null,
    role: share.role,
    permissions: share.permissions,
    created_by: share.createdBy,
    created_at: share.createdAt,
    updated_at: share.updatedAt,
    revoked: share.revoked,
    allowed_emails: share.allowedEmails || [],
    columns: share.columns,
    lists: share.lists,
    rows: share.rows,
  }
}

export function toPublicShare(share: ShareRecord, viewerId?: string) {
  return {
    ...share,
    isOwner: Boolean(viewerId && viewerId === share.createdBy),
  }
}

export const shareStore = {
  permissionsForRole,

  async create(input: CreateShareInput): Promise<ShareRecord> {
    const now = new Date().toISOString()
    const existing = parseShare(
      await rpc('find_share_for_resource', {
        p_created_by: input.createdBy,
        p_project_id: input.projectId,
        p_kind: input.kind,
        p_suite_id: input.kind === 'list' ? input.suiteId || null : null,
      })
    )

    const next: ShareRecord = existing
      ? {
          ...existing,
          title: input.title,
          projectName: input.projectName,
          role: input.role,
          permissions: permissionsForRole(input.role),
          columns: input.columns,
          lists: input.lists,
          rows: input.rows,
          allowedEmails: input.allowedEmails || [],
          updatedAt: now,
          revoked: false,
        }
      : {
          token: createToken(),
          kind: input.kind,
          title: input.title,
          projectId: input.projectId,
          projectName: input.projectName,
          suiteId: input.suiteId,
          role: input.role,
          permissions: permissionsForRole(input.role),
          createdBy: input.createdBy,
          createdAt: now,
          updatedAt: now,
          revoked: false,
          allowedEmails: input.allowedEmails || [],
          columns: input.columns,
          lists: input.lists,
          rows: input.rows,
        }

    const saved = parseShare(await rpc('upsert_share', { p_share: toInsert(next) }))
    if (!saved) throw new Error('Could not save share')
    return saved
  },

  async getByToken(token: string): Promise<ShareRecord | null> {
    return parseShare(await rpc('get_share_by_token', { p_token: token }))
  },

  async findForResource(options: {
    createdBy: string
    projectId: string
    kind: ShareKind
    suiteId?: string
  }): Promise<ShareRecord | null> {
    return parseShare(
      await rpc('find_share_for_resource', {
        p_created_by: options.createdBy,
        p_project_id: options.projectId,
        p_kind: options.kind,
        p_suite_id: options.kind === 'list' ? options.suiteId || null : null,
      })
    )
  },

  async revoke(token: string, createdBy: string): Promise<boolean> {
    const ok = await rpc<boolean>('revoke_share', { p_token: token, p_created_by: createdBy })
    if (ok) await shareArtifactStore.removeAll(token)
    return Boolean(ok)
  },

  async patchRows(
    token: string,
    patch:
      | { action: 'create'; row: SharedRow }
      | { action: 'update'; id: string; dynamicFields?: SharedRow['dynamicFields']; position?: number }
      | { action: 'delete'; ids: string[] }
      | { action: 'reorder'; ids: string[] },
    actorId?: string,
    email?: string
  ): Promise<ShareRecord> {
    const share = await this.getByToken(token)
    if (!share) throw new Error('Share not found')
    if (!canAccessShare(share, { actorId, email })) throw new Error('Forbidden')
    const isOwner = Boolean(actorId && actorId === share.createdBy)

    if (patch.action === 'create') {
      if (!isOwner && !share.permissions.canCreate && !share.permissions.canEdit) {
        throw new Error('Forbidden')
      }
      share.rows.push(patch.row)
    } else if (patch.action === 'update') {
      if (!isOwner && !share.permissions.canEdit) throw new Error('Forbidden')
      const index = share.rows.findIndex((row) => row.id === patch.id)
      if (index === -1) throw new Error('Row not found')
      share.rows[index] = {
        ...share.rows[index],
        updatedAt: new Date() as any,
        position: patch.position ?? share.rows[index].position,
        dynamicFields: patch.dynamicFields
          ? { ...share.rows[index].dynamicFields, ...patch.dynamicFields }
          : share.rows[index].dynamicFields,
      }
    } else if (patch.action === 'delete') {
      if (!isOwner && !share.permissions.canDelete) throw new Error('Forbidden')
      const ids = new Set(patch.ids)
      share.rows = share.rows.filter((row) => !ids.has(row.id))
    } else if (patch.action === 'reorder') {
      if (!isOwner && !share.permissions.canEdit) throw new Error('Forbidden')
      const order = new Map(patch.ids.map((id, index) => [id, index]))
      share.rows = share.rows
        .map((row) => ({ ...row, position: order.has(row.id) ? order.get(row.id)! : row.position }))
        .sort((a, b) => a.position - b.position)
    }

    share.updatedAt = new Date().toISOString()
    const saved = parseShare(
      await rpc('save_share_rows', {
        p_token: token,
        p_actor_id: actorId || '',
        p_email: email || '',
        p_rows: share.rows,
      })
    )
    if (!saved) throw new Error('Could not update share')
    return saved
  },
}
