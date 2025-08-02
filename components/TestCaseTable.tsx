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
  RefreshCw
} from 'lucide-react'
import { TestCase, TestCaseStatus, TestCasePriority, TestCaseCategory } from '@/types/qa-types'
import { SavedFilter } from '@/hooks/useSearchAndFilter'
import { getStatusBadgeVariant, getStatusBadgeStyle, getPriorityBadgeVariant, getPriorityBadgeStyle, getAutomationStatusIcon, getAutomationStatusColor, getAutomationStatusText, getUnresolvedCommentsCount, formatTestSteps, getStatusIcon, getPriorityIcon, mapImportedDataToTestCase, validateImportedTestCase, parseCSV } from "@/lib/utils"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { StatusHistoryDialog } from './StatusHistoryDialog'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const STATUS_OPTIONS: TestCaseStatus[] = ['Pass', 'Fail', 'Pending', 'In Progress', 'Blocked']
const PRIORITY_OPTIONS: TestCasePriority[] = ['High', 'Medium', 'Low']
const CATEGORY_OPTIONS: TestCaseCategory[] = ['Functional', 'Non-Functional', 'Regression', 'Smoke', 'Integration', 'Unit']

// Sortable Drag Handle Component
interface SortableDragHandleProps {
  testCase: TestCase
  columnWidths: any
}

function SortableDragHandle({ testCase, columnWidths }: SortableDragHandleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: testCase.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableCell 
      ref={setNodeRef}
      style={{ ...style, width: `${columnWidths.dragHandle}px` }}
      className="p-4 border-r border-slate-200"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded transition-colors"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
    </TableCell>
  )
}

// Sortable Table Row Component
interface SortableTableRowProps {
  testCase: TestCase
  index: number
  isSelected: boolean
  onToggleSelection: () => void
  onViewTestCase: () => void
  onEditTestCase: () => void
  onOpenComments: () => void
  onOpenAutomation: () => void
  onOpenStatusHistory: () => void
  onRemoveTestCase: () => void
  onUpdateTestCaseStatus: (status: TestCaseStatus) => void
  tableColumns: any
  columnWidths: any
  getUnresolvedCommentsCount: (testCase: TestCase) => number
  isMobile: boolean
  isDragEnabled: boolean
}

