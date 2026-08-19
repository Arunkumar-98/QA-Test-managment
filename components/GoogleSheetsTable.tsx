"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Check,
  Columns3,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  IndentDecrease,
  IndentIncrease,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Pin,
  PinOff,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  DynamicColumn,
  DynamicRow,
  googleSheetsService,
} from '@/lib/google-sheets-service'
import {
  CASE_TYPE_OPTIONS,
  COLUMN_WIDTHS,
  DEFAULT_ROW_VALUES,
  PRIORITY_PILL,
  RETIRED_COLUMN_NAMES,
  STATUS_PILL,
  canonicalStatus,
  formatCaseKey,
} from '@/lib/case-schema'
import { PRIORITY_OPTIONS } from '@/lib/constants'
import { downloadCasesWorkbook } from '@/lib/case-export'
import { fetchShare, patchShareRows } from '@/lib/share-client'
import { ArtifactCell } from '@/components/ArtifactCell'
import { artifactsFromRows, deleteArtifactFiles } from '@/lib/artifact-store'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { getCurrentUser } from '@/lib/local-auth'
import {
  applyDefaultStickyColumns,
  forgetColumnPref,
  getColumnWidths,
  getRowHeights,
  KEY_COLUMN_ID,
  DEFAULT_KEY_WIDTH,
  setColumnWidth,
  setRowHeight,
  toggleHiddenColumn,
  toggleStickyColumn,
} from '@/lib/column-prefs'

interface GoogleSheetsTableProps {
  projectId: string
  addCaseNonce?: number
  reloadNonce?: number
  exportNonce?: number
  filtersOpen?: boolean
  onFiltersOpenChange?: (open: boolean) => void
  searchQuery?: string
  suiteId?: string | null
  listKind?: 'suite' | 'bugs'
  listName?: string
  shareToken?: string | null
  shareMode?: 'owner' | 'guest'
  readOnly?: boolean
  canCreate?: boolean
  canDelete?: boolean
  canExport?: boolean
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const MIN_COL_WIDTH = 88
const CHECKBOX_WIDTH = 40
const MIN_ROW_HEIGHT = 40
const MAX_STEP_INDENT = 3
const LIST_PREFIX = /^\s*(?:(?:\d+|[a-z]+|[ivxlcdm]+)[.)]|[•◦▪\-*])\s+/i

function pillClass(columnName: string, value: string) {
  if (columnName === 'status') return STATUS_PILL[canonicalStatus(value)] || STATUS_PILL[value] || 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700/60 dark:text-slate-200 dark:border-slate-600'
  if (columnName === 'priority') return PRIORITY_PILL[value] || 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700/60 dark:text-slate-200 dark:border-slate-600'
  if (columnName === 'type') return 'bg-sky-500/15 text-sky-800 border-sky-500/40 dark:text-sky-200 dark:border-sky-400/30'
  return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
}

function toAlpha(n: number) {
  let value = n
  let result = ''
  while (value > 0) {
    value -= 1
    result = String.fromCharCode(97 + (value % 26)) + result
    value = Math.floor(value / 26)
  }
  return result
}

function toRoman(n: number) {
  const numerals: Array<[number, string]> = [
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ]
  let remaining = n
  let result = ''
  for (const [value, glyph] of numerals) {
    while (remaining >= value) {
      result += glyph
      remaining -= value
    }
  }
  return result
}

function numberedMarker(level: number, index: number) {
  const cycle = level % 3
  if (cycle === 0) return `${index}.`
  if (cycle === 1) return `${toAlpha(index)}.`
  return `${toRoman(index)}.`
}

function bulletMarker(level: number) {
  return ['•', '◦', '▪', '•'][Math.min(level, 3)]
}

function stripListPrefix(line: string) {
  return line.replace(LIST_PREFIX, '').trim()
}

function parseStepLine(line: string): { indent: number; body: string; kind: 'numbered' | 'bullets' | 'plain' } {
  const match = line.match(/^(\s*)(?:((?:\d+|[a-z]+|[ivxlcdm]+)[.)])|([•◦▪\-*]))\s*(.*)$/i)
  if (!match) {
    const spaces = (line.match(/^\s*/) || [''])[0].length
    return {
      indent: Math.min(MAX_STEP_INDENT, Math.round(spaces / 2)),
      body: line.trim(),
      kind: 'plain',
    }
  }
  return {
    indent: Math.min(MAX_STEP_INDENT, Math.round(match[1].length / 2)),
    body: (match[4] || '').trim(),
    kind: match[3] ? 'bullets' : 'numbered',
  }
}

function detectListKind(text: string): 'numbered' | 'bullets' | 'none' {
  const parsed = String(text || '')
    .split('\n')
    .map(parseStepLine)
    .filter((line) => line.body || line.kind !== 'plain')
  if (parsed.length === 0) return 'none'
  const numbered = parsed.filter((line) => line.kind === 'numbered').length
  const bullets = parsed.filter((line) => line.kind === 'bullets').length
  if (numbered === 0 && bullets === 0) return 'none'
  return bullets > numbered ? 'bullets' : 'numbered'
}

function renderStepLine(indent: number, kind: 'numbered' | 'bullets', markerIndex: number, body: string) {
  const marker = kind === 'bullets' ? bulletMarker(indent) : numberedMarker(indent, markerIndex)
  return `${'  '.repeat(indent)}${marker} ${body}`
}

function renumberList(text: string, kind: 'numbered' | 'bullets') {
  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const counters = [0, 0, 0, 0]
  return lines
    .map((line) => {
      if (!line.trim()) return ''
      const parsed = parseStepLine(line)
      const indent = Math.max(0, Math.min(MAX_STEP_INDENT, parsed.indent))
      counters[indent] += 1
      for (let level = indent + 1; level < counters.length; level += 1) counters[level] = 0
      return renderStepLine(indent, kind, counters[indent], parsed.body)
    })
    .join('\n')
}

function formatAsList(text: string, kind: 'numbered' | 'bullets') {
  const lines = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parsed = parseStepLine(line)
      return renderStepLine(parsed.indent, kind, 1, parsed.body)
    })
  return renumberList(lines.length > 0 ? lines.join('\n') : renderStepLine(0, kind, 1, ''), kind)
}

function formatRangeAsList(text: string, kind: 'numbered' | 'bullets', start: number, end: number) {
  const value = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lo = Math.min(start, end)
  const hi = Math.max(start, end)
  const hasSelection = lo !== hi
  const from = hasSelection ? value.lastIndexOf('\n', Math.max(0, lo - 1)) + 1 : 0
  let to = hasSelection ? hi : value.length
  if (hasSelection && to < value.length && value[to] !== '\n') {
    const lineEnd = value.indexOf('\n', to)
    to = lineEnd === -1 ? value.length : lineEnd
  }
  const formatted = formatAsList(value.slice(from, to), kind)
  return {
    text: value.slice(0, from) + formatted + value.slice(to),
    start: from,
    end: from + formatted.length,
  }
}

