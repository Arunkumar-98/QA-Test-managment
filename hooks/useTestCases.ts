import { useState, useCallback, useEffect } from 'react'
import { TestCase } from '@/types/qa-types'
import { generateId } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { testCaseService } from '@/lib/supabase-service'
import { CreateTestCaseInput } from '@/types/qa-types'
import { errorHandler, createSupabaseError, createDatabaseError } from '@/lib/error-handler'
import { loadingStateManager, LOADING_TYPES } from '@/lib/loading-states'


export const useTestCases = (currentProjectId: string) => {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Load test cases from Supabase on mount and when project changes
  useEffect(() => {
    const loadTestCases = async () => {
      console.log('🔍 Loading test cases for projectId:', currentProjectId)
      
      if (!currentProjectId) {
        console.log('⚠️ No currentProjectId provided, skipping test case load')
        return
      }
      
      const loadingId = loadingStateManager.startLoading(
        LOADING_TYPES.LOAD_TEST_CASES,
        { projectId: currentProjectId, component: 'useTestCases' },
        'Loading test cases...'
      )
      
      setLoading(true)
      try {
        console.log('📡 Calling testCaseService.getAll with projectId:', currentProjectId)
        const data = await testCaseService.getAll(currentProjectId)
        console.log('✅ Test cases loaded successfully:', data.length, 'cases')
        setTestCases(data)
        loadingStateManager.completeLoading(loadingId, `Loaded ${data.length} test cases`)
      } catch (error) {
        console.error('❌ Error loading test cases:', error)
        const appError = createSupabaseError(error, {
          projectId: currentProjectId,
          component: 'useTestCases',
          action: 'loadTestCases'
        })
        
        toast({
          title: appError.message,
          description: appError.userMessage,
          variant: "destructive",
        })
        
        loadingStateManager.completeLoadingWithError(loadingId, error, appError.userMessage)
      } finally {
        setLoading(false)
      }
    }

    loadTestCases()
  }, [currentProjectId])

  const addTestCase = useCallback(async (testCase: Partial<TestCase> & { testCase: string; description: string; status: TestCase["status"] }) => {
    const newTestCase: CreateTestCaseInput = {
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
      automationScript: testCase.automationScript
    }

    const loadingId = loadingStateManager.startLoading(
      LOADING_TYPES.CREATE_TEST_CASE,
      { projectId: currentProjectId, component: 'useTestCases' },
      'Creating test case...'
    )

    try {
      const created = await testCaseService.create(newTestCase)
      setTestCases(prev => [...prev, created])
      loadingStateManager.completeLoading(loadingId, 'Test case created successfully')
      toast({
        title: "Success",
        description: "Test case added successfully",
      })
      return created
    } catch (error) {
      console.error('Error adding test case:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        newTestCase,
        currentProjectId
      })
      
      const appError = createSupabaseError(error, {
        projectId: currentProjectId,
        component: 'useTestCases',
        action: 'addTestCase',
        additionalData: { testCase: newTestCase.testCase }
      })
      
      toast({
        title: appError.message,
        description: appError.userMessage,
        variant: "destructive",
      })
      
      loadingStateManager.completeLoadingWithError(loadingId, error, appError.userMessage)
      throw error
    }
  }, [currentProjectId])

  const updateTestCase = useCallback(async (id: string, updates: Partial<TestCase>) => {
    try {
      const updated = await testCaseService.update(id, updates)
      setTestCases(prev => prev.map(tc => {
        if (tc.id === id) {
          // Preserve the original updated_at to prevent reordering
          return { ...updated, updatedAt: tc.updatedAt }
        }
        return tc
      }))
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
      console.log('🗑️ Removing single test case:', id)
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
      console.error('Error removing test case:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        testCaseId: id
      })
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

    setDeleteLoading(true)
    try {
      await testCaseService.deleteMultiple(selectedIds)
      setTestCases(prev => prev.filter(tc => !selectedTestCases.has(tc.id)))
      setSelectedTestCases(new Set())
      toast({
        title: "Success",
        description: `${selectedIds.length} test case(s) removed successfully`,
      })
    } catch (error) {
      console.error('Error removing selected test cases:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        selectedIds,
        selectedIdsLength: selectedIds.length
      })
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast({
        title: "Error",
        description: `Failed to remove selected test cases: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }, [selectedTestCases])

  const updateTestCaseStatus = useCallback(async (id: string, status: TestCase["status"]) => {
    try {
      await testCaseService.update(id, { status })
      setTestCases(prev => prev.map(tc => {
        if (tc.id === id) {
          // Preserve the original updated_at to prevent reordering
          return { ...tc, status, updatedAt: tc.updatedAt }
        }
        return tc
      }))
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
      setTestCases(prev => prev.map(tc => {
        if (selectedTestCases.has(tc.id)) {
          // Preserve the original updated_at to prevent reordering
          return { ...tc, status, updatedAt: tc.updatedAt }
        }
        return tc
      }))
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
      console.log('🗑️ Clearing all test cases:', { count: allIds.length, ids: allIds })
      await testCaseService.deleteMultiple(allIds)
      setTestCases([])
      setSelectedTestCases(new Set())
      toast({
        title: "Success",
        description: "All test cases cleared successfully",
      })
    } catch (error) {
      console.error('Error clearing all test cases:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        testCaseCount: testCases.length
      })
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
    deleteLoading,
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