"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { CustomColumn, CustomColumnType } from "@/types/qa-types"
import { Plus, X } from "lucide-react"

interface CustomColumnDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (column: Omit<CustomColumn, 'id' | 'createdAt' | 'updatedAt'>) => void
  column?: CustomColumn | null
  isEditMode?: boolean
  defaultColumn?: { key: string; column: any } | null
}

export function CustomColumnDialog({
  isOpen,
  onClose,
  onSubmit,
  column,
  isEditMode = false,
  defaultColumn
}: CustomColumnDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    type: "text" as CustomColumnType,
    visible: true,
    width: "w-32",
    minWidth: "min-w-[120px]",
    options: [] as string[],
    optionColors: {} as { [key: string]: string },
    defaultValue: "",
    required: false,
    color: "#3b82f6" // Default blue color
  })

  const [newOption, setNewOption] = useState("")

  useEffect(() => {
    if (defaultColumn) {
      // Handle default column editing
      const key = defaultColumn.key
      let label = key
      
      // Convert common column keys to proper labels
      const labelMap: { [key: string]: string } = {
        'testCase': 'Test Case',
        'description': 'Description',
        'status': 'Status',
        'priority': 'Priority',
        'assignedTo': 'Assigned To',
        'createdAt': 'Created At',
        'updatedAt': 'Updated At',
        'date': 'Date',
        'ios_status': 'iOS Status',
        'android_status': 'Android Status',
        'automation': 'Automation',
        'testSuite': 'Test Suite',
        'platform': 'Platform',
        'browser': 'Browser',
        'environment': 'Environment'
      }
      
      if (labelMap[key]) {
        label = labelMap[key]
      } else {
        // Fallback: convert camelCase to Title Case
        label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
      }
      
      // Determine the column type based on the key
      let columnType: CustomColumnType = "text"
      if (key === 'date' || key === 'createdAt' || key === 'updatedAt') {
        columnType = "date"
      } else if (key === 'status' || key === 'priority' || key === 'ios_status' || key === 'android_status') {
        columnType = "select"
      } else if (key === 'automation') {
        columnType = "boolean"
      }
      
      setFormData({
        name: key,
        label: label,
        type: columnType,
        visible: defaultColumn.column.visible,
        width: defaultColumn.column.width,
        minWidth: defaultColumn.column.minWidth,
        options: [],
        optionColors: defaultColumn.column.optionColors || {},
        defaultValue: "",
        required: false,
        color: defaultColumn.column.color || "#3b82f6"
      })
    } else if (column && isEditMode) {
      // Handle custom column editing
      setFormData({
        name: column.name,
        label: column.label,
        type: column.type,
        visible: column.visible,
        width: column.width,
        minWidth: column.minWidth,
        options: column.options || [],
        optionColors: column.optionColors || {},
        defaultValue: column.defaultValue?.toString() || "",
        required: column.required || false,
        color: column.color || "#3b82f6"
      })
    } else {
      // Handle new custom column creation
      setFormData({
        name: "",
        label: "",
        type: "text",
        visible: true,
        width: "w-32",
        minWidth: "min-w-[120px]",
        options: [],
        optionColors: {},
        defaultValue: "",
        required: false,
        color: "#3b82f6"
      })
    }
  }, [column, isEditMode, isOpen, defaultColumn])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim() || !formData.label.trim()) {
      console.error('❌ Form validation failed: name or label is empty')
      console.error('Form data:', formData)
      return
    }

    // Validate form data structure
    if (!formData.type || !formData.width || !formData.minWidth) {
      console.error('❌ Form validation failed: missing required fields')
      console.error('Form data:', formData)
      return
    }

    const columnData = {
      ...formData,
      defaultValue: formData.type === 'boolean' ? formData.defaultValue === 'true' : 
                   formData.type === 'number' ? Number(formData.defaultValue) || 0 : 
                   formData.defaultValue
      // Note: projectId will be set in the parent component for custom columns
    }

    onSubmit(columnData as Omit<CustomColumn, 'id' | 'createdAt' | 'updatedAt'>)
  }

  const addOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      const optionName = newOption.trim()
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, optionName],
        optionColors: {
          ...prev.optionColors,
          [optionName]: '#6b7280' // Default gray color for new options
        }
      }))
      setNewOption("")
    }
  }

  const removeOption = (index: number) => {
    const optionToRemove = formData.options[index]
    const newOptionColors = { ...formData.optionColors }
    delete newOptionColors[optionToRemove]
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      optionColors: newOptionColors
    }))
  }

  const getWidthOptions = () => [
    { value: "w-16", label: "Narrow (64px)" },
    { value: "w-24", label: "Small (96px)" },
    { value: "w-32", label: "Medium (128px)" },
    { value: "w-40", label: "Large (160px)" },
    { value: "w-48", label: "Extra Large (192px)" },
    { value: "w-64", label: "Wide (256px)" },
    { value: "w-80", label: "Extra Wide (320px)" }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {defaultColumn 
              ? "Edit Default Column" 
              : isEditMode 
                ? "Edit Custom Column" 
                : "Add Custom Column"
            }
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            {defaultColumn 
              ? "Modify the default column settings below."
              : isEditMode 
                ? "Modify the custom column settings below."
                : "Create a new custom column to add to your test case table."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Column Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ios_status"
                required
                readOnly={!!defaultColumn}
                className={defaultColumn ? "bg-gray-50" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {defaultColumn ? "Default column name cannot be changed" : "Internal name (no spaces, lowercase)"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Display Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., iOS Status"
                required
                readOnly={!!defaultColumn}
                className={defaultColumn ? "bg-gray-50" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {defaultColumn ? "Default column label cannot be changed" : "Name shown in the table header"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Column Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: CustomColumnType) => 
                  setFormData(prev => ({ ...prev, type: value, defaultValue: "" }))
                }
                disabled={!!defaultColumn}
              >
                <SelectTrigger className={defaultColumn ? "bg-gray-50" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                  <SelectItem value="select">Select (Dropdown)</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
              {defaultColumn && (
                <p className="text-xs text-muted-foreground">
                  Default column type cannot be changed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Column Width</Label>
              <Select
                value={formData.width}
                onValueChange={(value) => setFormData(prev => ({ ...prev, width: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getWidthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Column Color</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                style={{ backgroundColor: formData.color }}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'color'
                  input.value = formData.color
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement
                    setFormData(prev => ({ ...prev, color: target.value }))
                  }
                  input.click()
                }}
                title="Click to change color"
              />
              <Input
                id="color"
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Color for the column header and badges
            </p>
          </div>

          {formData.type === 'select' && (
            <div className="space-y-3">
              <Label>Select Options</Label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options]
                        newOptions[index] = e.target.value
                        setFormData(prev => ({ ...prev, options: newOptions }))
                      }}
                      placeholder="Option value"
                      className="flex-1"
                    />
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                      style={{ backgroundColor: formData.optionColors[option] || '#6b7280' }}
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'color'
                        input.value = formData.optionColors[option] || '#6b7280'
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement
                          const newOptionColors = { ...formData.optionColors, [option]: target.value }
                          setFormData(prev => ({ ...prev, optionColors: newOptionColors }))
                        }
                        input.click()
                      }}
                      title={`Click to change color for "${option}"`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="defaultValue">Default Value</Label>
            {formData.type === 'boolean' ? (
              <Select
                value={formData.defaultValue}
                onValueChange={(value) => setFormData(prev => ({ ...prev, defaultValue: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            ) : formData.type === 'select' ? (
              <Select
                value={formData.defaultValue}
                onValueChange={(value) => setFormData(prev => ({ ...prev, defaultValue: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default value" />
                </SelectTrigger>
                <SelectContent>
                  {formData.options.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="defaultValue"
                type={formData.type === 'number' ? 'number' : 'text'}
                value={formData.defaultValue}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                placeholder={`Default ${formData.type} value`}
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="visible"
              checked={formData.visible}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, visible: checked as boolean }))
              }
            />
            <Label htmlFor="visible">Visible by default</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, required: checked as boolean }))
              }
            />
            <Label htmlFor="required">Required field</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {defaultColumn ? "Save Changes" : isEditMode ? "Update Column" : "Add Column"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 