import { useState, useCallback, useMemo } from 'react'
import { TestCase, TestCaseStatus, TestCasePriority, TestCaseCategory } from '@/types/qa-types'

export type SavedFilter = {
  id: string
  name: string
  filters: {
    status: TestCaseStatus[]
    priority: TestCasePriority[]
    platform: string[]
    category: TestCaseCategory[]
    assignedTester: string[]
    suite: string[]
  }
  searchQuery: string
  createdAt: Date
}

export const useSearchAndFilter = (testCases: TestCase[]) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TestCaseStatus[]>([])
  const [priorityFilter, setPriorityFilter] = useState<TestCasePriority[]>([])
  const [platformFilter, setPlatformFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<TestCaseCategory[]>([])
  const [assignedTesterFilter, setAssignedTesterFilter] = useState<string[]>([])
  const [suiteFilter, setSuiteFilter] = useState<string[]>([])
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    if (!testCases || testCases.length === 0) {
      return {
        platforms: [],
        categories: [],
        testers: [],
        suites: []
      }
    }
    
    const platforms = [...new Set(testCases.map(tc => tc.platform).filter(Boolean))]
    const categories = [...new Set(testCases.map(tc => tc.category).filter(Boolean))]
    const testers = [...new Set(testCases.map(tc => tc.assignedTester).filter(Boolean))]
    const suites = [...new Set(testCases.map(tc => tc.suiteId).filter(Boolean))]

    return {
      platforms,
      categories,
      testers,
      suites
    }
  }, [testCases])

  // Filter test cases based on search and filters
  const filteredTestCases = useMemo(() => {
    if (!testCases || testCases.length === 0) {
      return []
    }
    
    return testCases.filter(testCase => {
      // Search query filter
      const matchesSearch = !searchQuery || 
        testCase.testCase.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.expectedResult.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.assignedTester.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.category.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(testCase.status)

      // Priority filter
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(testCase.priority)

      // Platform filter
      const matchesPlatform = platformFilter.length === 0 || platformFilter.includes(testCase.platform)

      // Category filter
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(testCase.category)

      // Assigned tester filter
      const matchesTester = assignedTesterFilter.length === 0 || assignedTesterFilter.includes(testCase.assignedTester)

      // Suite filter
      const matchesSuite = suiteFilter.length === 0 || (testCase.suiteId && suiteFilter.includes(testCase.suiteId))

      return matchesSearch && matchesStatus && matchesPriority && matchesPlatform && matchesCategory && matchesTester && matchesSuite
    })
  }, [testCases, searchQuery, statusFilter, priorityFilter, platformFilter, categoryFilter, assignedTesterFilter, suiteFilter])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStatusFilter([])
    setPriorityFilter([])
    setPlatformFilter([])
    setCategoryFilter([])
    setAssignedTesterFilter([])
    setSuiteFilter([])
    setSearchQuery('')
  }, [])

  // Save current filter
  const saveCurrentFilter = useCallback((filterName: string) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: filterName,
      filters: {
        status: statusFilter,
        priority: priorityFilter,
        platform: platformFilter,
        category: categoryFilter,
        assignedTester: assignedTesterFilter,
        suite: suiteFilter,
      },
      searchQuery,
      createdAt: new Date()
    }
    setSavedFilters(prev => [...prev, newFilter])
  }, [statusFilter, priorityFilter, platformFilter, categoryFilter, assignedTesterFilter, suiteFilter, searchQuery])

  // Load saved filter
  const loadSavedFilter = useCallback((filter: SavedFilter) => {
    setStatusFilter(filter.filters.status)
    setPriorityFilter(filter.filters.priority)
    setPlatformFilter(filter.filters.platform)
    setCategoryFilter(filter.filters.category)
    setAssignedTesterFilter(filter.filters.assignedTester)
    setSuiteFilter(filter.filters.suite)
    setSearchQuery(filter.searchQuery)
  }, [])

  // Delete saved filter
  const deleteSavedFilter = useCallback((filterId: string) => {
    setSavedFilters(prev => prev.filter(filter => filter.id !== filterId))
  }, [])

  return {
    // State
    searchQuery,
    statusFilter,
    priorityFilter,
    platformFilter,
    categoryFilter,
    assignedTesterFilter,
    suiteFilter,
    savedFilters,
    filteredTestCases,
    filterOptions,

    // Setters
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setPlatformFilter,
    setCategoryFilter,
    setAssignedTesterFilter,
    setSuiteFilter,

    // Actions
    clearFilters,
    saveCurrentFilter,
    loadSavedFilter,
    deleteSavedFilter
  }
} 