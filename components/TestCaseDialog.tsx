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
import { FileText, Save, X, Edit3, Eye, Loader2, CheckCircle, AlertCircle, History, User, Calendar, Globe, Layers, Target, Clock, Settings, Info } from "lucide-react"
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
            // NEW: Minimal Single Unified View Mode Layout
            <div className="py-3">
              {/* Single Unified Card - All Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-5 pb-4 border-b border-slate-100">
                  <div className="flex-1 pr-4">
                    <h2 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{formData.testCase}</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">{formData.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeStyle(formData.status)}`}>
                      {formData.status}
                    </div>
                    {formData.priority && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeStyle(formData.priority)}`}>
                        {formData.priority}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 pb-4 border-b border-slate-100">
                  {formData.category && (
                    <div className="flex items-center gap-2">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Category</span>
                        <p className="text-sm font-medium text-slate-900">{formData.category}</p>
                      </div>
                    </div>
                  )}
                  {formData.platform && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Platform</span>
                        <p className="text-sm font-medium text-slate-900">{formData.platform}</p>
                      </div>
                    </div>
                  )}
                  {formData.assignedTester && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-slate-400" />
                      <div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Assigned To</span>
                        <p className="text-sm font-medium text-slate-900">{formData.assignedTester}</p>
                      </div>
                    </div>
                  )}
                  {formData.executionDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Execution Date</span>
                        <p className="text-sm font-medium text-slate-900">{formData.executionDate}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Steps & Expected Result */}
                {(formData.stepsToReproduce || formData.expectedResult) && (
                  <div className="mb-5 pb-4 border-b border-slate-100">
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center">
                        <Target className="w-3 h-3 text-blue-600" />
                      </div>
                      Test Steps & Expected Result
                    </h3>
                    
                    <div className="space-y-3">
                      {formData.stepsToReproduce && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            Steps to Reproduce
                          </h4>
                          <div className="bg-blue-50 rounded-md p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-blue-100">
                            {formatTestSteps(formData.stepsToReproduce)}
                          </div>
                        </div>
                      )}
                      
                      {formData.expectedResult && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            Expected Result
                          </h4>
                          <div className="bg-green-50 rounded-md p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-green-100">
                            {formatExpectedResult(formData.expectedResult)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                {(formData.prerequisites || formData.actualResult || formData.notes || formData.environment) && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center">
                        <Info className="w-3 h-3 text-slate-600" />
                      </div>
                      Additional Details
                    </h3>
                    
                    <div className="space-y-3">
                      {formData.prerequisites && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Settings className="w-3 h-3 text-slate-400" />
                            Prerequisites
                          </h4>
                          <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
                            {formData.prerequisites}
                          </div>
                        </div>
                      )}
                      
                      {formData.actualResult && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-slate-400" />
                            Actual Result
                          </h4>
                          <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
                            {formData.actualResult}
                          </div>
                        </div>
                      )}
                      
                      {formData.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FileText className="w-3 h-3 text-slate-400" />
                            Notes
                          </h4>
                          <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
                            {formData.notes}
                          </div>
                        </div>
                      )}
                      
                      {formData.environment && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Globe className="w-3 h-3 text-slate-400" />
                            Environment
                          </h4>
                          <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-700 border border-slate-200">
                            {formData.environment}
                          </div>
                        </div>
                      )}
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

          <DialogFooter className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {isViewMode && onEdit && (
                  <Button
                    type="button"
                    onClick={onEdit}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Test Case
                  </Button>
                )}
                {isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsStatusHistoryOpen(true)}
                    className="flex items-center gap-2 text-sm"
                  >
                    <History className="w-4 h-4" />
                    Status History
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-sm"
                >
                  Close
                </Button>
                {!isViewMode && (
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
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