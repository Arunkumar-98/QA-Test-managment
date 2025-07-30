"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Upload, 
  Download, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertTriangle,
  Info,
  Settings,
  FileText,
  Table as TableIcon
} from 'lucide-react'
import { TestCase } from '@/types/qa-types'
import { mapImportedDataToTestCase, validateImportedTestCase, mapImportField } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface ImportPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (testCases: Partial<TestCase>[]) => void
  rawData: any[]
  currentProject: string
  selectedSuiteId?: string
}

interface ColumnMapping {
  sourceColumn: string
  targetField: keyof TestCase | 'skip'
  isMapped: boolean
  confidence: number // 0-1, how confident we are in the mapping
}

const FIELD_OPTIONS = [
  { value: 'testCase', label: 'Test Case Name', description: 'The name or ID of the test case' },
  { value: 'description', label: 'Description', description: 'Detailed description of what the test verifies' },
  { value: 'expectedResult', label: 'Expected Result', description: 'What should happen when the test passes' },
  { value: 'status', label: 'Status', description: 'Current execution status' },
  { value: 'priority', label: 'Priority', description: 'Importance level of the test' },
  { value: 'category', label: 'Category', description: 'Type of test (Functional, Regression, etc.)' },
  { value: 'assignedTester', label: 'Assigned Tester', description: 'Who is responsible for this test' },
  { value: 'executionDate', label: 'Execution Date', description: 'When the test was or will be executed' },
  { value: 'notes', label: 'Notes', description: 'Additional comments or observations' },
  { value: 'actualResult', label: 'Actual Result', description: 'What actually happened during execution' },
  { value: 'environment', label: 'Environment', description: 'Test environment (Dev, QA, Prod)' },
  { value: 'prerequisites', label: 'Prerequisites', description: 'Requirements before running the test' },
  { value: 'platform', label: 'Platform', description: 'Operating system or device' },
  { value: 'stepsToReproduce', label: 'Steps to Reproduce', description: 'Detailed test execution steps' },
  { value: 'skip', label: 'Skip Column', description: 'Ignore this column during import' }
]

