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

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export async function hydrateCloudStore(userId: string) {
  const { data, error } = await supabase.from('app_rows').select('id, collection, data').eq('user_id', userId)
  if (error) throw new Error(error.message)

  const next: Store = { ...EMPTY_STORE }
  for (const row of data || []) {
    const name = row.collection as CollectionName
    if (!(name in EMPTY_STORE)) continue
    const item = row.data && typeof row.data === 'object' ? { ...(row.data as object), id: row.id } : { id: row.id }
    next[name] = [...(next[name] || []), item]
  }
  cache = next
  hydratedUserId = userId
}

export function clearCloudStore() {
  cache = { ...EMPTY_STORE, projects: [] }
  hydratedUserId = null
}

export function readCollection<T = any>(name: CollectionName): T[] {
  return [...(cache[name] || [])] as T[]
}

async function persistCollection(name: CollectionName, items: any[]) {
  if (!hydratedUserId) return
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
  if (canUseStorage()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    } catch {
      // browser quota is fine; cloud persist is the source of truth
    }
  }
  const run = (persistQueues[name] || Promise.resolve())
    .catch(() => undefined)
    .then(() => persistCollection(name, items))
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
