"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles,
  BookOpen,
  TestTube,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TestCase } from '@/types/qa-types'

interface PRDToTestCasesProps {
  onAddTestCases: (testCases: Partial<TestCase>[]) => void
  currentProject: string
}

interface GeneratedTestCase {
  id: string
  title: string
  description: string
  steps: string
  expectedResult: string
  priority: 'High' | 'Medium' | 'Low'
  category: string
  isSelected: boolean
}

export function PRDToTestCases({ onAddTestCases, currentProject }: PRDToTestCasesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prdTitle, setPrdTitle] = useState('')
  const [prdContent, setPrdContent] = useState('')
  const [generatedTestCases, setGeneratedTestCases] = useState<GeneratedTestCase[]>([])
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const handleGenerateTestCases = async () => {
    if (!prdTitle.trim() || !prdContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both PRD title and content.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prdTitle,
          prdContent,
          project: currentProject
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate test cases')
      }

      const data = await response.json()
      const testCases: GeneratedTestCase[] = data.testCases.map((tc: any, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        title: tc.title || `Test Case ${index + 1}`,
        description: tc.description || '',
        steps: tc.steps || '',
        expectedResult: tc.expectedResult || '',
        priority: tc.priority || 'Medium',
        category: tc.category || 'Functional',
        isSelected: true
      }))

      setGeneratedTestCases(testCases)
      setSelectedTestCases(new Set(testCases.map(tc => tc.id)))
      
      toast({
        title: "Test Cases Generated!",
        description: `Successfully generated ${testCases.length} test cases from your PRD.`,
      })
    } catch (error) {
      console.error('Error generating test cases:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate test cases. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddSelectedTestCases = () => {
    const selectedCases = generatedTestCases.filter(tc => selectedTestCases.has(tc.id))
    
    const testCasesToAdd: Partial<TestCase>[] = selectedCases.map(tc => ({
      testCase: tc.title,
      description: tc.description,
      stepsToReproduce: tc.steps,
      expectedResult: tc.expectedResult,
      priority: tc.priority,
      category: tc.category as any,
      status: 'Pending',
      platform: 'Web',
      environment: 'Test Environment',
      prerequisites: '',
      automation: false
    }))

    onAddTestCases(testCasesToAdd)
    
    toast({
      title: "Test Cases Added!",
      description: `Added ${selectedCases.length} test cases to your project.`,
    })
    
    setIsDialogOpen(false)
    setGeneratedTestCases([])
    setSelectedTestCases(new Set())
    setPrdTitle('')
    setPrdContent('')
  }

  const handleToggleTestCase = (id: string) => {
    const newSelected = new Set(selectedTestCases)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTestCases(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTestCases.size === generatedTestCases.length) {
      setSelectedTestCases(new Set())
    } else {
      setSelectedTestCases(new Set(generatedTestCases.map(tc => tc.id)))
    }
  }

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <>
      <Card className="w-full bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/60 hover:border-blue-300/60 transition-all duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-slate-900 break-words">AI Test Case Generator</CardTitle>
              <CardDescription className="text-slate-600 break-words">
                Upload PRDs or feature documentation to automatically generate comprehensive test cases
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">Powered by Gemini AI</span>
            </div>
            
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="break-words">Generate TC</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="break-words">AI Test Case Generator</span>
            </DialogTitle>
            <DialogDescription className="break-words">
              Upload your PRD or feature documentation to automatically generate comprehensive test cases using AI.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col h-full space-y-4 overflow-hidden">
            {/* Input Section */}
            <div className="space-y-4 flex-shrink-0">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">PRD/Feature Title</label>
                <Input
                  value={prdTitle}
                  onChange={(e) => setPrdTitle(e.target.value)}
                  placeholder="e.g., User Authentication System, Payment Gateway Integration"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">PRD/Feature Documentation</label>
                <Textarea
                  value={prdContent}
                  onChange={(e) => setPrdContent(e.target.value)}
                  placeholder="Paste your PRD, feature requirements, user stories, or any documentation here. The AI will analyze this and generate comprehensive test cases."
                  className="w-full min-h-[150px] max-h-[200px] resize-none"
                />
              </div>

              <Button 
                onClick={handleGenerateTestCases}
                disabled={isGenerating || !prdTitle.trim() || !prdContent.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                    <span className="break-words">Generating Test Cases...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="break-words">Generate Test Cases</span>
                  </>
                )}
              </Button>
            </div>

            {/* Generated Test Cases Section */}
            {generatedTestCases.length > 0 && (
              <div className="space-y-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg font-semibold text-slate-900 break-words">
                    Generated Test Cases ({generatedTestCases.length})
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="whitespace-nowrap"
                    >
                      {selectedTestCases.size === generatedTestCases.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap">
                      {selectedTestCases.size} selected
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
                  {generatedTestCases.map((testCase) => (
                    <Card 
                      key={testCase.id}
                      className={`border-2 transition-all duration-200 ${
                        selectedTestCases.has(testCase.id) 
                          ? 'border-blue-300 bg-blue-50/50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTestCases.has(testCase.id)}
                            onChange={() => handleToggleTestCase(testCase.id)}
                            className="mt-1 flex-shrink-0"
                          />
                          
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 mb-1 break-words">{testCase.title}</h4>
                                <p className="text-sm text-slate-600 mb-2 break-words">{testCase.description}</p>
                              </div>
                              <Badge className={`${getPriorityColor(testCase.priority)} flex-shrink-0 whitespace-nowrap`}>
                                {testCase.priority}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                              <div className="min-w-0">
                                <h5 className="font-medium text-slate-700 mb-1">Test Steps:</h5>
                                <p className="text-slate-600 whitespace-pre-wrap break-words">{testCase.steps}</p>
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-medium text-slate-700 mb-1">Expected Result:</h5>
                                <p className="text-slate-600 whitespace-pre-wrap break-words">{testCase.expectedResult}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {testCase.category}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToClipboard(`${testCase.title}\n\n${testCase.description}\n\nSteps: ${testCase.steps}\n\nExpected: ${testCase.expectedResult}`)}
                                className="h-6 px-2 text-xs whitespace-nowrap"
                              >
                                <Copy className="w-3 h-3 mr-1 flex-shrink-0" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-slate-500 break-words">
              {generatedTestCases.length > 0 && (
                <span>Select the test cases you want to add to your project</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="whitespace-nowrap">
                Cancel
              </Button>
              {generatedTestCases.length > 0 && (
                <Button 
                  onClick={handleAddSelectedTestCases}
                  disabled={selectedTestCases.size === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 whitespace-nowrap"
                >
                  <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                  Add Selected ({selectedTestCases.size})
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 