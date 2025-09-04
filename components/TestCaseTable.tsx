"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  Upload, 
  Download, 
  Clipboard, 
  Eye, 
  Edit, 
  MessageSquare, 
  Code, 
  Trash2, 
  FileText,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
  GripVertical,
  Sparkles,
  RefreshCw,
  Check,
  Square,
  AlertCircle
} from 'lucide-react'
import { TestCase, TestCaseStatus, TestCasePriority, TestCaseCategory, CustomColumn } from '@/types/qa-types'
import { SavedFilter } from '@/hooks/useSearchAndFilter'
import { getStatusBadgeVariant, getStatusBadgeStyle, getPriorityBadgeVariant, getPriorityBadgeStyle, getAutomationStatusIcon, getAutomationStatusColor, getAutomationStatusText, getUnresolvedCommentsCount, formatTestSteps, getStatusIcon, getPriorityIcon, mapImportedDataToTestCase, validateImportedTestCase, parseCSV } from "@/lib/utils"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { StatusHistoryDialog } from './StatusHistoryDialog'

const STATUS_OPTIONS: TestCaseStatus[] = ['Pass', 'Fail', 'Pending', 'In Progress', 'Blocked']
const PRIORITY_OPTIONS: TestCasePriority[] = ['High', 'Medium', 'Low']
const CATEGORY_OPTIONS: TestCaseCategory[] = ['Functional', 'Non-Functional', 'Regression', 'Smoke', 'Integration', 'Unit']

interface TestCaseTableProps {
  testCases: TestCase[]
  selectedTestCases: Set<string>
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: TestCaseStatus[]
  setStatusFilter: (filter: TestCaseStatus[]) => void
  priorityFilter: TestCasePriority[]
  setPriorityFilter: (filter: TestCasePriority[]) => void
  platformFilter: string[]
  setPlatformFilter: (filter: string[]) => void
  categoryFilter: TestCaseCategory[]
  setCategoryFilter: (filter: TestCaseCategory[]) => void
  assignedTesterFilter: string[]
  setAssignedTesterFilter: (filter: string[]) => void
  savedFilters: SavedFilter[]
  tableColumns: {
    [key: string]: { visible: boolean; width: string; minWidth: string }
  }
  // Pagination props
  currentPage: number
  setCurrentPage: (page: number) => void
  rowsPerPage: number
  setRowsPerPage: (rows: number) => void
  onAddTestCase: () => void
  onEditTestCase: (testCase: TestCase) => void
  onViewTestCase: (testCase: TestCase) => void
  onRemoveTestCase: (id: string) => void
  onRemoveSelectedTestCases: () => void
  onUpdateTestCase: (testCase: TestCase) => void
  onUpdateTestCaseStatus: (id: string, status: TestCase["status"]) => void
  onBulkUpdateStatus: (status: TestCase["status"]) => void
  onToggleTestCaseSelection: (id: string) => void
  onToggleSelectAll: (filteredTestCases?: TestCase[]) => void
  onClearAllTestCases: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onExportToExcel: () => void
  onSaveFilter: (name: string) => void
  onLoadFilter: (filter: SavedFilter) => void
  onDeleteFilter: (filterId: string) => void
  onClearAllFilters: () => void
  onOpenComments: (testCase: TestCase) => void
  onOpenAutomation: (testCase: TestCase) => void
  onAddTestCaseFromPaste?: (testCase: Partial<TestCase>) => void
  currentProject: string
  isPasteDialogOpen?: boolean
  setIsPasteDialogOpen?: (open: boolean) => void
  deleteLoading?: boolean
  customColumns?: CustomColumn[]
  onUpdateCustomField?: (testCaseId: string, fieldKey: string, value: any) => void
  columnOrder?: string[]
}

