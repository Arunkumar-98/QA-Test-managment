import * as XLSX from 'xlsx'
import { formatCaseKey, RETIRED_COLUMN_NAMES } from '@/lib/case-schema'
import { DynamicColumn, DynamicRow, googleSheetsService } from '@/lib/google-sheets-service'
import { testCaseService } from '@/lib/supabase-service'

const SKIP_COLUMNS = new Set(['artifacts', ...RETIRED_COLUMN_NAMES])

export type ExportRow = DynamicRow & { listName?: string }

function exportableColumns(columns: DynamicColumn[]) {
  return [...columns]
    .filter((column) => !SKIP_COLUMNS.has(column.name))
    .sort((a, b) => a.position - b.position)
}

function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'cases'
}

export function downloadCasesWorkbook(options: {
  columns: DynamicColumn[]
  rows: ExportRow[]
  fileName: string
  includeListColumn?: boolean
}) {
  const columns = exportableColumns(options.columns)
  if (options.rows.length === 0) {
    return 0
  }
  const records = options.rows.map((row, index) => {
    const record: Record<string, string> = {
      Key: formatCaseKey(index),
    }
    if (options.includeListColumn) {
      record.List = row.listName || ''
    }
    for (const column of columns) {
      record[column.label] = String(row.dynamicFields?.[column.name] ?? '')
    }
    return record
  })

  const worksheet = XLSX.utils.json_to_sheet(records)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cases')
  XLSX.writeFile(workbook, `${safeFileName(options.fileName)}.xlsx`)
  return records.length
}

export async function exportProjectCases(options: {
  projectId: string
  lists: Array<{ id: string; name: string }>
  suiteId?: string | null
  listName?: string
  projectName?: string
}) {
  const columns = await googleSheetsService.ensureDefaultColumns(options.projectId)

  if (options.suiteId) {
    const rows = await googleSheetsService.getRows(options.projectId, options.suiteId)
    const fileName = options.listName || 'cases'
    const count = downloadCasesWorkbook({ columns, rows, fileName })
    return { count, fileName: `${safeFileName(fileName)}.xlsx` }
  }

  const listNames = new Map(options.lists.map((list) => [list.id, list.name]))
  const allRows = await testCaseService.getAll(options.projectId)
  const rows: ExportRow[] = allRows
    .filter((row) => row.suiteId && listNames.has(row.suiteId))
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((row) => ({
      id: row.id,
      projectId: row.projectId,
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dynamicFields: row.dynamicFields || {},
      listName: listNames.get(row.suiteId || '') || '',
    }))

  const fileName = `${options.projectName || 'project'}-cases-${new Date().toISOString().slice(0, 10)}`
  const count = downloadCasesWorkbook({
    columns,
    rows,
    fileName,
    includeListColumn: true,
  })
  return { count, fileName: `${safeFileName(fileName)}.xlsx` }
}
