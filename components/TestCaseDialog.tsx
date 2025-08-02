"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { TestCase, TestSuite } from "@/types/qa-types"
import { STATUS_OPTIONS, PRIORITY_OPTIONS, PLATFORM_OPTIONS, CATEGORY_OPTIONS, ENVIRONMENT_OPTIONS } from "@/lib/constants"
import { FileText, Save, X, Edit3, Eye, Loader2, CheckCircle, AlertCircle, History, User, Calendar, Globe, Layers, Target, Clock, Settings, Info, Bug } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getStatusBadgeVariant, getStatusBadgeStyle, getPriorityBadgeVariant, getPriorityBadgeStyle, formatTestSteps, formatExpectedResult } from "@/lib/utils"
import { StatusHistoryDialog } from './StatusHistoryDialog'

interface TestCaseDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (testCase: Partial<TestCase> & { testCase: string; description: string; status: TestCase["status"] }) => void
  testCase: TestCase | null
  isViewMode?: boolean
  onEdit?: () => void
  testSuites: TestSuite[]
  selectedSuiteId?: string | null
}

export function TestCaseDialog({
  isOpen,
  onClose,
  onSubmit,
  testCase,
  isViewMode = false,
  onEdit,
  testSuites,
  selectedSuiteId
}: TestCaseDialogProps) {
  const [formData, setFormData] = useState({
    testCase: "",
    description: "",
    expectedResult: "",
    status: "Pending" as TestCase["status"],
    priority: undefined as TestCase["priority"] | undefined,
    category: undefined as TestCase["category"] | undefined,
    assignedTester: "",
    executionDate: "",
    notes: "",
    actualResult: "",
    environment: "",
    prerequisites: "",
    platform: "",
    stepsToReproduce: "",
    suiteId: selectedSuiteId || ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false)

  // Status configuration function
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
      passed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Passed' },
      failed: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Failed' },
      blocked: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Bug, label: 'Blocked' },
      'In Progress': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, label: 'In Progress' },
      'Pass': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Pass' },
      'Fail': { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Fail' },
      'Blocked': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Bug, label: 'Blocked' }
    };
    return configs[status.toLowerCase() as keyof typeof configs] || configs.pending;
  };

  useEffect(() => {
    // Reset form data when modal opens/closes or test case changes
    if (isOpen) {
      if (testCase) {
        setFormData({
          testCase: testCase.testCase,
          description: testCase.description,
          expectedResult: testCase.expectedResult,
          status: testCase.status,
          priority: testCase.priority,
          category: testCase.category,
          assignedTester: testCase.assignedTester,
          executionDate: testCase.executionDate,
          notes: testCase.notes,
          actualResult: testCase.actualResult,
          environment: testCase.environment,
          prerequisites: testCase.prerequisites,
          platform: testCase.platform,
          stepsToReproduce: testCase.stepsToReproduce,
          suiteId: testCase.suiteId || selectedSuiteId || ""
        })
      } else {
        setFormData({
          testCase: "",
          description: "",
          expectedResult: "",
          status: "Pending",
          priority: undefined,
          category: undefined,
          assignedTester: "",
          executionDate: "",
          notes: "",
          actualResult: "",
          environment: "",
          prerequisites: "",
          platform: "",
          stepsToReproduce: "",
          suiteId: selectedSuiteId || ""
        })
      }
      setErrors({})
    } else {
      // Clean up state when modal closes
      setFormData({
        testCase: "",
        description: "",
        expectedResult: "",
        status: "Pending",
        priority: undefined,
        category: undefined,
        assignedTester: "",
        executionDate: "",
        notes: "",
        actualResult: "",
        environment: "",
        prerequisites: "",
        platform: "",
        stepsToReproduce: "",
        suiteId: ""
      })
      setErrors({})
      setIsSubmitting(false)
      setIsStatusHistoryOpen(false)
    }
  }, [isOpen, testCase, selectedSuiteId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.testCase.trim()) {
      newErrors.testCase = "Test case name is required"
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
      toast({
        title: testCase ? "Test Case Updated" : "Test Case Created",
        description: testCase ? "Test case has been updated successfully." : "Test case has been created successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save test case. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {isViewMode ? (
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  {isViewMode ? "View Test Case" : (testCase ? "Edit Test Case" : "Create New Test Case")}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  {isViewMode ? "Review test case details" : "Fill in the test case information"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {isViewMode ? (
            // Updated View Mode Layout with improved design
            <div className="py-3">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                {/* Header with Title and Status */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-slate-900 leading-tight">{formData.testCase}</h2>
                      {(() => {
                        const statusConfig = getStatusConfig(formData.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                            <StatusIcon size={14} />
                            {statusConfig.label}
                  </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Description Section */}
                {formData.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Description</h3>
                    <p className="text-slate-600 leading-relaxed">{formData.description}</p>
                        </div>
                      )}
                      
                {/* Steps to Reproduce Section */}
                {formData.stepsToReproduce && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Steps to Reproduce</h3>
                    <ol className="space-y-2">
                      {formatTestSteps(formData.stepsToReproduce).split('\n').map((step, index) => (
                        step.trim() && (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-slate-600 leading-relaxed">{step.trim()}</span>
                          </li>
                        )
                      ))}
                    </ol>
                  </div>
                )}

                {/* Expected Result Section */}
                {formData.expectedResult && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Expected Result</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-slate-700 leading-relaxed">{formatExpectedResult(formData.expectedResult)}</p>
                    </div>
                  </div>
                )}


              </div>
            </div>
          ) : (
            // NEW: Improved Edit Mode Layout
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              {/* Basic Information Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="test-case" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Test Case Name
                      {!testCase && <span className="text-red-500">*</span>}
                      {errors.testCase && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </Label>
                    <Input
                      id="test-case"
                      value={formData.testCase}
                      onChange={(e) => handleInputChange("testCase", e.target.value)}
                      placeholder="Enter test case name"
                      required={!testCase}
                      className={`bg-white border-2 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 ${
                        errors.testCase ? 'border-red-300 focus:border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.testCase && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.testCase}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="status" className="text-sm font-semibold text-slate-700">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(status => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                status === "Pass" ? "bg-green-500" :
                                status === "Fail" ? "bg-red-500" :
                                status === "In Progress" ? "bg-blue-500" :
                                status === "Blocked" ? "bg-orange-500" : "bg-gray-500"
                              }`}></div>
                              {status}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Description
                    {!testCase && <span className="text-red-500">*</span>}
                    {errors.description && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what this test case is testing..."
                    required={!testCase}
                    rows={3}
                    className={`bg-white border-2 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 ${
                      errors.description ? 'border-red-300 focus:border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Test Details Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Test Details</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="steps" className="text-sm font-semibold text-slate-700">Steps to Reproduce</Label>
                    <Textarea
                      id="steps"
                      value={formData.stepsToReproduce}
                      onChange={(e) => handleInputChange("stepsToReproduce", e.target.value)}
                      placeholder="1. First step&#10;2. Second step&#10;3. Third step"
                      rows={4}
                      className="bg-white border-2 border-slate-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="expected-result" className="text-sm font-semibold text-slate-700">Expected Result</Label>
                    <Textarea
                      id="expected-result"
                      value={formData.expectedResult}
                      onChange={(e) => handleInputChange("expectedResult", e.target.value)}
                      placeholder="Describe the expected outcome..."
                      rows={4}
                      className="bg-white border-2 border-slate-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Additional Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="priority" className="text-sm font-semibold text-slate-700">Priority</Label>
                    <Select value={formData.priority || ""} onValueChange={(value) => handleInputChange("priority", value)}>
                      <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(priority => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-semibold text-slate-700">Category</Label>
                    <Select value={formData.category || ""} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="platform" className="text-sm font-semibold text-slate-700">Platform</Label>
                    <Select value={formData.platform || ""} onValueChange={(value) => handleInputChange("platform", value)}>
                      <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map(platform => (
                          <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="assigned-tester" className="text-sm font-semibold text-slate-700">Assigned Tester</Label>
                    <Input
                      id="assigned-tester"
                      value={formData.assignedTester}
                      onChange={(e) => handleInputChange("assignedTester", e.target.value)}
                      placeholder="Enter tester name"
                      className="bg-white border-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="execution-date" className="text-sm font-semibold text-slate-700">Execution Date</Label>
                    <Input
                      id="execution-date"
                      type="date"
                      value={formData.executionDate}
                      onChange={(e) => handleInputChange("executionDate", e.target.value)}
                      className="bg-white border-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="environment" className="text-sm font-semibold text-slate-700">Environment</Label>
                    <Select value={formData.environment || ""} onValueChange={(value) => handleInputChange("environment", value)}>
                      <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENVIRONMENT_OPTIONS.map(env => (
                          <SelectItem key={env} value={env}>{env}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <Label htmlFor="prerequisites" className="text-sm font-semibold text-slate-700">Prerequisites</Label>
                  <Textarea
                    id="prerequisites"
                    value={formData.prerequisites}
                    onChange={(e) => handleInputChange("prerequisites", e.target.value)}
                    placeholder="Any prerequisites or setup required..."
                    rows={3}
                    className="bg-white border-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500 transition-all duration-200"
                  />
                </div>
              </div>
            </form>
          )}

          <DialogFooter className="pt-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Close
              </Button>
                {isViewMode && onEdit && (
                  <Button
                    type="button"
                    onClick={onEdit}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Test Case
                  </Button>
                )}
              {!isViewMode && (
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {testCase ? "Update Test Case" : "Create Test Case"}
                  </Button>
                )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

             {isStatusHistoryOpen && testCase && (
         <StatusHistoryDialog
           isOpen={isStatusHistoryOpen}
           onClose={() => setIsStatusHistoryOpen(false)}
           testCaseId={testCase.id}
           testCaseName={testCase.testCase}
         />
       )}
    </>
  )
} 