export function TestCaseTable({
  testCases,
  selectedTestCases,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  platformFilter,
  setPlatformFilter,
  categoryFilter,
  setCategoryFilter,
  assignedTesterFilter,
  setAssignedTesterFilter,
  savedFilters,
  tableColumns,
  // Pagination props
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  onAddTestCase,
  onEditTestCase,
  onViewTestCase,
  onRemoveTestCase,
  onRemoveSelectedTestCases,
  onUpdateTestCase,
  onUpdateTestCaseStatus,
  onBulkUpdateStatus,
  onToggleTestCaseSelection,
  onToggleSelectAll,
  onClearAllTestCases,
  onFileUpload,
  onExportToExcel,
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  onClearAllFilters,
  onOpenComments,
  onOpenAutomation,
  onAddTestCaseFromPaste,
  currentProject,
  isPasteDialogOpen,
  setIsPasteDialogOpen,
  deleteLoading,
  customColumns = [],
  onUpdateCustomField,
  columnOrder
}: TestCaseTableProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const { toast } = useToast()
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false)
  const [selectedTestCaseForHistory, setSelectedTestCaseForHistory] = useState<TestCase | null>(null)
  const [sortedTestCases, setSortedTestCases] = useState<TestCase[]>(testCases)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [isSaveFilterOpen, setIsSaveFilterOpen] = useState(false)
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [wrapMode, setWrapMode] = useState<'wrap' | 'truncate'>('wrap')
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    ;[
      { key: 'index', width: 80 },
      { key: 'testCase', width: 320 },
      { key: 'description', width: 400 },
      { key: 'status', width: 160 },
      { key: 'priority', width: 140 },
      { key: 'category', width: 160 },
      { key: 'stepsToReproduce', width: 400 },
      { key: 'expectedResult', width: 320 },
      { key: 'actions', width: 240 }
    ].forEach(c => { initial[c.key] = c.width })
    return initial
  })
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const RESIZE_HANDLE_PX = 14

  // Persist wrap mode per project in localStorage
  const wrapStorageKey = useMemo(() => `qa.wrapMode:${currentProject || 'global'}`, [currentProject])
  const widthsStorageKey = useMemo(() => `qa.columnWidths:${currentProject || 'global'}`, [currentProject])
  const selectedTestCasesStorageKey = useMemo(() => `qa.selectedTestCases:${currentProject || 'global'}`, [currentProject])

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(wrapStorageKey) : null
      if (saved === 'wrap' || saved === 'truncate') {
        setWrapMode(saved)
      } else {
        // Default to 'wrap' if no saved preference
        setWrapMode('wrap')
        localStorage.setItem(wrapStorageKey, 'wrap')
      }
    } catch (err) {
      // ignore storage errors
    }
  }, [wrapStorageKey])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(wrapStorageKey, wrapMode)
      }
    } catch (err) {
      // ignore storage errors
    }
  }, [wrapMode, wrapStorageKey])

  // Load saved column widths
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(widthsStorageKey) : null
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>
        if (parsed && typeof parsed === 'object') {
          setColumnWidths(prev => ({ ...prev, ...parsed }))
        }
      }
    } catch {}
  }, [widthsStorageKey])

  // Save column widths
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(widthsStorageKey, JSON.stringify(columnWidths))
      }
    } catch {}
  }, [columnWidths, widthsStorageKey])

  // Load saved selected test cases
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(selectedTestCasesStorageKey) : null
      if (raw) {
        const parsed = JSON.parse(raw) as string[]
        if (Array.isArray(parsed)) {
          // Only restore selections for test cases that still exist
          const validSelections = parsed.filter(id => testCases.some(tc => tc.id === id))
          if (validSelections.length > 0) {
            // Use the onToggleTestCaseSelection function to properly set selections
            validSelections.forEach(id => {
              if (!selectedTestCases.has(id)) {
                onToggleTestCaseSelection(id)
              }
            })
            
            // Show toast notification about restored selections
            toast({
              title: "Selections Restored",
              description: `${validSelections.length} previously selected test case${validSelections.length !== 1 ? 's' : ''} restored.`,
              duration: 3000
            })
          }
        }
      }
    } catch (err) {
      console.error('Error loading saved test case selections:', err)
    }
  }, [currentProject, testCases.length]) // Only run when project changes or test cases are loaded

  // Save selected test cases
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && selectedTestCases.size > 0) {
        const selectionsArray = Array.from(selectedTestCases)
        localStorage.setItem(selectedTestCasesStorageKey, JSON.stringify(selectionsArray))
      } else if (typeof window !== 'undefined' && selectedTestCases.size === 0) {
        // Clear the storage when no selections
        localStorage.removeItem(selectedTestCasesStorageKey)
      }
    } catch (err) {
      console.error('Error saving test case selections:', err)
    }
  }, [selectedTestCases, selectedTestCasesStorageKey])

  const MIN_COL_WIDTH = 60
  const startColumnResize = (key: string, clientX: number) => {
    const startWidth = columnWidths[key] ?? MIN_COL_WIDTH
    setResizing({ key, startX: clientX, startWidth })
    setIsResizing(true)
    try {
      document.body.style.cursor = 'col-resize'
      document.body.classList.add('select-none')
    } catch {}
  }

  const autoFitColumn = (key: string) => {
    // Estimate best width using header + sample cell contents
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Match approximate table font
    ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'

    const headerText = spreadsheetColumns.find(c => c.key === key)?.label || key
    let maxWidth = ctx.measureText(headerText).width

    const sample = sortedTestCases.slice(0, 50)
    for (const tc of sample) {
      const value = getCellValue(tc, key) || ''
      const w = ctx.measureText(String(value)).width
      if (w > maxWidth) maxWidth = w
    }

    const padding = 28 // left+right padding
    const target = Math.max(MIN_COL_WIDTH, Math.ceil(maxWidth) + padding)
    setColumnWidths(prev => ({ ...prev, [key]: target }))
  }

  useEffect(() => {
    if (!resizing) return
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX
      const next = Math.max(MIN_COL_WIDTH, resizing.startWidth + delta)
      setColumnWidths(prev => ({ ...prev, [resizing.key]: next }))
    }
    const onUp = () => {
      setResizing(null)
      setIsResizing(false)
      try {
        document.body.style.cursor = ''
        document.body.classList.remove('select-none')
      } catch {}
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing])
  
  // Google Sheets-like state management
  const [selectedCell, setSelectedCell] = useState<{rowIndex: number, columnKey: string} | null>(null)
  const [selectedRange, setSelectedRange] = useState<{start: {rowIndex: number, columnKey: string}, end: {rowIndex: number, columnKey: string}} | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [editingCell, setEditingCell] = useState<{rowIndex: number, columnKey: string} | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [editingError, setEditingError] = useState<string>('')
  const [copiedCell, setCopiedCell] = useState<{rowIndex: number, columnKey: string, value: string} | null>(null)
  
  // Build column list: core columns (user-configurable) + dynamic custom columns + actions
  const defaultCoreSettings = {
    testCase: { visible: true, width: 'w-64', label: 'Test Case' },
    description: { visible: true, width: 'w-80', label: 'Description' },
    status: { visible: true, width: 'w-32', label: 'Status' },
    priority: { visible: true, width: 'w-24', label: 'Priority' },
    category: { visible: true, width: 'w-32', label: 'Category' },
    stepsToReproduce: { visible: true, width: 'w-80', label: 'Steps to Reproduce' },
    expectedResult: { visible: true, width: 'w-64', label: 'Expected Result' }
  }

  // Hoisted function so it can be used before definition
  function twWidthToPx(token?: string): number {
    switch (token) {
      case 'w-16': return 64
      case 'w-24': return 96
      case 'w-32': return 128
      case 'w-40': return 160
      case 'w-48': return 192
      case 'w-64': return 256
      case 'w-80': return 320
      default: return 128
    }
  }

  const selectedProjectId = typeof window !== 'undefined' ? localStorage.getItem('selectedProjectId') : null
  const coreSettingsRaw = typeof window !== 'undefined' ? localStorage.getItem(`qa.coreColumns:${selectedProjectId || currentProject}`) : null
  const coreSettings = coreSettingsRaw ? (() => { try { return JSON.parse(coreSettingsRaw) } catch { return defaultCoreSettings } })() : defaultCoreSettings

  type CoreCol = { key: string; label: string; width: number; type: string; visible: boolean; options?: string[] }
  const coreColumns: CoreCol[] = [
    { key: 'index', label: '#', width: 60, type: 'number', visible: true },
    ...(Object.entries(coreSettings) as Array<[string, any]>).map(([key, cfg]) => ({
      key,
      label: cfg?.label || (defaultCoreSettings as any)[key]?.label || key,
      width: twWidthToPx(cfg?.width || (defaultCoreSettings as any)[key]?.width),
      type: key === 'status' ? 'select' : key === 'priority' ? 'select' : key === 'category' ? 'select' : 'text',
      options: key === 'status' ? (STATUS_OPTIONS as unknown as string[]) : key === 'priority' ? (PRIORITY_OPTIONS as unknown as string[]) : key === 'category' ? (CATEGORY_OPTIONS as unknown as string[]) : undefined,
      visible: cfg?.visible !== false
    })).filter(col => col.visible)
  ]

  

  const customDynamicColumns: { key: string; label: string; width: number; type: string; options?: string[] }[] = (customColumns || [])
    .filter(c => c.visible)
    .map(c => ({
      key: `custom:${c.name}`,
      label: c.label,
      width: twWidthToPx(c.width),
      type: c.type === 'select' ? 'select' : (c.type === 'boolean' ? 'boolean' : (c.type === 'number' ? 'number' : c.type)),
      options: c.options
    }))

  const spreadsheetColumns = [
    ...coreColumns,
    ...customDynamicColumns,
    { key: 'actions', label: 'Actions', width: 220, type: 'actions' }
  ]

  // Initialize width for any new dynamic custom columns once (do not override user-resized widths)
  useEffect(() => {
    const pending: Record<string, number> = {}
    for (const col of customDynamicColumns) {
      if (columnWidths[col.key] === undefined) pending[col.key] = col.width
    }
    if (Object.keys(pending).length > 0) setColumnWidths(prev => ({ ...prev, ...pending }))
  }, [customDynamicColumns])

  // Seed widths for core columns from settings when missing
  useEffect(() => {
    const pending: Record<string, number> = {}
    for (const col of coreColumns) {
      if (columnWidths[col.key] === undefined) pending[col.key] = col.width as number
    }
    if (Object.keys(pending).length > 0) setColumnWidths(prev => ({ ...prev, ...pending }))
  }, [coreColumns])
  
  // Freeze first two columns: index and testCase
  const pinnedColumns = useMemo(() => new Set<string>(['index', 'testCase']), [])
  const columnLeftOffsets = useMemo(() => {
    const offsets: Record<string, number> = {}
    let acc = 0
    for (const col of spreadsheetColumns) {
      offsets[col.key] = acc
      const width = columnWidths[col.key] ?? col.width
      acc += width
    }
    return offsets
  }, [spreadsheetColumns, columnWidths])
  
  // Generate column letters (A, B, C, D...)
  const getColumnLetter = (index: number): string => {
    let result = ''
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result
      index = Math.floor(index / 26) - 1
    }
    return result
  }
  
  // Cell interaction handlers
  const handleCellClick = (rowIndex: number, columnKey: string, e?: React.MouseEvent) => {
    if (editingCell) {
      handleSaveEdit()
    }
    
    if (e?.shiftKey && selectedCell) {
      // Shift+click for range selection
      const startRow = Math.min(selectedCell.rowIndex, rowIndex)
      const endRow = Math.max(selectedCell.rowIndex, rowIndex)
      const startCol = Math.min(
        spreadsheetColumns.findIndex(col => col.key === selectedCell.columnKey),
        spreadsheetColumns.findIndex(col => col.key === columnKey)
      )
      const endCol = Math.max(
        spreadsheetColumns.findIndex(col => col.key === selectedCell.columnKey),
        spreadsheetColumns.findIndex(col => col.key === columnKey)
      )
      
      setSelectedRange({
        start: { rowIndex: startRow, columnKey: spreadsheetColumns[startCol].key },
        end: { rowIndex: endRow, columnKey: spreadsheetColumns[endCol].key }
      })
    } else {
      setSelectedCell({ rowIndex, columnKey })
      setSelectedRange(null)
    }
  }
  
  const handleCellMouseDown = (rowIndex: number, columnKey: string) => {
    if (!isSelecting) {
      setIsSelecting(true)
      setSelectedCell({ rowIndex, columnKey })
      setSelectedRange(null)
    }
  }
  
  const handleCellMouseEnter = (rowIndex: number, columnKey: string) => {
    if (isSelecting && selectedCell) {
      const startRow = Math.min(selectedCell.rowIndex, rowIndex)
      const endRow = Math.max(selectedCell.rowIndex, rowIndex)
      const startCol = Math.min(
        spreadsheetColumns.findIndex(col => col.key === selectedCell.columnKey),
        spreadsheetColumns.findIndex(col => col.key === columnKey)
      )
      const endCol = Math.max(
        spreadsheetColumns.findIndex(col => col.key === selectedCell.columnKey),
        spreadsheetColumns.findIndex(col => col.key === columnKey)
      )
      
      setSelectedRange({
        start: { rowIndex: startRow, columnKey: spreadsheetColumns[startCol].key },
        end: { rowIndex: endRow, columnKey: spreadsheetColumns[endCol].key }
      })
    }
  }
  
  const handleMouseUp = () => {
    setIsSelecting(false)
  }
  
  // Check if cell is in selected range
  const isCellInRange = (rowIndex: number, columnKey: string): boolean => {
    if (!selectedRange) return false
    
    const rowInRange = rowIndex >= selectedRange.start.rowIndex && rowIndex <= selectedRange.end.rowIndex
    const startColIndex = spreadsheetColumns.findIndex(col => col.key === selectedRange.start.columnKey)
    const endColIndex = spreadsheetColumns.findIndex(col => col.key === selectedRange.end.columnKey)
    const currentColIndex = spreadsheetColumns.findIndex(col => col.key === columnKey)
    const colInRange = currentColIndex >= startColIndex && currentColIndex <= endColIndex
    
    return rowInRange && colInRange
  }
  
  const handleCellDoubleClick = (rowIndex: number, columnKey: string) => {
    const testCase = paginatedTestCases[rowIndex]
    if (!testCase) return
    // Do not enter edit mode for non-editable columns
    if (columnKey === 'index' || columnKey === 'actions') return

    setEditingCell({ rowIndex, columnKey })
    const currentValue = getCellValue(testCase, columnKey)
    setEditingValue(currentValue || '')
    setEditingError('')
  }
  
  const getCellValue = (testCase: TestCase, columnKey: string): string => {
    switch (columnKey) {
      case 'index': return ''
      case 'testCase': return testCase.testCase || ''
      case 'description': return testCase.description || ''
      case 'status': return testCase.status || ''
      case 'priority': return testCase.priority || ''
      case 'category': return testCase.category || ''
      case 'stepsToReproduce': return testCase.stepsToReproduce || ''
      case 'expectedResult': return testCase.expectedResult || ''
      default: {
        if (columnKey.startsWith('custom:')) {
          const field = columnKey.slice('custom:'.length)
          return String((testCase.customFields || {})[field] ?? '')
        }
        return ''
      }
    }
  }
  
  // Validation rules per column
  const validateValue = (columnKey: string, value: string): { valid: boolean; message?: string } => {
    const trimmed = value?.toString().trim() ?? ''
    switch (columnKey) {
      case 'testCase':
        if (!trimmed) return { valid: false, message: 'Test Case is required.' }
        if (trimmed.length > 200) return { valid: false, message: 'Max 200 characters.' }
        return { valid: true }
      case 'description':
        if (trimmed.length > 2000) return { valid: false, message: 'Description max 2000 characters.' }
        return { valid: true }
      case 'status':
        return { valid: STATUS_OPTIONS.includes(trimmed as TestCaseStatus), message: 'Invalid status.' }
      case 'priority':
        return { valid: PRIORITY_OPTIONS.includes(trimmed as TestCasePriority), message: 'Invalid priority.' }
      case 'category':
        return { valid: CATEGORY_OPTIONS.includes(trimmed as TestCaseCategory), message: 'Invalid category.' }
      case 'stepsToReproduce':
        if (trimmed.length > 5000) return { valid: false, message: 'Steps max 5000 characters.' }
        return { valid: true }
      case 'expectedResult':
        if (trimmed.length > 2000) return { valid: false, message: 'Expected result max 2000 characters.' }
        return { valid: true }
      default:
        return { valid: true }
    }
  }
  
  const handleSaveEdit = async () => {
    if (!editingCell) return
    
    const testCase = paginatedTestCases[editingCell.rowIndex]
    if (!testCase) return
    
    // Validate
    const validation = validateValue(editingCell.columnKey, editingValue)
    if (!validation.valid) {
      setEditingError(validation.message || 'Invalid value')
      toast({ title: 'Invalid value', description: validation.message || 'Please correct and try again.', variant: 'destructive' })
      return
    }

    const updatedTestCase = { ...testCase }
    
    const columnKey = editingCell.columnKey
    switch (columnKey) {
      case 'testCase':
        updatedTestCase.testCase = editingValue
        break
      case 'description':
        updatedTestCase.description = editingValue
        break
      case 'status':
        updatedTestCase.status = editingValue as TestCaseStatus
        break
      case 'priority':
        updatedTestCase.priority = editingValue as TestCasePriority
        break
      case 'category':
        updatedTestCase.category = editingValue as TestCaseCategory
        break
      case 'stepsToReproduce':
        updatedTestCase.stepsToReproduce = editingValue
        break
      case 'expectedResult':
        updatedTestCase.expectedResult = editingValue
        break
      default:
        if (columnKey.startsWith('custom:')) {
          const field = columnKey.slice('custom:'.length)
          const nextCustom = { ...(updatedTestCase.customFields || {}), [field]: editingValue }
          updatedTestCase.customFields = nextCustom
        }
    }
    
    if (columnKey.startsWith('custom:') && onUpdateCustomField) {
      const field = columnKey.slice('custom:'.length)
      await onUpdateCustomField(testCase.id, field, editingValue)
    } else {
      await onUpdateTestCase(updatedTestCase)
    }
    setEditingCell(null)
    setEditingValue('')
    setEditingError('')
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return
    
    const { rowIndex, columnKey } = selectedCell
    const currentColIndex = spreadsheetColumns.findIndex(col => col.key === columnKey)
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        if (rowIndex > 0) {
          setSelectedCell({ rowIndex: rowIndex - 1, columnKey })
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (rowIndex < paginatedTestCases.length - 1) {
          setSelectedCell({ rowIndex: rowIndex + 1, columnKey })
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (currentColIndex > 0) {
          setSelectedCell({ rowIndex, columnKey: spreadsheetColumns[currentColIndex - 1].key })
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (currentColIndex < spreadsheetColumns.length - 1) {
          setSelectedCell({ rowIndex, columnKey: spreadsheetColumns[currentColIndex + 1].key })
        }
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          // Shift+Tab - move left
          if (currentColIndex > 0) {
            setSelectedCell({ rowIndex, columnKey: spreadsheetColumns[currentColIndex - 1].key })
          }
        } else {
          // Tab - move right
          if (currentColIndex < spreadsheetColumns.length - 1) {
            setSelectedCell({ rowIndex, columnKey: spreadsheetColumns[currentColIndex + 1].key })
          }
        }
        break
      case 'Enter':
        e.preventDefault()
        if (editingCell) {
          handleSaveEdit()
        } else {
          handleCellDoubleClick(rowIndex, columnKey)
        }
        break
      case 'Escape':
        if (editingCell) {
          setEditingCell(null)
          setEditingValue('')
        }
        break
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleCopyCell()
        }
        break
      case 'v':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handlePasteCell()
        }
        break
      case 'Delete':
      case 'Backspace':
        if (selectedTestCases.size > 0) {
          e.preventDefault()
          setIsBulkDeleteDialogOpen(true)
        }
        break
    }
  }
  
  // Copy/Paste functionality
  const handleCopyCell = () => {
    if (!selectedCell) return
    
    const testCase = paginatedTestCases[selectedCell.rowIndex]
    if (!testCase) return
    
    const value = getCellValue(testCase, selectedCell.columnKey)
    setCopiedCell({
      rowIndex: selectedCell.rowIndex,
      columnKey: selectedCell.columnKey,
      value: value
    })
    
    // Also copy to system clipboard
    navigator.clipboard.writeText(value).catch(console.error)
    
    toast({
      title: "Copied",
      description: `Cell ${getColumnLetter(spreadsheetColumns.findIndex(col => col.key === selectedCell.columnKey))}${selectedCell.rowIndex + 1} copied`,
      duration: 1000
    })
  }
  
  const handlePasteCell = async () => {
    if (!selectedCell || !copiedCell) return
    
    const testCase = paginatedTestCases[selectedCell.rowIndex]
    if (!testCase) return
    
    const updatedTestCase = { ...testCase }
    
    // Set the value from copied cell
    switch (selectedCell.columnKey) {
      case 'testCase':
        if (!validateValue('testCase', copiedCell.value).valid) {
          toast({ title: 'Invalid title', description: 'Test Case cannot be empty.', variant: 'destructive' })
          return
        }
        updatedTestCase.testCase = copiedCell.value
        break
      case 'description':
        if (!validateValue('description', copiedCell.value).valid) {
          toast({ title: 'Too long', description: 'Description is too long.', variant: 'destructive' })
          return
        }
        updatedTestCase.description = copiedCell.value
        break
      case 'status':
        if (STATUS_OPTIONS.includes(copiedCell.value as TestCaseStatus)) {
          updatedTestCase.status = copiedCell.value as TestCaseStatus
        }
        break
      case 'priority':
        if (PRIORITY_OPTIONS.includes(copiedCell.value as TestCasePriority)) {
          updatedTestCase.priority = copiedCell.value as TestCasePriority
        }
        break
      case 'category':
        if (CATEGORY_OPTIONS.includes(copiedCell.value as TestCaseCategory)) {
          updatedTestCase.category = copiedCell.value as TestCaseCategory
        }
        break
      case 'stepsToReproduce':
        if (!validateValue('stepsToReproduce', copiedCell.value).valid) {
          toast({ title: 'Too long', description: 'Steps content is too long.', variant: 'destructive' })
          return
        }
        updatedTestCase.stepsToReproduce = copiedCell.value
        break
      case 'expectedResult':
        if (!validateValue('expectedResult', copiedCell.value).valid) {
          toast({ title: 'Too long', description: 'Expected Result is too long.', variant: 'destructive' })
          return
        }
        updatedTestCase.expectedResult = copiedCell.value
        break
    }
    
    await onUpdateTestCase(updatedTestCase)
    
    toast({
      title: "Pasted",
      description: `Value pasted to cell ${getColumnLetter(spreadsheetColumns.findIndex(col => col.key === selectedCell.columnKey))}${selectedCell.rowIndex + 1}`,
      duration: 1000
    })
  }
  
  const [filterName, setFilterName] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [parsedTestCase, setParsedTestCase] = useState<Partial<TestCase> | null>(null)
  const [isAIProcessing, setIsAIProcessing] = useState(false)

  // Add keyboard event listener for table navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      handleKeyDown(e as any)
    }
    
    const handleGlobalMouseUp = () => {
      setIsSelecting(false)
    }
    
    document.addEventListener('keydown', handleGlobalKeyDown)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [selectedCell, editingCell, isSelecting])

  // Update sorted test cases when testCases prop changes
  useEffect(() => {
    setSortedTestCases(testCases)
  }, [testCases])

  // Reset to original order
  const resetOrder = () => {}

  // Calculate pagination
  const totalPages = Math.ceil(sortedTestCases.length / (rowsPerPage || 10))
  const startIndex = (currentPage - 1) * (rowsPerPage || 10)
  const endIndex = startIndex + (rowsPerPage || 10)
  const paginatedTestCases = sortedTestCases.slice(startIndex, endIndex)

  // Update current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages, setCurrentPage])

  const handleOpenStatusHistory = (testCase: TestCase) => {
    setSelectedTestCaseForHistory(testCase)
    setIsStatusHistoryOpen(true)
  }

  const handleCloseStatusHistory = () => {
    setIsStatusHistoryOpen(false)
    setSelectedTestCaseForHistory(null)
  }

  // AI Enhancement function for pasted test case content
  const enhanceWithAI = async (text: string) => {
    if (!text.trim()) {
      toast({
        title: "No content to enhance",
        description: "Please paste some test case content first.",
        variant: "destructive"
      })
      return
    }

    setIsAIProcessing(true)
    try {
      const response = await fetch('/api/enhance-test-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testCaseContent: text,
          project: currentProject
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enhance test case')
      }

      const data = await response.json()
      setPastedText(data.enhancedContent)
      
    toast({
        title: "Test Case Enhanced!",
        description: "AI has improved the grammar, structure, and format of your test case.",
      })
    } catch (error) {
      console.error('Error enhancing test case:', error)
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance test case. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAIProcessing(false)
    }
  }

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value))
    setCurrentPage(1) // Reset to first page when changing rows per page
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName.trim())
      setIsSaveFilterOpen(false)
      setFilterName('')
    }
  }

  const handleClearAll = () => {
    onClearAllTestCases()
    setIsClearAllDialogOpen(false)
  }

  const parsePastedText = (text: string): Partial<TestCase> => {
    // Check if the pasted text looks like CSV data
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length > 1 && lines[0].includes(',')) {
      // It looks like CSV data, try to parse it
      try {
        const csvData = parseCSV(text)
        if (csvData.length > 0) {
          // Use the first row as the test case
          const mappedTestCase = mapImportedDataToTestCase(csvData[0], 0, currentProject, undefined)
          const validation = validateImportedTestCase(mappedTestCase)
          return validation.cleanedTestCase
        }
      } catch (error) {
        console.warn('Failed to parse as CSV, falling back to text parsing:', error)
      }
    }
    
    // Fallback to original text parsing logic
    let testCase: Partial<TestCase> = {
      testCase: '',
      description: '',
      expectedResult: '',
      status: 'Pending' as TestCaseStatus,
      priority: 'Medium' as TestCasePriority,
      category: 'Functional' as TestCaseCategory,
      assignedTester: '',
      executionDate: '',
      notes: '',
      actualResult: '',
      environment: '',
      prerequisites: '',
      platform: '',
      stepsToReproduce: '',
      projectId: currentProject
    }

    if (lines.length > 0) {
      // First line is usually the test case title
      testCase.testCase = lines[0].trim()
      
      // Look for description in subsequent lines
      if (lines.length > 1) {
        const descriptionLines = lines.slice(1).filter(line => 
          !line.toLowerCase().includes('steps:') && 
          !line.toLowerCase().includes('expected:') &&
          !line.toLowerCase().includes('priority:') &&
          !line.toLowerCase().includes('status:')
        )
        testCase.description = descriptionLines.join(' ').trim()
      }

      // Try to extract other information from the text
      lines.forEach(line => {
        const lowerLine = line.toLowerCase()
        
        if (lowerLine.includes('steps:') || lowerLine.includes('steps to reproduce:')) {
          const stepsIndex = lines.indexOf(line)
          const stepsLines = lines.slice(stepsIndex + 1).filter(l => l.trim() && !l.toLowerCase().includes('expected:'))
          testCase.stepsToReproduce = stepsLines.join('\n').trim()
        }
        
        if (lowerLine.includes('expected:') || lowerLine.includes('expected result:')) {
          const expectedIndex = lines.indexOf(line)
          const expectedLines = lines.slice(expectedIndex + 1).filter(l => l.trim() && !l.toLowerCase().includes('steps:'))
          testCase.expectedResult = expectedLines.join('\n').trim()
        }
        
        if (lowerLine.includes('priority:')) {
          const priority = line.split(':')[1]?.trim()
          if (priority && ['High', 'Medium', 'Low'].includes(priority)) {
            testCase.priority = priority as TestCasePriority
          }
        }
        
        if (lowerLine.includes('status:')) {
          const status = line.split(':')[1]?.trim()
          if (status && ['Pass', 'Fail', 'Pending', 'In Progress', 'Blocked'].includes(status)) {
            testCase.status = status as TestCaseStatus
          }
        }
      })
    }

    return testCase
  }

  const handlePasteSubmit = () => {
    if (pastedText.trim()) {
      const parsed = parsePastedText(pastedText)
      setParsedTestCase(parsed)
      if (onAddTestCaseFromPaste) {
        onAddTestCaseFromPaste(parsed)
      }
      
      if (setIsPasteDialogOpen) {
        setIsPasteDialogOpen(false)
      }
      setPastedText('')
      setParsedTestCase(null)
    }
  }

  // Parse text in real-time as user types
  useEffect(() => {
    if (pastedText.trim()) {
      const parsed = parsePastedText(pastedText)
      setParsedTestCase(parsed)
    } else {
      setParsedTestCase(null)
    }
  }, [pastedText, currentProject])

  return (
    <div className="h-full flex flex-col pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      {/* Search and action buttons moved to header */}

      {/* Table */}
      <div className="bg-white flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Bulk Selection Indicator - Desktop */}
        {selectedTestCases.size > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-800">
                  {selectedTestCases.size} test case{selectedTestCases.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onToggleSelectAll([])
                    // Also clear the localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem(selectedTestCasesStorageKey)
                    }
                  }}
                  className="h-7 px-2 text-xs border-red-200 text-red-700 hover:bg-red-100"
                >
                  Clear Selection
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete Selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="w-full px-2 py-2 min-h-0">
            <div className={`relative w-full overflow-x-auto overflow-y-auto rounded-xl focus:outline-none h-[75vh] min-h-0 ${isResizing ? 'cursor-col-resize select-none' : ''}`} 
                 tabIndex={0} 
                 onKeyDown={handleKeyDown}>
              
              {/* Google Sheets-like Spreadsheet */}
              <div className="min-w-max w-max border border-slate-700/60 rounded-xl bg-white">
                
                {/* Sticky Headers Wrapper */}
                <div className="sticky top-0 z-40 bg-white">
                  {/* Column Letter Headers (A, B, C, D...) */}
                  <div className="flex bg-slate-100 border-b border-slate-300 rounded-t-xl">
                    {spreadsheetColumns.map((column, index) => (
                      <div 
                        key={column.key}
                        className={`flex-shrink-0 h-8 flex items-center justify-center border-r border-slate-300 bg-slate-200 text-xs font-semibold text-slate-600 ${pinnedColumns.has(column.key) ? 'sticky' : ''}`}
                        style={{ width: `${(columnWidths[column.key] ?? column.width)}px`, left: pinnedColumns.has(column.key) ? columnLeftOffsets[column.key] : undefined, zIndex: pinnedColumns.has(column.key) ? 60 : undefined }}
                      >
                        {getColumnLetter(index)}
              </div>
                    ))}
              </div>

                  {/* Column Name Headers */}
                  <div className="flex bg-slate-50 border-b border-slate-300">
                    {spreadsheetColumns.map((column) => (
                      <div 
                        key={column.key}
                        className={`group relative flex-shrink-0 h-10 flex items-center px-3 border-r border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors ${pinnedColumns.has(column.key) ? 'sticky' : ''}`}
                        style={{ width: `${(columnWidths[column.key] ?? column.width)}px`, left: pinnedColumns.has(column.key) ? columnLeftOffsets[column.key] : undefined, zIndex: pinnedColumns.has(column.key) ? 50 : undefined }}
                      >
                        {column.label}
                        {/* Bulk selection indicator for index column */}
                        {column.key === 'index' && selectedTestCases.size > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {selectedTestCases.size}
                          </div>
                        )}
                        {/* Hover affordance line */}
                        <div className="pointer-events-none absolute top-0 right-0 h-full w-px bg-transparent group-hover:bg-slate-300" />
                        {/* Resize handle - generous hit area with hover feedback */}
                        <div
                          className={`absolute top-0 right-0 h-full cursor-col-resize`} 
                          style={{ width: RESIZE_HANDLE_PX, marginRight: -RESIZE_HANDLE_PX / 2 }}
                          onMouseDown={(e) => {
                            e.preventDefault(); e.stopPropagation()
                            startColumnResize(column.key, e.clientX)
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault(); e.stopPropagation()
                            autoFitColumn(column.key)
                          }}
                          title="Drag to resize. Double-click to auto-fit"
                        >
                          {/* Grip icon for discoverability */}
                          <div className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-slate-300 group-hover:text-slate-500 transition-colors">
                            <GripVertical className="w-3 h-3" />
                    </div>
                          <div className="h-full w-full hover:bg-blue-500/15 transition-colors" />
                  </div>
                              </div>
                    ))}
                          </div>
                          </div>

                                {/* Data Rows */}
                <div className="divide-y divide-slate-200 rounded-b-xl">
                  {paginatedTestCases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <FileText className="w-10 h-10 text-slate-400" />
                      <p className="mt-3 text-slate-600">No test cases found</p>
                      <Button onClick={onAddTestCase} className="mt-4 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>
                  ) : (
                    paginatedTestCases.map((testCase, rowIndex) => (
                      <div key={testCase.id} className="flex">
                        {spreadsheetColumns.map((column) => {
                          const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.columnKey === column.key
                          const isInRange = isCellInRange(rowIndex, column.key)
                          const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key
                          
                          return (
                            <div
                              key={column.key}
                              className={`
                                flex-shrink-0 ${wrapMode === 'wrap' ? 'min-h-12 h-auto py-2' : 'h-12'} border-r border-slate-200 flex ${wrapMode === 'wrap' && column.key !== 'actions' && column.key !== 'index' ? 'items-start' : 'items-center'} px-3 ${column.key === 'actions' ? 'cursor-default' : 'cursor-cell'} transition-colors select-none ${pinnedColumns.has(column.key) ? 'sticky bg-white' : ''}
                                ${isSelected ? 'bg-blue-100 border-2 border-blue-500' : isInRange ? 'bg-blue-50 border border-blue-300' : 'hover:bg-slate-50'}
                                ${column.key === 'index' ? 'bg-slate-100 text-slate-600 font-medium justify-center' : ''}
                              `}
                              style={{ width: `${(columnWidths[column.key] ?? column.width)}px`, left: pinnedColumns.has(column.key) ? columnLeftOffsets[column.key] : undefined, zIndex: pinnedColumns.has(column.key) ? 25 : undefined }}
                              onClick={(e) => handleCellClick(rowIndex, column.key, e)}
                              onDoubleClick={() => handleCellDoubleClick(rowIndex, column.key)}
                              onMouseDown={() => handleCellMouseDown(rowIndex, column.key)}
                              onMouseEnter={() => handleCellMouseEnter(rowIndex, column.key)}
                              onMouseUp={handleMouseUp}
                            >
                              {column.key === 'actions' ? (
                                <div className="flex items-center gap-2 w-full justify-start">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="View"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      onViewTestCase(testCase)
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Edit"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      onEditTestCase(testCase)
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Comments"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      onOpenComments(testCase)
                                    }}
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Automation"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      onOpenAutomation(testCase)
                                    }}
                                  >
                                    <Code className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Status History"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      handleOpenStatusHistory(testCase)
                                    }}
                                  >
                                    <History className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                    title="Delete"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      onRemoveTestCase(testCase.id)
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : isEditing ? (
                                column.type === 'select' ? (
                                  <Select 
                                    value={editingValue} 
                                    onValueChange={setEditingValue}
                                    onOpenChange={(open) => {
                                      if (!open) {
                                        handleSaveEdit()
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 border-none shadow-none">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {column.options?.map((option: string) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={handleSaveEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveEdit()
                                      } else if (e.key === 'Escape') {
                                        setEditingCell(null)
                                        setEditingValue('')
                                      }
                                    }}
                                    className="h-8 border-none shadow-none p-0"
                                    autoFocus
                                  />
                                )
                              ) : (
                                <div className={`w-full text-sm ${wrapMode === 'wrap' ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
                                  {column.key === 'index' ? (
                                    startIndex + rowIndex + 1
                                  ) : column.key === 'status' ? (
                                    <Select
                                      value={testCase.status}
                                      onValueChange={(value) => onUpdateTestCaseStatus(testCase.id, value as TestCaseStatus)}
                                    >
                                      <SelectTrigger className="w-full border-0 p-0 h-auto bg-transparent hover:bg-slate-50">
                                        <Badge variant={getStatusBadgeVariant(testCase.status)} className={getStatusBadgeStyle(testCase.status)}>
                                          {testCase.status}
                                        </Badge>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUS_OPTIONS.map((status) => {
                                          const StatusIcon = getStatusIcon(status)
                                          return (
                                            <SelectItem key={status} value={status}>
                                              <div className="flex items-center gap-2">
                                                <StatusIcon className="w-4 h-4" />
                                                {status}
                                              </div>
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  ) : column.key === 'priority' ? (
                                    <Select
                                      value={testCase.priority}
                                      onValueChange={(value) => onUpdateTestCase({ ...testCase, priority: value as TestCasePriority })}
                                    >
                                      <SelectTrigger className="w-full border-0 p-0 h-auto bg-transparent hover:bg-slate-50">
                                        <Badge variant={getPriorityBadgeVariant(testCase.priority)} className={getPriorityBadgeStyle(testCase.priority)}>
                                          {testCase.priority}
                                        </Badge>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PRIORITY_OPTIONS.map((priority) => {
                                          const PriorityIcon = getPriorityIcon(priority)
                                          return (
                                            <SelectItem key={priority} value={priority}>
                                              <div className="flex items-center gap-2">
                                                <PriorityIcon className="w-4 h-4" />
                                                {priority}
                                              </div>
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  ) : column.type === 'select' && column.key.startsWith('custom:') ? (
                                    (() => {
                                      const fieldName = column.key.slice('custom:'.length)
                                      const value = (testCase.customFields || {})[fieldName]
                                      const stringValue = value != null ? String(value) : ''
                                      // Find the custom column to get its color and option colors
                                      const customColumn = customColumns.find(col => col.name === fieldName)
                                      const columnColor = customColumn?.color || '#3b82f6'
                                      const optionColor = customColumn?.optionColors?.[stringValue] || columnColor
                                      return (
                                        <Select
                                          value={stringValue}
                                          onValueChange={(newValue) => {
                                            if (onUpdateCustomField) {
                                              onUpdateCustomField(testCase.id, fieldName, newValue)
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="w-full border-0 p-0 h-auto bg-transparent hover:bg-slate-50">
                                            <Badge 
                                              variant="outline" 
                                              className="text-sm"
                                              style={{
                                                borderColor: optionColor,
                                                color: optionColor,
                                                backgroundColor: `${optionColor}10`
                                              }}
                                            >
                                              {value || 'Not Set'}
                                            </Badge>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {column.options?.map((option) => (
                                              <SelectItem key={option} value={option}>
                                                {option}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )
                                    })()
                                  ) : column.type === 'boolean' && column.key.startsWith('custom:') ? (
                                    (() => {
                                      const fieldName = column.key.slice('custom:'.length)
                                      const value = (testCase.customFields || {})[fieldName]
                                      const boolValue = value === true || value === 'true'
                                      // Find the custom column to get its color
                                      const customColumn = customColumns.find(col => col.name === fieldName)
                                      const columnColor = customColumn?.color || '#3b82f6'
                                      return (
                                        <Select
                                          value={boolValue ? 'true' : 'false'}
                                          onValueChange={(newValue) => {
                                            if (onUpdateCustomField) {
                                              onUpdateCustomField(testCase.id, fieldName, newValue === 'true')
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="w-full border-0 p-0 h-auto bg-transparent hover:bg-slate-50">
                                            <Badge 
                                              variant={boolValue ? 'default' : 'secondary'} 
                                              className="text-sm"
                                              style={{
                                                backgroundColor: boolValue ? columnColor : `${columnColor}20`,
                                                color: boolValue ? 'white' : columnColor,
                                                borderColor: columnColor
                                              }}
                                            >
                                              {boolValue ? 'Yes' : 'No'}
                                            </Badge>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="true">Yes</SelectItem>
                                            <SelectItem value="false">No</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )
                                    })()
                                  ) : (
                                    getCellValue(testCase, column.key) || '-'
                                  )}
                          </div>
                              )}
                          </div>
                          )
                        })}
                              </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile View */}
        <div className="lg:hidden p-4 lg:pl-16 space-y-4 bg-slate-900/60">
          {selectedTestCases.size > 0 && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    {selectedTestCases.size} test case{selectedTestCases.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {testCases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">No test cases available</h3>
              <p className="text-slate-400 mb-4">Get started by adding your first test case.</p>
              <Button onClick={onAddTestCase} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Test Case
              </Button>
            </div>
          ) : (
          <div className="space-y-4">
            {paginatedTestCases.map((testCase, idx) => (
              <div 
                key={testCase.id} 
                  className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4 cursor-pointer hover:bg-slate-800 transition-colors text-slate-200"
                onDoubleClick={() => onViewTestCase(testCase)}
                title="Double-click to view test case details"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedTestCases.has(testCase.id)}
                      onCheckedChange={() => onToggleTestCaseSelection(testCase.id)}
                    />
                  <div>
                        <h4 className="font-medium text-slate-200">{testCase.testCase}</h4>
                        <p className="text-sm text-slate-400">{testCase.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onViewTestCase(testCase)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEditTestCase(testCase)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveTestCase(testCase.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Select
                      value={testCase.status}
                      onValueChange={(value) => onUpdateTestCaseStatus(testCase.id, value as TestCaseStatus)}
                    >
                      <SelectTrigger className="w-auto border-0 p-0 h-auto bg-transparent">
                        <Badge variant={getStatusBadgeVariant(testCase.status)} className={getStatusBadgeStyle(testCase.status)}>
                          {testCase.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => {
                          const StatusIcon = getStatusIcon(status)
                          return (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <StatusIcon className="w-4 h-4" />
                                {status}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <Select
                      value={testCase.priority}
                      onValueChange={(value) => onUpdateTestCase({ ...testCase, priority: value as TestCasePriority })}
                    >
                      <SelectTrigger className="w-auto border-0 p-0 h-auto bg-transparent">
                        <Badge variant={getPriorityBadgeVariant(testCase.priority)} className={getPriorityBadgeStyle(testCase.priority)}>
                          {testCase.priority}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((priority) => {
                          const PriorityIcon = getPriorityIcon(priority)
                          return (
                            <SelectItem key={priority} value={priority}>
                              <div className="flex items-center gap-2">
                                <PriorityIcon className="w-4 h-4" />
                                {priority}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    
                    {/* Custom Fields in Mobile View */}
                    {customColumns.filter(col => col.visible).map((customCol) => {
                      const fieldValue = (testCase.customFields || {})[customCol.name]
                      
                      if (customCol.type === 'select') {
                        const stringValue = fieldValue != null ? String(fieldValue) : ''
                        return (
                          <Select
                            key={customCol.id}
                            value={stringValue}
                            onValueChange={(value) => {
                              if (onUpdateCustomField) {
                                onUpdateCustomField(testCase.id, customCol.name, value)
                              }
                            }}
                          >
                            <SelectTrigger className="w-auto border-0 p-0 h-auto bg-transparent">
                              <Badge 
                                variant="outline" 
                                className="text-sm"
                                style={{
                                  borderColor: customCol.optionColors?.[String(fieldValue)] || customCol.color || '#3b82f6',
                                  color: customCol.optionColors?.[String(fieldValue)] || customCol.color || '#3b82f6',
                                  backgroundColor: `${customCol.optionColors?.[String(fieldValue)] || customCol.color || '#3b82f6'}10`
                                }}
                              >
                                {fieldValue || 'Not Set'}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {customCol.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )
                      } else if (customCol.type === 'boolean') {
                        const boolValue = fieldValue === true || fieldValue === 'true'
                        return (
                          <Select
                            key={customCol.id}
                            value={boolValue ? 'true' : 'false'}
                            onValueChange={(value) => {
                              if (onUpdateCustomField) {
                                onUpdateCustomField(testCase.id, customCol.name, value === 'true')
                              }
                            }}
                          >
                            <SelectTrigger className="w-auto border-0 p-0 h-auto bg-transparent">
                              <Badge 
                                variant={boolValue ? 'default' : 'secondary'} 
                                className="text-sm"
                                style={{
                                  backgroundColor: boolValue ? (customCol.color || '#3b82f6') : `${customCol.color || '#3b82f6'}20`,
                                  color: boolValue ? 'white' : (customCol.color || '#3b82f6'),
                                  borderColor: customCol.color || '#3b82f6'
                                }}
                              >
                                {boolValue ? 'Yes' : 'No'}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        )
                      } else {
                        // For text, number, date fields, show as non-interactive badge
                        return (
                          <Badge 
                            key={customCol.id} 
                            variant="outline" 
                            className="text-sm"
                            style={{
                              borderColor: customCol.color || '#3b82f6',
                              color: customCol.color || '#3b82f6',
                              backgroundColor: `${customCol.color || '#3b82f6'}10`
                            }}
                          >
                            {customCol.label}: {fieldValue || '-'}
                          </Badge>
                        )
                      }
                    })}
                </div>
                  {testCase.description && (
                      <p className="text-sm text-slate-400 break-words whitespace-pre-wrap">{testCase.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
      </div>

      {/* Visual Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mx-6"></div>

      {/* Pagination - match sidebar gradient */}
        <div className="px-6 py-6 border-t border-slate-700/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">Rows per page:</span>
              <Select value={(rowsPerPage || 10).toString()} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
              <span className="text-sm text-slate-300">
              Showing {startIndex + 1} to {Math.min(endIndex, testCases.length)} of {testCases.length} results
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant={currentPage === 1 ? 'outline' : 'default'}
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className={currentPage === 1 ? 'px-4 py-2 bg-slate-800/70 border-slate-700 text-slate-400' : 'px-4 py-2 bg-blue-600 text-white hover:bg-blue-700'}
            >
              Prev
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-800/70 border-slate-700 text-slate-300 hover:text-blue-300 hover:border-blue-600 hover:bg-slate-800"}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  {currentPage > 3 && <span className="text-slate-400">...</span>}
                  {currentPage > 3 && currentPage < totalPages - 2 && (
                    <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                      {currentPage}
                    </Button>
                  )}
                  {currentPage < totalPages - 2 && <span className="text-slate-400">...</span>}
                  {currentPage < totalPages - 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  )}
                </>
              )}
            </div>
            <Button 
              variant={currentPage === totalPages || totalPages === 0 ? 'outline' : 'default'} 
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
              className={currentPage === totalPages || totalPages === 0 ? 'px-4 py-2 bg-slate-800/70 border-slate-700 text-slate-400' : 'px-4 py-2 bg-blue-600 text-white hover:bg-blue-700'}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isSaveFilterOpen} onOpenChange={setIsSaveFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>Save the current filter settings for future use.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Filter Name</label>
              <Input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveFilterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter}>Save Filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Test Cases</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all test cases? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Test Cases</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTestCases.size} selected test case{selectedTestCases.size !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onRemoveSelectedTestCases()
                setIsBulkDeleteDialogOpen(false)
              }}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  Delete {selectedTestCases.size} Test Case{selectedTestCases.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paste Dialog */}
      <Dialog open={isPasteDialogOpen || false} onOpenChange={setIsPasteDialogOpen || (() => {})}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clipboard className="w-5 h-5" />
              <span>Paste Test Case Data</span>
            </DialogTitle>
            <DialogDescription>
              Paste your test case information below. The system will automatically parse and create a new test case.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pasted-text" className="text-sm font-medium">Paste your test case data here:</Label>
              <div className="flex items-center space-x-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const exampleText = `Login Test Case
Test user login functionality with valid credentials

Steps to Reproduce:
1. Navigate to login page
2. Enter valid username and password
3. Click login button

Expected Result:
User should be logged in successfully

Priority: High
Status: Pending`
                    setPastedText(exampleText)
                  }}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Try Example
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => enhanceWithAI(pastedText)}
                  disabled={isAIProcessing || !pastedText.trim()}
                  className="h-8 px-3 text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-purple-100"
                >
                  {isAIProcessing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Enhance with AI
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="pasted-text"
                placeholder="Paste your test case information here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="h-32 resize-none"
              />
            </div>
            
            {/* Helper Text with Format Example */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-900">📋 Expected Format:</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const formatExample = `Login Test Case
Test user login functionality with valid credentials

Steps to Reproduce:
1. Navigate to login page
2. Enter valid username and password
3. Click login button

Expected Result:
User should be logged in successfully

Priority: High
Status: Pending`
                    navigator.clipboard.writeText(formatExample)
                    toast({
                      title: "Format copied!",
                      description: "Test case format example copied to clipboard.",
                    })
                  }}
                  className="h-8 px-3 text-xs"
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  Copy Format
                </Button>
              </div>
              <div className="text-sm text-blue-700 space-y-2">
                <p className="font-medium">The first line should be the test case title, followed by description and other details:</p>
                <div className="bg-white p-3 rounded border text-xs font-mono text-slate-700">
                  <div>Test Case Title</div>
                  <div>Description of the test case</div>
                  <div className="mt-2">Steps to Reproduce:</div>
                  <div>1. First step</div>
                  <div>2. Second step</div>
                  <div>3. Third step</div>
                  <div className="mt-2">Expected Result:</div>
                  <div>What should happen</div>
                  <div className="mt-2">Priority: High/Medium/Low</div>
                  <div>Status: Pass/Fail/Pending/In Progress/Blocked</div>
                </div>
              </div>
            </div>
            
            {parsedTestCase && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                <h4 className="font-medium text-slate-900">Parsed Test Case:</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {parsedTestCase.testCase}</div>
                  <div><strong>Description:</strong> {parsedTestCase.description}</div>
                  <div><strong>Status:</strong> {parsedTestCase.status}</div>
                  <div><strong>Priority:</strong> {parsedTestCase.priority}</div>
                  {parsedTestCase.stepsToReproduce && (
                    <div><strong>Steps:</strong> {parsedTestCase.stepsToReproduce}</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPastedText('')
              setParsedTestCase(null)
              if (setIsPasteDialogOpen) {
                setIsPasteDialogOpen(false)
              }
            }}>
              Cancel
            </Button>
            <Button onClick={handlePasteSubmit} disabled={!pastedText.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Test Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status History Dialog */}
      <StatusHistoryDialog
        isOpen={isStatusHistoryOpen}
        onClose={handleCloseStatusHistory}
        testCaseId={selectedTestCaseForHistory?.id || ''}
        testCaseName={selectedTestCaseForHistory?.testCase || ''}
      />

      {/* Floating Bulk Delete Button */}
      {selectedTestCases.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
              className="rounded-full h-16 w-16 p-0 bg-red-600 hover:bg-red-700 border-4 border-white shadow-2xl"
            >
              <div className="flex flex-col items-center">
                <Trash2 className="w-6 h-6" />
                <span className="text-sm font-bold">{selectedTestCases.size}</span>
              </div>
            </Button>
          </div>
          <div className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
            {selectedTestCases.size}
          </div>
        </div>
      )}
      </div>
    </div>
  )
} 