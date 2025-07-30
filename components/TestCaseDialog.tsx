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
import { FileText, Save, X, Edit3, Eye, Loader2, CheckCircle, AlertCircle, History } from "lucide-react"
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
  }, [testCase, selectedSuiteId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Only validate required fields for new test cases, not for editing
    if (!testCase) {
      // For new test cases, these fields are required
      if (!formData.testCase.trim()) {
        newErrors.testCase = "Test case name is required"
      }

      if (!formData.description.trim()) {
        newErrors.description = "Description is required"
      }

      // Test suite is now optional - removed validation
    } else {
      // For editing, only validate that test case name is not completely empty
      if (formData.testCase.trim() === "") {
        newErrors.testCase = "Test case name cannot be empty"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isViewMode) return

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      toast({
        title: "Success",
        description: testCase ? "Test case updated successfully" : "Test case created successfully",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save test case",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (!isViewMode) {
      setFormData(prev => ({ ...prev, [field]: value }))
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: "" }))
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                {isViewMode ? (
                  <Eye className="w-6 h-6 text-white" />
                ) : testCase ? (
                  <Edit3 className="w-6 h-6 text-white" />
                ) : (
                  <FileText className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-slate-900">
                  {isViewMode ? "View Test Case" : testCase ? "Edit Test Case" : "Create Test Case"}
                </DialogTitle>
                <DialogDescription className="text-slate-600 mt-2 text-base">
                  {isViewMode 
                    ? "Review test case details and specifications" 
                    : testCase 
                    ? "Update the test case information and requirements" 
                    : "Create a comprehensive test case with all necessary details"
                  }
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {isViewMode ? (
          // Clean View Mode Layout
          <div className="space-y-6">
            {/* Header Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{formData.testCase}</h2>
                  <p className="text-slate-600 text-base leading-relaxed">{formData.description}</p>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeStyle(formData.status)}`}>
                    {formData.status}
                  </div>
                  {formData.priority && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityBadgeStyle(formData.priority)}`}>
                      {formData.priority}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Info Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-blue-200">
                {formData.category && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</span>
                    <p className="text-sm font-medium text-slate-900">{formData.category}</p>
                  </div>
                )}
                {formData.platform && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Platform</span>
                    <p className="text-sm font-medium text-slate-900">{formData.platform}</p>
                  </div>
                )}
                {formData.assignedTester && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Assigned To</span>
                    <p className="text-sm font-medium text-slate-900">{formData.assignedTester}</p>
                  </div>
                )}
                {formData.executionDate && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Execution Date</span>
                    <p className="text-sm font-medium text-slate-900">{formData.executionDate}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Steps & Expected Result */}
            {(formData.stepsToReproduce || formData.expectedResult) && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Test Steps & Expected Result
                </h3>
                
                <div className="space-y-4">
                  {formData.stepsToReproduce && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Steps to Reproduce</h4>
                      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {formatTestSteps(formData.stepsToReproduce)}
                      </div>
                    </div>
                  )}
                  
                  {formData.expectedResult && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Expected Result</h4>
                      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {formatExpectedResult(formData.expectedResult)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details - Collapsible */}
            {(formData.prerequisites || formData.actualResult || formData.notes || formData.environment) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <details className="group">
                  <summary className="p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        Additional Details
                      </h3>
                      <div className="text-slate-400 group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </summary>
                  
                  <div className="px-6 pb-6 space-y-4">
                    {formData.prerequisites && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Prerequisites</h4>
                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {formData.prerequisites}
                        </div>
                      </div>
                    )}
                    
                    {formData.actualResult && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Actual Result</h4>
                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {formData.actualResult}
                        </div>
                      </div>
                    )}
                    
                    {formData.notes && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Notes</h4>
                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {formData.notes}
                        </div>
                      </div>
                    )}
                    
                    {formData.environment && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Environment</h4>
                        <p className="text-sm text-slate-700">{formData.environment}</p>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        ) : (
          // Original Edit Mode Layout
          <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  required={!testCase} // Only required for new test cases
                  disabled={isViewMode}
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
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)} disabled={isViewMode}>
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
              
              <div className="space-y-3">
                <Label htmlFor="test-suite" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Test Suite (Optional)
                  {errors.suiteId && <AlertCircle className="w-4 h-4 text-red-500" />}
                </Label>
                <Select 
                  value={formData.suiteId || "none"} 
                  onValueChange={(value) => handleInputChange("suiteId", value === "none" ? "" : value)} 
                  disabled={isViewMode}
                >
                  <SelectTrigger className={`bg-white border-2 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.suiteId ? 'border-red-300 focus:border-red-500' : 'border-slate-300'
                  }`}>
                    <SelectValue placeholder="Select test suite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (No Test Suite)</SelectItem>
                    {testSuites.map(suite => (
                      <SelectItem key={suite.id} value={suite.id}>{suite.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.suiteId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.suiteId}
                  </p>
                )}
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
                placeholder="Describe what this test case validates..."
                required={!testCase} // Only required for new test cases
                rows={4}
                disabled={isViewMode}
                className={`bg-white border-2 focus:border-blue-500 focus:ring-blue-500 resize-none transition-all duration-200 ${
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
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900">Test Details</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="priority" className="text-sm font-semibold text-slate-700">Priority</Label>
                <Select value={formData.priority || ""} onValueChange={(value) => handleInputChange("priority", value)} disabled={isViewMode}>
                  <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            priority === "High" ? "bg-red-500" :
                            priority === "Medium" ? "bg-yellow-500" : "bg-green-500"
                          }`}></div>
                          {priority}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="category" className="text-sm font-semibold text-slate-700">Category</Label>
                <Select value={formData.category || ""} onValueChange={(value) => handleInputChange("category", value)} disabled={isViewMode}>
                  <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Label htmlFor="steps-to-reproduce" className="text-sm font-semibold text-slate-700">Steps to Reproduce</Label>
              <Textarea
                id="steps-to-reproduce"
                value={formData.stepsToReproduce}
                onChange={(e) => handleInputChange("stepsToReproduce", e.target.value)}
                placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Verify that..."
                rows={4}
                disabled={isViewMode}
                className="bg-white border-2 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
              />
            </div>
            
            <div className="mt-6 space-y-3">
              <Label htmlFor="expected-result" className="text-sm font-semibold text-slate-700">Expected Result</Label>
              <Textarea
                id="expected-result"
                value={formData.expectedResult}
                onChange={(e) => handleInputChange("expectedResult", e.target.value)}
                placeholder="Describe the expected outcome..."
                rows={3}
                disabled={isViewMode}
                className="bg-white border-2 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Environment & Assignment Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900">Environment & Assignment</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="platform" className="text-sm font-semibold text-slate-700">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => handleInputChange("platform", value)} disabled={isViewMode}>
                  <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-purple-500 focus:ring-purple-500">
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
                <Label htmlFor="environment" className="text-sm font-semibold text-slate-700">Environment</Label>
                <Select value={formData.environment} onValueChange={(value) => handleInputChange("environment", value)} disabled={isViewMode}>
                  <SelectTrigger className="bg-white border-2 border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENT_OPTIONS.map(env => (
                      <SelectItem key={env} value={env}>{env}</SelectItem>
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
                  placeholder="Enter assigned tester"
                  disabled={isViewMode}
                  className="bg-white border-2 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Label htmlFor="execution-date" className="text-sm font-semibold text-slate-700">Execution Date</Label>
              <Input
                id="execution-date"
                type="date"
                value={formData.executionDate}
                onChange={(e) => handleInputChange("executionDate", e.target.value)}
                disabled={isViewMode}
                className="bg-white border-2 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
          
          {/* Additional Information Section */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900">Additional Information</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="prerequisites" className="text-sm font-semibold text-slate-700">Prerequisites</Label>
                <Textarea
                  id="prerequisites"
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange("prerequisites", e.target.value)}
                  placeholder="List any prerequisites..."
                  rows={3}
                  disabled={isViewMode}
                  className="bg-white border-2 border-slate-300 focus:border-orange-500 focus:ring-orange-500 resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="actual-result" className="text-sm font-semibold text-slate-700">Actual Result</Label>
                <Textarea
                  id="actual-result"
                  value={formData.actualResult}
                  onChange={(e) => handleInputChange("actualResult", e.target.value)}
                  placeholder="Enter actual result after execution..."
                  rows={3}
                  disabled={isViewMode}
                  className="bg-white border-2 border-slate-300 focus:border-orange-500 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Label htmlFor="notes" className="text-sm font-semibold text-slate-700">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Add any additional notes or observations..."
                rows={3}
                disabled={isViewMode}
                className="bg-white border-2 border-slate-300 focus:border-orange-500 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="pt-8 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {isViewMode && onEdit && (
                  <Button 
                    type="button" 
                    onClick={onEdit} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Test Case
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isViewMode ? "Close" : "Cancel"}
                </Button>
                
                {!isViewMode && (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {testCase ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {testCase ? "Update Test Case" : "Create Test Case"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </form>
        )}
        
        {/* Footer for View Mode */}
        {isViewMode && (
          <div className="pt-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {onEdit && (
                  <Button 
                    type="button" 
                    onClick={onEdit} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Test Case
                  </Button>
                )}
                {testCase && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsStatusHistoryOpen(true)}
                    className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Status History
                  </Button>
                )}
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      
      {/* Status History Dialog */}
      {testCase && (
        <StatusHistoryDialog
          isOpen={isStatusHistoryOpen}
          onClose={() => setIsStatusHistoryOpen(false)}
          testCaseId={testCase.id}
          testCaseName={testCase.testCase}
        />
      )}
    </Dialog>
  )
} 