import * as XLSX from 'xlsx'
import {
  CASE_TYPE_OPTIONS,
  DEFAULT_CASE_COLUMNS,
  DEFAULT_ROW_VALUES,
} from '@/lib/case-schema'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/constants'
import {
  CreateColumnInput,
  DynamicColumn,
  googleSheetsService,
} from '@/lib/google-sheets-service'
import { parseHierarchicalTestCases } from '@/lib/hierarchical-parser'
import { parseTextIntelligently } from '@/lib/utils'

export type ImportListKind = 'suite' | 'bugs'

export type ColumnMapping = {
  sourceHeader: string
  targetName: string
  targetLabel: string
  isNew: boolean
}

export type MappedImportCase = {
  dynamicFields: Record<string, string>
}

export type ParsedImportTable = {
  headers: string[]
  rows: Record<string, string>[]
  format: string
}

export type PersistImportResult = {
  imported: number
  extraColumns: string[]
  skipped: number
}

const SKIP_HEADERS = new Set([
  'key',
  'id',
  'tc id',
  'tcid',
  'test case id',
  'case id',
  'case key',
  '#',
  'no',
  'number',
  'row',
])

const HEADER_ALIASES: Record<string, string[]> = {
  title: [
    'title',
    'test case',
    'test case title',
    'test case name',
    'name',
    'test name',
    'test title',
    'summary',
    'testcase',
  ],
  description: ['description', 'desc', 'details', 'overview'],
  steps: [
    'steps',
    'steps to reproduce',
    'test steps',
    'procedure',
    'actions',
    'reproduction steps',
    'stepstoreproduce',
  ],
  type: ['type', 'test type', 'case type', 'category'],
  status: ['status', 'test status', 'execution status'],
  priority: ['priority', 'test priority', 'importance'],
  expected_result: [
    'expected result',
    'expected',
    'expected outcome',
    'expected output',
    'expectedresult',
  ],
  actual_result: ['actual result', 'actual', 'result', 'output', 'actualresult'],
  artifacts: ['artifacts', 'attachments', 'files', 'screenshots'],
  assignee: ['assignee', 'assigned tester', 'assigned to', 'tester', 'owner'],
}

const KNOWN_COLUMN_LABELS = Object.fromEntries(
  DEFAULT_CASE_COLUMNS.map((column) => [column.name, column.label])
)

function normalizeHeader(header: string) {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function sanitizeColumnName(header: string) {
  return (
    header
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'column'
  )
}

function cellText(value: unknown) {
  if (value == null) return ''
  return String(value).trim()
}

function isSkipHeader(header: string) {
  return SKIP_HEADERS.has(normalizeHeader(header))
}

function matchKnownColumn(header: string): string | null {
  const normalized = normalizeHeader(header)
  const compact = normalized.replace(/\s+/g, '')
  for (const [name, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => alias === normalized || alias.replace(/\s+/g, '') === compact)) {
      return name
    }
  }
  if (KNOWN_COLUMN_LABELS[header] || DEFAULT_CASE_COLUMNS.some((column) => column.name === header)) {
    return header
  }
  return null
}

function normalizeStatus(value: string) {
  const raw = value.trim().toLowerCase()
  if (!raw) return DEFAULT_ROW_VALUES.status
  if (['pass', 'passed', 'ok', 'success'].includes(raw)) return 'Pass'
  if (['fail', 'failed', 'failure'].includes(raw)) return 'Fail'
  if (['blocked', 'block'].includes(raw)) return 'Blocked'
  if (['in progress', 'in-progress', 'progress', 'running', 'wip'].includes(raw)) return 'In Progress'
  if (['not executed', 'pending', 'new', 'open', 'todo', 'not run', 'not_executed'].includes(raw)) {
    return 'Not Executed'
  }
  return (STATUS_OPTIONS as readonly string[]).includes(value) ? value : 'Other'
}

function normalizePriority(value: string) {
  const raw = value.trim().toLowerCase()
  if (!raw) return DEFAULT_ROW_VALUES.priority
  if (['p0', 'blocker', 'critical', 'p0 (blocker)'].includes(raw)) return 'P0 (Blocker)'
  if (['p1', 'high', 'p1 (high)'].includes(raw)) return 'P1 (High)'
  if (['p2', 'medium', 'med', 'p2 (medium)'].includes(raw)) return 'P2 (Medium)'
  if (['p3', 'low', 'p3 (low)'].includes(raw)) return 'P3 (Low)'
  return (PRIORITY_OPTIONS as readonly string[]).includes(value) ? value : 'Other'
}

