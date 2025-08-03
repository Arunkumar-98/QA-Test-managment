"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { useTestCases } from "@/hooks/useTestCases"
import { useTestSuites } from "@/hooks/useTestSuites"
import { useSearchAndFilter } from "@/hooks/useSearchAndFilter"
import { QASidebar } from "./Sidebar"
import { TestCaseTable } from "./TestCaseTable"
import { TestCaseDialog } from "./TestCaseDialog"
import { TestSuiteDialog } from "./TestSuiteDialog"
import { CommentsDialog } from "./CommentsDialog"
import { AutomationDialog } from "./AutomationDialog"
import { ShareProjectDialog } from "./ShareProjectDialog"
import { StatusHistoryDialog } from './StatusHistoryDialog'
import { PRDToTestCases } from './PRDToTestCases'
import { ImportPreviewDialog } from './ImportPreviewDialog'
import { EnhancedPasteDialog } from './EnhancedPasteDialog'
import { ShareTestSuiteDialog } from './ShareTestSuiteDialog'
import { WelcomeProjectModal } from './WelcomeProjectModal'
import { EmptyState } from './EmptyState'
import { ActionGuard } from './ActionGuard'
import { FullScreenWelcome } from './FullScreenWelcome'
import { 
  TestCase, TestCaseStatus, TestSuite, Document, ImportantLink, Project,
  CreateDocumentInput, CreateImportantLinkInput, SharedProjectReference
} from "@/types/qa-types"
import type { Comment } from "@/types/qa-types"
import { DEFAULT_PROJECT, PLATFORM_OPTIONS } from "@/lib/constants"
import { getSuiteStatistics, mapImportedDataToTestCase, validateImportedTestCase, parseCSV } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

import { projectService, documentService, importantLinkService, platformService, commentService, sharedProjectReferenceService } from "@/lib/supabase-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Settings, Eye, Trash2, LogOut, User, Share2, Plus, Upload, Clipboard, Download, X, Folder, Table, FileText, Share, RefreshCw, Mail } from "lucide-react"
import { useAuth } from "./AuthProvider"