export function ImportPreviewDialog({
  isOpen,
  onClose,
  onImport,
  rawData,
  currentProject,
  selectedSuiteId
}: ImportPreviewDialogProps) {
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [previewData, setPreviewData] = useState<Partial<TestCase>[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Auto-detect column mappings when data changes
  useEffect(() => {
    if (rawData.length > 0) {
      const headers = Object.keys(rawData[0])
      const mappings: ColumnMapping[] = headers.map(header => {
        const mapping = detectColumnMapping(header)
        return {
          sourceColumn: header,
          targetField: mapping.field,
          isMapped: mapping.field !== 'skip',
          confidence: mapping.confidence
        }
      })
      setColumnMappings(mappings)
    }
  }, [rawData])

  // Generate preview data when mappings change
  useEffect(() => {
    if (rawData.length > 0 && columnMappings.length > 0) {
      const preview = rawData.slice(0, 5).map((row, index) => {
        const mappedData: any = {}
        
        columnMappings.forEach(mapping => {
          if (mapping.isMapped && mapping.targetField !== 'skip') {
            mappedData[mapping.targetField] = row[mapping.sourceColumn]
          }
        })

        const testCase = mapImportedDataToTestCase(mappedData, index, currentProject, selectedSuiteId)
        const validation = validateImportedTestCase(testCase)
        
        return validation.cleanedTestCase
      })
      
      setPreviewData(preview)
      
      // Collect validation errors
      const errors: string[] = []
      rawData.forEach((row, index) => {
        const mappedData: any = {}
        columnMappings.forEach(mapping => {
          if (mapping.isMapped && mapping.targetField !== 'skip') {
            mappedData[mapping.targetField] = row[mapping.sourceColumn]
          }
        })
        
        const testCase = mapImportedDataToTestCase(mappedData, index, currentProject, selectedSuiteId)
        const validation = validateImportedTestCase(testCase)
        
        if (!validation.isValid) {
          errors.push(`Row ${index + 1}: ${validation.errors.join(', ')}`)
        }
      })
      setValidationErrors(errors)
    }
  }, [columnMappings, rawData, currentProject, selectedSuiteId])

  const detectColumnMapping = (columnName: string): { field: keyof TestCase | 'skip', confidence: number } => {
    const lowerColumn = columnName.toLowerCase()
    
    // High confidence mappings
    if (lowerColumn.includes('test') && (lowerColumn.includes('case') || lowerColumn.includes('id'))) {
      return { field: 'testCase', confidence: 0.9 }
    }
    if (lowerColumn.includes('description') || lowerColumn.includes('desc')) {
      return { field: 'description', confidence: 0.9 }
    }
    if (lowerColumn.includes('expected') && lowerColumn.includes('result')) {
      return { field: 'expectedResult', confidence: 0.9 }
    }
    if (lowerColumn.includes('steps') || lowerColumn.includes('procedure')) {
      return { field: 'stepsToReproduce', confidence: 0.9 }
    }
    if (lowerColumn === 'status') {
      return { field: 'status', confidence: 0.9 }
    }
    if (lowerColumn === 'priority') {
      return { field: 'priority', confidence: 0.9 }
    }
    
    // Medium confidence mappings
    if (lowerColumn.includes('assigned') || lowerColumn.includes('tester') || lowerColumn.includes('owner')) {
      return { field: 'assignedTester', confidence: 0.7 }
    }
    if (lowerColumn.includes('date') || lowerColumn.includes('execution')) {
      return { field: 'executionDate', confidence: 0.7 }
    }
    if (lowerColumn.includes('notes') || lowerColumn.includes('comments')) {
      return { field: 'notes', confidence: 0.7 }
    }
    if (lowerColumn.includes('actual') || lowerColumn.includes('result')) {
      return { field: 'actualResult', confidence: 0.7 }
    }
    if (lowerColumn.includes('environment') || lowerColumn.includes('env')) {
      return { field: 'environment', confidence: 0.7 }
    }
    if (lowerColumn.includes('prerequisites') || lowerColumn.includes('setup')) {
      return { field: 'prerequisites', confidence: 0.7 }
    }
    if (lowerColumn.includes('platform') || lowerColumn.includes('os')) {
      return { field: 'platform', confidence: 0.7 }
    }
    if (lowerColumn.includes('category') || lowerColumn.includes('type')) {
      return { field: 'category', confidence: 0.6 }
    }
    
    // Low confidence or skip
    return { field: 'skip', confidence: 0.1 }
  }

  const handleMappingChange = (sourceColumn: string, targetField: keyof TestCase | 'skip') => {
    setColumnMappings(prev => prev.map(mapping => 
      mapping.sourceColumn === sourceColumn 
        ? { ...mapping, targetField, isMapped: targetField !== 'skip' }
        : mapping
    ))
  }

  const handleSelectAll = () => {
    if (selectedRows.size === rawData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(rawData.map((_, index) => index)))
    }
  }

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  const handleImport = () => {
    const rowsToImport = selectedRows.size > 0 ? Array.from(selectedRows) : rawData.map((_, index) => index)
    
    const testCasesToImport: Partial<TestCase>[] = rowsToImport.map(index => {
      const row = rawData[index]
      const mappedData: any = {}
      
      columnMappings.forEach(mapping => {
        if (mapping.isMapped && mapping.targetField !== 'skip') {
          mappedData[mapping.targetField] = row[mapping.sourceColumn]
        }
      })

      const testCase = mapImportedDataToTestCase(mappedData, index, currentProject, selectedSuiteId)
      const validation = validateImportedTestCase(testCase)
      
      return validation.cleanedTestCase
    })

    onImport(testCasesToImport)
    onClose()
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Preview & Column Mapping
          </DialogTitle>
          <DialogDescription>
            Review how your data will be imported and adjust column mappings if needed.
            {rawData.length} rows detected, showing first 5 rows as preview.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Column Mapping Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Column Mapping
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {columnMappings.map((mapping) => (
                <div key={mapping.sourceColumn} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {mapping.sourceColumn}
                    <Badge 
                      variant="outline" 
                      className={`ml-2 text-xs ${getConfidenceColor(mapping.confidence)}`}
                    >
                      {getConfidenceText(mapping.confidence)}
                    </Badge>
                  </Label>
                  
                  <Select
                    value={mapping.targetField}
                    onValueChange={(value) => handleMappingChange(mapping.sourceColumn, value as keyof TestCase | 'skip')}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {showAdvanced && (
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Validation Warnings</span>
              </div>
              <div className="text-sm text-yellow-700 max-h-20 overflow-y-auto">
                {validationErrors.slice(0, 3).map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
                {validationErrors.length > 3 && (
                  <div>... and {validationErrors.length - 3} more warnings</div>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview (First 5 rows)
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRows.size === rawData.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({selectedRows.size}/{rawData.length})
                </span>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Test Case</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((testCase, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(index)}
                          onCheckedChange={() => handleSelectRow(index)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {testCase.testCase || 'No name'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {testCase.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={testCase.status === 'Pass' ? 'default' : 'secondary'}>
                          {testCase.status || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {testCase.priority || 'Medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {testCase.category || 'Functional'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedRows.size > 0 ? `${selectedRows.size} rows selected` : 'All rows will be imported'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={rawData.length === 0}>
              Import {selectedRows.size > 0 ? selectedRows.size : rawData.length} Test Cases
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 