function lineIndexAt(text: string, cursor: number) {
  return text.slice(0, cursor).split('\n').length - 1
}

function offsetAtLine(text: string, lineIndex: number) {
  if (lineIndex <= 0) return 0
  return text.split('\n').slice(0, lineIndex).join('\n').length + 1
}

function changeStepIndent(text: string, start: number, end: number, delta: number) {
  const value = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const kind = detectListKind(value) === 'bullets' ? 'bullets' : 'numbered'
  const lines = value.split('\n')
  const startLine = lineIndexAt(value, start)
  const endLine = lineIndexAt(value, end)
  const parsed = lines.map(parseStepLine)

  for (let index = startLine; index <= endLine; index += 1) {
    const previousIndent = index === 0 ? -1 : parsed[index - 1].indent
    let indent = parsed[index].indent + delta
    indent = Math.max(0, Math.min(MAX_STEP_INDENT, indent))
    indent = Math.min(indent, previousIndent + 1)
    parsed[index] = { ...parsed[index], indent, kind }
  }

  const rebuilt = parsed
    .map((line, index) => (lines[index].trim() ? renderStepLine(line.indent, kind, 1, line.body) : ''))
    .join('\n')
  const nextText = renumberList(rebuilt, kind)
  const nextLine = nextText.split('\n')[startLine] || ''
  const cursor = offsetAtLine(nextText, startLine) + nextLine.length
  return { text: nextText, cursor }
}

function continueListOnEnter(value: string, cursor: number) {
  const text = String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const kind = detectListKind(text) === 'bullets' ? 'bullets' : 'numbered'
  const lines = text.split('\n')
  const index = lineIndexAt(text, cursor)
  const parsed = parseStepLine(lines[index] || '')

  if (!parsed.body.trim()) {
    if (parsed.indent > 0) {
      const next = changeStepIndent(text, cursor, cursor, -1)
      return next
    }
    lines.splice(index, 1)
    const nextText = lines.join('\n')
    return { text: nextText, cursor: offsetAtLine(nextText, Math.max(0, index)) }
  }

  lines.splice(index + 1, 0, renderStepLine(parsed.indent, kind, 1, ''))
  const nextText = renumberList(lines.join('\n'), kind)
  const nextLine = nextText.split('\n')[index + 1] || ''
  return { text: nextText, cursor: offsetAtLine(nextText, index + 1) + nextLine.length }
}

function StepsListToolbar({
  active,
  onNumbered,
  onBullets,
  onIndent,
  onOutdent,
}: {
  active?: 'numbered' | 'bullets' | 'none'
  onNumbered: () => void
  onBullets: () => void
  onIndent?: () => void
  onOutdent?: () => void
}) {
  return (
    <div className="flex items-center gap-0.5" data-steps-toolbar onMouseDown={(event) => event.preventDefault()}>
      <button
        type="button"
        title="Numbered list"
        onClick={(event) => {
          event.stopPropagation()
          onNumbered()
        }}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded',
          active === 'numbered' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
        )}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Bullet list"
        onClick={(event) => {
          event.stopPropagation()
          onBullets()
        }}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded',
          active === 'bullets' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
        )}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      {onIndent && onOutdent ? (
        <>
          <span className="mx-1 h-3 w-px bg-slate-700" />
          <button
            type="button"
            title="Outdent"
            onClick={(event) => {
              event.stopPropagation()
              onOutdent()
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <IndentDecrease className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Indent"
            onClick={(event) => {
              event.stopPropagation()
              onIndent()
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <IndentIncrease className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <span className="mx-1 h-3 w-px bg-slate-700" />
      )}
    </div>
  )
}

function StepsContent({ text }: { text: string }) {
  const kind = detectListKind(text)
  const lines = text.split('\n').filter((line) => line.trim())

  if (kind === 'none') {
    return (
      <span className={cn('block whitespace-pre-wrap [overflow-wrap:anywhere] text-slate-800 dark:text-slate-200', !text && 'text-slate-400')}>
        {text}
      </span>
    )
  }

  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        const parsed = parseStepLine(line)
        const marker = kind === 'bullets' ? bulletMarker(parsed.indent) : line.trim().split(/\s+/, 1)[0]
        return (
          <div
            key={`${index}-${line}`}
            className="flex [overflow-wrap:anywhere] text-slate-800 dark:text-slate-200"
            style={{ paddingLeft: parsed.indent * 16 }}
          >
            <span className="mr-2 shrink-0 text-slate-500">{marker}</span>
            <span>{parsed.body || <span className="text-slate-600">Step</span>}</span>
          </div>
        )
      })}
    </div>
  )
}

function columnSortableId(id: string) {
  return `col:${id}`
}

function rowSortableId(id: string) {
  return `row:${id}`
}

function toColumnName(label: string, existing: DynamicColumn[]) {
  const base = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'column'
  const used = new Set(existing.map((column) => column.name))
  if (!used.has(base)) return base
  let index = 2
  while (used.has(`${base}_${index}`)) index += 1
  return `${base}_${index}`
}

function resolveColumnWidth(column: DynamicColumn, overrides: Record<string, number>) {
  if (overrides[column.id]) return overrides[column.id]
  if (COLUMN_WIDTHS[column.name]) return COLUMN_WIDTHS[column.name]
  const parsed = Number.parseInt(String(column.width || '').replace(/[^\d]/g, ''), 10)
  return Number.isFinite(parsed) && parsed >= MIN_COL_WIDTH ? parsed : 160
}

