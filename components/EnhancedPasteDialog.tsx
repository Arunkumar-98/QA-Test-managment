"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Clipboard, 
  FileText, 
  Table as TableIcon, 
  Check, 
  AlertTriangle,
  Info,
  Sparkles,
  Upload,
  Download,
  Eye,
  Loader2
} from 'lucide-react'
import { TestCase, CustomColumn, CreateCustomColumnInput } from '@/types/qa-types'
import { ImportFormat } from '@/types/import-types'
import { parseTextIntelligently, mapImportedDataToTestCase, validateImportedTestCase } from '@/lib/utils'
import { parseHierarchicalTestCases } from '@/lib/hierarchical-parser'
import { toast } from '@/hooks/use-toast'
import { customColumnService } from '@/lib/supabase-service'

interface EnhancedPasteDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (testCases: Partial<TestCase>[]) => void
  currentProject: string
  selectedSuiteId?: string
  onCustomColumnsCreated?: (columns: CustomColumn[]) => void
}

export function EnhancedPasteDialog({
  isOpen,
  onClose,
  onImport,
  currentProject,
  selectedSuiteId,
  onCustomColumnsCreated
}: EnhancedPasteDialogProps) {
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<any[]>([])
  const [parsedTestCases, setParsedTestCases] = useState<Partial<TestCase>[]>([])
  const [detectedFormat, setDetectedFormat] = useState<ImportFormat>('freeform')
  const [confidence, setConfidence] = useState(0)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('paste')
  const [hierarchicalData, setHierarchicalData] = useState<any>(null)
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([])
  const [creatingColumns, setCreatingColumns] = useState(false)

  // Auto-parse when text changes
  useEffect(() => {
    if (pastedText.trim()) {
      const result = parseTextIntelligently(pastedText)
      setDetectedFormat(result.format)
      setConfidence(result.confidence)
      setParsedData(result.data)

      // Detect headers for TSV/CSV formats
      if (result.format === 'tsv' || result.format === 'csv') {
        const lines = pastedText.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          const separator = result.format === 'tsv' ? '\t' : ','
          const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''))
          setDetectedHeaders(headers)
        }
      } else {
        setDetectedHeaders([])
      }

      if (result.format === 'hierarchical') {
        try {
          const hierarchical = parseHierarchicalTestCases(pastedText)
          setHierarchicalData(hierarchical)
          
          // Convert hierarchical test cases to flat test cases
          const testCases = hierarchical.testCases.map(tc => ({
            testCase: `${tc.id}: ${tc.title}`,
            description: tc.description || '',
            expectedResult: tc.expectedResult || '',
            status: tc.status || 'Not Executed',
            priority: tc.priority || 'P2 (Medium)',
            category: tc.category || 'Other',
            stepsToReproduce: tc.stepsToReproduce || '',
            projectId: currentProject,
            suiteId: selectedSuiteId,
            customFields: {
              section: tc.section || '',
              subsection: tc.subsection || '',
              automationStatus: tc.automationStatus || null
            } as { [key: string]: string | number | boolean | null }
          }))

          setParsedTestCases(testCases)
          setValidationErrors([]) // Hierarchical format has built-in validation
        } catch (error) {
          setValidationErrors([`Failed to parse hierarchical format: ${error instanceof Error ? error.message : 'Unknown error'}`])
        }
      } else {
        // Convert to test cases for other formats
        const testCases = result.data.map((row, index) => {
          const mappedTestCase = mapImportedDataToTestCase(row, index, currentProject, selectedSuiteId)
          const validation = validateImportedTestCase(mappedTestCase)
          return validation.cleanedTestCase
        })

        setParsedTestCases(testCases)

        // Collect validation errors
        const errors: string[] = []
        testCases.forEach((testCase, index) => {
          const validation = validateImportedTestCase(testCase)
          if (!validation.isValid) {
            errors.push(`Row ${index + 1}: ${validation.errors.join(', ')}`)
          }
        })
        setValidationErrors(errors)
      }
    } else {
      setParsedData([])
      setParsedTestCases([])
      setValidationErrors([])
      setHierarchicalData(null)
      setDetectedHeaders([])
    }
  }, [pastedText, currentProject, selectedSuiteId])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setPastedText(text)
      setActiveTab('preview')
    } catch (error) {
      toast({
        title: "Clipboard Access Failed",
        description: "Please paste the text manually or check clipboard permissions.",
        variant: "destructive"
      })
    }
  }

  const createCustomColumnsFromHeaders = async (headers: string[]): Promise<CustomColumn[]> => {
    const standardFields = [
      'test case id', 'title', 'description', 'steps to reproduce', 'expected result', 
      'priority', 'status', 'category', 'assigned tester', 'execution date', 'notes', 
      'actual result', 'environment', 'prerequisites', 'platform'
    ]
    
    const customColumns: CustomColumn[] = []
    
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim()
      
      // Skip if it's a standard field
      if (standardFields.some(field => normalizedHeader.includes(field))) {
        continue
      }
      
      // Determine column type based on header name
      let columnType: 'text' | 'number' | 'select' | 'date' = 'text'
      if (normalizedHeader.includes('date') || normalizedHeader.includes('time')) {
        columnType = 'date'
      } else if (normalizedHeader.includes('count') || normalizedHeader.includes('number') || normalizedHeader.includes('id')) {
        columnType = 'number'
      } else if (normalizedHeader.includes('enabled') || normalizedHeader.includes('active') || normalizedHeader.includes('status')) {
        columnType = 'select'
      }
      
      try {
        const columnInput: CreateCustomColumnInput = {
          name: header.toLowerCase().replace(/\s+/g, '_'),
          label: header,
          type: columnType,
          visible: true,
          width: '150px',
          minWidth: '100px',
          options: columnType === 'select' ? ['Yes', 'No', 'Enabled', 'Disabled'] : undefined,
          defaultValue: undefined,
          required: false,
          projectId: currentProject
        }
        
        const createdColumn = await customColumnService.create(columnInput)
        customColumns.push(createdColumn)
      } catch (error) {
        console.error(`Failed to create custom column for header "${header}":`, error)
        // Continue with other columns even if one fails
      }
    }
    
    return customColumns
  }

  const handleImport = async () => {
    if (parsedTestCases.length > 0) {
      setCreatingColumns(true)
      
      try {
        // Create custom columns if headers are detected
        let createdColumns: CustomColumn[] = []
        if (detectedHeaders.length > 0 && (detectedFormat === 'tsv' || detectedFormat === 'csv')) {
          createdColumns = await createCustomColumnsFromHeaders(detectedHeaders)
          
          if (createdColumns.length > 0) {
            toast({
              title: "Custom Columns Created",
              description: `Successfully created ${createdColumns.length} custom columns from your data headers.`,
            })
            
            // Notify parent component about new columns
            if (onCustomColumnsCreated) {
              onCustomColumnsCreated(createdColumns)
            }
          }
        }
        
        onImport(parsedTestCases)
        onClose()
        setPastedText('')
        setParsedData([])
        setParsedTestCases([])
        setDetectedHeaders([])
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to create custom columns. Please try again.",
          variant: "destructive"
        })
      } finally {
        setCreatingColumns(false)
      }
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <TableIcon className="w-4 h-4" />
      case 'tsv': return <TableIcon className="w-4 h-4" />
      case 'structured': return <FileText className="w-4 h-4" />
      default: return <Clipboard className="w-4 h-4" />
    }
  }

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'csv': return 'bg-blue-100 text-blue-800'
      case 'tsv': return 'bg-purple-100 text-purple-800'
      case 'structured': return 'bg-green-100 text-green-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-green-100 text-green-800'
    if (conf >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Clipboard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-slate-900">
                Enhanced Paste
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                Paste your test case data and let AI help you organize it perfectly
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Paste Data
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Help
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="paste-textarea">Paste your test case data:</Label>
              <Button variant="outline" size="sm" onClick={handlePaste}>
                <Clipboard className="w-4 h-4 mr-2" />
                Paste from Clipboard
              </Button>
            </div>

            <Textarea
              id="paste-textarea"
              placeholder="Paste CSV data, structured text, or freeform text here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="flex-1 min-h-[300px] font-mono text-sm"
            />

            {pastedText.trim() && (
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getFormatIcon(detectedFormat)}
                  <span className="font-medium">Detected Format:</span>
                  <Badge className={getFormatColor(detectedFormat)}>
                    {detectedFormat.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Confidence:</span>
                  <Badge className={getConfidenceColor(confidence)}>
                    {Math.round(confidence * 100)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Test Cases:</span>
                  <Badge variant="outline">{parsedTestCases.length}</Badge>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="flex-1 flex flex-col gap-4">
            {parsedTestCases.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Preview ({parsedTestCases.length} test cases)</h3>
                  <div className="flex items-center gap-2">
                    {detectedHeaders.length > 0 && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {detectedHeaders.length} columns detected
                      </Badge>
                    )}
                    {validationErrors.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {validationErrors.length} warnings
                      </Badge>
                    )}
                    <Badge variant="outline" className={getFormatColor(detectedFormat)}>
                      {detectedFormat === 'csv' ? 'CSV' : 
                       detectedFormat === 'tsv' ? 'TABLE' :
                       detectedFormat === 'structured' ? 'STRUCTURED' :
                       'FREEFORM'}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <div className="space-y-3">
                    {detectedFormat === 'hierarchical' && hierarchicalData ? (
                      // Hierarchical preview
                      <div className="space-y-6">
                        {Object.entries(hierarchicalData.sections).slice(0, 2).map(([sectionKey, section]: [string, any]) => (
                          <Card key={sectionKey} className="border-l-4 border-l-indigo-500">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-4">
                                {Object.entries(section.subsections).slice(0, 2).map(([subsectionKey, subsection]: [string, any]) => (
                                  <div key={subsectionKey} className="pl-4 border-l-2 border-l-indigo-200">
                                    <h4 className="font-medium text-sm mb-2">{subsection.title}</h4>
                                    <div className="space-y-3">
                                      {subsection.testCases.slice(0, 2).map((testCase: any, index: number) => (
                                        <Card key={index} className="border-l-4 border-l-blue-500">
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center justify-between">
                                              <span>{testCase.id}: {testCase.title}</span>
                                              <div className="flex items-center gap-2">
                                                <Badge variant="outline">{testCase.priority || 'Medium'}</Badge>
                                                {testCase.automationStatus && (
                                                  <Badge variant="secondary">
                                                    {testCase.automationStatus}
                                                  </Badge>
                                                )}
                                              </div>
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="pt-0">
                                            <p className="text-sm text-muted-foreground mb-2">
                                              {testCase.description || 'No description'}
                                            </p>
                                            {testCase.expectedResult && (
                                              <div className="text-xs text-muted-foreground">
                                                <strong>Expected:</strong> {testCase.expectedResult}
                                              </div>
                                            )}
                                          </CardContent>
                                        </Card>
                                      ))}
                                      {subsection.testCases.length > 2 && (
                                        <div className="text-xs text-muted-foreground pl-4">
                                          ... and {subsection.testCases.length - 2} more test cases in this subsection
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {Object.keys(section.subsections).length > 2 && (
                                  <div className="text-sm text-muted-foreground pl-4">
                                    ... and {Object.keys(section.subsections).length - 2} more subsections
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {Object.keys(hierarchicalData.sections).length > 2 && (
                          <div className="text-center text-sm text-muted-foreground">
                            ... and {Object.keys(hierarchicalData.sections).length - 2} more sections
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular preview
                      <>
                        {parsedTestCases.slice(0, 5).map((testCase, index) => (
                          <Card key={index} className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center justify-between">
                                <span>{testCase.testCase || `Test Case ${index + 1}`}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{testCase.priority || 'Medium'}</Badge>
                                  <Badge variant={testCase.status === 'Pass' ? 'default' : 'secondary'}>
                                    {testCase.status || 'Pending'}
                                  </Badge>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-muted-foreground mb-2">
                                {testCase.description || 'No description'}
                              </p>
                              {testCase.stepsToReproduce && (
                                <div className="text-xs text-muted-foreground">
                                  <strong>Steps:</strong> {testCase.stepsToReproduce}
                                </div>
                              )}
                              {testCase.expectedResult && (
                                <div className="text-xs text-muted-foreground">
                                  <strong>Expected:</strong> {testCase.expectedResult}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        {parsedTestCases.length > 5 && (
                          <div className="text-center text-sm text-muted-foreground">
                            ... and {parsedTestCases.length - 5} more test cases
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clipboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No data to preview. Please paste some test case data first.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="help" className="flex-1 overflow-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="w-5 h-5" />
                    Table Format (TSV)
                  </CardTitle>
                  <CardDescription>
                    Paste tab-separated data from Excel, Google Sheets, or tables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`Test Case ID	Title	Description	Steps to Reproduce	Expected Result	Priority	Status
TC-001	Overlapping Scheduled Rides	Driver should not be able to accept overlapping scheduled rides.	1. Login as driver 2. Accept ride at 10:00 AM 3. Try to accept another ride at 10:15 AM	System should restrict overlapping rides (min 30 min gap required).	High	Pending
TC-002	Immediate Ride Conflict	Driver should get warning if accepting ride within 30 min of scheduled ride.	1. Accept scheduled ride at 11:00 AM 2. Try to accept on-demand ride at 10:40 AM	Warning message should be shown.	High	Pending`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="w-5 h-5" />
                    CSV Format
                  </CardTitle>
                  <CardDescription>
                    Paste comma-separated values with headers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`Test Case ID,Title,Description,Steps to Reproduce,Expected Result,Priority,Status
TC-001,Overlapping Scheduled Rides,Driver should not be able to accept overlapping scheduled rides.,1. Login as driver 2. Accept ride at 10:00 AM 3. Try to accept another ride at 10:15 AM,System should restrict overlapping rides (min 30 min gap required).,High,Pending
TC-002,Immediate Ride Conflict,Driver should get warning if accepting ride within 30 min of scheduled ride.,1. Accept scheduled ride at 11:00 AM 2. Try to accept on-demand ride at 10:40 AM,Warning message should be shown.,High,Pending`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Structured Text Format
                  </CardTitle>
                  <CardDescription>
                    Use keywords to structure your test case data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`Test Case ID: TC-001
Title: Overlapping Scheduled Rides
Description: Driver should not be able to accept overlapping scheduled rides.
Steps to Reproduce: 1. Login as driver 2. Accept ride at 10:00 AM 3. Try to accept another ride at 10:15 AM
Expected Result: System should restrict overlapping rides (min 30 min gap required).
Priority: High
Status: Pending`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clipboard className="w-5 h-5" />
                    Freeform Text Format
                  </CardTitle>
                  <CardDescription>
                    Simple text format for quick test case creation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`Login Test
Verify user can log in with valid credentials. 
The system should authenticate the user and redirect to the dashboard.`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Dynamic Column Creation
                  </CardTitle>
                  <CardDescription>
                    Custom columns are automatically created based on your data headers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      When you paste data with headers that don't match standard fields, the system will automatically create custom columns for them.
                    </p>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-2">Example:</p>
                      <p>If your data has headers like:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li><code>Test Case ID</code> → Standard field (no custom column)</li>
                        <li><code>Custom Field</code> → Creates a new custom column</li>
                        <li><code>Date Created</code> → Creates a date-type custom column</li>
                        <li><code>Bug Count</code> → Creates a number-type custom column</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Hierarchical Test Cases Format
                  </CardTitle>
                  <CardDescription>
                    Comprehensive format with sections, subsections, and test case metadata
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard

TC002: Verify user login with invalid credentials
Expected Result: Error message displayed, login denied

2. ADVANCED FEATURES
2.1 Profile Management
TC003: Update user profile picture
Expected Result: Profile picture updated and displayed correctly

TEST EXECUTION PRIORITY
P0 - Critical (Must Pass)
- TC001, TC002
P1 - High Priority
- TC003`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedTestCases.length === 0 || creatingColumns}
            className="flex items-center gap-2"
          >
            {creatingColumns ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Columns...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Import {parsedTestCases.length} Test Cases
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 