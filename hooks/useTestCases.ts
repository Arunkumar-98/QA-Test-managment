import { useState, useCallback, useEffect } from 'react'
import { TestCase } from '@/types/qa-types'
import { generateId } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { testCaseService } from '@/lib/supabase-service'

export const useTestCases = (currentProjectId: string) => {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Load test cases from Supabase on mount and when project changes
  useEffect(() => {
    const loadTestCases = async () => {
      console.log('🔍 Loading test cases for projectId:', currentProjectId)
      
      if (!currentProjectId) {
        console.log('⚠️ No currentProjectId provided, skipping test case load')
        return
      }
      
      setLoading(true)
      try {
        console.log('📡 Calling testCaseService.getAll with projectId:', currentProjectId)
        const data = await testCaseService.getAll(currentProjectId)
        console.log('✅ Test cases loaded successfully:', data.length, 'cases')
        setTestCases(data)
      } catch (error) {
        console.error('❌ Error loading test cases:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          currentProjectId,
          error
        })
        toast({
          title: "Error",
          description: `Failed to load test cases: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadTestCases()
  }, [currentProjectId])

  const addTestCase = useCallback(async (testCase: Partial<TestCase> & { testCase: string; description: string; status: TestCase["status"] }) => {
    const newTestCase: Omit<TestCase, 'id'> = {
      testCase: testCase.testCase,
      description: testCase.description,
      status: testCase.status,
      expectedResult: testCase.expectedResult || "",
      priority: testCase.priority || "Medium",
      category: testCase.category || "Functional",
      assignedTester: testCase.assignedTester || "",
      executionDate: testCase.executionDate || "",
      notes: testCase.notes || "",
      actualResult: testCase.actualResult || "",
      environment: testCase.environment || "",
      prerequisites: testCase.prerequisites || "",
      platform: testCase.platform || "",
      stepsToReproduce: testCase.stepsToReproduce || "",
      projectId: testCase.projectId || currentProjectId,
      suiteId: testCase.suiteId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      const created = await testCaseService.create(newTestCase)
      setTestCases(prev => [...prev, created])
      toast({
        title: "Success",
        description: "Test case added successfully",
      })
      return created
    } catch (error) {
      console.error('Error adding test case:', error)
      toast({
        title: "Error",
        description: "Failed to add test case",
        variant: "destructive",
      })
      throw error
    }
  }, [currentProjectId])

  const updateTestCase = useCallback(async (id: string, updates: Partial<TestCase>) => {
    try {
      const updated = await testCaseService.update(id, updates)
      setTestCases(prev => prev.map(tc => tc.id === id ? updated : tc))
      toast({
        title: "Success",
        description: "Test case updated successfully",
      })
    } catch (error) {
      console.error('Error updating test case:', error)
      toast({
        title: "Error",
        description: "Failed to update test case",
        variant: "destructive",
      })
    }
  }, [])

  const removeTestCase = useCallback(async (id: string) => {
    try {
      await testCaseService.delete(id)
      setTestCases(prev => prev.filter(tc => tc.id !== id))
      setSelectedTestCases(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      toast({
        title: "Success",
        description: "Test case removed successfully",
      })
    } catch (error) {
      console.error('Error removing test case:', error)
      toast({
        title: "Error",
        description: "Failed to remove test case",
        variant: "destructive",
      })
    }
  }, [])

  const removeSelectedTestCases = useCallback(async () => {
    const selectedIds = Array.from(selectedTestCases)
    if (selectedIds.length === 0) return

    try {
      await testCaseService.deleteMultiple(selectedIds)
      setTestCases(prev => prev.filter(tc => !selectedTestCases.has(tc.id)))
      setSelectedTestCases(new Set())
      toast({
        title: "Success",
        description: `${selectedIds.length} test case(s) removed successfully`,
      })
    } catch (error) {
      console.error('Error removing selected test cases:', error)
      toast({
        title: "Error",
        description: "Failed to remove selected test cases",
        variant: "destructive",
      })
    }
  }, [selectedTestCases])

  const updateTestCaseStatus = useCallback(async (id: string, status: TestCase["status"]) => {
    try {
      await testCaseService.update(id, { status })
      setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, status } : tc))
    } catch (error) {
      console.error('Error updating test case status:', error)
      toast({
        title: "Error",
        description: "Failed to update test case status",
        variant: "destructive",
      })
    }
  }, [])

  const bulkUpdateStatus = useCallback(async (status: TestCase["status"]) => {
    const selectedIds = Array.from(selectedTestCases)
    if (selectedIds.length === 0) return

    try {
      await Promise.all(selectedIds.map(id => testCaseService.update(id, { status })))
      setTestCases(prev => prev.map(tc => selectedTestCases.has(tc.id) ? { ...tc, status } : tc))
      toast({
        title: "Success",
        description: `${selectedIds.length} test case(s) status updated to ${status}`,
      })
    } catch (error) {
      console.error('Error bulk updating test case status:', error)
      toast({
        title: "Error",
        description: "Failed to update test case statuses",
        variant: "destructive",
      })
    }
  }, [selectedTestCases])

  const toggleTestCaseSelection = useCallback((id: string) => {
    setSelectedTestCases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback((filteredTestCases?: TestCase[]) => {
    const testCasesToToggle = filteredTestCases || testCases
    setSelectedTestCases(prev => {
      const currentSelectedIds = new Set(prev)
      const testCaseIds = new Set(testCasesToToggle.map(tc => tc.id))
      
      // Check if all filtered test cases are currently selected
      const allSelected = testCaseIds.size > 0 && Array.from(testCaseIds).every(id => currentSelectedIds.has(id))
      
      if (allSelected) {
        // Deselect all filtered test cases
        const newSelected = new Set(currentSelectedIds)
        Array.from(testCaseIds).forEach(id => newSelected.delete(id))
        return newSelected
      } else {
        // Select all filtered test cases (keep existing selections)
        const newSelected = new Set(currentSelectedIds)
        Array.from(testCaseIds).forEach(id => newSelected.add(id))
        return newSelected
      }
    })
  }, [testCases])

  const clearAllTestCases = useCallback(async () => {
    if (testCases.length === 0) return

    try {
      const allIds = testCases.map(tc => tc.id)
      await testCaseService.deleteMultiple(allIds)
      setTestCases([])
      setSelectedTestCases(new Set())
      toast({
        title: "Success",
        description: "All test cases cleared successfully",
      })
    } catch (error) {
      console.error('Error clearing all test cases:', error)
      toast({
        title: "Error",
        description: "Failed to clear all test cases",
        variant: "destructive",
      })
    }
  }, [testCases])

  const setTestCasesData = useCallback((testCases: TestCase[]) => {
    setTestCases(testCases)
  }, [])

  return {
    testCases,
    selectedTestCases,
    loading,
    addTestCase,
    updateTestCase,
    removeTestCase,
    removeSelectedTestCases,
    updateTestCaseStatus,
    bulkUpdateStatus,
    toggleTestCaseSelection,
    toggleSelectAll,
    clearAllTestCases,
    setTestCases: setTestCasesData
  }
} 