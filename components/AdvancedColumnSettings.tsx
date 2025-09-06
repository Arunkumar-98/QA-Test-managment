"use client"

import React, { useState, useEffect } from 'react'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Grid3X3
} from 'lucide-react'
import { CustomColumn, CustomColumnType } from '@/types/qa-types'
import { useToast } from '@/hooks/use-toast'

interface AdvancedColumnSettingsProps {
  isOpen: boolean
  onClose: () => void
  tableColumns: {
    [key: string]: { visible: boolean; width: string; minWidth: string }
  }
  customColumns: CustomColumn[]
  onUpdateTableColumns: (columns: any) => void
  onAddCustomColumn: (column: Omit<CustomColumn, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onUpdateCustomColumn: (id: string, updates: Partial<CustomColumn>) => Promise<void>
  onDeleteCustomColumn: (id: string) => Promise<void>
  currentProjectId: string
}

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
    id: 'status',
    name: 'status',
    label: 'Status',
    type: 'select',
    description: 'Current execution status',
    icon: BarChart3,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'priority',
    name: 'priority',
    label: 'Priority',
    type: 'select',
    description: 'Test case priority level',
    icon: Star,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'category',
    name: 'category',
    label: 'Category',
    type: 'select',
    description: 'Test case category or type',
    icon: Grid3X3,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'platform',
    name: 'platform',
    label: 'Platform',
    type: 'select',
    description: 'Target platform for testing',
    icon: Database,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'assignedTester',
    name: 'assignedTester',
    label: 'Assigned Tester',
    type: 'text',
    description: 'Person responsible for execution',
    icon: User,
    category: 'management',
    isGlobal: true
  },
  {
    id: 'executionDate',
    name: 'executionDate',
    label: 'Execution Date',
    type: 'date',
    description: 'When the test was executed',
    icon: Calendar,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'environment',
    name: 'environment',
    label: 'Environment',
    type: 'select',
    description: 'Testing environment',
    icon: Globe,
    category: 'testing',
    isGlobal: true
  },
  {
    id: 'automation',
    name: 'automation',
    label: 'Automation',
    type: 'boolean',
    description: 'Whether test is automated',
    icon: ToggleLeft,
    category: 'automation',
    isGlobal: true
  }
]