export function QAApplication() {
  // Auth context
  const { user, signOut } = useAuth()
  
  // UI state - declare these first
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [currentProject, setCurrentProject] = useState(DEFAULT_PROJECT)
  const [currentProjectId, setCurrentProjectId] = useState<string>('')
  const [platforms, setPlatforms] = useState<string[]>([...PLATFORM_OPTIONS])
  const [projects, setProjects] = useState<Project[]>([])
  const [sharedProjectReferences, setSharedProjectReferences] = useState<SharedProjectReference[]>([])
  const [importantLinks, setImportantLinks] = useState<ImportantLink[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null)
  const [viewingTestCase, setViewingTestCase] = useState<TestCase | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSuiteDialogOpen, setIsSuiteDialogOpen] = useState(false)
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false)
  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false)
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false)
  const [isShareProjectDialogOpen, setIsShareProjectDialogOpen] = useState(false)
  const [isShareTestSuiteDialogOpen, setIsShareTestSuiteDialogOpen] = useState(false)
  const [selectedTestSuiteForSharing, setSelectedTestSuiteForSharing] = useState<TestSuite | null>(null)
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false)
  const [isImportPreviewDialogOpen, setIsImportPreviewDialogOpen] = useState(false)
  const [isEnhancedPasteDialogOpen, setIsEnhancedPasteDialogOpen] = useState(false)
  const [importRawData, setImportRawData] = useState<any[]>([])
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [projectsLoading, setProjectsLoading] = useState(true)

  
  // Selected test case for dialogs
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  
  // Table column configuration with responsive widths
  const [tableColumns, setTableColumns] = useState({
    id: { visible: true, width: "w-16", minWidth: "min-w-[80px]" },
    testCase: { visible: true, width: "w-64", minWidth: "min-w-[250px]" },
    description: { visible: true, width: "w-80", minWidth: "min-w-[300px]" },
    expectedResult: { visible: false, width: "w-72", minWidth: "min-w-[250px]" },
    status: { visible: true, width: "w-32", minWidth: "min-w-[120px]" },
    category: { visible: false, width: "w-32", minWidth: "min-w-[120px]" },
    platform: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
    suite: { visible: false, width: "w-32", minWidth: "min-w-[120px]" },
    date: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
    actions: { visible: true, width: "w-32", minWidth: "min-w-[140px]" },
    automationActions: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
    stepsToReproduce: { visible: true, width: "w-80", minWidth: "min-w-[300px]" },
    priority: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
    environment: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
    prerequisites: { visible: false, width: "w-64", minWidth: "min-w-[250px]" },
    automation: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
  })

  // Custom columns state
  const [customColumns, setCustomColumns] = useState<any>({})
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rowsPerPage')
      return saved ? parseInt(saved) : 25
    }
    return 25
  })
  const [selectedTestCaseForComments, setSelectedTestCaseForComments] = useState<(TestCase & { comments?: Comment[] }) | null>(null)
  const [selectedTestCaseForAutomation, setSelectedTestCaseForAutomation] = useState<TestCase | null>(null)
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null)

  // Handle click outside user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Core state management
    const { 
    testCases, 
    selectedTestCases, 
    loading: testCasesLoading,
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
    setTestCases 
  } = useTestCases(currentProjectId)

  const {
    testSuites,
    createTestSuite,
    updateTestSuite,
    deleteTestSuite,
    addTestCaseToSuite,
    removeTestCaseFromSuite,
    updateSuiteStatistics,
    setTestSuites
  } = useTestSuites(currentProjectId)

  const {
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
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setPlatformFilter,
    setCategoryFilter,
    setAssignedTesterFilter,
    setSuiteFilter,
    clearFilters,
    saveCurrentFilter,
    loadSavedFilter,
    deleteSavedFilter
  } = useSearchAndFilter(testCases)

  // Load initial data from Supabase on mount
  useEffect(() => {
    // Load projects from Supabase
    loadProjectsFromSupabase()
    
    // Clean up any test projects
    cleanupTestProjects()
    
    // Test cases are loaded by useTestCases hook when currentProjectId changes
    // Other data can be loaded here if needed
  }, [])

  // On app load, try to restore last selected project from localStorage
  useEffect(() => {
    const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('selectedProjectId') : null
    const savedProjectName = typeof window !== 'undefined' ? localStorage.getItem('selectedProjectName') : null
    if (savedProjectId && savedProjectName) {
      setCurrentProjectId(savedProjectId)
      setCurrentProject(savedProjectName)
    }
  }, [])

  // Persist rows per page to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rowsPerPage', rowsPerPage.toString())
    }
  }, [rowsPerPage])

  // On project change, persist to localStorage
  useEffect(() => {
    if (currentProjectId && currentProject) {
      localStorage.setItem('selectedProjectId', currentProjectId)
      localStorage.setItem('selectedProjectName', currentProject)
    }
  }, [currentProjectId, currentProject])

  // Clean up any test projects or invalid projects that might have been left behind
  const cleanupTestProjects = async () => {
    try {
  
      const projectsData = await projectService.getAll()
      
      // Find test projects and projects with UUID-like names
      const projectsToCleanup = projectsData.filter(p => 
        p.name.startsWith('Test Project ') || 
        /^\d{13,}$/.test(p.name) || // Timestamp-like names
        p.name.length > 50 // Very long names that might be UUIDs
      )
      
      if (projectsToCleanup.length > 0) {

        for (const project of projectsToCleanup) {
          // Don't delete if it's the current project and there are other projects
          if (project.name === currentProject && projectsData.length > 1) {

            continue
          }
          await projectService.delete(project.id)
          
        }
      } else {

      }
    } catch (error) {
      console.error('❌ Failed to clean up projects:', error)
    }
  }

  // Load projects from Supabase
  const loadProjectsFromSupabase = async () => {
    try {
      setProjectsLoading(true)
  
      const projectsData = await projectService.getAll()
      
      setProjects(projectsData)
      
      // Load shared project references
      try {
        const sharedRefs = await sharedProjectReferenceService.getAll()
        setSharedProjectReferences(sharedRefs)
      } catch (error) {
        console.error('Error loading shared project references:', error)
        // Don't show error toast for this as it might be expected if table doesn't exist yet
      }
      
      // Only set current project if none is currently selected
      if (projectsData.length > 0 && (!currentProjectId || !currentProject)) {
        const defaultProject = projectsData.find(p => p.name === DEFAULT_PROJECT) || projectsData[0]

        setCurrentProjectId(defaultProject.id)
        setCurrentProject(defaultProject.name)
      } else if (projectsData.length === 0) {
        // No projects exist - full screen welcome will be shown in main content
        console.log('📝 No projects found - showing full screen welcome')
        
        // Clear current project state
        setCurrentProjectId('')
        setCurrentProject('')
      }
    } catch (error) {
      console.error('❌ Failed to load projects from Supabase:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        error
      })
      toast({
        title: "Error Loading Projects",
        description: `Failed to load projects from database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setProjectsLoading(false)
    }
  }

  // Load project-specific data when project changes
  useEffect(() => {
    if (!currentProjectId) {
      console.log('⚠️ No currentProjectId, skipping project data load')
      return
    }

    console.log('🔄 Loading project data for projectId:', currentProjectId)
    
    const loadProjectData = async () => {
      try {
        // Load platforms, documents, and important links for current project
        const [platformsData, documentsData, linksData] = await Promise.all([
          platformService.getAll(currentProjectId),
          documentService.getAll(currentProjectId),
          importantLinkService.getAll(currentProjectId)
        ])

        console.log('✅ Project data loaded:', {
          platforms: platformsData.length,
          documents: documentsData.length,
          links: linksData.length
        })

        setPlatforms(platformsData.map(p => p.name))
        setDocuments(documentsData)
        setImportantLinks(linksData)
      } catch (error) {
        console.error('❌ Failed to load project data:', error)
      }
    }

    loadProjectData()
  }, [currentProjectId])

  // Refresh test suite statistics when test cases change
  useEffect(() => {
    const refreshAllSuiteStatistics = async () => {
      for (const suite of testSuites) {
        await refreshTestSuiteStatistics(suite.id)
      }
    }
    
    if (testCases.length > 0 && testSuites.length > 0) {
      refreshAllSuiteStatistics()
    }
  }, [testCases, testSuites])

  // Project management
  const handleAddProject = async (projectName: string) => {
    setIsCreatingProject(true)
    
    try {
      // Validate project name
      if (!projectName.trim()) {
        toast({
          title: "Invalid Project Name",
          description: "Project name cannot be empty.",
          variant: "destructive",
        })
        return
      }
    
      // Check for invalid project names (UUIDs, timestamps, etc.)
      if (/^\d{13,}$/.test(projectName.trim()) || projectName.trim().length > 50) {
        toast({
          title: "Invalid Project Name",
          description: "Project name appears to be invalid. Please use a descriptive name.",
          variant: "destructive",
        })
        return
      }
    
      const projectExists = projects.some(p => p.name.toLowerCase() === projectName.toLowerCase())
    
      if (projectExists) {
        toast({
          title: "Project Already Exists",
          description: `A project with the name "${projectName}" already exists.`,
          variant: "destructive",
        })
        return
      }

      console.log('Attempting to create project:', projectName)
      
      // Save to Supabase - only send required fields, let database handle defaults
      const newProject = await projectService.create({
        name: projectName,
        description: `Project: ${projectName}`
      })
      
      console.log('Project created successfully:', newProject)
      
      // If this is the first project, automatically select it
      if (projects.length === 0) {
        setCurrentProjectId(newProject.id)
        setCurrentProject(newProject.name)
        
        // Save to localStorage
        localStorage.setItem('selectedProjectId', newProject.id)
        localStorage.setItem('selectedProjectName', newProject.name)
      }
      
      // Reload projects from Supabase
      await loadProjectsFromSupabase()
      
      toast({
        title: "Project Added",
        description: `Project "${projectName}" has been added${projects.length === 0 ? ' and selected' : ''}.`,
      })
    } catch (error) {
      console.error('Failed to add project:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        error: error
      })
      
      // Handle specific database errors
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === '23505') {
          toast({
            title: "Project Already Exists",
            description: `A project with the name "${projectName}" already exists.`,
            variant: "destructive",
          })
          return
        }
      }
      
      toast({
        title: "Error Adding Project",
        description: `Failed to add project to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleRemoveProject = async (projectName: string) => {
    // Check if this is the last project
    if (projects.length === 1) {
      toast({
        title: "Cannot Remove Last Project",
        description: "You must have at least one project. Please create a new project before removing this one.",
        variant: "destructive"
      })
      return
    }
    
    try {
      // Get project ID from projects list
      const projectToDelete = projects.find(p => p.name === projectName)
      
      if (projectToDelete) {
        // Check if we're deleting the current project
        const isDeletingCurrentProject = currentProject === projectName
        
        // Delete from Supabase
        await projectService.delete(projectToDelete.id)
        
        // Get remaining projects before reloading
        const remainingProjects = projects.filter(p => p.name !== projectName)
        
        // If we're deleting the current project, select a new one first
        if (isDeletingCurrentProject && remainingProjects.length > 0) {
          const newCurrentProject = remainingProjects[0]
          setCurrentProjectId(newCurrentProject.id)
          setCurrentProject(newCurrentProject.name)
          
          // Clear localStorage for the deleted project
          localStorage.removeItem('selectedProjectId')
          localStorage.removeItem('selectedProjectName')
          
          // Set new project in localStorage
          localStorage.setItem('selectedProjectId', newCurrentProject.id)
          localStorage.setItem('selectedProjectName', newCurrentProject.name)
        }
        
        // Reload projects from Supabase
        await loadProjectsFromSupabase()
        
        toast({
          title: "Project Removed",
          description: `Project "${projectName}" has been removed.`,
        })
      } else {
        toast({
          title: "Project Not Found",
          description: `Project "${projectName}" not found in database.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to remove project:', error)
      toast({
        title: "Error Removing Project",
        description: "Failed to remove project from database.",
        variant: "destructive",
      })
    }
  }

  const handleProjectChange = async (projectName: string) => {
    try {
    const selectedProject = projects.find(p => p.name === projectName)
    if (selectedProject) {
      setCurrentProjectId(selectedProject.id)
      setCurrentProject(selectedProject.name)
      
      // Load project-specific data for the new project
        const [platformsData, documentsData, linksData] = await Promise.all([
          platformService.getAll(selectedProject.id),
          documentService.getAll(selectedProject.id),
          importantLinkService.getAll(selectedProject.id)
        ])

        setPlatforms(platformsData.map(p => p.name))
        setDocuments(documentsData)
        setImportantLinks(linksData)
        
        toast({
          title: "Project Switched",
          description: `Successfully switched to "${projectName}"`,
        })
      }
      } catch (error) {
        console.error('Failed to load project data:', error)
      toast({
        title: "Error Switching Project",
        description: "Failed to load project data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Platform management
  const handleAddPlatform = async (platformName: string) => {
    if (!platforms.includes(platformName)) {
      try {
        await platformService.create({
          name: platformName,
          projectId: currentProjectId
        })
        
        // Reload platforms
        const platformsData = await platformService.getAll(currentProjectId)
        setPlatforms(platformsData.map(p => p.name))
        
        toast({
          title: "Platform Added",
          description: `Platform "${platformName}" has been added.`,
        })
      } catch (error) {
        console.error('Failed to add platform:', error)
        toast({
          title: "Error Adding Platform",
          description: "Failed to add platform to database.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeletePlatform = async (platformName: string) => {
    try {
      const platformsData = await platformService.getAll(currentProjectId)
      const platformToDelete = platformsData.find(p => p.name === platformName)
      
      if (platformToDelete) {
        await platformService.delete(platformToDelete.id)
        
        // Reload platforms
        const updatedPlatformsData = await platformService.getAll(currentProjectId)
        setPlatforms(updatedPlatformsData.map(p => p.name))
        
        toast({
          title: "Platform Deleted",
          description: `Platform "${platformName}" has been deleted.`,
        })
      }
    } catch (error) {
      console.error('Failed to delete platform:', error)
      toast({
        title: "Error Deleting Platform",
        description: "Failed to delete platform from database.",
        variant: "destructive",
      })
    }
  }

  const handleRemovePlatform = (platformName: string) => {
    setPlatforms(prev => prev.filter(p => p !== platformName))
    toast({
      title: "Platform Removed",
      description: `Platform "${platformName}" has been removed.`,
    })
  }

  // Important links management
  const handleAddImportantLink = async (link: CreateImportantLinkInput) => {
    try {
      const newLink = await importantLinkService.create({
        ...link,
        projectId: currentProjectId
      })
      
      setImportantLinks(prev => [...prev, newLink])
      toast({
        title: "Link Added",
        description: "Important link has been added.",
      })
    } catch (error) {
      console.error('Failed to add important link:', error)
      toast({
        title: "Error Adding Link",
        description: "Failed to add link to database.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteImportantLink = async (id: string) => {
    try {
      await importantLinkService.delete(id)
      setImportantLinks(prev => prev.filter(link => link.id !== id))
      toast({
        title: "Link Deleted",
        description: "Important link has been deleted.",
      })
    } catch (error) {
      console.error('Failed to delete important link:', error)
      toast({
        title: "Error Deleting Link",
        description: "Failed to delete link from database.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveImportantLink = (linkId: string) => {
    setImportantLinks(prev => prev.filter(link => link.id !== linkId))
    toast({
      title: "Link Removed",
      description: "Important link has been removed.",
    })
  }

  // Documents management
  const handleAddDocument = async (document: CreateDocumentInput) => {
    try {
      const newDoc = await documentService.create({
        ...document,
        projectId: currentProjectId
      })
      
      setDocuments(prev => [...prev, newDoc])
      toast({
        title: "Document Added",
        description: "Document has been added.",
      })
    } catch (error) {
      console.error('Failed to add document:', error)
      toast({
        title: "Error Adding Document",
        description: "Failed to add document to database.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      await documentService.delete(id)
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      toast({
        title: "Document Deleted",
        description: "Document has been deleted.",
      })
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast({
        title: "Error Deleting Document",
        description: "Failed to delete document from database.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  // Debug function to fix database RLS issues
  const handleFixDatabase = async () => {
    try {
      const response = await fetch('/api/fix-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Database Fix Applied",
          description: data.message,
        })
      } else {
        toast({
          title: "Database Fix Failed",
          description: data.error || "Failed to apply database fixes",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fixing database:', error)
      toast({
        title: "Database Fix Failed",
        description: "Failed to apply database fixes. Please apply the SQL script manually.",
        variant: "destructive"
      })
    }
  }

  // Test case management
  const handleAddTestCase = async (testCase: Partial<TestCase> & { testCase: string; description: string; status: TestCaseStatus }) => {
    if (!currentProjectId) {
      // Show toast message since full screen welcome is already visible
      toast({
        title: "No Project Selected",
        description: "Please create a project first to add test cases.",
        variant: "destructive",
      })
      return
    }
    
    try {
      const savedTestCase = await addTestCase({
        ...testCase,
        projectId: currentProjectId
      })
      
      // Update test suite statistics if the test case is associated with a suite
      if (savedTestCase.suiteId) {
        await refreshTestSuiteStatistics(savedTestCase.suiteId)
      }
      
      // Close the dialog after successful save
      setIsAddDialogOpen(false)
      setEditingTestCase(null)
      setViewingTestCase(null)
    } catch (error) {
      // Error handling is done in the dialog component
      throw error
    }
  }

  // Function to refresh test suite statistics
  const refreshTestSuiteStatistics = async (suiteId: string) => {
    try {
      const suiteTestCases = testCases.filter(tc => tc.suiteId === suiteId)
      const totalTests = suiteTestCases.length
      const passedTests = suiteTestCases.filter(tc => tc.status === 'Pass').length
      const failedTests = suiteTestCases.filter(tc => tc.status === 'Fail').length
      const pendingTests = suiteTestCases.filter(tc => tc.status === 'Pending').length
      
      await updateSuiteStatistics(suiteId, {
        totalTests,
        passedTests,
        failedTests,
        pendingTests
      })
      
      console.log(`✅ Refreshed statistics for suite ${suiteId}: Total=${totalTests}, Passed=${passedTests}, Failed=${failedTests}, Pending=${pendingTests}`)
    } catch (error) {
      console.error('❌ Failed to refresh test suite statistics:', {
        suiteId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  // Function to manually refresh all test suite statistics
  const refreshAllTestSuiteStatistics = async () => {
    console.log('🔄 Manually refreshing all test suite statistics...')
    for (const suite of testSuites) {
      await refreshTestSuiteStatistics(suite.id)
    }
    console.log('✅ All test suite statistics refreshed')
    toast({
      title: "Statistics Updated",
      description: "Test suite statistics have been refreshed.",
    })
  }

  const handleAddTestCaseFromPaste = (testCase: Partial<TestCase>) => {
    addTestCase({
      testCase: testCase.testCase || 'Untitled Test Case',
      description: testCase.description || '',
      status: testCase.status || 'Pending',
      priority: testCase.priority || 'Medium',
      category: testCase.category || 'Functional',
      platform: testCase.platform || 'Web',
      suiteId: selectedSuiteId || testCase.suiteId || '',
      executionDate: testCase.executionDate || '',
      stepsToReproduce: testCase.stepsToReproduce || '',
      expectedResult: testCase.expectedResult || '',
      environment: testCase.environment || 'Test Environment',
      prerequisites: testCase.prerequisites || '',
      projectId: currentProjectId
    })
  }

  const handleAddMultipleTestCases = async (testCases: Partial<TestCase>[]) => {

    
    // Validate that we have a current project ID
    if (!currentProjectId) {
      toast({
        title: "No Project Selected",
        description: "Please create a project first to import test cases.",
        variant: "destructive",
      })
      return
    }
    
    // Save each test case to the database
    const savedTestCases: TestCase[] = []
    const failedTestCases: string[] = []
    
    // Show progress toast
    toast({
      title: "Importing Test Cases",
      description: `Processing ${testCases.length} test cases...`,
    })

    // Process test cases sequentially to avoid race conditions
    // This ensures reliable position assignment even if atomic function fails
    const results = []
    for (let index = 0; index < testCases.length; index++) {
      const testCaseData = testCases[index]
      try {
        console.log(`📝 Processing test case ${index + 1}/${testCases.length}: ${testCaseData.testCase}`)
        
        // Ensure required fields are present and associate with selected suite
        const testCaseToAdd = {
          ...testCaseData,
          testCase: testCaseData.testCase || `Imported Test Case ${Date.now()}`,
          description: testCaseData.description || '',
          status: testCaseData.status || 'Pending',
          projectId: currentProjectId, // Ensure projectId is set
          suiteId: selectedSuiteId || testCaseData.suiteId // Associate with selected suite
        } as Partial<TestCase> & { testCase: string; description: string; status: TestCaseStatus }
        
        const savedTestCase = await addTestCase(testCaseToAdd)
        
        results.push({ status: 'fulfilled', value: { success: true, testCase: savedTestCase, originalName: testCaseData.testCase } })
        
        // Update progress toast every 5 test cases
        if ((index + 1) % 5 === 0 || index === testCases.length - 1) {
          toast({
            title: "Import Progress",
            description: `Processed ${index + 1}/${testCases.length} test cases...`,
          })
        }
      } catch (error) {
        console.error(`❌ Failed to save test case ${index + 1}:`, testCaseData.testCase, error)
        results.push({ status: 'rejected', reason: error, value: { success: false, error, originalName: testCaseData.testCase || 'Unknown' } })
      }
    }

    // Process results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success && result.value.testCase) {
          savedTestCases.push(result.value.testCase)
        } else {
          failedTestCases.push(result.value.originalName || 'Unknown')
        }
      } else {
        console.error('❌ Promise rejected:', result.reason)
        failedTestCases.push('Unknown')
      }
    })

    
    
    // Update test suite statistics if we have a selected suite and saved test cases
    if (selectedSuiteId && savedTestCases.length > 0) {
      try {

        const suite = testSuites.find(s => s.id === selectedSuiteId)
        if (suite) {
          // Calculate new statistics
          const suiteTestCases = testCases.filter(tc => tc.suiteId === selectedSuiteId || tc.suiteId === undefined)
          const totalTests = (suite.totalTests || 0) + savedTestCases.length
          const passedTests = suite.passedTests || 0
          const failedTests = suite.failedTests || 0
          const pendingTests = (suite.pendingTests || 0) + savedTestCases.filter(tc => tc.status === 'Pending').length
          
          
          
          // Update the test suite
          await updateSuiteStatistics(selectedSuiteId, {
            totalTests,
            passedTests,
            failedTests,
            pendingTests
          })
          
          
        }
      } catch (error) {
        console.error('❌ Failed to update test suite statistics:', error)
      }
    }
    
    if (failedTestCases.length > 0) {
      toast({
        title: "Partial Import Success",
        description: `${savedTestCases.length} test cases imported successfully. ${failedTestCases.length} failed to save.`,
        variant: "default",
      })
    } else {
      toast({
        title: "Import Successful",
        description: `${savedTestCases.length} test cases imported and saved successfully.`,
      })
    }
  }

  const handleEditTestCase = (testCase: TestCase) => {
    setEditingTestCase(testCase)
    setViewingTestCase(null)
    setIsAddDialogOpen(true)
  }

  const handleViewTestCase = (testCase: TestCase) => {
    setViewingTestCase(testCase)
    setEditingTestCase(null)
    setIsAddDialogOpen(true)
  }

  const handleOpenComments = async (testCase: TestCase) => {
    try {
      // Load comments for this test case
      const comments = await commentService.getByTestCaseId(testCase.id)
      const testCaseWithComments = { ...testCase, comments }
      setSelectedTestCaseForComments(testCaseWithComments)
      setIsCommentsDialogOpen(true)
    } catch (error) {
      console.error('Error loading comments:', error)
      // Fallback to opening without comments
      setSelectedTestCaseForComments(testCase)
      setIsCommentsDialogOpen(true)
    }
  }

  const handleOpenAutomation = (testCase: TestCase) => {
    setSelectedTestCaseForAutomation(testCase)
    setIsAutomationDialogOpen(true)
  }

  // File upload handling
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        let jsonData: any[] = []
        const fileExtension = file.name.toLowerCase().split('.').pop()

        if (fileExtension === 'csv') {
          // Handle CSV files
          const csvContent = e.target?.result as string
          jsonData = parseCSV(csvContent)
          console.log('📁 Importing test cases from CSV file:', jsonData.length, 'rows')
        } else {
          // Handle Excel files
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
          jsonData = XLSX.utils.sheet_to_json(worksheet)
          console.log('📁 Importing test cases from Excel file:', jsonData.length, 'rows')
        }

        if (jsonData.length === 0) {
        toast({
            title: "Import Failed",
            description: "No data found in the file.",
            variant: "destructive",
          })
          return
        }

        // Store raw data and open preview dialog
        setImportRawData(jsonData)
        setIsImportPreviewDialogOpen(true)
        
      } catch (error) {
        console.error('❌ Error importing file:', error)
        toast({
          title: "Import Failed",
          description: "Failed to import test cases from file.",
          variant: "destructive",
        })
      }
    }

    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file)
    } else {
    reader.readAsArrayBuffer(file)
    }
    
    event.target.value = ''
  }

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(testCases.map(tc => ({
      'Test Case': tc.testCase,
      'Description': tc.description,
      'Expected Result': tc.expectedResult,
      'Status': tc.status,
      'Priority': tc.priority,
      'Category': tc.category,
      'Assigned Tester': tc.assignedTester,
      'Execution Date': tc.executionDate,
      'Notes': tc.notes,
      'Actual Result': tc.actualResult,
      'Environment': tc.environment,
      'Prerequisites': tc.prerequisites,
      'Platform': tc.platform,
      'Steps to Reproduce': tc.stepsToReproduce
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases')
    XLSX.writeFile(workbook, `test-cases-${currentProject}-${new Date().toISOString().split('T')[0]}.xlsx`)

    toast({
      title: "Export Successful",
      description: "Test cases exported to Excel successfully.",
    })
  }

  // Filter test cases for selected suite and current project
  const displayedTestCases = testCases.filter(tc =>
    tc.projectId === currentProjectId &&
    (!selectedSuiteId || tc.suiteId === selectedSuiteId)
  )

  // Use filtered test cases from useSearchAndFilter hook
  const finalTestCases = filteredTestCases.filter(tc =>
    tc.projectId === currentProjectId &&
    (!selectedSuiteId || tc.suiteId === selectedSuiteId)
  )

  const handleOpenShareProject = () => {
    if (!currentProjectId || !currentProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project first before sharing.",
        variant: "destructive",
      })
      return
    }
    setIsShareProjectDialogOpen(true)
  }

  const handleOpenShareTestSuite = (testSuite: TestSuite) => {
    if (!testSuite) {
      toast({
        title: "Error",
        description: "Cannot share test suite: Invalid test suite data.",
        variant: "destructive",
      })
      return
    }
    setSelectedTestSuiteForSharing(testSuite)
    setIsShareTestSuiteDialogOpen(true)
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-white shadow-lg"
          >
            {isSidebarOpen ? "×" : "☰"}
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 border-b border-white/20 shadow-lg relative z-50">
          <div className="w-full px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">QA Management</h1>
                    <p className="text-sm text-blue-200 font-medium">Professional Test Case Management</p>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-white/20"></div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenShareProject}
                  disabled={!currentProjectId || !currentProject}
                  className={`flex items-center space-x-2 h-10 px-5 border-white/20 transition-all duration-200 shadow-sm ${
                    currentProjectId && currentProject 
                      ? 'bg-white/10 hover:bg-white/20 hover:border-white/40 text-white' 
                      : 'bg-white/5 text-white/50 cursor-not-allowed'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Share Project</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="h-10 w-10 p-0 hover:bg-white/10 rounded-xl transition-all duration-200"
                  >
                    <Settings className="w-5 h-5 text-white" />
                  </Button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 py-2 z-[60]">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">User Profile</p>
                      </div>
                      
                      <div className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-xs text-blue-200 truncate">
                              {user?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-4 py-2 border-t border-white/10">
                        <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Settings</p>
                      </div>
                      
                      <button
                        onClick={() => setIsProjectSettingsOpen(true)}
                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-3 transition-colors"
                      >
                        <Folder className="w-4 h-4 text-blue-300" />
                        <span className="font-medium">Project Settings</span>
                      </button>
                      
                      <button
                        onClick={() => setIsTableSettingsOpen(true)}
                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-3 transition-colors"
                      >
                        <Table className="w-4 h-4 text-blue-300" />
                        <span className="font-medium">Table Settings</span>
                      </button>
                      
                      <div className="px-4 py-2 border-t border-white/10">
                        <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Other</p>
                      </div>
                      
                      <button
                        onClick={handleFixDatabase}
                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-3 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-blue-300" />
                        <span className="font-medium">Fix Database RLS</span>
                      </button>
                      
                      <button
                        onClick={signOut}
                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-3 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-blue-300" />
                        <span className="font-medium">Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar Grid Layout */}
        <div className="grid grid-cols-[20rem_1fr] h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          <QASidebar
            currentProject={currentProject}
            currentProjectId={currentProjectId}
            projects={projects}
            sharedProjectReferences={sharedProjectReferences}
            platforms={platforms}
            importantLinks={importantLinks}
            documents={documents}
            testSuites={testSuites}
            testCasesCount={finalTestCases.length}
            passedCount={finalTestCases.filter(tc => tc.status === 'Pass').length}
            failedCount={finalTestCases.filter(tc => tc.status === 'Fail').length}
            pendingCount={finalTestCases.filter(tc => tc.status === 'Pending').length}

            getSuiteStatistics={getSuiteStatistics}
            onAddTestSuite={createTestSuite}
            onDeleteTestSuite={deleteTestSuite}
            onProjectChange={handleProjectChange}
            onAddProject={handleAddProject}
            onRemoveProject={handleRemoveProject}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            onAddImportantLink={handleAddImportantLink}
            onDeleteImportantLink={handleDeleteImportantLink}
            onAddPlatform={handleAddPlatform}
            onDeletePlatform={handleDeletePlatform}
            onOpenTableSettings={() => setIsTableSettingsOpen(true)}
            onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
            onSuiteClick={setSelectedSuiteId}
            selectedSuiteId={selectedSuiteId}
            onAddTestCases={(testCases) => {
              testCases.forEach(testCase => {
                addTestCase({
                  testCase: testCase.testCase || 'Untitled Test Case',
                  description: testCase.description || '',
                  status: testCase.status || 'Pending',
                  priority: testCase.priority || 'Medium',
                  category: testCase.category || 'Functional',
                  platform: testCase.platform || 'Web',
                  suiteId: selectedSuiteId || testCase.suiteId || '',
                  executionDate: testCase.executionDate || '',
                  stepsToReproduce: testCase.stepsToReproduce || '',
                  expectedResult: testCase.expectedResult || '',
                  environment: testCase.environment || 'Test Environment',
                  prerequisites: testCase.prerequisites || '',
                  projectId: currentProjectId
                })
              })
            }}
            onShareTestSuite={handleOpenShareTestSuite}
            // Test Case Actions
            onAddTestCase={() => setIsAddDialogOpen(true)}
            onFileUpload={handleFileUpload}
            onExportToExcel={handleExportToExcel}
            isPasteDialogOpen={isEnhancedPasteDialogOpen}
            setIsPasteDialogOpen={setIsEnhancedPasteDialogOpen}
          />
          <div className="flex flex-col h-full overflow-hidden relative">
            {/* Loading Overlay */}

            


            {/* Suite Filter Banner */}
            {selectedSuiteId && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-blue-900">Test Suite Active</span>
                      <p className="text-sm text-blue-700">{testSuites.find(s => s.id === selectedSuiteId)?.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSuiteId(null)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Suite
                  </Button>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Show loading state while projects are being fetched */}
              {projectsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your projects...</p>
                  </div>
                </div>
              ) : projects.length === 0 ? (
                <FullScreenWelcome 
                  onCreateProject={handleAddProject}
                  isLoading={isCreatingProject}
                  onSignOut={signOut}
                  user={user}
                />
              ) : (
                /* Test Cases Table */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <TestCaseTable
                  testCases={finalTestCases}
                  selectedTestCases={selectedTestCases}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  priorityFilter={priorityFilter}
                  setPriorityFilter={setPriorityFilter}
                  platformFilter={platformFilter}
                  setPlatformFilter={setPlatformFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  assignedTesterFilter={assignedTesterFilter}
                  setAssignedTesterFilter={setAssignedTesterFilter}
                  savedFilters={savedFilters}
                  tableColumns={tableColumns}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  rowsPerPage={rowsPerPage}
                  setRowsPerPage={setRowsPerPage}
                  onAddTestCase={() => setIsAddDialogOpen(true)}
                  onEditTestCase={handleEditTestCase}
                  onViewTestCase={handleViewTestCase}
                  onRemoveTestCase={removeTestCase}
                  onRemoveSelectedTestCases={removeSelectedTestCases}
        deleteLoading={deleteLoading}
                  onUpdateTestCaseStatus={updateTestCaseStatus}
                  onBulkUpdateStatus={bulkUpdateStatus}
                  onToggleTestCaseSelection={toggleTestCaseSelection}
                  onToggleSelectAll={(filteredTestCases) => toggleSelectAll(filteredTestCases)}
                  onClearAllTestCases={clearAllTestCases}
                  onFileUpload={handleFileUpload}
                  onExportToExcel={handleExportToExcel}
                  onSaveFilter={saveCurrentFilter}
                  onLoadFilter={(filter) => loadSavedFilter(filter)}
                  onDeleteFilter={deleteSavedFilter}
                  onClearAllFilters={clearFilters}
                  onOpenComments={handleOpenComments}
                  onOpenAutomation={handleOpenAutomation}
                  onAddTestCaseFromPaste={handleAddTestCaseFromPaste}
                  currentProject={currentProject}
                  isPasteDialogOpen={isPasteDialogOpen}
                  setIsPasteDialogOpen={setIsPasteDialogOpen}
                />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <TestCaseDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          setEditingTestCase(null)
          setViewingTestCase(null)
        }}
        onSubmit={handleAddTestCase}
        testCase={editingTestCase || viewingTestCase}
        isViewMode={!!viewingTestCase}
        onEdit={() => {
          if (viewingTestCase) {
            setEditingTestCase(viewingTestCase)
            setViewingTestCase(null)
          }
        }}
        testSuites={testSuites}
        selectedSuiteId={selectedSuiteId}
      />

      <TestSuiteDialog
        isOpen={isSuiteDialogOpen}
        onClose={() => setIsSuiteDialogOpen(false)}
        onSubmit={createTestSuite}
        testSuites={testSuites}
        testCases={testCases}
        onAddTestCaseToSuite={addTestCaseToSuite}
        onRemoveTestCaseFromSuite={removeTestCaseFromSuite}
      />

      {selectedTestCaseForComments && (
        <CommentsDialog
          isOpen={isCommentsDialogOpen}
          onClose={() => setIsCommentsDialogOpen(false)}
          testCase={selectedTestCaseForComments}
          onUpdateTestCase={(updates) => updateTestCase(selectedTestCaseForComments!.id, updates)}
          onCommentsUpdate={(comments) => {
            if (selectedTestCaseForComments) {
              setSelectedTestCaseForComments({ ...selectedTestCaseForComments, comments })
            }
          }}
        />
      )}

      {selectedTestCaseForAutomation && (
        <AutomationDialog
          isOpen={isAutomationDialogOpen}
          onClose={() => setIsAutomationDialogOpen(false)}
          testCase={selectedTestCaseForAutomation}
          onUpdateTestCase={(updates) => updateTestCase(selectedTestCaseForAutomation!.id, updates)}
        />
      )}

      <ShareProjectDialog
        isOpen={isShareProjectDialogOpen}
        onClose={() => setIsShareProjectDialogOpen(false)}
        projectId={currentProjectId}
        projectName={currentProject}
        onShareCreated={(share) => {
          console.log('Project shared:', share)
          toast({
            title: "Project Shared!",
            description: "Share link has been created successfully.",
          })
        }}
      />

      {selectedTestSuiteForSharing && (
        <ShareTestSuiteDialog
          isOpen={isShareTestSuiteDialogOpen}
          onClose={() => setIsShareTestSuiteDialogOpen(false)}
          testSuite={selectedTestSuiteForSharing}
          projectId={currentProjectId}
          projectName={currentProject}
          onShareCreated={(share) => {
            console.log('Test suite shared:', share)
            toast({
              title: "Test Suite Shared!",
              description: "Share link has been created successfully.",
            })
          }}
        />
      )}

      {/* Table Settings Dialog */}
      <Dialog open={isTableSettingsOpen} onOpenChange={setIsTableSettingsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Settings className="w-6 h-6 text-blue-600" />
              Table Settings & Customization
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Configure table columns, add custom fields, and manage data options.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Column Management */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-900">Column Management</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Default Columns */}
                {Object.entries(tableColumns).map(([key, column]) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <Label className="font-medium capitalize text-slate-900">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <p className="text-sm text-slate-600 mt-1">Show/hide column</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={column.visible}
                        onCheckedChange={(checked) => {
                          setTableColumns(prev => ({
                            ...prev,
                            [key]: { ...prev[key as keyof typeof tableColumns], visible: checked as boolean }
                          }))
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Data Options */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-900">Data Options</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Rows per page</Label>
                  <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(parseInt(value))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="25">25 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">Table Density</Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Auto-save Settings</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Checkbox id="auto-save" defaultChecked />
                    <Label htmlFor="auto-save" className="text-sm">Automatically save changes</Label>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">Show Row Numbers</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Checkbox id="row-numbers" />
                    <Label htmlFor="row-numbers" className="text-sm">Display row numbers</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-6 rounded-xl">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset all settings to default
                  setTableColumns({
                    id: { visible: true, width: "w-16", minWidth: "min-w-[80px]" },
                    testCase: { visible: true, width: "w-48", minWidth: "min-w-[200px]" },
                    description: { visible: true, width: "w-64", minWidth: "min-w-[250px]" },
                    expectedResult: { visible: true, width: "w-56", minWidth: "min-w-[200px]" },
                    status: { visible: true, width: "w-32", minWidth: "min-w-[120px]" },
                    category: { visible: true, width: "w-32", minWidth: "min-w-[120px]" },
                    platform: { visible: true, width: "w-24", minWidth: "min-w-[100px]" },
                    suite: { visible: true, width: "w-32", minWidth: "min-w-[120px]" },
                    date: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
                    actions: { visible: true, width: "w-32", minWidth: "min-w-[140px]" },
                    automationActions: { visible: true, width: "w-24", minWidth: "min-w-[100px]" },
                    stepsToReproduce: { visible: false, width: "w-56", minWidth: "min-w-[200px]" },
                    priority: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
                    environment: { visible: false, width: "w-24", minWidth: "min-w-[100px]" },
                    prerequisites: { visible: false, width: "w-48", minWidth: "min-w-[180px]" },
                    automation: { visible: true, width: "w-24", minWidth: "min-w-[100px]" },
                  })
                  setRowsPerPage(25)
                  toast({
                    title: "Success",
                    description: "All table settings have been reset to default",
                  })
                }}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                Reset All Settings
              </Button>
              <Button onClick={() => setIsTableSettingsOpen(false)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                Save & Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Settings Dialog */}
      <Dialog open={isProjectSettingsOpen} onOpenChange={setIsProjectSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Manage your projects and view statistics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {projects.map((project) => {
              const projectTestCases = testCases.filter(tc => tc.projectId === project.id)
              const projectStats = {
                total: projectTestCases.length,
                pending: projectTestCases.filter(tc => tc.status === "Pending").length,
                pass: projectTestCases.filter(tc => tc.status === "Pass").length,
                fail: projectTestCases.filter(tc => tc.status === "Fail").length,
              }
              
              return (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.id === currentProjectId && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                      <span>Total: {projectStats.total}</span>
                      <span className="text-green-600">Pass: {projectStats.pass}</span>
                      <span className="text-red-600">Fail: {projectStats.fail}</span>
                      <span className="text-orange-600">Pending: {projectStats.pending}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {project.id !== currentProjectId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await handleProjectChange(project.name)
                          setIsProjectSettingsOpen(false)
                        }}
                      >
                        Switch
                      </Button>
                    )}
                    {project.name !== "Default Project" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProject(project.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Button 
                variant="outline" 
                onClick={clearAllTestCases}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Test Cases
              </Button>
              <Button variant="outline" onClick={() => setIsProjectSettingsOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <ImportPreviewDialog
        isOpen={isImportPreviewDialogOpen}
        onClose={() => setIsImportPreviewDialogOpen(false)}
        rawData={importRawData}
        onImport={(importedTestCases) => {
          setIsImportPreviewDialogOpen(false)
          handleAddMultipleTestCases(importedTestCases)
        }}
        currentProject={currentProject}
        selectedSuiteId={selectedSuiteId || undefined}
      />

      {/* Enhanced Paste Dialog */}
      <EnhancedPasteDialog
        isOpen={isEnhancedPasteDialogOpen}
        onClose={() => setIsEnhancedPasteDialogOpen(false)}
        onImport={(importedTestCases) => {
          setIsEnhancedPasteDialogOpen(false)
          handleAddMultipleTestCases(importedTestCases)
        }}
        currentProject={currentProject}
        selectedSuiteId={selectedSuiteId || undefined}
      />


    </>
  )
} 