function normalizeType(value: string, listKind: ImportListKind) {
  if (listKind === 'bugs') return 'Bug'
  const raw = value.trim().toLowerCase()
  if (!raw) return DEFAULT_ROW_VALUES.type
  const match = CASE_TYPE_OPTIONS.find((option) => option.toLowerCase() === raw)
  return match || value
}

function sheetToObjects(sheet: XLSX.WorkSheet): Record<string, string>[] {
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
  })
  if (matrix.length < 2) return []
  const headers = (matrix[0] || []).map((header, index) => cellText(header) || `Column ${index + 1}`)
  return matrix
    .slice(1)
    .map((row) => {
      const record: Record<string, string> = {}
      headers.forEach((header, index) => {
        record[header] = cellText(row?.[index])
      })
      return record
    })
    .filter((row) => Object.values(row).some((value) => value.length > 0))
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedImportTable> {
  const buffer = await file.arrayBuffer()
  const name = file.name.toLowerCase()

  if (name.endsWith('.json')) {
    const parsed = JSON.parse(new TextDecoder().decode(buffer))
    const rows = (Array.isArray(parsed) ? parsed : parsed?.data || parsed?.testCases || [])
      .map((row: Record<string, unknown>) =>
        Object.fromEntries(Object.entries(row).map(([key, value]) => [key, cellText(value)]))
      )
      .filter((row: Record<string, string>) => Object.values(row).some(Boolean))
    return {
      headers: rows[0] ? Object.keys(rows[0]) : [],
      rows,
      format: 'json',
    }
  }

  const workbook = name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')
    ? XLSX.read(new TextDecoder().decode(buffer), { type: 'string', FS: name.endsWith('.tsv') ? '\t' : ',' })
    : XLSX.read(buffer, { type: 'array' })

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('The file has no sheets')
  const rows = sheetToObjects(sheet)
  return {
    headers: rows[0] ? Object.keys(rows[0]) : [],
    rows,
    format: name.split('.').pop() || 'file',
  }
}

function structuredRowToRecord(row: Record<string, unknown>): Record<string, string> {
  if (row.title || row.description || row.steps || row.dynamicFields) {
    const fields = (row.dynamicFields as Record<string, unknown>) || row
    return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, cellText(value)]))
  }

  return {
    Title: cellText(row.testCase || row.title || row.name),
    Description: cellText(row.description),
    Steps: cellText(row.stepsToReproduce || row.steps),
    Type: cellText(row.type || row.category),
    Status: cellText(row.status),
    Priority: cellText(row.priority),
    'Expected result': cellText(row.expectedResult || row.expected_result),
    'Actual result': cellText(row.actualResult || row.actual_result),
    Assignee: cellText(row.assignedTester || row.assignee),
  }
}