function startDragResize(
  event: React.PointerEvent,
  axis: 'x' | 'y',
  startSize: number,
  min: number,
  onMove: (size: number) => void,
  onEnd: (size: number) => void
) {
  event.preventDefault()
  event.stopPropagation()
  const origin = axis === 'x' ? event.clientX : event.clientY
  let latest = startSize
  const previousCursor = document.body.style.cursor
  document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'

  const move = (ev: PointerEvent) => {
    const point = axis === 'x' ? ev.clientX : ev.clientY
    latest = Math.max(min, Math.round(startSize + (point - origin)))
    onMove(latest)
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    document.body.style.cursor = previousCursor
    document.body.style.userSelect = ''
    onEnd(latest)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

export function GoogleSheetsTable({
  projectId,
  addCaseNonce = 0,
  reloadNonce = 0,
  exportNonce = 0,
  filtersOpen = false,
  onFiltersOpenChange,
  searchQuery,
  suiteId = null,
  listKind = 'suite',
  listName,
  shareToken = null,
  shareMode = 'owner',
  readOnly = false,
  canCreate = true,
  canDelete = true,
  canExport = true,
}: GoogleSheetsTableProps) {
  const [columns, setColumns] = useState<DynamicColumn[]>([])
  const [rows, setRows] = useState<DynamicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const activeQuery = searchQuery ?? query
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeCell, setActiveCell] = useState<{ rowId: string; columnName: string } | null>(null)
  const [draft, setDraft] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null)
  const lastNonce = useRef(0)
  const lastExportNonce = useRef(0)
  const addRowLock = useRef(false)
  const activeCellRef = useRef<{ rowId: string; columnName: string } | null>(null)
  const columnsPanelRef = useRef<HTMLDivElement | null>(null)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [newColumnLabel, setNewColumnLabel] = useState('')
  const [newColumnType, setNewColumnType] = useState<DynamicColumn['type']>('text')
  const [newColumnOptions, setNewColumnOptions] = useState('')
  const [addingColumn, setAddingColumn] = useState(false)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({})
  const [stickyIds, setStickyIds] = useState<string[]>([KEY_COLUMN_ID])
  const currentUserId = getCurrentUser()?.id
  const isGuest = shareMode === 'guest'
  const allowEdit = !readOnly
  const allowCreate = allowEdit && canCreate
  const allowDelete = allowEdit && canDelete
  const allowExport = canExport

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const visibleColumns = useMemo(
    () => columns.filter((column) => column.visible).sort((a, b) => a.position - b.position),
    [columns]
  )

  const filteredRows = useMemo(() => {
    const term = activeQuery.trim().toLowerCase()
    return rows.filter((row) => {
      const status = String(row.dynamicFields.status || '')
      const priority = String(row.dynamicFields.priority || '')
      const type = String(row.dynamicFields.type || '')
      const assignee = String(row.dynamicFields.assignee || '')
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (priorityFilter !== 'all' && priority !== priorityFilter) return false
      if (typeFilter !== 'all' && type !== typeFilter) return false
      if (assigneeFilter !== 'all' && assignee !== assigneeFilter) return false
      if (!term) return true
      return Object.values(row.dynamicFields).some((value) =>
        String(value || '').toLowerCase().includes(term)
      )
    })
  }, [activeQuery, assigneeFilter, priorityFilter, rows, statusFilter, typeFilter])

  const columnIds = useMemo(() => visibleColumns.map((column) => columnSortableId(column.id)), [visibleColumns])
  const rowIds = useMemo(() => filteredRows.map((row) => rowSortableId(row.id)), [filteredRows])
  const keyWidth = Math.max(MIN_COL_WIDTH, columnWidths[KEY_COLUMN_ID] || DEFAULT_KEY_WIDTH)
  const stickySet = useMemo(() => new Set(stickyIds), [stickyIds])
  const stickyOffsets = useMemo(() => {
    const offsets: Record<string, number> = { __checkbox__: 0 }
    let left = CHECKBOX_WIDTH
    if (stickySet.has(KEY_COLUMN_ID)) {
      offsets[KEY_COLUMN_ID] = left
      left += keyWidth
    }
    for (const column of visibleColumns) {
      if (!stickySet.has(column.id)) continue
      offsets[column.id] = left
      left += resolveColumnWidth(column, columnWidths)
    }
    return offsets
  }, [columnWidths, keyWidth, stickySet, visibleColumns])
  const tableWidth = useMemo(
    () =>
      CHECKBOX_WIDTH +
      keyWidth +
      visibleColumns.reduce((sum, column) => sum + resolveColumnWidth(column, columnWidths), 0),
    [columnWidths, keyWidth, visibleColumns]
  )

  const applySharePayload = useCallback(
    (columnData: DynamicColumn[], allRows: DynamicRow[]) => {
      const nextColumns = columnData.filter((column) => !RETIRED_COLUMN_NAMES.includes(column.name))
      const nextRows = allRows
        .filter((row: any) => !suiteId || row.suiteId === suiteId)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
      setColumns(nextColumns)
      setRows(nextRows)
      setColumnWidths(getColumnWidths(projectId || 'shared'))
      setRowHeights(getRowHeights(projectId || 'shared'))
      setStickyIds(applyDefaultStickyColumns(projectId || 'shared', nextColumns))
    },
    [projectId, suiteId]
  )

  const syncLocalFromRemote = useCallback(
    async (remoteRows: DynamicRow[]) => {
      if (isGuest || !projectId || !suiteId) return
      for (const row of remoteRows) {
        try {
          await googleSheetsService.updateRow(row.id, {
            dynamicFields: row.dynamicFields,
            position: row.position,
          })
        } catch {
          await googleSheetsService.createRow(
            projectId,
            { id: row.id, position: row.position, dynamicFields: row.dynamicFields },
            { suiteId, listKind }
          )
        }
      }
    },
    [isGuest, listKind, projectId, suiteId]
  )

  const loadData = useCallback(async () => {
    if (!projectId && !shareToken) return
    try {
      setLoading(true)
      if (shareToken) {
        const { share } = await fetchShare(shareToken)
        applySharePayload(share.columns || [], share.rows || [])
        if (!isGuest) await syncLocalFromRemote((share.rows || []).filter((row: any) => !suiteId || row.suiteId === suiteId))
      } else {
        const [columnData, rowData] = await Promise.all([
          googleSheetsService.ensureDefaultColumns(projectId),
          googleSheetsService.getRows(projectId, suiteId),
        ])
        applySharePayload(columnData, rowData)
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Could not load cases',
        description: 'Refresh and try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [applySharePayload, isGuest, projectId, shareToken, suiteId, syncLocalFromRemote])

  useEffect(() => {
    loadData()
  }, [loadData, reloadNonce])

  useEffect(() => {
    activeCellRef.current = activeCell
  }, [activeCell])

  useEffect(() => {
    if (!shareToken) return
    const timer = window.setInterval(async () => {
      if (activeCellRef.current) return
      try {
        const { share } = await fetchShare(shareToken)
        const remoteRows = (share.rows || []).filter((row: any) => !suiteId || row.suiteId === suiteId)
        applySharePayload(share.columns || [], share.rows || [])
        if (!isGuest) await syncLocalFromRemote(remoteRows)
      } catch {
        // Keep the current grid if the poll fails.
      }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [applySharePayload, isGuest, shareToken, suiteId, syncLocalFromRemote])

  useEffect(() => {
    if (!columnsOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!columnsPanelRef.current?.contains(event.target as Node)) {
        setColumnsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [columnsOpen])

  useEffect(() => {
    if (activeCell) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [activeCell])

  const startEdit = (row: DynamicRow, column: DynamicColumn) => {
    if (!allowEdit) return
    if (column.name === 'artifacts') return
    if (activeCell?.rowId === row.id && activeCell?.columnName === column.name) return
    setActiveCell({ rowId: row.id, columnName: column.name })
    setDraft(String(row.dynamicFields[column.name] ?? ''))
  }

  const persistCell = async (rowId: string, columnName: string, value: string | number | boolean | null) => {
    let shouldSave = false
    setRows((prev) => {
      const row = prev.find((item) => item.id === rowId)
      if (!row) return prev
      if (String(row.dynamicFields[columnName] ?? '') === String(value ?? '')) return prev
      shouldSave = true
      return prev.map((item) =>
        item.id === rowId
          ? { ...item, dynamicFields: { ...item.dynamicFields, [columnName]: value } }
          : item
      )
    })
    if (!shouldSave) return

    setSaveState('saving')
    try {
      if (shareToken) {
        await patchShareRows(shareToken, { action: 'update', id: rowId, dynamicFields: { [columnName]: value } })
      }
      if (!isGuest && projectId) {
        try {
          await googleSheetsService.updateRow(rowId, { dynamicFields: { [columnName]: value } })
        } catch {
          const latest = rows.find((item) => item.id === rowId)
          const nextFields = { ...(latest?.dynamicFields || {}), [columnName]: value }
          if (suiteId) {
            await googleSheetsService.createRow(
              projectId,
              { id: rowId, dynamicFields: nextFields },
              { suiteId, listKind }
            )
          }
        }
      }
      setSaveState('saved')
    } catch (error) {
      console.error(error)
      setSaveState('error')
      toast({
        title: 'Change not saved',
        description: 'The cell could not be updated.',
        variant: 'destructive',
      })
    }
  }

  const commitEdit = async (move?: 'next' | 'down' | 'stay', valueOverride?: string) => {
    if (!activeCell) return
    const column = visibleColumns.find((item) => item.name === activeCell.columnName)
    await persistCell(activeCell.rowId, activeCell.columnName, valueOverride !== undefined ? valueOverride : draft)
    if (!column) {
      setActiveCell(null)
      return
    }

    const rowIndex = filteredRows.findIndex((row) => row.id === activeCell.rowId)
    const colIndex = visibleColumns.findIndex((item) => item.name === activeCell.columnName)

    if (move === 'next') {
      const nextCol = visibleColumns[colIndex + 1]
      const nextRow = filteredRows[rowIndex]
      if (nextCol && nextRow) startEdit(nextRow, nextCol)
      else setActiveCell(null)
      return
    }

    if (move === 'down') {
      const nextRow = filteredRows[rowIndex + 1]
      if (nextRow) startEdit(nextRow, column)
      else setActiveCell(null)
      return
    }

    setActiveCell(null)
  }

  const handleAddRow = useCallback(async () => {
    if (!allowCreate || addRowLock.current) return
    if (!suiteId) {
      toast({
        title: 'Pick a list first',
        description: 'Open a test suite or bug list, then add cases there.',
      })
      return
    }
    addRowLock.current = true
    try {
      const dynamicFields = {
        ...DEFAULT_ROW_VALUES,
        ...(listKind === 'bugs' ? { type: 'Bug' } : {}),
      }
      let row: DynamicRow
      if (isGuest && shareToken) {
        row = {
          id: crypto.randomUUID(),
          projectId: projectId || 'shared',
          position: rows.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          dynamicFields,
        }
        await patchShareRows(shareToken, { action: 'create', row: { ...row, suiteId } })
      } else {
        row = await googleSheetsService.createRow(projectId, { dynamicFields }, { suiteId, listKind })
        if (shareToken) {
          await patchShareRows(shareToken, { action: 'create', row: { ...row, suiteId } })
        }
      }
      setRows((prev) => [...prev, row])
      const titleColumn = visibleColumns.find((column) => column.name === 'title') || visibleColumns[0]
      if (titleColumn) {
        setActiveCell({ rowId: row.id, columnName: titleColumn.name })
        setDraft('')
      }
      setSaveState('saved')
    } catch (error) {
      console.error(error)
      toast({
        title: 'Could not add case',
        description: 'Try again in a moment.',
        variant: 'destructive',
      })
    } finally {
      addRowLock.current = false
    }
  }, [allowCreate, isGuest, listKind, projectId, rows.length, shareToken, suiteId, visibleColumns])

  useEffect(() => {
    if (!addCaseNonce || addCaseNonce === lastNonce.current || loading) return
    lastNonce.current = addCaseNonce
    handleAddRow()
  }, [addCaseNonce, handleAddRow, loading])

  useEffect(() => {
    if (!exportNonce || exportNonce === lastExportNonce.current || loading) return
    lastExportNonce.current = exportNonce
    if (!allowExport) {
      toast({ title: 'Export is not allowed on this share', variant: 'destructive' })
      return
    }
    if (filteredRows.length === 0) {
      toast({
        title: 'Nothing to export',
        description: suiteId ? 'This list has no matching cases.' : 'Open a test suite or bug list first.',
        variant: 'destructive',
      })
      return
    }
    try {
      const fileName = listName || (listKind === 'bugs' ? 'bug-list' : 'test-suite')
      const count = downloadCasesWorkbook({
        columns,
        rows: filteredRows,
        fileName,
      })
      toast({
        title: 'Export complete',
        description: `${count} cases saved to ${fileName}.xlsx`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Export failed',
        description: 'Could not create the spreadsheet.',
        variant: 'destructive',
      })
    }
  }, [columns, exportNonce, filteredRows, listKind, listName, loading, suiteId])

  const persistColumnOrder = async (nextVisible: DynamicColumn[]) => {
    if (isGuest) return
    const hidden = columns.filter((column) => !column.visible)
    const ordered = [...nextVisible, ...hidden].map((column, index) => ({ ...column, position: index }))
    setColumns(ordered)
    setSaveState('saving')
    try {
      await googleSheetsService.reorderColumns(projectId, ordered.map((column) => column.id))
      setSaveState('saved')
    } catch (error) {
      console.error(error)
      setSaveState('error')
      toast({ title: 'Could not save column order', variant: 'destructive' })
    }
  }

  const persistRowOrder = async (nextRows: DynamicRow[]) => {
    const withPositions = nextRows.map((row, index) => ({ ...row, position: index }))
    setRows(withPositions)
    setSaveState('saving')
    try {
      if (shareToken) {
        await patchShareRows(shareToken, { action: 'reorder', ids: withPositions.map((row) => row.id) })
      }
      if (!isGuest && projectId) {
        await googleSheetsService.reorderRows(projectId, withPositions.map((row) => row.id))
      }
      setSaveState('saved')
    } catch (error) {
      console.error(error)
      setSaveState('error')
      toast({ title: 'Could not save row order', variant: 'destructive' })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type
    if (activeType !== overType) return

    if (activeType === 'column') {
      if (isGuest) return
      const oldIndex = visibleColumns.findIndex((column) => columnSortableId(column.id) === String(active.id))
      const newIndex = visibleColumns.findIndex((column) => columnSortableId(column.id) === String(over.id))
      if (oldIndex < 0 || newIndex < 0) return
      await persistColumnOrder(arrayMove(visibleColumns, oldIndex, newIndex))
      return
    }

    if (activeType === 'row') {
      if (!allowEdit) return
      const oldIndex = rows.findIndex((row) => rowSortableId(row.id) === String(active.id))
      const newIndex = rows.findIndex((row) => rowSortableId(row.id) === String(over.id))
      if (oldIndex < 0 || newIndex < 0) return
      await persistRowOrder(arrayMove(rows, oldIndex, newIndex))
    }
  }

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0 || !allowDelete) return
    try {
      const removed = rows.filter((row) => selectedIds.has(row.id))
      if (!isGuest || shareToken) await deleteArtifactFiles(artifactsFromRows(removed), shareToken)
      if (shareToken) await patchShareRows(shareToken, { action: 'delete', ids })
      if (!isGuest) await googleSheetsService.bulkDeleteRows(ids)
      setRows((prev) => prev.filter((row) => !selectedIds.has(row.id)))
      setSelectedIds(new Set())
    } catch (error) {
      console.error(error)
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedIds.has(row.id))
  const hiddenCount = columns.filter((column) => !column.visible).length

  const handleToggleColumn = (columnId: string, hidden: boolean) => {
    toggleHiddenColumn(projectId, columnId, hidden)
    setColumns((prev) => prev.map((column) => (column.id === columnId ? { ...column, visible: !hidden } : column)))
  }

  const handleToggleSticky = (columnId: string) => {
    setStickyIds(toggleStickyColumn(projectId, columnId))
  }

  const handleAddColumn = async () => {
    if (isGuest) return
    const label = newColumnLabel.trim()
    if (!label || addingColumn) return
    const user = getCurrentUser()
    if (!user) {
      toast({ title: 'Sign in required', description: 'Column changes are saved to your account.', variant: 'destructive' })
      return
    }

    setAddingColumn(true)
    try {
      const options =
        newColumnType === 'select'
          ? newColumnOptions.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined
      const column = await googleSheetsService.createColumn(projectId, {
        name: toColumnName(label, columns),
        label,
        type: newColumnType,
        options: options?.length ? options : undefined,
        ownerUserId: user.id,
      })
      setColumns((prev) => [...prev, column])
      setNewColumnLabel('')
      setNewColumnOptions('')
      setNewColumnType('text')
      setSaveState('saved')
      toast({ title: 'Column added', description: `"${label}" is only visible on your account.` })
    } catch (error) {
      console.error(error)
      toast({ title: 'Could not add column', variant: 'destructive' })
    } finally {
      setAddingColumn(false)
    }
  }

  const handleDeleteColumn = async (column: DynamicColumn) => {
    if (!column.ownerUserId || column.ownerUserId !== currentUserId) return
    try {
      await googleSheetsService.deleteColumn(column.id)
      forgetColumnPref(projectId, column.id)
      setColumns((prev) => prev.filter((item) => item.id !== column.id))
      setSaveState('saved')
    } catch (error) {
      console.error(error)
      toast({ title: 'Could not delete column', variant: 'destructive' })
    }
  }

  const handleResizeColumn = (columnId: string, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [columnId]: width }))
  }

  const handleResizeColumnEnd = (columnId: string, width: number) => {
    setColumnWidth(projectId, columnId, width)
    setSaveState('saved')
  }

  const handleResizeRow = (rowId: string, height: number) => {
    setRowHeights((prev) => ({ ...prev, [rowId]: height }))
  }

  const handleResizeRowEnd = (rowId: string, height: number) => {
    setRowHeight(projectId, rowId, height)
    setSaveState('saved')
  }

  const statusOptions = useMemo(() => {
    const column = columns.find((item) => item.name === 'status')
    return column?.options || ['Pass', 'Fail', 'Blocked', 'In Progress', 'Not Executed']
  }, [columns])

  const priorityOptions = useMemo(() => {
    const column = columns.find((item) => item.name === 'priority')
    return column?.options || [...PRIORITY_OPTIONS]
  }, [columns])

  const typeOptions = useMemo(() => {
    const column = columns.find((item) => item.name === 'type')
    return column?.options || [...CASE_TYPE_OPTIONS]
  }, [columns])

  const assigneeOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map((row) => String(row.dynamicFields.assignee || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const activeFilterCount = [statusFilter, priorityFilter, typeFilter, assigneeFilter].filter((value) => value !== 'all').length

  const clearGridFilters = () => {
    setStatusFilter('all')
    setPriorityFilter('all')
    setTypeFilter('all')
    setAssigneeFilter('all')
  }

  const selectClass = 'h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
  const toolbarBtn = 'h-9 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading case grid…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {listName || (suiteId ? (listKind === 'bugs' ? 'Bug list' : 'Test suite') : 'No list selected')}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {filteredRows.length} case{filteredRows.length === 1 ? '' : 's'}
        </div>
        <div className="relative min-w-[200px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={activeQuery}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cases..."
            className="h-9 border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={selectClass}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFiltersOpenChange?.(!filtersOpen)}
            className={cn(
              toolbarBtn,
              filtersOpen && 'border-orange-400 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-400/40 dark:bg-orange-500/15 dark:text-orange-200 dark:hover:bg-orange-500/20'
            )}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="ml-1.5 rounded bg-orange-100 px-1.5 text-[10px] text-orange-800 dark:bg-orange-500/20 dark:text-orange-200">{activeFilterCount}</span>
            ) : null}
          </Button>
          <span className="text-xs text-slate-500">
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved' && (
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                <Check className="mr-1 h-3.5 w-3.5" /> Saved
              </span>
            )}
            {saveState === 'error' && 'Save failed'}
          </span>
          {allowDelete && selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteSelected}
              className="h-9 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete {selectedIds.size}
            </Button>
          )}
          {!isGuest && (
          <div className="relative" ref={columnsPanelRef}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setColumnsOpen((open) => !open)}
              className={toolbarBtn}
            >
              <Columns3 className="mr-1.5 h-3.5 w-3.5" />
              Columns
              {hiddenCount > 0 ? (
                <span className="ml-1.5 rounded bg-slate-100 px-1.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">{hiddenCount} hidden</span>
              ) : null}
            </Button>
            {columnsOpen ? (
              <div className="absolute right-0 top-11 z-40 w-[340px] rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-2 text-xs font-medium text-slate-800 dark:text-slate-200">Your columns</p>
                <p className="mb-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-500">
                  Hide, pin, or add columns for this account. Pinned columns stay visible when you scroll sideways.
                </p>
                <div className="max-h-64 space-y-1 overflow-auto pr-1">
                  <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/80">
                    <span className="flex h-7 w-7 items-center justify-center text-slate-400">
                      <Eye className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">Key</span>
                    <button
                      type="button"
                      onClick={() => handleToggleSticky(KEY_COLUMN_ID)}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-800',
                        stickySet.has(KEY_COLUMN_ID) ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100'
                      )}
                      aria-label={stickySet.has(KEY_COLUMN_ID) ? 'Unpin Key' : 'Pin Key'}
                      title={stickySet.has(KEY_COLUMN_ID) ? 'Unpin column' : 'Pin column'}
                    >
                      {stickySet.has(KEY_COLUMN_ID) ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {columns
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((column) => {
                      const mine = Boolean(column.ownerUserId && column.ownerUserId === currentUserId)
                      const pinned = stickySet.has(column.id)
                      return (
                        <div key={column.id} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleToggleColumn(column.id, column.visible)}
                            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            aria-label={column.visible ? `Hide ${column.label}` : `Show ${column.label}`}
                          >
                            {column.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <span className={cn('min-w-0 flex-1 truncate text-sm', column.visible ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500')}>
                            {column.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleSticky(column.id)}
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-800',
                              pinned ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100'
                            )}
                            aria-label={pinned ? `Unpin ${column.label}` : `Pin ${column.label}`}
                            title={pinned ? 'Unpin column' : 'Pin column'}
                          >
                            {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                          </button>
                          {mine ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(column)}
                              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                              aria-label={`Delete ${column.label}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                </div>
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Add a column</p>
                  <Input
                    value={newColumnLabel}
                    onChange={(event) => setNewColumnLabel(event.target.value)}
                    placeholder="Column name"
                    className="h-8 border-slate-300 bg-white text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddColumn()
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <select
                      value={newColumnType}
                      onChange={(event) => setNewColumnType(event.target.value as DynamicColumn['type'])}
                      className="h-8 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="text">Text</option>
                      <option value="select">Select</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Checkbox</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={handleAddColumn}
                      disabled={!newColumnLabel.trim() || addingColumn}
                      className="h-8 bg-blue-600 px-3 text-white hover:bg-blue-500"
                    >
                      {addingColumn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  {newColumnType === 'select' ? (
                    <Input
                      value={newColumnOptions}
                      onChange={(event) => setNewColumnOptions(event.target.value)}
                      placeholder="Options, comma separated"
                      className="h-8 border-slate-300 bg-white text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <label className="space-y-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={selectClass}>
              <option value="all">All</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Priority</span>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={selectClass}>
              <option value="all">All</option>
              {priorityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={selectClass}>
              <option value="all">All</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Assignee</span>
            <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className={selectClass}>
              <option value="all">All</option>
              {assigneeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">{filteredRows.length} matching</span>
            <Button
              size="sm"
              variant="outline"
              onClick={clearGridFilters}
              className={toolbarBtn}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFiltersOpenChange?.(false)}
              className={toolbarBtn}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="table-fixed border-collapse text-sm" style={{ width: tableWidth }}>
            <thead className="sticky top-0 z-30">
              <tr className="bg-slate-100 dark:bg-slate-900">
                <th
                  className="sticky left-0 z-40 w-10 border-b border-r border-slate-200 bg-slate-100 px-2 dark:border-slate-800 dark:bg-slate-900"
                  style={{ left: 0, width: CHECKBOX_WIDTH, minWidth: CHECKBOX_WIDTH }}
                >
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) => {
                      setSelectedIds(checked ? new Set(filteredRows.map((row) => row.id)) : new Set())
                    }}
                  />
                </th>
                <th
                  className={cn(
                    'relative border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                    stickyOffsets[KEY_COLUMN_ID] != null && 'sticky z-[39]'
                  )}
                  style={{
                    width: keyWidth,
                    minWidth: keyWidth,
                    maxWidth: keyWidth,
                    left: stickyOffsets[KEY_COLUMN_ID],
                  }}
                >
                  Key
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize Key column"
                    className="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize hover:bg-blue-400/70"
                    onPointerDown={(event) =>
                      startDragResize(event, 'x', keyWidth, MIN_COL_WIDTH, (width) => handleResizeColumn(KEY_COLUMN_ID, width), (width) => handleResizeColumnEnd(KEY_COLUMN_ID, width))
                    }
                  />
                </th>
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                  {visibleColumns.map((column) => (
                    <SortableColumnHeader
                      key={column.id}
                      column={column}
                      width={resolveColumnWidth(column, columnWidths)}
                      personal={Boolean(column.ownerUserId && column.ownerUserId === currentUserId)}
                      stickyLeft={stickyOffsets[column.id]}
                      onResize={(width) => handleResizeColumn(column.id, width)}
                      onResizeEnd={(width) => handleResizeColumnEnd(column.id, width)}
                    />
                  ))}
                </SortableContext>
              </tr>
            </thead>
            <tbody>
              <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                {filteredRows.map((row, index) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    index={index}
                    selected={selectedIds.has(row.id)}
                    onToggleSelected={toggleSelected}
                    visibleColumns={visibleColumns}
                    columnWidths={columnWidths}
                    stickyOffsets={stickyOffsets}
                    keyWidth={keyWidth}
                    rowHeight={rowHeights[row.id]}
                    activeCell={activeCell}
                    draft={draft}
                    setDraft={setDraft}
                    inputRef={inputRef}
                    startEdit={startEdit}
                    commitEdit={commitEdit}
                    onSaveCell={persistCell}
                    onCancelEdit={() => setActiveCell(null)}
                    onResizeRow={(height) => handleResizeRow(row.id, height)}
                    onResizeRowEnd={(height) => handleResizeRowEnd(row.id, height)}
                    shareToken={shareToken}
                    readOnly={!allowEdit}
                  />
                ))}
              </SortableContext>
              {allowCreate ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="cursor-pointer border-b border-slate-200 px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-300"
                  onClick={handleAddRow}
                >
                  <span className="inline-flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    {suiteId
                      ? 'Click to add a case, or press Add case'
                      : 'Open a test suite or bug list in the sidebar to add cases'}
                  </span>
                </td>
              </tr>
              ) : null}
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  )
}

function SortableColumnHeader({
  column,
  width,
  personal,
  stickyLeft,
  onResize,
  onResizeEnd,
}: {
  column: DynamicColumn
  width: number
  personal?: boolean
  stickyLeft?: number
  onResize: (width: number) => void
  onResizeEnd: (width: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnSortableId(column.id),
    data: { type: 'column' },
  })
  const pinned = stickyLeft != null

  return (
    <th
      ref={setNodeRef}
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        zIndex: isDragging ? 50 : pinned ? 38 : undefined,
        left: stickyLeft,
      }}
      className={cn(
        'relative border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
        pinned && 'sticky'
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5 pr-2">
        <button
          type="button"
          className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={`Reorder ${column.label} column`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-0 flex-1 truncate">{column.label}</span>
        {personal ? <span className="shrink-0 rounded bg-blue-500/15 px-1 py-0.5 text-[9px] font-medium text-blue-300">You</span> : null}
        {column.required ? <span className="text-rose-400">*</span> : null}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${column.label} column`}
        className="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize hover:bg-blue-400/70"
        onPointerDown={(event) =>
          startDragResize(event, 'x', width, MIN_COL_WIDTH, onResize, onResizeEnd)
        }
      />
    </th>
  )
}

function SortableRow({
  row,
  index,
  selected,
  onToggleSelected,
  visibleColumns,
  columnWidths,
  stickyOffsets,
  keyWidth,
  rowHeight,
  activeCell,
  draft,
  setDraft,
  inputRef,
  startEdit,
  commitEdit,
  onSaveCell,
  onCancelEdit,
  onResizeRow,
  onResizeRowEnd,
  shareToken = null,
  readOnly = false,
}: {
  row: DynamicRow
  index: number
  selected: boolean
  onToggleSelected: (id: string) => void
  visibleColumns: DynamicColumn[]
  columnWidths: Record<string, number>
  stickyOffsets: Record<string, number>
  keyWidth: number
  rowHeight?: number
  activeCell: { rowId: string; columnName: string } | null
  draft: string
  setDraft: (value: string) => void
  inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>
  startEdit: (row: DynamicRow, column: DynamicColumn) => void
  commitEdit: (move?: 'next' | 'down' | 'stay', valueOverride?: string) => void
  onSaveCell: (rowId: string, columnName: string, value: string | number | boolean | null) => void
  onCancelEdit: () => void
  onResizeRow: (height: number) => void
  onResizeRowEnd: (height: number) => void
  shareToken?: string | null
  readOnly?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowSortableId(row.id),
    data: { type: 'row' },
  })
  const minHeight = rowHeight || MIN_ROW_HEIGHT

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        minHeight,
      }}
      className={cn('group', selected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/80', isDragging && 'relative z-20 bg-slate-100 dark:bg-slate-800')}
    >
      <td
        className={cn(
          'sticky left-0 z-[22] border-b border-r border-slate-200 px-2 align-top dark:border-slate-800',
          selected ? 'bg-blue-50 dark:bg-slate-900' : 'bg-white group-hover:bg-slate-50 dark:bg-slate-950 dark:group-hover:bg-slate-900'
        )}
        style={{ left: 0, width: CHECKBOX_WIDTH, minWidth: CHECKBOX_WIDTH }}
      >
        <div className="flex items-start pt-2">
          <Checkbox checked={selected} onCheckedChange={() => onToggleSelected(row.id)} />
        </div>
      </td>
      <td
        className={cn(
          'relative border-b border-r border-slate-200 px-2 py-0 align-top font-mono text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400',
          stickyOffsets[KEY_COLUMN_ID] != null && 'sticky z-[21]',
          selected ? 'bg-blue-50 dark:bg-slate-900' : 'bg-white group-hover:bg-slate-50 dark:bg-slate-950 dark:group-hover:bg-slate-900'
        )}
        style={{
          width: keyWidth,
          minWidth: keyWidth,
          maxWidth: keyWidth,
          left: stickyOffsets[KEY_COLUMN_ID],
        }}
      >
        <div className="flex min-h-10 items-start gap-1 pt-2" style={{ minHeight }}>
          <button
            type="button"
            className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={`Reorder row ${formatCaseKey(index)}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="pt-0.5">{formatCaseKey(index)}</span>
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label={`Resize row ${formatCaseKey(index)}`}
          className="absolute bottom-0 left-0 z-20 h-1.5 w-full cursor-row-resize hover:bg-blue-400/70"
          onPointerDown={(event) =>
            startDragResize(event, 'y', minHeight, MIN_ROW_HEIGHT, onResizeRow, onResizeRowEnd)
          }
        />
      </td>
      {visibleColumns.map((column) => {
        const isEditing = activeCell?.rowId === row.id && activeCell?.columnName === column.name
        const value = row.dynamicFields[column.name]
        const width = resolveColumnWidth(column, columnWidths)
        const text = value ? String(value) : column.name === 'title' ? 'Untitled case' : ''
        const stickyLeft = stickyOffsets[column.id]
        return (
          <td
            key={column.id}
            className={cn(
              'relative border-b border-r border-slate-200 px-0 align-top dark:border-slate-800',
              isEditing && 'ring-1 ring-inset ring-blue-400',
              stickyLeft != null && 'sticky z-20',
              stickyLeft != null && (selected ? 'bg-blue-50 dark:bg-slate-900' : 'bg-white group-hover:bg-slate-50 dark:bg-slate-950 dark:group-hover:bg-slate-900')
            )}
            style={{ width, minWidth: width, maxWidth: width, minHeight, left: stickyLeft }}
            onClick={() => {
              if (isEditing || column.name === 'artifacts') return
              startEdit(row, column)
            }}
          >
            {column.name === 'artifacts' ? (
              <ArtifactCell
                value={value}
                onChange={(next) => onSaveCell(row.id, 'artifacts', next)}
                shareToken={shareToken}
                readOnly={readOnly}
              />
            ) : isEditing ? (
              <CellEditor
                column={column}
                value={draft}
                onChange={setDraft}
                inputRef={inputRef}
                onCommit={(move) => commitEdit(move)}
                onCancel={onCancelEdit}
              />
            ) : (
              <div className="px-3 py-2" style={{ minHeight }}>
                {column.type === 'select' && value ? (
                  <span className={cn('inline-flex max-w-full whitespace-normal break-words rounded-full border px-2 py-0.5 text-xs font-medium', pillClass(column.name, String(value)))}>
                    {String(value)}
                  </span>
                ) : column.name === 'steps' ? (
                  value ? (
                    <StepsContent text={String(value)} />
                  ) : (
                    <span className="text-slate-600">Add numbered or bullet steps</span>
                  )
                ) : (
                  <span
                    className={cn(
                      'block whitespace-pre-wrap [overflow-wrap:anywhere] text-slate-800 dark:text-slate-200',
                      !value && 'text-slate-400 dark:text-slate-600'
                    )}
                  >
                    {text}
                  </span>
                )}
              </div>
            )}
          </td>
        )
      })}
    </tr>
  )
}

function CellEditor({
  column,
  value,
  onChange,
  inputRef,
  onCommit,
  onCancel,
}: {
  column: DynamicColumn
  value: string
  onChange: (value: string) => void
  inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>
  onCommit: (move?: 'next' | 'down' | 'stay', valueOverride?: string) => void
  onCancel: () => void
}) {
  const applyIndent = (delta: number, area?: HTMLTextAreaElement | null) => {
    const field = area || (inputRef.current instanceof HTMLTextAreaElement ? inputRef.current : null)
    const start = field ? field.selectionStart : 0
    const end = field ? field.selectionEnd : value.length
    const startLine = lineIndexAt(value, start)
    const endLine = lineIndexAt(value, end)
    let current = value
    if (detectListKind(current) === 'none' && current.trim()) {
      current = formatAsList(current, 'numbered')
    }
    const lines = current.split('\n')
    const fromLine = Math.min(startLine, lines.length - 1)
    const toLine = Math.min(endLine, lines.length - 1)
    const from = offsetAtLine(current, fromLine)
    const to = offsetAtLine(current, toLine) + (lines[toLine] || '').length
    const next = changeStepIndent(current, from, to, delta)
    onChange(next.text)
    requestAnimationFrame(() => {
      const target = field || (inputRef.current instanceof HTMLTextAreaElement ? inputRef.current : null)
      if (!target) return
      target.focus()
      target.style.height = 'auto'
      target.style.height = `${Math.max(40, target.scrollHeight)}px`
      target.setSelectionRange(next.cursor, next.cursor)
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      if (column.name === 'steps' && event.currentTarget instanceof HTMLTextAreaElement) {
        applyIndent(event.shiftKey ? -1 : 1, event.currentTarget)
        return
      }
      onCommit('next')
      return
    }
    if (event.key === 'Enter' && !event.shiftKey && column.name === 'steps' && event.currentTarget instanceof HTMLTextAreaElement) {
      event.preventDefault()
      const area = event.currentTarget
      const next = continueListOnEnter(value, area.selectionStart)
      onChange(next.text)
      requestAnimationFrame(() => {
        area.style.height = 'auto'
        area.style.height = `${Math.max(40, area.scrollHeight)}px`
        area.setSelectionRange(next.cursor, next.cursor)
      })
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onCommit('down')
    }
  }

  if (column.type === 'select') {
    const options = Array.from(new Set([...(column.options || []), value].filter((option) => option !== '')))
    return (
      <select
        ref={(node) => {
          inputRef.current = node
        }}
        className="min-h-10 w-full bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:bg-slate-900 dark:text-white"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          onChange(next)
          onCommit('stay', next)
        }}
        onKeyDown={handleKeyDown}
      >
        <option value=""></option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }

  if (column.type === 'boolean') {
    return (
      <div className="flex min-h-10 items-center px-3">
        <input
          ref={(node) => {
            inputRef.current = node
          }}
          type="checkbox"
          checked={value === 'true' || value === '1'}
          onChange={(event) => {
            onChange(event.currentTarget.checked ? 'true' : 'false')
            onCommit('stay')
          }}
        />
      </div>
    )
  }

  if (column.type === 'number' || column.type === 'date') {
    return (
      <input
        ref={(node) => {
          inputRef.current = node
        }}
        type={column.type === 'number' ? 'number' : 'date'}
        className="min-h-10 w-full bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:bg-slate-900 dark:text-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onCommit('stay')}
        onKeyDown={handleKeyDown}
      />
    )
  }

  const isSteps = column.name === 'steps'
  const listKind = isSteps ? detectListKind(value) : 'none'

  const applyList = (kind: 'numbered' | 'bullets') => {
    const area = inputRef.current
    const start = area instanceof HTMLTextAreaElement ? area.selectionStart : 0
    const end = area instanceof HTMLTextAreaElement ? area.selectionEnd : value.length
    const next = formatRangeAsList(value, kind, start, end)
    onChange(next.text)
    requestAnimationFrame(() => {
      if (area instanceof HTMLTextAreaElement) {
        area.focus()
        area.style.height = 'auto'
        area.style.height = `${Math.max(40, area.scrollHeight)}px`
        area.setSelectionRange(next.start, next.end)
      }
    })
  }

  return (
    <div className="flex min-h-10 flex-col" onClick={(event) => event.stopPropagation()}>
      {isSteps ? (
        <div className="flex items-center border-b border-slate-200 px-2 py-1 dark:border-slate-800">
          <StepsListToolbar
            active={listKind}
            onNumbered={() => applyList('numbered')}
            onBullets={() => applyList('bullets')}
            onIndent={() => applyIndent(1)}
            onOutdent={() => applyIndent(-1)}
          />
        </div>
      ) : null}
      <textarea
        ref={(node) => {
          inputRef.current = node
          if (node) {
            node.style.height = 'auto'
            node.style.height = `${Math.max(40, node.scrollHeight)}px`
          }
        }}
        className="w-full resize-none overflow-hidden bg-white px-3 py-2 text-sm leading-5 text-slate-900 outline-none whitespace-pre-wrap [overflow-wrap:anywhere] dark:bg-slate-900 dark:text-white"
        value={value}
        rows={1}
        onChange={(event) => {
          onChange(event.target.value)
          event.target.style.height = 'auto'
          event.target.style.height = `${Math.max(40, event.target.scrollHeight)}px`
        }}
        onBlur={(event) => {
          const next = event.relatedTarget as HTMLElement | null
          if (next?.closest('[data-steps-toolbar]')) return
          onCommit('stay')
        }}
        onKeyDown={handleKeyDown}
        placeholder={
          column.name === 'title'
            ? 'Short title for the case'
            : isSteps
              ? 'Paste steps, select them, then click numbering'
              : 'Type here'
        }
      />
    </div>
  )
}
