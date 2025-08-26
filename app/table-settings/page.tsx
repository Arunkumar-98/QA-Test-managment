"use client"

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  ArrowUp, 
  ArrowDown,
  GripVertical,
  Save,
  RotateCcw,
  Download,
  Upload,
  Palette,
  Type,
  Ruler,
  Lock,
  Unlock,
  Star,
  StarOff,
  Users,
  User,
  Globe,
  Database,
  FileText,
  BarChart3,
  Calendar,
  Hash,
  ToggleLeft,
  List,
  Grid3X3,
  ArrowLeft,
  Check
} from 'lucide-react'
import { CustomColumn, CustomColumnType } from '@/types/qa-types'
import { customColumnService } from '@/lib/supabase-service'
import { CustomColumnDialog } from '@/components/CustomColumnDialog'
import { toast } from '@/hooks/use-toast'

interface ColumnTemplate {
  id: string
  name: string
  label: string
  type: CustomColumnType
  description: string
  icon: React.ComponentType<any>
  category: 'core' | 'testing' | 'management' | 'automation' | 'custom'
  isGlobal: boolean
}

const COLUMN_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'testCase',
    name: 'testCase',
    label: 'Test Case',
    type: 'text',
    description: 'The main test case title or identifier',
    icon: FileText,
    category: 'core',
    isGlobal: true
  },
  {
    id: 'description',
    name: 'description',
    label: 'Description',
    type: 'text',
    description: 'Detailed description of the test case',
    icon: FileText,
    category: 'core',
    isGlobal: true
  },
  {
    id: 'expectedResult',
    name: 'expectedResult',
    label: 'Expected Result',
    type: 'text',
    description: 'Expected outcome of the test case',
    icon: Check,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'status',
    name: 'status',
    label: 'Status',
    type: 'select',
    description: 'Current status of the test case',
    icon: BarChart3,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'priority',
    name: 'priority',
    label: 'Priority',
    type: 'select',
    description: 'Priority level of the test case',
    icon: Star,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'category',
    name: 'category',
    label: 'Category',
    type: 'select',
    description: 'Category or module of the test case',
    icon: Hash,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'assignedTester',
    name: 'assignedTester',
    label: 'Assigned Tester',
    type: 'text',
    description: 'Tester assigned to this test case',
    icon: User,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'executionDate',
    name: 'executionDate',
    label: 'Execution Date',
    type: 'date',
    description: 'Date when the test case was executed',
    icon: Calendar,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'notes',
    name: 'notes',
    label: 'Notes',
    type: 'text',
    description: 'Additional notes or comments',
    icon: FileText,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'actualResult',
    name: 'actualResult',
    label: 'Actual Result',
    type: 'text',
    description: 'Actual result when test was executed',
    icon: Check,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'environment',
    name: 'environment',
    label: 'Environment',
    type: 'select',
    description: 'Test environment (Dev, QA, Prod)',
    icon: Database,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'prerequisites',
    name: 'prerequisites',
    label: 'Prerequisites',
    type: 'text',
    description: 'Prerequisites for running the test',
    icon: List,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'platform',
    name: 'platform',
    label: 'Platform',
    type: 'select',
    description: 'Target platform (iOS, Android, Web)',
    icon: Globe,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'stepsToReproduce',
    name: 'stepsToReproduce',
    label: 'Steps to Reproduce',
    type: 'text',
    description: 'Step-by-step instructions to reproduce the test',
    icon: List,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'suite',
    name: 'suite',
    label: 'Test Suite',
    type: 'select',
    description: 'Test suite this case belongs to',
    icon: FileText,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'position',
    name: 'position',
    label: 'Position',
    type: 'number',
    description: 'Order position in the test case list',
    icon: Hash,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'createdAt',
    name: 'createdAt',
    label: 'Created At',
    type: 'date',
    description: 'Date when the test case was created',
    icon: Calendar,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'updatedAt',
    name: 'updatedAt',
    label: 'Updated At',
    type: 'date',
    description: 'Date when the test case was last updated',
    icon: Calendar,
    category: 'management',
    isGlobal: true
  },
  // New core columns
  {
    id: 'qaStatus',
    name: 'qaStatus',
    label: 'QA Status',
    type: 'select',
    description: 'Current QA status of the test case',
    icon: BarChart3,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'devStatus',
    name: 'devStatus',
    label: 'Dev Status',
    type: 'select',
    description: 'Current development status',
    icon: BarChart3,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'assignedDev',
    name: 'assignedDev',
    label: 'Assigned Developer',
    type: 'text',
    description: 'Developer assigned to this test case',
    icon: User,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'bugStatus',
    name: 'bugStatus',
    label: 'Bug Status',
    type: 'select',
    description: 'Status of any associated bug',
    icon: BarChart3,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'testType',
    name: 'testType',
    label: 'Test Type',
    type: 'select',
    description: 'Type of testing (Manual, Automated, etc.)',
    icon: ToggleLeft,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'testLevel',
    name: 'testLevel',
    label: 'Test Level',
    type: 'select',
    description: 'Level of testing (Unit, Integration, System, etc.)',
    icon: Hash,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'defectSeverity',
    name: 'defectSeverity',
    label: 'Defect Severity',
    type: 'select',
    description: 'Severity level of any defects found',
    icon: Star,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'defectPriority',
    name: 'defectPriority',
    label: 'Defect Priority',
    type: 'select',
    description: 'Priority level of any defects found',
    icon: Star,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'estimatedTime',
    name: 'estimatedTime',
    label: 'Estimated Time',
    type: 'number',
    description: 'Estimated time to complete the test (minutes)',
    icon: Calendar,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'actualTime',
    name: 'actualTime',
    label: 'Actual Time',
    type: 'number',
    description: 'Actual time taken to complete the test (minutes)',
    icon: Calendar,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'testData',
    name: 'testData',
    label: 'Test Data',
    type: 'text',
    description: 'Test data requirements or setup',
    icon: Database,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'attachments',
    name: 'attachments',
    label: 'Attachments',
    type: 'text',
    description: 'Files or documents attached to the test case',
    icon: FileText,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'tags',
    name: 'tags',
    label: 'Tags',
    type: 'text',
    description: 'Tags for categorizing and filtering test cases',
    icon: Hash,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'reviewer',
    name: 'reviewer',
    label: 'Reviewer',
    type: 'text',
    description: 'Person responsible for reviewing the test case',
    icon: User,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'reviewDate',
    name: 'reviewDate',
    label: 'Review Date',
    type: 'date',
    description: 'Date when the test case was reviewed',
    icon: Calendar,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'reviewNotes',
    name: 'reviewNotes',
    label: 'Review Notes',
    type: 'text',
    description: 'Notes from the review process',
    icon: FileText,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'lastModifiedBy',
    name: 'lastModifiedBy',
    label: 'Last Modified By',
    type: 'text',
    description: 'Person who last modified the test case',
    icon: User,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'lastModifiedDate',
    name: 'lastModifiedDate',
    label: 'Last Modified Date',
    type: 'date',
    description: 'Date when the test case was last modified',
    icon: Calendar,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'automationScript',
    name: 'automationScript',
    label: 'Automation Script',
    type: 'text',
    description: 'Automation script details',
    icon: ToggleLeft,
    category: 'automation',
    isGlobal: true
  },
  {
    id: 'customFields',
    name: 'customFields',
    label: 'Custom Fields',
    type: 'text',
    description: 'Dynamic custom fields',
    icon: Database,
    category: 'custom',
    isGlobal: true
  }
]

