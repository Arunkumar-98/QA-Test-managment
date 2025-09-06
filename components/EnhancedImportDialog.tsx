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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Table as TableIcon,
  FolderPlus,
  Folder,
  RefreshCw,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react'
import { TestCase, TestSuite, CreateTestSuiteInput } from '@/types/qa-types'
import { ImportProcessor, ImportOptions, ImportProgress, ImportResult } from '@/lib/import-processor'
import { DuplicateGroup, generateResolutionSuggestions } from '@/lib/duplicate-detector'
import { ValidationError } from '@/lib/import-validator'
import { toast } from '@/hooks/use-toast'

interface EnhancedImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (testCases: TestCase[]) => void
  currentProject: string
  selectedSuiteId?: string
  testSuites?: TestSuite[]
  onCreateTestSuite?: (suite: CreateTestSuiteInput) => Promise<TestSuite>
}

type ImportStage = 'upload' | 'processing' | 'review' | 'duplicates' | 'validation' | 'complete'

export function EnhancedImportDialog({
  isOpen,
  onClose,
  onImport,
  currentProject,
  selectedSuiteId,
  testSuites = [],
  onCreateTestSuite
}: EnhancedImportDialogProps) {
  const [currentStage, setCurrentStage] = useState<ImportStage>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [duplicateResolutions, setDuplicateResolutions] = useState<Map<number, string>>(new Map())
  const [validationFilter, setValidationFilter] = useState<'all' | 'errors' | 'warnings'>('all')
  const [importSuiteId, setImportSuiteId] = useState<string | undefined>(selectedSuiteId)
  const [newSuiteName, setNewSuiteName] = useState('')
  const [suiteSelectionMode, setSuiteSelectionMode] = useState<'existing' | 'new' | 'none'>('existing')

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStage('upload')
      setSelectedFile(null)
      setImportProgress(null)
      setImportResult(null)
      setDuplicateResolutions(new Map())
      setImportSuiteId(selectedSuiteId)
    }
  }, [isOpen, selectedSuiteId])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.json') || file.name.endsWith('.tsv') || file.name.endsWith('.txt'))) {
      setSelectedFile(file)
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV, TSV, JSON, or Excel file.",
        variant: "destructive"
      })
    }
  }

  const processImport = async () => {
    if (!selectedFile) return

    setCurrentStage('processing')
    
    const options: ImportOptions = {
      file: selectedFile,
      projectId: currentProject,
      suiteId: suiteSelectionMode === 'existing' ? importSuiteId : undefined,
      duplicateDetection: {
        fields: ['testCase'], // Only compare test case names
        similarity: 0.95, // Much higher threshold for exact matches
        caseSensitive: false,
        trimWhitespace: true
      },
      validation: {
        autoFix: true,
        strictMode: false // Keep relaxed validation
      },
      processing: {
        batchSize: 100,
        maxConcurrency: 3
      }
    }

    const processor = new ImportProcessor(options, (progress) => {
      setImportProgress(progress)
    })

    try {
      const result = await processor.processImport()
      setImportResult(result)
      
      if (result.duplicates && result.duplicates.duplicateGroups.length > 0) {
        setCurrentStage('duplicates')
      } else if (result.validation && (result.validation.errors.length > 0 || result.validation.warnings.length > 0)) {
        setCurrentStage('validation')
      } else {
        setCurrentStage('review')
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
      setCurrentStage('upload')
    }
  }

  const handleDuplicateResolution = (groupIndex: number, strategy: string) => {
    setDuplicateResolutions(prev => new Map(prev.set(groupIndex, strategy)))
  }

  const proceedFromDuplicates = () => {
    if (importResult?.validation && (importResult.validation.errors.length > 0 || importResult.validation.warnings.length > 0)) {
      setCurrentStage('validation')
    } else {
      setCurrentStage('review')
    }
  }

  const proceedFromValidation = () => {
    setCurrentStage('review')
  }

  const finalizeImport = async () => {
    if (!importResult) return

    // Create new test suite if needed
    if (suiteSelectionMode === 'new' && newSuiteName.trim() && onCreateTestSuite) {
      try {
        const newSuite = await onCreateTestSuite({
          name: newSuiteName.trim(),
          description: `Created during import of ${selectedFile?.name}`,
          projectId: currentProject,
          testCaseIds: [],
          tags: [],
          owner: '',
          isActive: true
        })
        
        // Update imported test cases with new suite ID
        importResult.imported.forEach(testCase => {
          testCase.suiteId = newSuite.id
        })
      } catch (error) {
        toast({
          title: "Failed to Create Test Suite",
          description: "Import will proceed without test suite assignment",
          variant: "destructive"
        })
      }
    }

    onImport(importResult.imported)
    setCurrentStage('complete')
  }

  const renderUploadStage = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Import Test Cases</h3>
        <p className="text-slate-600">Upload a CSV or Excel file containing your test cases</p>
      </div>

      <div 
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-slate-700">
            {selectedFile ? selectedFile.name : 'Drop your file here, or click to browse'}
          </p>
          <p className="text-sm text-slate-500">Supports CSV, TSV, JSON, Excel (.xlsx, .xls) files up to 10MB</p>
        </div>
        
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.json,.tsv,.txt"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" className="mt-4" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
      </div>

      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">Name:</span>
                <span className="ml-2 text-slate-600">{selectedFile.name}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Size:</span>
                <span className="ml-2 text-slate-600">{Math.round(selectedFile.size / 1024)} KB</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Type:</span>
                <span className="ml-2 text-slate-600">{selectedFile.type || 'Unknown'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Last Modified:</span>
                <span className="ml-2 text-slate-600">{new Date(selectedFile.lastModified).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <Label className="text-base font-medium text-slate-900">Test Suite Assignment</Label>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="existing-suite"
              checked={suiteSelectionMode === 'existing'}
              onCheckedChange={(checked) => setSuiteSelectionMode(checked ? 'existing' : 'none')}
            />
            <Label htmlFor="existing-suite" className="text-sm">Assign to existing test suite</Label>
          </div>
          
          {suiteSelectionMode === 'existing' && (
            <Select value={importSuiteId} onValueChange={setImportSuiteId}>
              <SelectTrigger>
                <SelectValue placeholder="Select test suite" />
              </SelectTrigger>
              <SelectContent>
                {testSuites.map((suite) => (
                  <SelectItem key={suite.id} value={suite.id}>
                    {suite.name} ({suite.totalTests || 0} tests)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="new-suite"
              checked={suiteSelectionMode === 'new'}
              onCheckedChange={(checked) => setSuiteSelectionMode(checked ? 'new' : 'none')}
            />
            <Label htmlFor="new-suite" className="text-sm">Create new test suite</Label>
          </div>
          
          {suiteSelectionMode === 'new' && (
            <Input
              placeholder="Enter test suite name"
              value={newSuiteName}
              onChange={(e) => setNewSuiteName(e.target.value)}
            />
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="no-suite"
              checked={suiteSelectionMode === 'none'}
              onCheckedChange={(checked) => setSuiteSelectionMode(checked ? 'none' : 'existing')}
            />
            <Label htmlFor="no-suite" className="text-sm">Don't assign to any test suite</Label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderProcessingStage = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Processing Import</h3>
        <p className="text-slate-600">Please wait while we process your file...</p>
      </div>

      {importProgress && (
        <div className="space-y-4">
          <Progress value={importProgress.progress} className="w-full" />
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 capitalize">
              {importProgress.stage.replace('_', ' ')}: {importProgress.message}
            </p>
            
            {importProgress.current > 0 && importProgress.total > 0 && (
              <p className="text-xs text-slate-500">
                {importProgress.current} of {importProgress.total} items
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        </div>
      )}
    </div>
  )

  const renderDuplicatesStage = () => {
    if (!importResult?.duplicates) return null

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Duplicate Detection</h3>
          <p className="text-slate-600">
            We found {importResult.duplicates.totalDuplicates} potential duplicates. 
            Please choose how to handle them.
          </p>
        </div>

        <div className="space-y-4">
          {importResult.duplicates.duplicateGroups.map((group, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Duplicate Group {index + 1}
                  <Badge variant={group.matchType === 'exact' ? 'destructive' : 'secondary'}>
                    {group.matchType === 'exact' ? 'Exact Match' : `${Math.round(group.similarity * 100)}% Similar`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Original:</h4>
                    <div className="bg-slate-50 p-3 rounded border text-sm">
                      <strong>{group.original.testCase}</strong>
                      {group.original.description && (
                        <p className="text-slate-600 mt-1">{group.original.description}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">
                      Duplicates ({group.duplicates.length}):
                    </h4>
                    <div className="space-y-2">
                      {group.duplicates.map((dup, dupIndex) => (
                        <div key={dupIndex} className="bg-red-50 p-3 rounded border border-red-200 text-sm">
                          <strong>{dup.testCase}</strong>
                          {dup.description && (
                            <p className="text-slate-600 mt-1">{dup.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-900">Resolution Strategy:</Label>
                    <Select 
                      value={duplicateResolutions.get(index) || 'keep_first'}
                      onValueChange={(value) => handleDuplicateResolution(index, value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keep_first">Keep first occurrence</SelectItem>
                        <SelectItem value="keep_last">Keep last occurrence</SelectItem>
                        <SelectItem value="merge_fields">Merge all fields</SelectItem>
                        <SelectItem value="skip_all">Skip all duplicates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const renderValidationStage = () => {
    if (!importResult?.validation) return null

    const { errors, warnings, info } = importResult.validation
    const allIssues = [...errors, ...warnings, ...info]
    
    const filteredIssues = allIssues.filter(issue => {
      if (validationFilter === 'errors') return issue.severity === 'error'
      if (validationFilter === 'warnings') return issue.severity === 'warning'
      return true
    })

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Validation Results</h3>
          <p className="text-slate-600">
            Review the validation results before proceeding with the import
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={validationFilter} onValueChange={(value: any) => setValidationFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues ({allIssues.length})</SelectItem>
              <SelectItem value="errors">Errors Only ({errors.length})</SelectItem>
              <SelectItem value="warnings">Warnings Only ({warnings.length})</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errors.length} Errors</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>{warnings.length} Warnings</span>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue, index) => (
                <TableRow key={index}>
                  <TableCell>{issue.row}</TableCell>
                  <TableCell className="font-mono text-sm">{issue.field}</TableCell>
                  <TableCell>{issue.message}</TableCell>
                  <TableCell>
                    <Badge variant={
                      issue.severity === 'error' ? 'destructive' : 
                      issue.severity === 'warning' ? 'secondary' : 'outline'
                    }>
                      {issue.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const renderReviewStage = () => {
    if (!importResult) return null

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Import Summary</h3>
          <p className="text-slate-600">Review the import results before finalizing</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{importResult.summary.successfulImports}</div>
              <div className="text-sm text-slate-600">Test Cases</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{importResult.summary.skippedRows}</div>
              <div className="text-sm text-slate-600">Skipped</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{importResult.summary.errorCount}</div>
              <div className="text-sm text-slate-600">Errors</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(importResult.summary.processingTime / 1000)}s</div>
              <div className="text-sm text-slate-600">Processing Time</div>
            </CardContent>
          </Card>
        </div>

        {importResult.warnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Warnings & Fixes Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {importResult.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-slate-600">
                    • {warning}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderCompleteStage = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-lg font-semibold text-slate-900">Import Complete!</h3>
        <p className="text-slate-600">
          Successfully imported {importResult?.summary.successfulImports} test cases
        </p>
      </div>
    </div>
  )

  const getStageActions = () => {
    switch (currentStage) {
      case 'upload':
        return (
          <Button 
            onClick={processImport} 
            disabled={!selectedFile}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Start Import
          </Button>
        )
      
      case 'processing':
        return null
      
      case 'duplicates':
        return (
          <Button onClick={proceedFromDuplicates}>
            Continue with Resolutions
          </Button>
        )
      
      case 'validation':
        return (
          <Button onClick={proceedFromValidation}>
            Continue Despite Issues
          </Button>
        )
      
      case 'review':
        return (
          <Button 
            onClick={finalizeImport}
            className="bg-green-600 hover:bg-green-700"
          >
            Finalize Import
          </Button>
        )
      
      case 'complete':
        return (
          <Button onClick={onClose}>
            Close
          </Button>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Enhanced Import</DialogTitle>
          <DialogDescription className="text-slate-600">
            Import test cases with advanced validation and duplicate detection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {currentStage === 'upload' && renderUploadStage()}
          {currentStage === 'processing' && renderProcessingStage()}
          {currentStage === 'duplicates' && renderDuplicatesStage()}
          {currentStage === 'validation' && renderValidationStage()}
          {currentStage === 'review' && renderReviewStage()}
          {currentStage === 'complete' && renderCompleteStage()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={currentStage === 'processing'}
            >
              Cancel
            </Button>
            {getStageActions()}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
