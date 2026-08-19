import { customColumnService, testCaseService } from '@/lib/supabase-service'
import { DEFAULT_CASE_COLUMNS, DEFAULT_ROW_VALUES, RETIRED_COLUMN_NAMES } from '@/lib/case-schema'
import { getCurrentUser } from '@/lib/local-auth'
import { applyDefaultHiddenColumns } from '@/lib/column-prefs'

async function persistPositions(kind: 'columns' | 'rows', ids: string[]) {
  if (kind === 'columns') {
    await Promise.all(ids.map((id, index) => customColumnService.update(id, { position: index })))
    return
  }
  await Promise.all(ids.map((id, index) => testCaseService.update(id, { position: index })))
}

export interface DynamicColumn {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'date'
  visible: boolean
  width: string
  minWidth: string
  options?: string[]
  defaultValue?: string
  required: boolean
  position: number
  projectId: string
  ownerUserId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DynamicRow {
  id: string
  projectId: string
  position: number
  createdAt: Date
  updatedAt: Date
  dynamicFields: {
    [columnName: string]: string | number | boolean | null
  }
}

export interface CreateColumnInput {
  name: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'date'
  options?: string[]
  defaultValue?: string
  required?: boolean
  width?: string
  minWidth?: string
  ownerUserId?: string
}

export interface UpdateColumnInput {
  label?: string
  type?: 'text' | 'number' | 'boolean' | 'select' | 'date'
  options?: string[]
  defaultValue?: string
  required?: boolean
  visible?: boolean
  width?: string
  minWidth?: string
  position?: number
}

export interface CreateRowInput {
  id?: string
  position?: number
  dynamicFields: {
    [columnName: string]: string | number | boolean | null
  }
}

export interface UpdateRowInput {
  dynamicFields?: {
    [columnName: string]: string | number | boolean | null
  }
  position?: number
}

const ensureLocks = new Map<string, Promise<DynamicColumn[]>>()

function mapColumn(column: any): DynamicColumn {
  return {
    ...column,
    required: column.required || false,
    defaultValue: column.defaultValue != null ? String(column.defaultValue) : undefined,
  }
}

function applyUserVisibility(projectId: string, columns: DynamicColumn[]): DynamicColumn[] {
  const hidden = new Set(applyDefaultHiddenColumns(projectId, columns))
  return columns.map((column) => ({
    ...column,
    visible: !hidden.has(column.id),
  }))
}

function isRetiredColumn(column: { name?: string; label?: string }) {
  const name = (column.name || '').trim().toLowerCase()
  const label = (column.label || '').trim().toLowerCase()
  return RETIRED_COLUMN_NAMES.includes(name) || RETIRED_COLUMN_NAMES.includes(label)
}

function columnDedupeKey(column: { id: string; name?: string; label?: string; ownerUserId?: string }) {
  const name = (column.name || column.label || column.id).trim().toLowerCase()
  return `${column.ownerUserId || 'shared'}:${name}`
}

export const googleSheetsService = {
  async getColumns(projectId: string): Promise<DynamicColumn[]> {
    const columns = await this.dedupeColumns(projectId)
    return applyUserVisibility(projectId, columns.map(mapColumn))
  },

  async dedupeColumns(projectId: string): Promise<DynamicColumn[]> {
    const columns = await customColumnService.getAll(projectId)
    const seen = new Map<string, DynamicColumn>()
    const extras: string[] = []

    for (const column of columns) {
      const key = columnDedupeKey(column)
      if (seen.has(key)) {
        extras.push(column.id)
      } else {
        seen.set(key, mapColumn(column))
      }
    }

    const unique = Array.from(seen.values())
      .filter((column) => !isRetiredColumn(column))
      .map((column, index) => ({ ...column, position: index }))

    const retired = columns.filter((column) => isRetiredColumn(column))
    const toDelete = [...extras, ...retired.map((column) => column.id)]
    if (toDelete.length > 0) {
      await Promise.all(toDelete.map((id) => customColumnService.delete(id)))
    }

    if (extras.length > 0 || retired.length > 0) {
      await googleSheetsService.reorderColumns(projectId, unique.map((column) => column.id))
    }
    return unique
  },

  async ensureDefaultColumns(projectId: string): Promise<DynamicColumn[]> {
    const pending = ensureLocks.get(projectId)
    if (pending) return pending

    const task = (async () => {
      const existing = await this.dedupeColumns(projectId)
      const existingNames = new Set(existing.filter((column) => !column.ownerUserId).map((column) => column.name))
      const missing = DEFAULT_CASE_COLUMNS.filter((column) => !existingNames.has(column.name))

      for (const [index, column] of missing.entries()) {
        await this.createColumn(projectId, {
          ...column,
          width: `w-${Math.max(32, 8 * (index + 4))}`,
        })
      }

      const columns = missing.length > 0 ? await this.dedupeColumns(projectId) : existing
      const defaultOrder = DEFAULT_CASE_COLUMNS.map((column) => column.name)
      const shared = columns.filter((column) => !column.ownerUserId)
      const personal = columns.filter((column) => column.ownerUserId)
      const orderedShared = [
        ...defaultOrder
          .map((name) => shared.find((column) => column.name === name))
          .filter((column): column is DynamicColumn => Boolean(column)),
        ...shared.filter((column) => !defaultOrder.includes(column.name)),
      ]
      const ordered = [...orderedShared, ...personal].map((column, index) => ({ ...column, position: index }))
      const orderChanged = ordered.some((column, index) => column.id !== columns[index]?.id)
      if (missing.length > 0 || orderChanged) {
        await this.reorderColumns(projectId, ordered.map((column) => column.id))
      }
      return applyUserVisibility(projectId, ordered)
    })()

    ensureLocks.set(projectId, task)
    try {
      return await task
    } finally {
      ensureLocks.delete(projectId)
    }
  },

  async createColumn(projectId: string, input: CreateColumnInput): Promise<DynamicColumn> {
    const column = await customColumnService.create({
      name: input.name,
      label: input.label,
      type: input.type,
      visible: true,
      width: input.width || 'w-32',
      minWidth: input.minWidth || 'min-w-[120px]',
      options: input.options,
      defaultValue: input.defaultValue,
      required: input.required || false,
      projectId,
      ownerUserId: input.ownerUserId,
    })
    return applyUserVisibility(projectId, [mapColumn(column)])[0]
  },

  async updateColumn(columnId: string, input: UpdateColumnInput): Promise<DynamicColumn> {
    const column = await customColumnService.update(columnId, input)
    return {
      ...column,
      required: column.required || false,
      defaultValue: column.defaultValue != null ? String(column.defaultValue) : undefined,
    }
  },

  async deleteColumn(columnId: string): Promise<void> {
    await customColumnService.delete(columnId)
  },

  async reorderColumns(_projectId: string, columnIds: string[]): Promise<void> {
    await persistPositions('columns', columnIds)
  },

  async getRows(projectId: string, suiteId?: string | null): Promise<DynamicRow[]> {
    if (!suiteId) {
      await testCaseService.deleteUnassigned(projectId)
      return []
    }
    const rows = await testCaseService.getAll(projectId)
    return rows
      .filter((row: any) => row.suiteId === suiteId)
      .map((row: any) => ({
        id: row.id,
        projectId: row.projectId,
        position: row.position,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        dynamicFields: row.dynamicFields || {},
      }))
  },

  async createRow(
    projectId: string,
    input: CreateRowInput = { dynamicFields: {} },
    options: { suiteId?: string | null; listKind?: 'suite' | 'bugs' } = {}
  ): Promise<DynamicRow> {
    const row: any = await testCaseService.create({
      id: input.id,
      projectId,
      suiteId: options.suiteId || undefined,
      position: input.position,
      dynamicFields: {
        ...DEFAULT_ROW_VALUES,
        ...(options.listKind === 'bugs' ? { type: 'Bug' } : {}),
        ...input.dynamicFields,
      },
    })
    return {
      id: row.id,
      projectId: row.projectId,
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dynamicFields: row.dynamicFields || {},
    }
  },

  async updateRow(rowId: string, input: UpdateRowInput): Promise<DynamicRow> {
    const row: any = await testCaseService.update(rowId, input)
    return {
      id: row.id,
      projectId: row.projectId,
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dynamicFields: row.dynamicFields || {},
    }
  },

  async deleteRow(rowId: string): Promise<void> {
    await testCaseService.delete(rowId)
  },

  async reorderRows(_projectId: string, rowIds: string[]): Promise<void> {
    await persistPositions('rows', rowIds)
  },

  async bulkUpdateRows(updates: Array<{ id: string; dynamicFields: any }>): Promise<void> {
    await Promise.all(updates.map((update) => testCaseService.update(update.id, { dynamicFields: update.dynamicFields })))
  },

  async bulkDeleteRows(rowIds: string[]): Promise<void> {
    await testCaseService.deleteMultiple(rowIds)
  },
}
