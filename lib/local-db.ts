import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'qa-local-db'

export type CollectionName =
  | 'projects'
  | 'test_cases'
  | 'test_suites'
  | 'documents'
  | 'important_links'
  | 'platforms'
  | 'comments'
  | 'custom_columns'
  | 'project_shares'
  | 'test_suite_shares'
  | 'status_history'
  | 'shared_project_references'
  | 'app_settings'
  | 'project_activity_log'
  | 'user_column_prefs'

type Store = Record<CollectionName, any[]>

const EMPTY_STORE: Store = {
  projects: [],
  test_cases: [],
  test_suites: [],
  documents: [],
  important_links: [],
  platforms: [],
  comments: [],
  custom_columns: [],
  project_shares: [],
  test_suite_shares: [],
  status_history: [],
  shared_project_references: [],
  app_settings: [],
  project_activity_log: [],
  user_column_prefs: [],
}

let cache: Store = { ...EMPTY_STORE, projects: [] }
let hydratedUserId: string | null = null
const persistQueues: Partial<Record<CollectionName, Promise<void>>> = {}
const dirtyCollections = new Set<CollectionName>()
const hydrateWaiters: Array<() => void> = []

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function notifyHydrated() {
  while (hydrateWaiters.length > 0) {
    hydrateWaiters.shift()?.()
  }
}

function whenHydrated(timeoutMs = 12000): Promise<void> {
  if (hydratedUserId) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Workspace is still loading. Wait a moment and try again.'))
    }, timeoutMs)
    hydrateWaiters.push(() => {
      window.clearTimeout(timer)
      resolve()
    })
  })
}

function emptyStore(): Store {
  const next = { ...EMPTY_STORE }
  for (const key of Object.keys(EMPTY_STORE) as CollectionName[]) {
    next[key] = []
  }
  return next
}

function itemTime(item: any) {
  const raw = item?.updatedAt || item?.createdAt || 0
  const time = new Date(raw).getTime()
  return Number.isFinite(time) ? time : 0
}

/** Keep both cloud and local rows; same id keeps the newer one. */
function mergeById(cloudItems: any[] = [], localItems: any[] = []) {
  const map = new Map<string, any>()
  for (const item of cloudItems) {
    if (item?.id) map.set(String(item.id), item)
  }
  for (const item of localItems) {
    if (!item?.id) continue
    const id = String(item.id)
    const existing = map.get(id)
    if (!existing || itemTime(item) >= itemTime(existing)) {
      map.set(id, item)
    }
  }
  return [...map.values()]
}

function readLocalStore(): Store | null {
  if (!canUseStorage()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const next = emptyStore()
    for (const key of Object.keys(EMPTY_STORE) as CollectionName[]) {
      if (Array.isArray(parsed?.[key])) next[key] = parsed[key]
    }
    return next
  } catch {
    return null
  }
}

function writeLocalStore(store: Store) {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota errors
  }
}

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export async function hydrateCloudStore(userId: string) {
  const local = readLocalStore()
  const memory = cache

  const { data, error } = await supabase.from('app_rows').select('id, collection, data').eq('user_id', userId)
  if (error) throw new Error(error.message)

  const cloud = emptyStore()
  for (const row of data || []) {
    const name = row.collection as CollectionName
    if (!(name in EMPTY_STORE)) continue
    const item = row.data && typeof row.data === 'object' ? { ...(row.data as object), id: row.id } : { id: row.id }
    cloud[name] = [...(cloud[name] || []), item]
  }

  const next = emptyStore()
  const needsCloudSync = new Set<CollectionName>()

  for (const name of Object.keys(EMPTY_STORE) as CollectionName[]) {
    // Always merge cloud + browser localStorage + in-memory cache so a reload
    // cannot throw away cases that were saved locally but not yet in cloud.
    const merged = mergeById(cloud[name], mergeById(local?.[name] || [], memory[name] || []))
    next[name] = merged

    const cloudCount = cloud[name]?.length || 0
    if (merged.length > cloudCount || dirtyCollections.has(name)) {
      needsCloudSync.add(name)
    }
  }

  cache = next
  hydratedUserId = userId
  dirtyCollections.clear()
  writeLocalStore(cache)
  notifyHydrated()

  // Push merged data up only when local had extras the cloud was missing.
  for (const name of needsCloudSync) {
    await persistCollection(name, cache[name] || [])
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('qa-cloud-ready'))
  }
}

export function isCloudReady() {
  return Boolean(hydratedUserId)
}

export async function whenCloudReady(timeoutMs = 12000) {
  await whenHydrated(timeoutMs)
}

export function clearCloudStore() {
  cache = emptyStore()
  hydratedUserId = null
  dirtyCollections.clear()
}

export function readCollection<T = any>(name: CollectionName): T[] {
  return [...(cache[name] || [])] as T[]
}

async function persistCollection(name: CollectionName, items: any[]) {
  if (!hydratedUserId) {
    throw new Error('Workspace is still loading. Wait a moment and try again.')
  }

  // Guard: never wipe a non-empty cloud collection with an accidental empty write.
  if (items.length === 0) {
    const { count, error: countError } = await supabase
      .from('app_rows')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', hydratedUserId)
      .eq('collection', name)
    if (!countError && (count || 0) > 0) {
      console.warn(`Skipped empty replace for ${name} to protect existing cloud rows`)
      return
    }
  }

  const payload = JSON.parse(JSON.stringify(items))
  const { error } = await supabase.rpc('replace_collection', {
    p_collection: name,
    p_rows: payload,
  })
  if (error) {
    console.error(`Could not save ${name} to Supabase`, error.message)
    throw new Error(error.message)
  }
}

export function writeCollection<T = any>(name: CollectionName, items: T[]) {
  cache[name] = items
  writeLocalStore(cache)

  if (!hydratedUserId) {
    dirtyCollections.add(name)
    return whenHydrated().then(() => undefined)
  }

  const snapshot = [...items]
  const run = (persistQueues[name] || Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      // Prefer latest cache, but never persist an empty snapshot over newer non-empty cache.
      const latest = cache[name] || []
      const toPersist = latest.length > 0 ? latest : snapshot
      await persistCollection(name, toPersist)
    })
  persistQueues[name] = run
  return run
}

export function reviveDates<T extends Record<string, any>>(
  item: T,
  fields: string[] = [
    'createdAt',
    'updatedAt',
    'changedAt',
    'timestamp',
    'lastSyncedAt',
    'expiresAt',
    'resolvedAt',
    'lastRun',
  ]
): T {
  if (!item) return item
  const next: Record<string, any> = { ...item }
  for (const field of fields) {
    if (next[field]) next[field] = new Date(next[field])
  }
  return next as T
}