function SortableTableRow({
  testCase,
  index,
  isSelected,
  onToggleSelection,
  onViewTestCase,
  onEditTestCase,
  onOpenComments,
  onOpenAutomation,
  onOpenStatusHistory,
  onRemoveTestCase,
  onUpdateTestCaseStatus,
  tableColumns,
  columnWidths,
  getUnresolvedCommentsCount,
  isMobile,
  isDragEnabled
}: SortableTableRowProps) {
  const unresolvedComments = getUnresolvedCommentsCount(testCase)

  return (
    <TableRow
      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
      onDoubleClick={onViewTestCase}
    >
      <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.checkbox}px` }}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      
      {isDragEnabled && (
        <SortableDragHandle testCase={testCase} columnWidths={columnWidths} />
      )}

      {tableColumns.id?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.id}px` }}>
          <span className="text-sm text-slate-500">#{index + 1}</span>
        </TableCell>
      )}

      {tableColumns.testCase?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.testCase}px` }}>
          <div className="font-medium text-slate-900">{testCase.testCase}</div>
        </TableCell>
      )}

      {tableColumns.description?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.description}px` }}>
          <div className="text-sm text-slate-600 line-clamp-2">{testCase.description}</div>
        </TableCell>
      )}

      {tableColumns.status?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.status}px` }}>
          <Select
            value={testCase.status}
            onValueChange={(value) => onUpdateTestCaseStatus(value as TestCaseStatus)}
          >
            <SelectTrigger className="w-full">
              <Badge variant={getStatusBadgeVariant(testCase.status)} className={getStatusBadgeStyle(testCase.status)}>
                {(() => {
                  const StatusIcon = getStatusIcon(testCase.status)
                  return (
                    <>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {testCase.status}
                    </>
                  )
                })()}
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
        </TableCell>
      )}

      {tableColumns.priority?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.priority}px` }}>
          <Select
            value={testCase.priority}
            onValueChange={(value) => onUpdateTestCaseStatus(value as TestCaseStatus)}
          >
            <SelectTrigger className="w-full">
              <Badge variant={getPriorityBadgeVariant(testCase.priority)} className={getPriorityBadgeStyle(testCase.priority)}>
                {(() => {
                  const PriorityIcon = getPriorityIcon(testCase.priority)
                  return (
                    <>
                      <PriorityIcon className="w-3 h-3 mr-1" />
                      {testCase.priority}
                    </>
                  )
                })()}
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
        </TableCell>
      )}

      {tableColumns.category?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.category}px` }}>
          <Badge variant="outline">{testCase.category || "Not set"}</Badge>
        </TableCell>
      )}

      {tableColumns.platform?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.platform}px` }}>
          <Badge variant="outline">{testCase.platform || "Not set"}</Badge>
        </TableCell>
      )}

      {tableColumns.suite?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.suite}px` }}>
          <Badge variant="outline">{testCase.suiteId || "No suite"}</Badge>
        </TableCell>
      )}

      {tableColumns.date?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.date}px` }}>
          <span className="text-sm text-slate-600">{testCase.executionDate || "Not set"}</span>
        </TableCell>
      )}

      {tableColumns.stepsToReproduce?.visible && (
        <TableCell className="p-4 border-r border-slate-200 align-top" style={{ width: `${columnWidths.stepsToReproduce}px` }}>
          <div className="break-words whitespace-pre-wrap leading-relaxed text-sm">{formatTestSteps(testCase.stepsToReproduce)}</div>
        </TableCell>
      )}

      {tableColumns.expectedResult?.visible && (
        <TableCell className="p-4 border-r border-slate-200 align-top" style={{ width: `${columnWidths.expectedResult}px` }}>
          <div className="break-words whitespace-pre-wrap leading-relaxed text-sm">{testCase.expectedResult}</div>
        </TableCell>
      )}

      {tableColumns.environment?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.environment}px` }}>
          <Badge variant="outline">{testCase.environment || "Not set"}</Badge>
        </TableCell>
      )}

      {tableColumns.prerequisites?.visible && (
        <TableCell className="p-4 border-r border-slate-200 align-top" style={{ width: `${columnWidths.prerequisites}px` }}>
          <div className="break-words whitespace-normal leading-relaxed text-sm">{testCase.prerequisites}</div>
        </TableCell>
      )}

      {tableColumns.automation?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.automation}px` }}>
          <Badge variant="outline" className="text-gray-500">
            Manual
          </Badge>
        </TableCell>
      )}

      {tableColumns.actions?.visible && (
        <TableCell className="p-4 border-r border-slate-200" style={{ width: `${columnWidths.actions}px` }}>
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewTestCase}
              title="View Details"
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditTestCase}
              title="Edit"
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenComments}
              title="Comments"
              className="relative h-8 w-8 p-0"
            >
              <MessageSquare className="w-4 h-4" />
              {unresolvedComments > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {unresolvedComments}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAutomation}
              title="Automation"
              className="h-8 w-8 p-0"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenStatusHistory}
              title="Status History"
              className="relative h-8 w-8 p-0"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveTestCase}
              title="Delete"
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}

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
  deleteLoading
}: TestCaseTableProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const { toast } = useToast()
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false)
  const [selectedTestCaseForHistory, setSelectedTestCaseForHistory] = useState<TestCase | null>(null)
  const [sortedTestCases, setSortedTestCases] = useState<TestCase[]>(testCases)
  const [isDragEnabled, setIsDragEnabled] = useState(false)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [isSaveFilterOpen, setIsSaveFilterOpen] = useState(false)
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [parsedTestCase, setParsedTestCase] = useState<Partial<TestCase> | null>(null)
  const [isAIProcessing, setIsAIProcessing] = useState(false)


  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update sorted test cases when testCases prop changes
  useEffect(() => {
    setSortedTestCases(testCases)
  }, [testCases])

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setSortedTestCases((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newOrder = arrayMove(items, oldIndex, newIndex)
        
        // TODO: Call database reorder function here
        // For now, just update the local state
        // testCaseService.reorderTestCase(active.id, newIndex + 1)
        
        return newOrder
      })

      toast({
        title: "Test Case Reordered",
        description: "The test case order has been updated.",
      })
    }
  }

  // Reset to original order
  const resetOrder = () => {
    setSortedTestCases(testCases)
    toast({
      title: "Order Reset",
      description: "Test cases have been reset to their original order.",
    })
  }

  const handlePasteData = () => {
    if (setIsPasteDialogOpen) {
      setIsPasteDialogOpen(true)
    }
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
  }, [pastedText])

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRowsPerPageChange = (newRowsPerPage: string) => {
    const newRows = parseInt(newRowsPerPage)
    setRowsPerPage(newRows)
    setCurrentPage(1)
  }

  // Calculate optimal column widths based on content
  const calculateColumnWidths = () => {
    // Get viewport width for responsive calculations
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const isLargeScreen = viewportWidth >= 1400
    const isMediumScreen = viewportWidth >= 1024
    
    const columnWidths: { [key: string]: number } = {
      checkbox: 50, // Fixed width for checkbox
      dragHandle: 50, // Fixed width for drag handle
      id: 60, // Fixed width for ID
      testCase: isLargeScreen ? 250 : isMediumScreen ? 200 : 180, // Responsive test case name
      description: isLargeScreen ? 300 : isMediumScreen ? 250 : 200, // Responsive description
      status: 100, // Fixed width for status badges
      priority: 100, // Fixed width for priority badges
      category: 120, // Fixed width for category
      platform: 100, // Fixed width for platform
      suite: 120, // Fixed width for suite
      date: 100, // Fixed width for date
      actions: 140, // Fixed width for action buttons
      automationActions: 120, // Fixed width for automation
      stepsToReproduce: isLargeScreen ? 350 : isMediumScreen ? 300 : 250, // Responsive steps
      environment: 100, // Fixed width for environment
      prerequisites: isLargeScreen ? 250 : isMediumScreen ? 200 : 180, // Responsive prerequisites
      automation: 100, // Fixed width for automation
      expectedResult: isLargeScreen ? 300 : isMediumScreen ? 250 : 200, // Responsive expected result
    }

    // Calculate dynamic widths based on content with better constraints
    sortedTestCases.forEach(testCase => {
      // Test Case name width with better text measurement
      const testCaseText = testCase.testCase || ''
      const testCaseWidth = Math.max(columnWidths.testCase, Math.min(testCaseText.length * 8, 400))
      columnWidths.testCase = Math.min(testCaseWidth, isLargeScreen ? 400 : isMediumScreen ? 350 : 300)

      // Description width with truncation consideration
      const descText = testCase.description || ''
      const descWidth = Math.max(columnWidths.description, Math.min(descText.length * 7, 500))
      columnWidths.description = Math.min(descWidth, isLargeScreen ? 500 : isMediumScreen ? 400 : 300)

      // Steps to Reproduce width
      const stepsText = testCase.stepsToReproduce || ''
      const stepsWidth = Math.max(columnWidths.stepsToReproduce, Math.min(stepsText.length * 6, 600))
      columnWidths.stepsToReproduce = Math.min(stepsWidth, isLargeScreen ? 600 : isMediumScreen ? 450 : 350)

      // Expected Result width
      const expectedText = testCase.expectedResult || ''
      const expectedWidth = Math.max(columnWidths.expectedResult, Math.min(expectedText.length * 7, 500))
      columnWidths.expectedResult = Math.min(expectedWidth, isLargeScreen ? 500 : isMediumScreen ? 400 : 300)

      // Prerequisites width
      const prereqText = testCase.prerequisites || ''
      const prereqWidth = Math.max(columnWidths.prerequisites, Math.min(prereqText.length * 6, 400))
      columnWidths.prerequisites = Math.min(prereqWidth, isLargeScreen ? 400 : isMediumScreen ? 300 : 250)
    })

    return columnWidths
  }

  const columnWidths = calculateColumnWidths()

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

  return (
    <div className="h-full flex flex-col pb-24">
      {/* Search and Filters - Modern Professional Design */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200/60 px-6 py-6">
        <div className="flex flex-col gap-6">
          {/* Main Search and Actions Row */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Enhanced Search Bar */}
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
            <Input
                className="pl-12 pr-12 h-12 bg-white/80 backdrop-blur-sm border-slate-200/60 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder:text-slate-500"
                placeholder="Search test cases by title, description, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
              <Button 
              variant="ghost"
              size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100/80 rounded-md transition-colors"
              onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                title="Advanced Search Options"
            >
                <Settings className="w-4 h-4 text-slate-500" />
            </Button>
            </div>
            
            {/* Modern Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Drag & Drop Toggle */}
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setIsDragEnabled(!isDragEnabled)}
                className={`flex items-center gap-2.5 h-12 px-4 backdrop-blur-sm border-slate-200/60 transition-all duration-200 ${
                  isDragEnabled 
                    ? 'bg-blue-50/80 border-blue-300/60 text-blue-700 hover:bg-blue-100/80' 
                    : 'bg-white/80 hover:border-blue-500/60 hover:bg-blue-50/50'
                }`}
              >
                <GripVertical className="w-4 h-4" />
                <span className="font-medium">Drag & Drop</span>
              </Button>
              
              {/* Reset Order Button */}
              <Button 
                variant="outline" 
                size="lg"
                onClick={resetOrder}
                className="flex items-center gap-2.5 h-12 px-4 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-orange-500/60 hover:bg-orange-50/50 transition-all duration-200"
                title="Reset test case order to original arrangement"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Reset Order</span>
              </Button>
              
              {/* Filters Toggle */}
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="flex items-center gap-2.5 h-12 px-4 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-blue-500/60 hover:bg-blue-50/50 transition-all duration-200"
              >
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Filters</span>
                {isFiltersExpanded ? 
                  <ChevronUp className="w-4 h-4 text-slate-600" /> : 
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                }
              </Button>
            </div>
          </div>
          
          {/* Expandable Filters - Modern Grid */}
          {isFiltersExpanded && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60 p-6 shadow-sm">
              {/* Filter Action Buttons */}
              <div className="flex items-center gap-3 mb-4">
                {/* Save Filter */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsSaveFilterOpen(true)}
                  className="h-8 px-3 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-blue-500/60 hover:bg-blue-50/50 transition-all duration-200"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  <span className="text-xs font-medium text-slate-700">Save Filter</span>
                </Button>
                
                {/* Load Filter */}
                <Select onValueChange={(value) => {
                  const filter = savedFilters.find(f => f.id === value)
                  if (filter) onLoadFilter(filter)
                }}>
                  <SelectTrigger className="h-8 px-3 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 w-32">
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                    <SelectValue placeholder="Load Filter" className="text-xs font-medium text-slate-700" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200/60">
                    {savedFilters.map((filter) => (
                      <SelectItem key={filter.id} value={filter.id} className="hover:bg-blue-50/50">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{filter.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteFilter(filter.id)
                            }}
                            className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Clear All */}
                <Button
                  variant="outline" 
                  size="sm" 
                  onClick={onClearAllFilters}
                  className="h-8 px-3 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-red-500/60 hover:bg-red-50/50 transition-all duration-200"
                >
                  <span className="text-xs font-medium text-slate-700">Clear All</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                         <Select value={statusFilter.join(',')} onValueChange={(value) => setStatusFilter(value ? value.split(',') as TestCaseStatus[] : [])}>
                    <SelectTrigger className="h-11 bg-white/80 border-slate-200/60 hover:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200">
                      <Filter className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue placeholder="Select status" />
              </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200/60">
                      {STATUS_OPTIONS.map((status) => {
                        const StatusIcon = getStatusIcon(status)
                        return (
                          <SelectItem key={status} value={status} className="hover:bg-blue-50/50">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="w-4 h-4" />
                              <span className="font-medium">{status}</span>
                            </div>
                  </SelectItem>
                        )
                      })}
              </SelectContent>
            </Select>
                </div>
            
                {/* Priority Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Priority</label>
                         <Select value={priorityFilter.join(',')} onValueChange={(value) => setPriorityFilter(value ? value.split(',') as TestCasePriority[] : [])}>
                    <SelectTrigger className="h-11 bg-white/80 border-slate-200/60 hover:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200">
                      <Filter className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue placeholder="Select priority" />
              </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200/60">
                      {PRIORITY_OPTIONS.map((priority) => {
                        const PriorityIcon = getPriorityIcon(priority)
                        return (
                          <SelectItem key={priority} value={priority} className="hover:bg-blue-50/50">
                            <div className="flex items-center gap-2">
                              <PriorityIcon className="w-4 h-4" />
                              <span className="font-medium">{priority}</span>
                            </div>
                  </SelectItem>
                        )
                      })}
              </SelectContent>
            </Select>
                </div>
                
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Category</label>
                  <Select value={categoryFilter.join(',')} onValueChange={(value) => setCategoryFilter(value ? value.split(',') as TestCaseCategory[] : [])}>
                    <SelectTrigger className="h-11 bg-white/80 border-slate-200/60 hover:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200">
                      <Filter className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue placeholder="Select category" />
              </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200/60">
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category} value={category} className="hover:bg-blue-50/50">
                          <span className="font-medium">{category}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
                </div>
                
                {/* Platform Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Platform</label>
                  <Select value={platformFilter.join(',')} onValueChange={(value) => setPlatformFilter(value ? value.split(',') : [])}>
                    <SelectTrigger className="h-11 bg-white/80 border-slate-200/60 hover:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200">
                      <Filter className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200/60">
                      <SelectItem value="Web" className="hover:bg-blue-50/50">
                        <span className="font-medium">Web</span>
                    </SelectItem>
                      <SelectItem value="Mobile" className="hover:bg-blue-50/50">
                        <span className="font-medium">Mobile</span>
                      </SelectItem>
                      <SelectItem value="Desktop" className="hover:bg-blue-50/50">
                        <span className="font-medium">Desktop</span>
                      </SelectItem>
                      <SelectItem value="API" className="hover:bg-blue-50/50">
                        <span className="font-medium">API</span>
                      </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col">
          {/* Viewport Info Bar - Hidden but code preserved */}
          {/* <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <span>📊 {paginatedTestCases.length} of {sortedTestCases.length} test cases</span>
                <span>📱 {typeof window !== 'undefined' ? `${window.innerWidth}px` : 'Desktop'} viewport</span>
                <span>📋 {Object.keys(tableColumns).filter(key => tableColumns[key]?.visible).length} columns visible</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {typeof window !== 'undefined' ?
                    (window.innerWidth >= 1400 ? 'Large' : window.innerWidth >= 1024 ? 'Medium' : 'Small') :
                    'Desktop'} View
                </span>
              </div>
            </div>
          </div> */}
          
          <div className="w-full px-4 py-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={paginatedTestCases.map(testCase => testCase.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="relative w-full overflow-auto border border-slate-200 rounded-lg shadow-sm" style={{ 
                  maxHeight: 'calc(100vh - 350px)',
                  minHeight: '500px'
                }}>
                  {/* Scroll Indicators */}
                  <div className="absolute top-2 right-2 z-10">
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded border">
                      <span>↔</span>
                      <span>Scroll</span>
                    </div>
                  </div>
                  <Table className="w-full border-collapse" style={{ 
                    tableLayout: 'fixed', 
                    minWidth: '100%',
                    width: 'max-content'
                  }}>
                <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 border-b-2 border-white/20 sticky top-0 z-20">
                          <TableHead className="p-2 lg:p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.checkbox}px` }}>
                      <Checkbox
                        checked={selectedTestCases.size === paginatedTestCases.length && paginatedTestCases.length > 0}
                        onCheckedChange={() => onToggleSelectAll(paginatedTestCases)}
                      />
                    </TableHead>
                          {isDragEnabled && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.dragHandle}px` }}>
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-white" />
                                <span className="text-xs">Drag</span>
                              </div>
                            </TableHead>
                          )}
                    {tableColumns.id?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.id}px` }}>#</TableHead>
                    )}
                    {tableColumns.testCase?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.testCase}px` }}>Test Case</TableHead>
                    )}
                    {tableColumns.description?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.description}px` }}>Description</TableHead>
                    )}
                    {tableColumns.status?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.status}px` }}>Status</TableHead>
                          )}
                          {tableColumns.priority?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.priority}px` }}>Priority</TableHead>
                    )}
                    {tableColumns.category?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.category}px` }}>Category</TableHead>
                    )}
                    {tableColumns.platform?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.platform}px` }}>Platform</TableHead>
                    )}
                    {tableColumns.suite?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.suite}px` }}>Suite</TableHead>
                    )}
                    {tableColumns.date?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.date}px` }}>Date</TableHead>
                    )}
                    {tableColumns.stepsToReproduce?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.stepsToReproduce}px` }}>Steps to Reproduce</TableHead>
                    )}
                          {tableColumns.expectedResult?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.expectedResult}px` }}>Expected Result</TableHead>
                    )}
                    {tableColumns.environment?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.environment}px` }}>Environment</TableHead>
                    )}
                    {tableColumns.prerequisites?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.prerequisites}px` }}>Prerequisites</TableHead>
                    )}
                    {tableColumns.automation?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.automation}px` }}>Automation</TableHead>
                    )}
                    {tableColumns.actions?.visible && (
                            <TableHead className="font-semibold text-white p-4 border-r border-white/20 bg-transparent" style={{ width: `${columnWidths.actions}px` }}>Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {/* Desktop Bulk Delete Button */}
                  {selectedTestCases.size > 0 && (
                    <TableRow className="bg-red-50 border-b border-red-200">
                      <TableCell 
                        colSpan={Object.keys(tableColumns).filter(key => tableColumns[key]?.visible).length + 1 + (isDragEnabled ? 1 : 0)} 
                        className="p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <Trash2 className="w-4 h-4 text-red-600" />
                          </div>
                            <div>
                              <span className="text-sm font-semibold text-red-900">
                                {selectedTestCases.size} test case{selectedTestCases.size !== 1 ? 's' : ''} selected
                              </span>
                              <p className="text-xs text-red-700">Click the button below to delete all selected test cases</p>
                          </div>
                        </div>
                          <div className="flex items-center gap-2">
                                <Button
                              variant="outline" 
                                  size="sm"
                              onClick={() => {
                                // Clear all selections by toggling select all if all are selected, or clearing all
                                if (selectedTestCases.size === testCases.length) {
                                  onToggleSelectAll()
                                } else {
                                  // Clear all selections by toggling each selected item
                                  selectedTestCases.forEach(id => {
                                    onToggleTestCaseSelection(id)
                                  })
                                }
                              }}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              Cancel
                                </Button>
                                <Button
                              variant="destructive" 
                                  size="sm"
                              onClick={() => setIsBulkDeleteDialogOpen(true)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete {selectedTestCases.size} Test Case{selectedTestCases.size !== 1 ? 's' : ''}
                                </>
                              )}
                              </Button>
                          </div>
                            </div>
                          </TableCell>
                    </TableRow>
                  )}
                  
                  {paginatedTestCases.length === 0 ? (
                    <TableRow>
                          <TableCell colSpan={Object.keys(tableColumns).filter(key => tableColumns[key]?.visible).length + 1 + (isDragEnabled ? 1 : 0)} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <FileText className="w-12 h-12 text-slate-300" />
                              <div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">No test cases found</h3>
                                <p className="text-slate-600 mb-4">Try adjusting your search or filter criteria.</p>
                            <Button onClick={onAddTestCase} className="bg-blue-600 hover:bg-blue-700">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Test Case
                            </Button>
                          </div>
                              </div>
                            </TableCell>
                        </TableRow>
                  ) : (
                        paginatedTestCases.map((testCase, idx) => (
                          <SortableTableRow
                            key={testCase.id}
                            testCase={testCase}
                            index={startIndex + idx}
                            isSelected={selectedTestCases.has(testCase.id)}
                            onToggleSelection={() => onToggleTestCaseSelection(testCase.id)}
                            onViewTestCase={() => onViewTestCase(testCase)}
                            onEditTestCase={() => onEditTestCase(testCase)}
                            onOpenComments={() => onOpenComments(testCase)}
                            onOpenAutomation={() => onOpenAutomation(testCase)}
                            onOpenStatusHistory={() => handleOpenStatusHistory(testCase)}
                            onRemoveTestCase={() => onRemoveTestCase(testCase.id)}
                            onUpdateTestCaseStatus={(status) => onUpdateTestCaseStatus(testCase.id, status)}
                            tableColumns={tableColumns}
                            columnWidths={columnWidths}
                            getUnresolvedCommentsCount={getUnresolvedCommentsCount}
                            isMobile={false}
                            isDragEnabled={isDragEnabled}
                          />
                        ))
                  )}
                </TableBody>
              </Table>
                </div>
              </SortableContext>
            </DndContext>
            </div>
          </div>
        </div>
        
        {/* Mobile View */}
        <div className="lg:hidden p-4 lg:pl-16 space-y-4">
          {selectedTestCases.size > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No test cases available</h3>
              <p className="text-slate-600 mb-4">Get started by adding your first test case.</p>
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
                className="bg-white border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-colors"
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
                    <h4 className="font-medium text-slate-900">{testCase.testCase}</h4>
                      <p className="text-sm text-slate-500">{testCase.category}</p>
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
                  <Badge variant={getStatusBadgeVariant(testCase.status)} className={getStatusBadgeStyle(testCase.status)}>
                    {testCase.status}
                  </Badge>
                    <Badge variant={getPriorityBadgeVariant(testCase.priority)} className={getPriorityBadgeStyle(testCase.priority)}>
                      {testCase.priority}
                    </Badge>
                </div>
                  {testCase.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">{testCase.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
      </div>

      {/* Visual Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-6"></div>

      {/* Pagination */}
      <div className="px-6 py-6 border-t border-slate-200 bg-gradient-to-r from-slate-50/50 to-blue-50/30 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Rows per page:</span>
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
            <span className="text-sm text-slate-600">
              Showing {startIndex + 1} to {Math.min(endIndex, testCases.length)} of {testCases.length} results
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2"
            >
              Previous
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
                    className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
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
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2"
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
  )
} 