export function AdvancedColumnSettings({
  isOpen,
  onClose,
  tableColumns,
  customColumns,
  onUpdateTableColumns,
  onAddCustomColumn,
  onUpdateCustomColumn,
  onDeleteCustomColumn,
  currentProjectId
}: AdvancedColumnSettingsProps) {
  console.log('🔧 AdvancedColumnSettings rendered:', { 
    isOpen, 
    tableColumnsKeys: Object.keys(tableColumns), 
    customColumnsCount: customColumns.length,
    currentProjectId 
  })
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('columns')
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<CustomColumn | null>(null)
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [columnSettings, setColumnSettings] = useState<any>({})

  // Initialize column order and settings
  useEffect(() => {
    if (isOpen) {
      const allColumns = [
        ...Object.keys(tableColumns),
        ...customColumns.map(col => col.name)
      ]
      setColumnOrder(allColumns)
      
      // Initialize settings for each column
      const settings: any = {}
      Object.entries(tableColumns).forEach(([key, col]) => {
        settings[key] = {
          visible: col.visible,
          width: col.width,
          minWidth: col.minWidth,
          type: COLUMN_TEMPLATES.find(t => t.name === key)?.type || 'text',
          isGlobal: COLUMN_TEMPLATES.find(t => t.name === key)?.isGlobal || false
        }
      })
      customColumns.forEach(col => {
        settings[col.name] = {
          visible: col.visible,
          width: col.width,
          minWidth: col.minWidth,
          type: col.type,
          isGlobal: false
        }
      })
      setColumnSettings(settings)
    }
  }, [isOpen, tableColumns, customColumns])

  const handleSaveSettings = () => {
    // Update table columns with new settings
    const updatedTableColumns: any = {}
    Object.entries(columnSettings).forEach(([key, settings]: [string, any]) => {
      if (settings.isGlobal) {
        updatedTableColumns[key] = {
          visible: settings.visible,
          width: settings.width,
          minWidth: settings.minWidth
        }
      }
    })
    
    onUpdateTableColumns(updatedTableColumns)
    
    // Update custom columns
    Object.entries(columnSettings).forEach(([key, settings]: [string, any]) => {
      if (!settings.isGlobal) {
        const customColumn = customColumns.find(col => col.name === key)
        if (customColumn) {
          onUpdateCustomColumn(customColumn.id, {
            visible: settings.visible,
            width: settings.width,
            minWidth: settings.minWidth
          })
        }
      }
    })
    
    toast({
      title: "Settings Saved",
      description: "Column settings have been updated successfully.",
    })
  }

  const handleResetToDefaults = () => {
    // Reset all columns to default settings
    const defaultSettings: any = {}
    COLUMN_TEMPLATES.forEach(template => {
      defaultSettings[template.name] = {
        visible: true,
        width: 'w-32',
        minWidth: 'min-w-[120px]',
        type: template.type,
        isGlobal: template.isGlobal
      }
    })
    setColumnSettings(defaultSettings)
    
    toast({
      title: "Reset to Defaults",
      description: "All columns have been reset to their default settings.",
    })
  }

  const handleExportSettings = () => {
    const settings = {
      tableColumns: columnSettings,
      columnOrder,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `column-settings-${currentProjectId}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Settings Exported",
      description: "Column settings have been exported successfully.",
    })
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string)
        setColumnSettings(settings.tableColumns)
        setColumnOrder(settings.columnOrder)
        
        toast({
          title: "Settings Imported",
          description: "Column settings have been imported successfully.",
        })
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid settings file format.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
  }

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder]
    const [movedColumn] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, movedColumn)
    setColumnOrder(newOrder)
  }

  const getColumnTemplate = (columnName: string) => {
    return COLUMN_TEMPLATES.find(t => t.name === columnName)
  }

  // Sortable column card component
  const SortableColumnCard = React.memo(({ 
    columnName, 
    settings, 
    template, 
    customColumn, 
    index 
  }: { 
    columnName: string
    settings: any
    template: ColumnTemplate | undefined
    customColumn: CustomColumn | undefined
    index: number
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: columnName })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 2 : 1,
      position: 'relative' as const,
      opacity: isDragging ? 0.5 : 1
    }

    return (
      <Card 
        ref={setNodeRef} 
        style={style}
        className="relative border border-slate-200 hover:border-slate-300 transition-colors"
      >
        <div 
          {...attributes} 
          {...listeners}
          className="absolute left-0 inset-y-0 w-8 flex items-center justify-center cursor-move bg-slate-50 border-r border-slate-200 rounded-l-lg"
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        
        <div className="pl-8 pr-4 py-3">
          <div className="flex items-start gap-3 max-w-full">
            <div className="pt-1 shrink-0">
              <Checkbox
                checked={settings.visible}
                onCheckedChange={(checked) => {
                  setColumnSettings(prev => ({
                    ...prev,
                    [columnName]: { ...prev[columnName], visible: checked as boolean }
                  }))
                }}
              />
            </div>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="font-medium text-sm truncate">
                  {template?.label || customColumn?.label || columnName}
                </Label>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0">
                  {settings.type}
                </Badge>
                {settings.isGlobal ? (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                    <Globe className="w-3 h-3 mr-1" />
                    Global
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200 shrink-0">
                    <User className="w-3 h-3 mr-1" />
                    Custom
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                {template?.description || customColumn?.description || 'Custom column'}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <Select
                  value={settings.width}
                  onValueChange={(value) => {
                    setColumnSettings(prev => ({
                      ...prev,
                      [columnName]: { ...prev[columnName], width: value }
                    }))
                  }}
                >
                  <SelectTrigger className="h-7 text-xs w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="w-20">Narrow</SelectItem>
                    <SelectItem value="w-32">Medium</SelectItem>
                    <SelectItem value="w-40">Wide</SelectItem>
                    <SelectItem value="w-56">Extra Wide</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveColumn(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveColumn(index, Math.min(columnOrder.length - 1, index + 1))}
                    disabled={index === columnOrder.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-1 pt-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditingColumn(customColumn || null)
                  setIsAddColumnOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              {!settings.isGlobal && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (customColumn) {
                      onDeleteCustomColumn(customColumn.id)
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  })

  // Setup drag and drop sensors
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

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = columnOrder.indexOf(active.id as string)
    const newIndex = columnOrder.indexOf(over.id as string)
    
    const newOrder = arrayMove(columnOrder, oldIndex, newIndex)
    setColumnOrder(newOrder)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="px-8 py-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-slate-900">
                Advanced Column Settings
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                Configure table columns, custom fields, and data management options
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="w-full border-b px-6 pt-2 shrink-0 bg-white">
              <div className="flex gap-4">
                <TabsTrigger value="columns" className="flex items-center gap-2 pb-3 text-sm font-medium relative data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <FileText className="w-4 h-4" />
                  Columns
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2 pb-3 text-sm font-medium relative data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Grid3X3 className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2 pb-3 text-sm font-medium relative data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Palette className="w-4 h-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2 pb-3 text-sm font-medium relative data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Settings className="w-4 h-4" />
                  Advanced
                </TabsTrigger>
              </div>
            </TabsList>

            <div className="flex-1 overflow-hidden relative">
              <TabsContent value="columns" className="absolute inset-0 overflow-y-auto">
                <div className="px-6 py-4 min-w-[800px]">
                  <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <List className="w-5 h-5 text-slate-500" />
                      Column Management
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddColumnOpen(true)}
                        className="h-8"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Column
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetToDefaults}
                        className="h-8"
                      >
                        <RotateCcw className="w-4 h-4 mr-1.5" />
                        Reset
                      </Button>
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
                    <div className="space-y-2">
                      {columnOrder.map((columnName, index) => {
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
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="mt-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Grid3X3 className="w-5 h-5 text-slate-500" />
                    Column Templates
                  </h3>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="h-8 text-xs w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COLUMN_TEMPLATES.map((template) => (
                    <Card key={template.id} className="group relative overflow-hidden border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="absolute top-3 right-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-5 capitalize",
                            template.category === 'core' && "bg-blue-50 text-blue-700 border-blue-200",
                            template.category === 'testing' && "bg-green-50 text-green-700 border-green-200",
                            template.category === 'management' && "bg-purple-50 text-purple-700 border-purple-200",
                            template.category === 'automation' && "bg-orange-50 text-orange-700 border-orange-200"
                          )}
                        >
                          {template.category}
                        </Badge>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            template.category === 'core' && "bg-blue-100 text-blue-600",
                            template.category === 'testing' && "bg-green-100 text-green-600",
                            template.category === 'management' && "bg-purple-100 text-purple-600",
                            template.category === 'automation' && "bg-orange-100 text-orange-600"
                          )}>
                            <template.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{template.label}</h4>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{template.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                            {template.type}
                          </Badge>
                          {template.isGlobal && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                              <Globe className="w-3 h-3 mr-1" />
                              Global
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="h-9 px-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="mt-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="w-5 h-5 text-slate-500" />
                    Table Appearance
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Layout & Density</CardTitle>
                      <CardDescription>
                        Adjust the spacing and layout of your table.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Row Height</Label>
                        <Select defaultValue="default">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compact (32px)</SelectItem>
                            <SelectItem value="default">Default (40px)</SelectItem>
                            <SelectItem value="comfortable">Comfortable (48px)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          Adjust the height of table rows to show more or less content.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Cell Padding</Label>
                        <Select defaultValue="default">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compact (8px)</SelectItem>
                            <SelectItem value="default">Default (12px)</SelectItem>
                            <SelectItem value="spacious">Spacious (16px)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          Control the padding inside table cells.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Line Height</Label>
                        <Select defaultValue="default">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tight">Tight (1.2)</SelectItem>
                            <SelectItem value="default">Default (1.5)</SelectItem>
                            <SelectItem value="relaxed">Relaxed (1.8)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          Set the line height for text in table cells.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Visual Style</CardTitle>
                      <CardDescription>
                        Customize the visual appearance of your table.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Border Style</Label>
                        <Select defaultValue="default">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Borders</SelectItem>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="horizontal">Horizontal Only</SelectItem>
                            <SelectItem value="all">All Borders</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          Choose how table borders are displayed.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Row Hover Effect</Label>
                        <Select defaultValue="default">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="highlight">Highlight</SelectItem>
                            <SelectItem value="subtle">Subtle</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          Set the hover effect for table rows.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Alternating Rows</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox id="striped" />
                          <Label htmlFor="striped" className="text-sm font-normal">
                            Enable striped rows
                          </Label>
                        </div>
                        <p className="text-xs text-slate-500">
                          Add alternating background colors to rows.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Import/Export</CardTitle>
                      <CardDescription>
                        Backup and restore your column settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button onClick={handleExportSettings} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Export Settings
                      </Button>
                      
                      <div>
                        <Label htmlFor="import-settings">Import Settings</Label>
                        <Input
                          id="import-settings"
                          type="file"
                          accept=".json"
                          onChange={handleImportSettings}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Options</CardTitle>
                      <CardDescription>
                        Configure advanced table behavior.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Auto-save changes</Label>
                        <Checkbox defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Show column tooltips</Label>
                        <Checkbox defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Enable drag & drop</Label>
                        <Checkbox defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t mt-auto shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="h-9">
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} className="h-9">
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
} 