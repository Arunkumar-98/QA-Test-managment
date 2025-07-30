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
  Eye
} from 'lucide-react'
import { TestCase } from '@/types/qa-types'
import { parseTextIntelligently, mapImportedDataToTestCase, validateImportedTestCase } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface EnhancedPasteDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (testCases: Partial<TestCase>[]) => void
  currentProject: string
  selectedSuiteId?: string
}

export function EnhancedPasteDialog({
  isOpen,
  onClose,
  onImport,
  currentProject,
  selectedSuiteId
}: EnhancedPasteDialogProps) {
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<any[]>([])
  const [parsedTestCases, setParsedTestCases] = useState<Partial<TestCase>[]>([])
  const [detectedFormat, setDetectedFormat] = useState<'csv' | 'structured' | 'freeform'>('freeform')
  const [confidence, setConfidence] = useState(0)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('paste')

  // Auto-parse when text changes
  useEffect(() => {
    if (pastedText.trim()) {
      const result = parseTextIntelligently(pastedText)
      setDetectedFormat(result.format)
      setConfidence(result.confidence)
      setParsedData(result.data)

      // Convert to test cases
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
    } else {
      setParsedData([])
      setParsedTestCases([])
      setValidationErrors([])
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

  const handleImport = () => {
    if (parsedTestCases.length > 0) {
      onImport(parsedTestCases)
      onClose()
      setPastedText('')
      setParsedData([])
      setParsedTestCases([])
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <TableIcon className="w-4 h-4" />
      case 'structured': return <FileText className="w-4 h-4" />
      default: return <Clipboard className="w-4 h-4" />
    }
  }

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'csv': return 'bg-blue-100 text-blue-800'
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clipboard className="w-5 h-5" />
            Enhanced Paste Import
          </DialogTitle>
          <DialogDescription>
            Paste your test case data in any format. The system will automatically detect and parse it.
          </DialogDescription>
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
                    {validationErrors.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {validationErrors.length} warnings
                      </Badge>
                    )}
                    <Badge variant="outline" className={getFormatColor(detectedFormat)}>
                      {detectedFormat.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <div className="space-y-3">
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
                    CSV Format
                  </CardTitle>
                  <CardDescription>
                    Paste comma-separated values with headers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`Test ID,Test Case Name,Description,Steps,Expected Result,Priority,Status
TC001,Login Test,Verify user login,1. Enter credentials 2. Click login,User logged in,High,Pending
TC002,Logout Test,Verify user logout,1. Click logout,User logged out,Medium,Pending`}
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
{`Test Case: User Login
Description: Verify user can log in with valid credentials
Steps: 1. Enter username 2. Enter password 3. Click login
Expected: User is logged in and redirected to dashboard
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
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedTestCases.length === 0}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Import {parsedTestCases.length} Test Cases
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 