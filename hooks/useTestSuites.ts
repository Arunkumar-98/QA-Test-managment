import { useState, useCallback, useEffect } from 'react'
import { TestSuite, CreateTestSuiteInput } from '@/types/qa-types'
import { testSuiteService } from '@/lib/supabase-service'

export const useTestSuites = (currentProjectId: string) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [loading, setLoading] = useState(false)

  // Load test suites from Supabase
  useEffect(() => {
    const loadTestSuites = async () => {
      if (!currentProjectId) return
      
      setLoading(true)
      try {
        console.log('Loading test suites for projectId:', currentProjectId)
        const data = await testSuiteService.getAll(currentProjectId)
        console.log('Loaded test suites:', data.length)
        setTestSuites(data)
      } catch (error) {
        console.error('Failed to load test suites:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTestSuites()
  }, [currentProjectId])

  const createTestSuite = useCallback(async (suite: CreateTestSuiteInput) => {
    try {
      const newSuite = await testSuiteService.create({
        ...suite,
        projectId: suite.projectId || currentProjectId
      })
      setTestSuites(prev => [newSuite, ...prev])
      return newSuite
    } catch (error) {
      console.error('Failed to create test suite:', error)
      throw error
    }
  }, [currentProjectId])

  const updateTestSuite = useCallback(async (id: string, updates: Partial<TestSuite>) => {
    try {
      const updatedSuite = await testSuiteService.update(id, updates)
      setTestSuites(prev => prev.map(suite => suite.id === id ? updatedSuite : suite))
      return updatedSuite
    } catch (error) {
      console.error('Failed to update test suite:', {
        id,
        updates,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }, [])

  const deleteTestSuite = useCallback(async (id: string) => {
    try {
      await testSuiteService.delete(id)
      setTestSuites(prev => prev.filter(suite => suite.id !== id))
    } catch (error) {
      console.error('Failed to delete test suite:', error)
      throw error
    }
  }, [])

  const addTestCaseToSuite = useCallback(async (suiteId: string, testCaseId: string) => {
    const suite = testSuites.find(s => s.id === suiteId)
    if (!suite) return

    const updatedTestCaseIds = [...suite.testCaseIds, testCaseId]
    const totalTests = (suite.totalTests || 0) + 1

    await updateTestSuite(suiteId, {
      testCaseIds: updatedTestCaseIds,
      totalTests
    })
  }, [testSuites, updateTestSuite])

  const removeTestCaseFromSuite = useCallback(async (suiteId: string, testCaseId: string) => {
    const suite = testSuites.find(s => s.id === suiteId)
    if (!suite) return

    const updatedTestCaseIds = suite.testCaseIds.filter(id => id !== testCaseId)
    const totalTests = Math.max(0, (suite.totalTests || 0) - 1)

    await updateTestSuite(suiteId, {
      testCaseIds: updatedTestCaseIds,
      totalTests
    })
  }, [testSuites, updateTestSuite])

  const updateSuiteStatistics = useCallback(async (suiteId: string, stats: {
    totalTests: number
    passedTests: number
    failedTests: number
    pendingTests: number
  }) => {
    await updateTestSuite(suiteId, stats)
  }, [updateTestSuite])

  const setTestSuitesData = useCallback((suites: TestSuite[]) => {
    setTestSuites(suites)
  }, [])

  return {
    testSuites,
    loading,
    createTestSuite,
    updateTestSuite,
    deleteTestSuite,
    addTestCaseToSuite,
    removeTestCaseFromSuite,
    updateSuiteStatistics,
    setTestSuites: setTestSuitesData
  }
} 