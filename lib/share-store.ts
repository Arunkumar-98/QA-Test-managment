import { promises as fs } from 'fs'
import path from 'path'
import type { CreateShareInput, ShareKind, SharePermissions, ShareRecord, ShareRole, SharedRow } from '@/lib/share-types'
import { canAccessShare } from '@/lib/share-access'
import { shareArtifactStore } from '@/lib/share-artifact-store'

export type {
  CreateShareInput,
  ShareKind,
  SharePermissions,
  ShareRecord,
  ShareRole,
  SharedList,
  SharedRow,
} from '@/lib/share-types'

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'shares.json')

type Store = { shares: ShareRecord[] }

let writeQueue: Promise<void> = Promise.resolve()

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

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return { shares: Array.isArray(parsed?.shares) ? parsed.shares : [] }
  } catch (error: any) {
    if (error?.code === 'ENOENT') return { shares: [] }
    throw error
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const tmp = `${STORE_PATH}.tmp`
  await fs.writeFile(tmp, JSON.stringify(store, null, 2))
  await fs.rename(tmp, STORE_PATH)
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn)
  writeQueue = run.then(
    () => undefined,
    () => undefined
  )
  return run
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
    return withLock(async () => {
      const store = await readStore()
      const now = new Date().toISOString()
      const existing = store.shares.find(
        (share) =>
          !share.revoked &&
          share.createdBy === input.createdBy &&
          share.kind === input.kind &&
          share.projectId === input.projectId &&
          (input.kind === 'project' || share.suiteId === input.suiteId)
      )

      if (existing) {
        existing.title = input.title
        existing.projectName = input.projectName
        existing.role = input.role
        existing.permissions = permissionsForRole(input.role)
        existing.columns = input.columns
        existing.lists = input.lists
        existing.rows = input.rows
        existing.allowedEmails = input.allowedEmails || []
        existing.updatedAt = now
        existing.revoked = false
        await writeStore(store)
        return existing
      }

      const created: ShareRecord = {
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
      store.shares.push(created)
      await writeStore(store)
      return created
    })
  },

  async getByToken(token: string): Promise<ShareRecord | null> {
    const store = await readStore()
    return store.shares.find((share) => share.token === token && !share.revoked) || null
  },

  async findForResource(options: {
    createdBy: string
    projectId: string
    kind: ShareKind
    suiteId?: string
  }): Promise<ShareRecord | null> {
    const store = await readStore()
    return (
      store.shares.find(
        (share) =>
          !share.revoked &&
          share.createdBy === options.createdBy &&
          share.kind === options.kind &&
          share.projectId === options.projectId &&
          (options.kind === 'project' || share.suiteId === options.suiteId)
      ) || null
    )
  },

  async revoke(token: string, createdBy: string): Promise<boolean> {
    return withLock(async () => {
      const store = await readStore()
      const share = store.shares.find((item) => item.token === token)
      if (!share || share.createdBy !== createdBy) return false
      share.revoked = true
      share.updatedAt = new Date().toISOString()
      await writeStore(store)
      await shareArtifactStore.removeAll(token)
      return true
    })
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
    return withLock(async () => {
      const store = await readStore()
      const share = store.shares.find((item) => item.token === token && !item.revoked)
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
      await writeStore(store)
      return share
    })
  },
}
