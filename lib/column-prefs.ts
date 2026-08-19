import { createId, readCollection, writeCollection } from '@/lib/local-db'
import { getCurrentUser } from '@/lib/local-auth'
import { DEFAULT_HIDDEN_COLUMN_NAMES } from '@/lib/case-schema'

const HIDDEN_DEFAULTS_VERSION = 1
const STICKY_DEFAULTS_VERSION = 1
export const KEY_COLUMN_ID = '__key__'
export const DEFAULT_KEY_WIDTH = 108
export const DEFAULT_STICKY_COLUMN_NAMES = ['title']

export type UserColumnPref = {
  id: string
  userId: string
  projectId: string
  hiddenColumnIds: string[]
  hiddenDefaultsVersion?: number
  stickyColumnIds?: string[]
  stickyDefaultsVersion?: number
  columnWidths?: Record<string, number>
  rowHeights?: Record<string, number>
}

function prefKey(userId: string, projectId: string) {
  return `${userId}:${projectId}`
}

function readPref(projectId: string): UserColumnPref | null {
  const user = getCurrentUser()
  if (!user || !projectId) return null
  return (
    readCollection<UserColumnPref>('user_column_prefs').find(
      (item) => prefKey(item.userId, item.projectId) === prefKey(user.id, projectId)
    ) || null
  )
}

function patchPref(projectId: string, patch: Partial<UserColumnPref>) {
  const user = getCurrentUser()
  if (!user || !projectId) return null

  const items = readCollection<UserColumnPref>('user_column_prefs')
  const index = items.findIndex(
    (item) => prefKey(item.userId, item.projectId) === prefKey(user.id, projectId)
  )
  const current = index >= 0 ? items[index] : null
  const next: UserColumnPref = {
    id: current?.id || createId(),
    userId: user.id,
    projectId,
    hiddenColumnIds: current?.hiddenColumnIds || [],
    hiddenDefaultsVersion: current?.hiddenDefaultsVersion,
    stickyColumnIds: current?.stickyColumnIds,
    stickyDefaultsVersion: current?.stickyDefaultsVersion,
    columnWidths: current?.columnWidths || {},
    rowHeights: current?.rowHeights || {},
    ...patch,
  }

  if (index >= 0) items[index] = next
  else items.push(next)
  writeCollection('user_column_prefs', items)
  return next
}

export function getHiddenColumnIds(projectId: string): string[] {
  return readPref(projectId)?.hiddenColumnIds || []
}

export function applyDefaultHiddenColumns(
  projectId: string,
  columns: Array<{ id: string; name: string }>
): string[] {
  const pref = readPref(projectId)
  if ((pref?.hiddenDefaultsVersion || 0) >= HIDDEN_DEFAULTS_VERSION) {
    return pref?.hiddenColumnIds || []
  }

  const hidden = new Set(pref?.hiddenColumnIds || [])
  for (const column of columns) {
    if (DEFAULT_HIDDEN_COLUMN_NAMES.includes(column.name)) hidden.add(column.id)
  }
  const hiddenColumnIds = Array.from(hidden)
  patchPref(projectId, { hiddenColumnIds, hiddenDefaultsVersion: HIDDEN_DEFAULTS_VERSION })
  return hiddenColumnIds
}

export function applyDefaultStickyColumns(
  projectId: string,
  columns: Array<{ id: string; name: string }>
): string[] {
  const pref = readPref(projectId)
  if ((pref?.stickyDefaultsVersion || 0) >= STICKY_DEFAULTS_VERSION) {
    return pref?.stickyColumnIds || [KEY_COLUMN_ID]
  }

  const sticky = new Set(pref?.stickyColumnIds || [])
  sticky.add(KEY_COLUMN_ID)
  for (const column of columns) {
    if (DEFAULT_STICKY_COLUMN_NAMES.includes(column.name)) sticky.add(column.id)
  }
  const stickyColumnIds = Array.from(sticky)
  patchPref(projectId, { stickyColumnIds, stickyDefaultsVersion: STICKY_DEFAULTS_VERSION })
  return stickyColumnIds
}

export function getStickyColumnIds(projectId: string): string[] {
  return readPref(projectId)?.stickyColumnIds || [KEY_COLUMN_ID]
}

export function setStickyColumnIds(projectId: string, stickyColumnIds: string[]) {
  return patchPref(projectId, { stickyColumnIds })?.stickyColumnIds || stickyColumnIds
}

export function toggleStickyColumn(projectId: string, columnId: string) {
  const current = new Set(getStickyColumnIds(projectId))
  if (current.has(columnId)) current.delete(columnId)
  else current.add(columnId)
  return setStickyColumnIds(projectId, Array.from(current))
}

export function setHiddenColumnIds(projectId: string, hiddenColumnIds: string[]) {
  return patchPref(projectId, { hiddenColumnIds })?.hiddenColumnIds || hiddenColumnIds
}

export function toggleHiddenColumn(projectId: string, columnId: string, hidden: boolean) {
  const current = new Set(getHiddenColumnIds(projectId))
  if (hidden) current.add(columnId)
  else current.delete(columnId)
  return setHiddenColumnIds(projectId, Array.from(current))
}

export function forgetColumnPref(projectId: string, columnId: string) {
  const pref = readPref(projectId)
  const columnWidths = { ...(pref?.columnWidths || {}) }
  delete columnWidths[columnId]
  patchPref(projectId, {
    columnWidths,
    stickyColumnIds: (pref?.stickyColumnIds || []).filter((id) => id !== columnId),
  })
  return setHiddenColumnIds(
    projectId,
    getHiddenColumnIds(projectId).filter((id) => id !== columnId)
  )
}

export function getColumnWidths(projectId: string): Record<string, number> {
  return { ...(readPref(projectId)?.columnWidths || {}) }
}

export function setColumnWidth(projectId: string, columnId: string, width: number) {
  const columnWidths = { ...getColumnWidths(projectId), [columnId]: width }
  patchPref(projectId, { columnWidths })
  return columnWidths
}

export function getRowHeights(projectId: string): Record<string, number> {
  return { ...(readPref(projectId)?.rowHeights || {}) }
}

export function setRowHeight(projectId: string, rowId: string, height: number) {
  const rowHeights = { ...getRowHeights(projectId), [rowId]: height }
  patchPref(projectId, { rowHeights })
  return rowHeights
}