function parseDelimitedText(text: string, delimiter: '\t' | ','): Record<string, string>[] {
  const workbook = XLSX.read(text, { type: 'string', FS: delimiter, raw: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return sheet ? sheetToObjects(sheet) : []
}

export function parsePastedText(text: string): ParsedImportTable {
  const trimmed = text.trim()
  if (!trimmed) return { headers: [], rows: [], format: 'empty' }

  try {
    const hierarchical = parseHierarchicalTestCases(trimmed)
    if (hierarchical.testCases.length > 0 && /^TC\d{3}:/m.test(trimmed)) {
      const rows = hierarchical.testCases.map((testCase) => ({
        Title: testCase.title,
        Description: testCase.description || '',
        Steps: testCase.stepsToReproduce || '',
        Status: testCase.status || '',
        Priority: testCase.priority || '',
        'Expected result': testCase.expectedResult || '',
      }))
      return { headers: Object.keys(rows[0]), rows, format: 'hierarchical' }
    }
  } catch {
    // Fall through to other formats
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0] || ''
  if (firstLine.includes('\t')) {
    const rows = parseDelimitedText(trimmed, '\t')
    if (rows.length > 0) {
      return { headers: Object.keys(rows[0]), rows, format: 'tsv' }
    }
  }

  if ((firstLine.match(/,/g) || []).length >= 2) {
    const rows = parseDelimitedText(trimmed, ',')
    if (rows.length > 0) {
      return { headers: Object.keys(rows[0]), rows, format: 'csv' }
    }
  }

  const detected = parseTextIntelligently(trimmed)
  const rows = detected.data
    .map((row) => structuredRowToRecord(row))
    .filter((row) => Object.values(row).some(Boolean))

  return {
    headers: rows[0] ? Object.keys(rows[0]) : [],
    rows,
    format: detected.format,
  }
}

export function buildColumnMappings(
  headers: string[],
  existingColumns: DynamicColumn[]
): ColumnMapping[] {
  const usedTargets = new Set<string>()
  const existingNames = new Set(existingColumns.map((column) => column.name))

  return headers
    .filter((header) => header && !isSkipHeader(header))
    .map((header) => {
      const known = matchKnownColumn(header)
      if (known && !usedTargets.has(known)) {
        usedTargets.add(known)
        return {
          sourceHeader: header,
          targetName: known,
          targetLabel: KNOWN_COLUMN_LABELS[known] || header,
          isNew: false,
        }
      }

      let name = sanitizeColumnName(header)
      if (usedTargets.has(name)) {
        const base = name
        let suffix = 2
        while (usedTargets.has(`${base}_${suffix}`)) suffix += 1
        name = `${base}_${suffix}`
      }
      usedTargets.add(name)
      return {
        sourceHeader: header,
        targetName: name,
        targetLabel: header.trim(),
        isNew: !existingNames.has(name) && !DEFAULT_CASE_COLUMNS.some((column) => column.name === name),
      }
    })
}

export function mapImportRows(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  listKind: ImportListKind
): MappedImportCase[] {
  return rows.map((row) => {
    const dynamicFields: Record<string, string> = { ...DEFAULT_ROW_VALUES }
    if (listKind === 'bugs') dynamicFields.type = 'Bug'

    for (const mapping of mappings) {
      const value = cellText(row[mapping.sourceHeader])
      if (!value) continue
      if (mapping.targetName === 'status') dynamicFields.status = normalizeStatus(value)
      else if (mapping.targetName === 'priority') dynamicFields.priority = normalizePriority(value)
      else if (mapping.targetName === 'type') dynamicFields.type = normalizeType(value, listKind)
      else if (mapping.targetName === 'artifacts') continue
      else dynamicFields[mapping.targetName] = value
    }

    if (!dynamicFields.title) {
      dynamicFields.title = cellText(row.Title || row.title || row['Test Case'] || 'Imported case')
    }

    return { dynamicFields }
  })
}

function guessColumnType(name: string, label: string): CreateColumnInput['type'] {
  const haystack = `${name} ${label}`.toLowerCase()
  if (haystack.includes('date') || haystack.includes('time')) return 'date'
  if (haystack.includes('status') || haystack.includes('priority') || haystack.includes('type')) return 'select'
  if (haystack.includes('count') || haystack.includes('number')) return 'number'
  return 'text'
}

export async function persistImportedCases(options: {
  projectId: string
  suiteId: string
  listKind: ImportListKind
  cases: MappedImportCase[]
  extraColumns?: ColumnMapping[]
}): Promise<PersistImportResult> {
  if (!options.projectId) throw new Error('Select a project before importing')
  if (!options.suiteId) throw new Error('Cases must be imported into a test suite or bug list')

  const columns = await googleSheetsService.ensureDefaultColumns(options.projectId)
  const existingNames = new Set(columns.map((column) => column.name))
  const extraColumns: string[] = []

  for (const mapping of options.extraColumns || []) {
    if (!mapping.isNew || existingNames.has(mapping.targetName)) continue
    await googleSheetsService.createColumn(options.projectId, {
      name: mapping.targetName,
      label: mapping.targetLabel,
      type: guessColumnType(mapping.targetName, mapping.targetLabel),
    })
    existingNames.add(mapping.targetName)
    extraColumns.push(mapping.targetLabel)
  }

  let imported = 0
  let skipped = 0
  for (const item of options.cases) {
    const title = cellText(item.dynamicFields.title)
    if (!title) {
      skipped += 1
      continue
    }
    await googleSheetsService.createRow(
      options.projectId,
      { dynamicFields: item.dynamicFields },
      { suiteId: options.suiteId, listKind: options.listKind }
    )
    imported += 1
  }

  return { imported, extraColumns, skipped }
}