// Default table columns configuration
const defaultTableColumns = {
  id: { visible: true, width: "w-16", minWidth: "min-w-[80px]" },
  testCase: { visible: true, width: "w-64", minWidth: "min-w-[250px]" },
  description: { visible: true, width: "w-80", minWidth: "min-w-[300px]" },
  expectedResult: { visible: false, width: "w-72", minWidth: "min-w-[250px]" },
  status: { visible: true, width: "w-32", minWidth: "min-w-[120px]" },
  category: { visible: false, width: "w-32", minWidth: "min-w-[120px]" },
  platform: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
  suite: { visible: false, width: "w-32", minWidth: "min-w-[120px]" },
  date: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
  actions: { visible: true, width: "w-32", minWidth: "min-w-[140px]" },
  automationActions: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
  stepsToReproduce: { visible: true, width: "w-80", minWidth: "min-w-[300px]" },
  priority: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
  environment: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
  prerequisites: { visible: false, width: "w-64", minWidth: "min-w-[250px]" },
  automation: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
}

interface SortableColumnCardProps {
  columnName: string
  settings: { visible: boolean; width: string; minWidth: string; label?: string }
  template?: ColumnTemplate
  customColumn?: CustomColumn
  index: number
  onToggleVisibility: (columnName: string) => void
  onUpdateWidth: (columnName: string, width: string) => void
  onEditColumn: (columnName: string) => void
  onDeleteColumn: (columnName: string) => void
  onUpdateLabel: (columnName: string, label: string) => void
}

function SortableColumnCard({
  columnName,
  settings,
  template,
  customColumn,
  index,
  onToggleVisibility,
  onUpdateWidth,
  onEditColumn,
  onDeleteColumn,
  onUpdateLabel
}: SortableColumnCardProps) {
  const sortable = useSortable ? useSortable({ id: columnName }) : null
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = sortable || {}

  const style = {
    transform: CSS && transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const isCustomColumn = !!customColumn
  const isDefaultColumn = !!template

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all",
        isDragging && "shadow-lg scale-105"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      {/* Column Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {template?.icon && <template.icon className="w-4 h-4 text-slate-500" />}
          {/* Inline label editing only if handler is passed (from page) */}
          {typeof (onUpdateLabel as any) === 'function' ? (
            <Input
              value={settings.label || template?.label || customColumn?.label || columnName}
              onChange={(e) => (onUpdateLabel as any)(columnName, e.target.value)}
              className="h-8 w-48"
            />
          ) : (
            <span className="font-medium text-sm truncate">
              {settings.label || template?.label || customColumn?.label || columnName}
            </span>
          )}
          {isCustomColumn && (
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          )}
          {template?.category && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                template.category === 'core' && "border-blue-200 text-blue-700",
                template.category === 'testing' && "border-green-200 text-green-700",
                template.category === 'management' && "border-purple-200 text-purple-700",
                template.category === 'automation' && "border-orange-200 text-orange-700",
                template.category === 'custom' && "border-gray-200 text-gray-700"
              )}
            >
              {template.category}
            </Badge>
          )}
        </div>
                                    <p className="text-xs text-slate-500 truncate">
                              {template?.description || 'Custom column'}
                            </p>
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={settings.visible}
          onCheckedChange={() => {
            console.log('🔧 Checkbox clicked for:', columnName, 'current state:', settings.visible)
            onToggleVisibility(columnName)
          }}
          className="data-[state=checked]:bg-primary"
        />
        <span className="text-xs text-slate-500 w-16">
          {settings.visible ? 'Visible' : 'Hidden'}
        </span>
      </div>

      {/* Width Selector */}
      <div className="flex items-center gap-2">
        <Label htmlFor={`width-${columnName}`} className="text-xs text-slate-500 w-12">
          Width
        </Label>
        <Select
          value={settings.width}
          onValueChange={(value) => {
            console.log('🔧 Width changed for:', columnName, 'to:', value)
            onUpdateWidth(columnName, value)
          }}
        >
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="w-16">Narrow</SelectItem>
            <SelectItem value="w-24">Small</SelectItem>
            <SelectItem value="w-32">Medium</SelectItem>
            <SelectItem value="w-48">Wide</SelectItem>
            <SelectItem value="w-64">Extra Wide</SelectItem>
            <SelectItem value="w-80">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('🔧 Edit button clicked for:', columnName)
            onEditColumn(columnName)
          }}
          className="h-8 w-8 p-0"
        >
          <Edit className="w-4 h-4" />
        </Button>
        {isCustomColumn && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteColumn(columnName)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function TableSettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawProjectId = searchParams.get('projectId')
  const projectId = rawProjectId || (typeof window !== 'undefined' ? localStorage.getItem('selectedProjectId') : null)


  const [activeTab, setActiveTab] = useState('columns')
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [columnSettings, setColumnSettings] = useState<{[key: string]: { visible: boolean; width: string; minWidth: string; label?: string }}>({})
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<CustomColumn | null>(null)
  const [templateCategory, setTemplateCategory] = useState<string>('all')
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [columnFilter, setColumnFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getColumnTemplate = (columnName: string): ColumnTemplate | undefined => {
    return COLUMN_TEMPLATES.find(template => template.name === columnName)
  }

  const CORE_KEYS = [
    'testCase', 'description', 'expectedResult', 'status', 'priority', 'category', 
    'assignedTester', 'executionDate', 'notes', 'actualResult', 'environment', 
    'prerequisites', 'platform', 'stepsToReproduce', 'suite', 'position', 
    'createdAt', 'updatedAt', 'automationScript', 'customFields',
    // New core columns
    'qaStatus', 'devStatus', 'assignedDev', 'bugStatus', 'testType', 'testLevel',
    'defectSeverity', 'defectPriority', 'estimatedTime', 'actualTime', 'testData',
    'attachments', 'tags', 'reviewer', 'reviewDate', 'reviewNotes', 'lastModifiedBy', 'lastModifiedDate'
  ]
  const defaultCoreSettings: {[key: string]: { visible: boolean; width: string; minWidth: string; label: string }} = {
    testCase: { visible: true, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Test Case' },
    description: { visible: true, width: 'w-80', minWidth: 'min-w-[300px]', label: 'Description' },
    expectedResult: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Expected Result' },
    status: { visible: true, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Status' },
    priority: { visible: false, width: 'w-24', minWidth: 'min-w-[100px]', label: 'Priority' },
    category: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Category' },
    assignedTester: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Assigned Tester' },
    executionDate: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Execution Date' },
    notes: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Notes' },
    actualResult: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Actual Result' },
    environment: { visible: false, width: 'w-24', minWidth: 'min-w-[100px]', label: 'Environment' },
    prerequisites: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Prerequisites' },
    platform: { visible: false, width: 'w-24', minWidth: 'min-w-[100px]', label: 'Platform' },
    stepsToReproduce: { visible: true, width: 'w-80', minWidth: 'min-w-[300px]', label: 'Steps to Reproduce' },
    suite: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Test Suite' },
    position: { visible: false, width: 'w-16', minWidth: 'min-w-[80px]', label: 'Position' },
    createdAt: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Created At' },
    updatedAt: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Updated At' },
    automationScript: { visible: false, width: 'w-48', minWidth: 'min-w-[200px]', label: 'Automation Script' },
    customFields: { visible: false, width: 'w-48', minWidth: 'min-w-[200px]', label: 'Custom Fields' },
    // New core columns default settings
    qaStatus: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'QA Status' },
    devStatus: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Dev Status' },
    assignedDev: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Assigned Developer' },
    bugStatus: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Bug Status' },
    testType: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Test Type' },
    testLevel: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Test Level' },
    defectSeverity: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Defect Severity' },
    defectPriority: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Defect Priority' },
    estimatedTime: { visible: false, width: 'w-24', minWidth: 'min-w-[100px]', label: 'Estimated Time' },
    actualTime: { visible: false, width: 'w-24', minWidth: 'min-w-[100px]', label: 'Actual Time' },
    testData: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Test Data' },
    attachments: { visible: false, width: 'w-48', minWidth: 'min-w-[200px]', label: 'Attachments' },
    tags: { visible: false, width: 'w-48', minWidth: 'min-w-[200px]', label: 'Tags' },
    reviewer: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Reviewer' },
    reviewDate: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Review Date' },
    reviewNotes: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Review Notes' },
    lastModifiedBy: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Last Modified By' },
    lastModifiedDate: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Last Modified Date' },
  }

  useEffect(() => {
    const load = async () => {
      if (!projectId) {
        setCustomColumns([])
        setColumnOrder([])
        setColumnSettings({})
        return
      }
      try {
        const cols = await customColumnService.getAll(projectId)
        setCustomColumns(cols)

        const settings: {[key: string]: { visible: boolean; width: string; minWidth: string; label?: string }} = {}

        // Load core settings from localStorage
        const coreRaw = typeof window !== 'undefined' ? localStorage.getItem(`qa.coreColumns:${projectId}`) : null
        const coreSettings = coreRaw ? JSON.parse(coreRaw) : defaultCoreSettings
        
        // Merge existing settings with default settings to ensure all new columns are included
        const mergedCoreSettings = { ...defaultCoreSettings, ...coreSettings }
        
        // Ensure all CORE_KEYS are included with proper defaults
        CORE_KEYS.forEach(k => {
          const s = mergedCoreSettings[k] || defaultCoreSettings[k]
          if (s) {
            settings[k] = { visible: s.visible, width: s.width, minWidth: s.minWidth, label: s.label }
          } else {
            // Fallback for any missing core columns
            const template = COLUMN_TEMPLATES.find(t => t.name === k)
            settings[k] = { 
              visible: false, 
              width: 'w-32', 
              minWidth: 'min-w-[120px]', 
              label: template?.label || k 
            }
          }
        })
        
        // Save the updated core settings back to localStorage to include new columns
        if (typeof window !== 'undefined') {
          localStorage.setItem(`qa.coreColumns:${projectId}`, JSON.stringify(mergedCoreSettings))
        }
        
        // Include custom columns
        cols.forEach(c => {
          settings[c.name] = { visible: c.visible, width: c.width, minWidth: c.minWidth, label: c.label }
        })
        setColumnSettings(settings)

        // Load order and ensure all columns are included
        const orderRaw = typeof window !== 'undefined' ? localStorage.getItem(`qa.columnOrder:${projectId}`) : null
        let order: string[] = []
        
        if (orderRaw) {
          order = JSON.parse(orderRaw) as string[]
        }
        
        // Ensure all CORE_KEYS and custom columns are in the order
        const allColumns = [...CORE_KEYS, ...cols.map(c => c.name)]
        for (const k of allColumns) {
          if (!order.includes(k)) {
            order.push(k)
          }
        }
        
        // Filter to only include columns that have settings
        const validOrder = order.filter(n => settings[n])
        setColumnOrder(validOrder)
        
        // Save updated order to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`qa.columnOrder:${projectId}`, JSON.stringify(validOrder))
        }
        
      } catch (e) {
        console.error('Failed to load custom columns:', e)
        setCustomColumns([])
        setColumnOrder([])
        setColumnSettings({})
      }
    }
    load()
  }, [projectId])

  const handleToggleVisibility = (columnName: string) => {
    setColumnSettings(prev => {
      const newSettings = {
        ...prev,
        [columnName]: {
          ...prev[columnName],
          visible: !prev[columnName]?.visible
        }
      }
      return newSettings
    })
  }

  const handleUpdateWidth = (columnName: string, width: string) => {
    setColumnSettings(prev => {
      const newSettings = {
        ...prev,
        [columnName]: {
          ...prev[columnName],
          width
        }
      }
      return newSettings
    })
  }

  const handleEditColumn = (columnName: string) => {
    const col = customColumns.find(c => c.name === columnName) || null
    setEditingColumn(col)
    if (col) {
      toast({ title: 'Edit Column', description: `Editing ${col.label}.` })
    }
  }

  const handleUpdateLabel = (columnName: string, label: string) => {
    setColumnSettings(prev => ({
      ...prev,
      [columnName]: { ...prev[columnName], label }
    }))
  }

  const handleDeleteColumn = async (columnName: string) => {
    const target = customColumns.find(c => c.name === columnName)
    if (!target) {
      // Core column: treat delete as hide
      setColumnSettings(prev => ({
        ...prev,
        [columnName]: { ...prev[columnName], visible: false }
      }))
      toast({ title: 'Column hidden', description: `${columnName} has been hidden.` })
      return
    }
    try {
      await customColumnService.delete(target.id)
      const next = customColumns.filter(c => c.id !== target.id)
      setCustomColumns(next)
      const { [columnName]: _removed, ...rest } = columnSettings
      setColumnSettings(rest)
      setColumnOrder(prev => prev.filter(n => n !== columnName))
      toast({ title: 'Column deleted', description: `${columnName} has been removed.` })
    } catch (e) {
      console.error('Delete column failed:', e)
      toast({ title: 'Error', description: 'Failed to delete column', variant: 'destructive' })
    }
  }

  const handleSaveSettings = async () => {
    try {
      // Persist custom columns to DB (visible/width/minWidth and label if changed)
      await Promise.all(customColumns.map(col => {
        const s = columnSettings[col.name]
        if (!s) return Promise.resolve()
        const updates: any = {}
        if (s.visible !== col.visible) updates.visible = s.visible
        if (s.width !== col.width) updates.width = s.width
        if (s.minWidth !== col.minWidth) updates.minWidth = s.minWidth
        if (s.label && s.label !== col.label) updates.label = s.label
        if (Object.keys(updates).length > 0) {
          return customColumnService.update(col.id, updates)
        }
        return Promise.resolve()
      }))

      // Persist core columns to localStorage (visible/width/minWidth/label)
      const coreToSave: any = {}
      CORE_KEYS.forEach(k => {
        const s = columnSettings[k] || defaultCoreSettings[k]
        coreToSave[k] = { visible: s.visible, width: s.width, minWidth: s.minWidth, label: s.label || defaultCoreSettings[k].label }
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem(`qa.coreColumns:${projectId}`, JSON.stringify(coreToSave))
        localStorage.setItem(`qa.columnOrder:${projectId}`, JSON.stringify(columnOrder))
      }
      toast({ title: 'Settings saved', description: 'Column settings updated.' })
    } catch (e) {
      console.error('Persist settings failed:', e)
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    }
  }

  const handleShowAllColumns = () => {
    setShowAllColumns(true)
    // Add all missing columns to the order and settings
    const allColumns = [...CORE_KEYS, ...customColumns.map(c => c.name)]
    const missingColumns = allColumns.filter(col => !columnOrder.includes(col))
    
    if (missingColumns.length > 0) {
      setColumnOrder(prev => [...prev, ...missingColumns])
      
      // Add default settings for missing columns
      setColumnSettings(prev => {
        const newSettings = { ...prev }
        missingColumns.forEach(col => {
          if (!newSettings[col]) {
            const template = getColumnTemplate(col)
            const customCol = customColumns.find(c => c.name === col)
            const defaultSettings = defaultCoreSettings[col]
            newSettings[col] = {
              visible: false, // Start hidden
              width: defaultSettings?.width || 'w-32',
              minWidth: defaultSettings?.minWidth || 'min-w-[120px]',
              label: template?.label || customCol?.label || col
            }
          }
        })
        return newSettings
      })
      
      toast({ 
        title: 'All columns added', 
        description: `Added ${missingColumns.length} new columns to the table settings.` 
      })
    } else {
      toast({ 
        title: 'All columns already present', 
        description: 'All available columns are already in your table settings.' 
      })
    }
  }

  const handleToggleAllColumns = (makeVisible: boolean) => {
    setColumnSettings(prev => {
      const newSettings = { ...prev }
      Object.keys(newSettings).forEach(col => {
        newSettings[col] = { ...newSettings[col], visible: makeVisible }
      })
      return newSettings
    })
    
    toast({ 
      title: makeVisible ? 'All columns shown' : 'All columns hidden', 
      description: makeVisible ? 'All columns are now visible.' : 'All columns are now hidden.' 
    })
  }

  const handleResetToDefaults = async () => {
    try {
      console.log('🔧 Resetting columns: hide all and clear local view')
      await Promise.all(customColumns.map(col => {
        if (col.visible) return customColumnService.update(col.id, { visible: false })
        return Promise.resolve()
      }))
      setColumnSettings({})
      setColumnOrder([])
      toast({ title: 'Settings reset', description: 'All columns hidden. Add columns to start.' })
    } catch (e) {
      console.error('Reset failed:', e)
      toast({ title: 'Error', description: 'Failed to reset', variant: 'destructive' })
    }
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string)
      const newIndex = columnOrder.indexOf(over?.id as string)
      
      if (arrayMove) {
        const newOrder = arrayMove(columnOrder, oldIndex, newIndex)
        setColumnOrder(newOrder)
      }
    }
  }



  const filteredTemplates = templateCategory === 'all' 
    ? COLUMN_TEMPLATES 
    : COLUMN_TEMPLATES.filter(template => template.category === templateCategory)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Table Settings</h1>
                <p className="text-sm text-slate-500">
                  Customize your table columns, their types, visibility, and order
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              <Button
                onClick={handleSaveSettings}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="columns" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Columns
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="columns" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <List className="w-5 h-5" />
                      Column Management
                    </CardTitle>
                    <CardDescription>
                      Reorder, show/hide, and customize your table columns
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        // Clear localStorage for this project to force fresh load
                        if (typeof window !== 'undefined' && projectId) {
                          localStorage.removeItem(`qa.coreColumns:${projectId}`)
                          localStorage.removeItem(`qa.columnOrder:${projectId}`)
                        }
                        window.location.reload()
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Force Refresh Columns
                    </Button>
                    <Button
                      onClick={handleShowAllColumns}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Show All Columns
                    </Button>
                    <Button
                      onClick={() => setIsAddColumnOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Column
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Column Summary and Filter */}
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">
                        <strong>{columnOrder.length}</strong> total columns
                      </span>
                      <span className="text-slate-600">
                        <strong>{Object.values(columnSettings).filter(s => s.visible).length}</strong> visible
                      </span>
                      <span className="text-slate-600">
                        <strong>{Object.values(columnSettings).filter(s => !s.visible).length}</strong> hidden
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {CORE_KEYS.length} core columns • {customColumns.length} custom columns
                    </div>
                  </div>
                  
                  {/* Filter Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Label htmlFor="column-filter" className="text-sm font-medium">
                        Filter columns:
                      </Label>
                      <Select value={columnFilter} onValueChange={(value: 'all' | 'visible' | 'hidden') => setColumnFilter(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Columns</SelectItem>
                          <SelectItem value="visible">Visible Only</SelectItem>
                          <SelectItem value="hidden">Hidden Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAllColumns(true)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Show All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAllColumns(false)}
                        className="flex items-center gap-1"
                      >
                        <EyeOff className="w-3 h-3" />
                        Hide All
                      </Button>
                    </div>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={columnOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                       {columnOrder
                        .filter(columnName => {
                          const settings = columnSettings[columnName]
                          if (!settings) return false
                          
                          switch (columnFilter) {
                            case 'visible':
                              return settings.visible
                            case 'hidden':
                              return !settings.visible
                            default:
                              return true
                          }
                        })
                        .map((columnName, index) => {
                        const settings = columnSettings[columnName]
                        const template = getColumnTemplate(columnName)
                        const customColumn = customColumns.find(col => col.name === columnName)
                        
                        if (!settings) return null

                        return (
                           <SortableColumnCard
                            key={columnName}
                            columnName={columnName}
                            settings={settings}
                            template={template}
                            customColumn={customColumn}
                            index={index}
                            onToggleVisibility={handleToggleVisibility}
                            onUpdateWidth={handleUpdateWidth}
                            onEditColumn={handleEditColumn}
                            onDeleteColumn={handleDeleteColumn}
                            onUpdateLabel={handleUpdateLabel}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  Column Templates
                </CardTitle>
                <CardDescription>
                  Pre-built column templates to quickly add common fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Label htmlFor="category-filter" className="text-sm font-medium">
                    Filter by category:
                  </Label>
                  <Select value={templateCategory} onValueChange={setTemplateCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <template.icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm mb-1">{template.label}</h3>
                            <p className="text-xs text-slate-500 mb-2">{template.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  template.category === 'core' && "border-blue-200 text-blue-700",
                                  template.category === 'testing' && "border-green-200 text-green-700",
                                  template.category === 'management' && "border-purple-200 text-purple-700",
                                  template.category === 'automation' && "border-orange-200 text-orange-700",
                                  template.category === 'custom' && "border-gray-200 text-gray-700"
                                )}
                              >
                                {template.category}
                              </Badge>
                              {template.isGlobal && (
                                <Badge variant="secondary" className="text-xs">
                                  Global
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="w-5 h-5" />
                    Layout & Density
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="row-height">Row Height</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cell-padding">Cell Padding</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tight">Tight</SelectItem>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="loose">Loose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="line-height">Line Height</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tight">Tight</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="relaxed">Relaxed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Visual Style
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="border-style">Border Style</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="bordered">Bordered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="row-hover">Row Hover Effect</Label>
                    <Select defaultValue="subtle">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="subtle">Subtle</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="alternating-rows" />
                    <Label htmlFor="alternating-rows" className="text-sm">
                      Alternating row colors
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Advanced configuration options for power users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Import/Export</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Export Settings
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="w-4 h-4 mr-2" />
                        Import Settings
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Data Management</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Settings
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset All
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add / Edit Custom Column Dialog */}
      <CustomColumnDialog
        isOpen={isAddColumnOpen || !!editingColumn}
        onClose={() => { setIsAddColumnOpen(false); setEditingColumn(null) }}
        isEditMode={!!editingColumn}
        column={editingColumn ?? undefined}
        onSubmit={async (payload) => {
          try {
            if (!projectId) {
              toast({ title: 'No project selected', description: 'Select a project first.', variant: 'destructive' })
              return
            }
            if (editingColumn) {
              const updated = await customColumnService.update(editingColumn.id, payload)
              setCustomColumns(prev => prev.map(c => c.id === updated.id ? updated : c))
              setColumnSettings(prev => ({
                ...prev,
                [updated.name]: { visible: updated.visible, width: updated.width, minWidth: updated.minWidth }
              }))
              setColumnOrder(prev => {
                const exists = prev.includes(updated.name)
                return exists ? prev : [...prev, updated.name]
              })
              toast({ title: 'Column updated', description: `${updated.label} saved.` })
            } else {
              const created = await customColumnService.create({ ...payload, projectId })
              setCustomColumns(prev => [...prev, created])
              setColumnSettings(prev => ({
                ...prev,
                [created.name]: { visible: created.visible, width: created.width, minWidth: created.minWidth }
              }))
              setColumnOrder(prev => [...prev, created.name])
              toast({ title: 'Column added', description: `${created.label} created.` })
            }
          } catch (e: any) {
            console.error('Save column failed:', e)
            toast({ title: 'Error', description: e?.message || 'Failed to save column', variant: 'destructive' })
          } finally {
            setIsAddColumnOpen(false)
            setEditingColumn(null)
          }
        }}
      />
    </div>
  )
}

export default function TableSettingsPage() {
  return (
    <Suspense fallback={<div />}> 
      <TableSettingsContent />
    </Suspense>
  )
}