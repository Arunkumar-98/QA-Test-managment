"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { useTestCases } from "@/hooks/useTestCases"
import { useTestSuites } from "@/hooks/useTestSuites"
import { useSearchAndFilter } from "@/hooks/useSearchAndFilter"

import { GoogleSheetsTable } from "./GoogleSheetsTable"
import { TestCaseDialog } from "./TestCaseDialog"
import { TestSuiteDialog } from "./TestSuiteDialog"
import { CommentsDialog } from "./CommentsDialog"
import { AutomationDialog } from "./AutomationDialog"
import { ShareDialog } from "./ShareDialog"
import { AddDocumentDialog, AddLinkDialog } from "./ResourceDialogs"
import { StatusHistoryDialog } from './StatusHistoryDialog'
import { PRDToTestCases } from './PRDToTestCases'
import { ImportPreviewDialog } from './ImportPreviewDialog'
import { EnhancedImportDialog } from './EnhancedImportDialog'
import { EnhancedPasteDialog } from './EnhancedPasteDialog'
import { WelcomeProjectModal } from './WelcomeProjectModal'
import { EmptyState } from './EmptyState'
import { ActionGuard } from './ActionGuard'
import { FullScreenWelcome } from './FullScreenWelcome'
import { 
  TestCase, TestCaseStatus, TestSuite, Document, ImportantLink, Project,
  CreateDocumentInput, CreateImportantLinkInput, SharedProjectReference, CustomColumn
} from "@/types/qa-types"
import type { Comment } from "@/types/qa-types"
import { DEFAULT_PROJECT, PLATFORM_OPTIONS } from "@/lib/constants"
import { getLocalShare } from "@/lib/share-client"
import { getSuiteStatistics, mapImportedDataToTestCase, validateImportedTestCase, parseCSV } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { errorHandler, createSupabaseError } from "@/lib/error-handler"
import { loadingStateManager, LOADING_TYPES } from "@/lib/loading-states"
import { GlobalLoadingIndicator } from "@/components/ui/loading-indicator"

import { projectService, documentService, importantLinkService, platformService, commentService, sharedProjectReferenceService, customColumnService } from "@/lib/supabase-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Settings, Eye, Trash2, LogOut, User, Share2, Plus, Upload, Clipboard, Download, X, Folder, Table, FileText, Share, RefreshCw, Mail, EyeOff, BarChart3, RotateCcw, ChevronDown, Briefcase, BookOpen, Users, Link, FileSpreadsheet, Filter, LayoutDashboard, Table2, Bug } from "lucide-react"
import { useAuth } from "./AuthProvider"
import { CustomColumnDialog } from './CustomColumnDialog'
import { ProjectDashboard } from './ProjectDashboard'
import { ProjectDropdown } from './ProjectDropdown'
import { ThemeToggle } from './ThemeToggle'



export function QAApplication() {
  // Auth context
  const { user, signOut } = useAuth()
  
  // UI state - declare these first
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)

  // Helper functions for dropdown management
  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown((current) => (current === dropdownName ? null : dropdownName))
  }

  const [newProject, setNewProject] = useState('')
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingProjectName, setEditingProjectName] = useState('')
  const [selectedProjectForSharing, setSelectedProjectForSharing] = useState<Project | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const projectMenuRef = useRef<HTMLDivElement>(null)
  
  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
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
  const [suiteDialogKind, setSuiteDialogKind] = useState<'suite' | 'bugs'>('suite')
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareKind, setShareKind] = useState<'project' | 'list'>('project')
  const [selectedTestSuiteForSharing, setSelectedTestSuiteForSharing] = useState<TestSuite | null>(null)
  const [shareTick, setShareTick] = useState(0)
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false)
  const [isImportPreviewDialogOpen, setIsImportPreviewDialogOpen] = useState(false)
  const [isEnhancedImportDialogOpen, setIsEnhancedImportDialogOpen] = useState(false)
  const [isEnhancedPasteDialogOpen, setIsEnhancedPasteDialogOpen] = useState(false)
  const [importRawData, setImportRawData] = useState<any[]>([])
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [projectsLoading, setProjectsLoading] = useState(true)

  const [showDashboard, setShowDashboard] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'test-cases'>('dashboard')
  const [addCaseNonce, setAddCaseNonce] = useState(0)
  const [gridReloadNonce, setGridReloadNonce] = useState(0)
  const [exportNonce, setExportNonce] = useState(0)
  const [gridFiltersOpen, setGridFiltersOpen] = useState(false)

  
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
  
  // Custom columns management
  const [customColumnsList, setCustomColumnsList] = useState<CustomColumn[]>([])
  const [isAddCustomColumnDialogOpen, setIsAddCustomColumnDialogOpen] = useState(false)
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false)
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false)
  const [editingCustomColumn, setEditingCustomColumn] = useState<CustomColumn | null>(null)
  const [editingDefaultColumn, setEditingDefaultColumn] = useState<{key: string, column: any} | null>(null)
  
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

  // Search and filter state

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

  // Handle click outside user menu, project menu, and test suites dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false)
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
    setTestCases,
    reloadTestCases,
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
    const loadingId = loadingStateManager.startLoading(
      'APP_INITIALIZATION',
      { component: 'QAApplication' },
      'Initializing application...'
    )
    
    // Add a small delay to ensure localStorage is loaded first
    const timer = setTimeout(async () => {
      try {
    // Load projects from Supabase
        await loadProjectsFromSupabase()
    
    // Clean up any test projects
        await cleanupTestProjects()
    
    // Test cases are loaded by useTestCases hook when currentProjectId changes
    // Other data can be loaded here if needed
        
        loadingStateManager.completeLoading(loadingId, 'Application initialized successfully')
      } catch (error) {
        const appError = createSupabaseError(error, {
          component: 'QAApplication',
          action: 'initialization'
        })
        
        loadingStateManager.completeLoadingWithError(loadingId, error, appError.userMessage)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // On app load, try to restore last selected project from localStorage
  useEffect(() => {
    const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('selectedProjectId') : null
    const savedProjectName = typeof window !== 'undefined' ? localStorage.getItem('selectedProjectName') : null
    console.log('Loading from localStorage - savedProjectId:', savedProjectId, 'savedProjectName:', savedProjectName)
    
    // Only set both if both are present and valid
    if (savedProjectId && savedProjectName && savedProjectId.trim() !== '' && savedProjectName.trim() !== '') {
      console.log('✅ Setting project from localStorage:', savedProjectId, savedProjectName)
      setCurrentProjectId(savedProjectId)
      setCurrentProject(savedProjectName)
    } else {
      console.log('❌ Invalid localStorage data - will use default project')
      // Clear any invalid localStorage data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedProjectId')
        localStorage.removeItem('selectedProjectName')
      }
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
      console.log('Saving to localStorage - currentProjectId:', currentProjectId, 'currentProject:', currentProject)
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

  // Edit project
  const handleEditProject = async (project: Project) => {
    setEditingProject(project)
    setEditingProjectName(project.name)
    setIsEditProjectDialogOpen(true)
    setShowProjectMenu(false)
  }

  // Save edited project
  const handleSaveEditedProject = async () => {
    if (!editingProject || !editingProjectName.trim()) {
      toast({
        title: "Invalid Project Name",
        description: "Project name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    // Don't update if the name hasn't changed
    if (editingProject.name === editingProjectName.trim()) {
      setIsEditProjectDialogOpen(false)
      setEditingProject(null)
      setEditingProjectName('')
      return
    }

    try {
      // Check if name already exists (excluding current project)
      const projectExists = projects.some(p => 
        p.id !== editingProject.id && 
        p.name.toLowerCase() === editingProjectName.toLowerCase()
      )

      if (projectExists) {
        toast({
          title: "Project Name Already Exists",
          description: `A project with the name "${editingProjectName}" already exists.`,
          variant: "destructive",
        })
        return
      }

      // Update project in database
      await projectService.update(editingProject.id, {
        name: editingProjectName.trim(),
        description: `Project: ${editingProjectName.trim()}`
      })

      // Update current project if it was the edited one
      if (currentProject === editingProject.name) {
        setCurrentProject(editingProjectName.trim())
        localStorage.setItem('selectedProjectName', editingProjectName.trim())
      }

      // Reload projects
      await loadProjectsFromSupabase()

      toast({
        title: "Project Updated",
        description: `Project "${editingProject.name}" has been updated to "${editingProjectName}".`
      })

      setIsEditProjectDialogOpen(false)
      setEditingProject(null)
      setEditingProjectName('')
    } catch (error) {
      console.error('Failed to update project:', error)
      
      // Handle specific database constraint errors
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        toast({
          title: "Project Name Already Exists",
          description: `A project with the name "${editingProjectName}" already exists. Please choose a different name.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Updating Project",
          description: `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        })
      }
    }
  }

  // Share project
  const handleShareProject = async (project: Project) => {
    setSelectedProjectForSharing(project)
    setShareKind('project')
    setSelectedTestSuiteForSharing(null)
    setIsShareDialogOpen(true)
    setShowProjectMenu(false)
  }

  // Delete project
  const handleDeleteProject = async (project: Project) => {
    // Don't allow deleting the current project if it's the only one
    if (projects.length === 1) {
      toast({
        title: "Cannot Delete Project",
        description: "Cannot delete the only project. Please create another project first.",
        variant: "destructive",
      })
      return
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${project.name}"? This will also delete all test cases and test suites in this project.`)) {
      return
    }

    try {
      // Delete project from database
      await projectService.delete(project.id)

      // If this was the current project, switch to another one
      if (currentProject === project.name) {
        const remainingProjects = projects.filter(p => p.id !== project.id)
        if (remainingProjects.length > 0) {
          const newCurrentProject = remainingProjects[0]
          setCurrentProjectId(newCurrentProject.id)
          setCurrentProject(newCurrentProject.name)
          localStorage.setItem('selectedProjectId', newCurrentProject.id)
          localStorage.setItem('selectedProjectName', newCurrentProject.name)
        }
      }

      // Reload projects
      await loadProjectsFromSupabase()

      toast({
        title: "Project Deleted",
        description: `Project "${project.name}" and all its test cases have been deleted.`
      })
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast({
        title: "Error Deleting Project",
        description: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
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
      if (projectsData.length > 0 && (!currentProjectId || currentProjectId.trim() === '' || !currentProject || currentProject.trim() === '')) {
        const defaultProject = projectsData.find(p => p.name === DEFAULT_PROJECT) || projectsData[0]
        console.log('Setting default project:', defaultProject.name, 'ID:', defaultProject.id)
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
      // Don't load data if no project is selected
      if (!currentProjectId || currentProjectId.trim() === '') {
        console.log('⏭️ Skipping project data load - no project selected')
        return
      }

      try {
        // Load platforms, documents, important links, and custom columns for current project
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
        
        // Load custom columns
        await loadCustomColumns(currentProjectId)
      } catch (error) {
        console.error('❌ Failed to load project data:', error)
      }
    }

    loadProjectData()
  }, [currentProjectId])

  // REMOVED: This useEffect was causing infinite API calls
  // Test suite statistics will be refreshed manually when needed instead

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
        description: `Project "${projectName}" has been added${projects.length === 0 ? ' and selected' : ''}.`
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
        
        // If we're deleting the current project, handle the transition
        if (isDeletingCurrentProject) {
          if (remainingProjects.length > 0) {
            // Select a new project if there are remaining projects
            const newCurrentProject = remainingProjects[0]
            setCurrentProjectId(newCurrentProject.id)
            setCurrentProject(newCurrentProject.name)
            
            // Update localStorage
            localStorage.setItem('selectedProjectId', newCurrentProject.id)
            localStorage.setItem('selectedProjectName', newCurrentProject.name)
          } else {
            // No projects left - clear current project state
            setCurrentProjectId('')
            setCurrentProject('')
            
            // Clear localStorage
            localStorage.removeItem('selectedProjectId')
            localStorage.removeItem('selectedProjectName')
          }
        }
        
        // Reload projects from Supabase
        await loadProjectsFromSupabase()
        
        // Show appropriate message based on remaining projects
        if (remainingProjects.length === 0) {
          toast({
            title: "Last Project Removed",
            description: `Project "${projectName}" has been removed. Create a new project to get started.`,
          })
        } else {
          toast({
            title: "Project Removed",
            description: `Project "${projectName}" has been removed.`,
          })
        }
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
      console.log('Switching to project:', projectName, 'ID:', selectedProject.id)
      setCurrentProjectId(selectedProject.id)
      setCurrentProject(selectedProject.name)
      setCurrentView('dashboard')
      setGridFiltersOpen(false)
      // Don't clear selectedSuiteId - let user choose suite or stay in project view
      
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
  const handleAddImportantLink = async (link: Omit<CreateImportantLinkInput, 'projectId'>) => {
    if (!currentProjectId) {
      toast({
        title: "No project selected",
        description: "Create or select a project before adding resources.",
        variant: "destructive",
      })
      return
    }
    try {
      const created = await importantLinkService.create({
        ...link,
        projectId: currentProjectId
      })
      setImportantLinks(prev => [...prev, created])
      toast({
        title: "Link added",
        description: `"${created.title}" is now in this project's resources.`,
      })
    } catch (error) {
      console.error('Failed to add important link:', error)
      toast({
        title: "Could not add link",
        description: "The link was not saved. Try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteImportantLink = async (id: string) => {
    try {
      await importantLinkService.delete(id)
      setImportantLinks(prev => prev.filter(link => link.id !== id))
      toast({
        title: "Link deleted",
        description: "The link was removed from this project's resources.",
      })
    } catch (error) {
      console.error('Failed to delete important link:', error)
      toast({
        title: "Could not delete link",
        description: "The link is still in resources. Try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddDocument = async (document: Omit<CreateDocumentInput, 'projectId'>) => {
    if (!currentProjectId) {
      toast({
        title: "No project selected",
        description: "Create or select a project before adding resources.",
        variant: "destructive",
      })
      return
    }
    try {
      const created = await documentService.create({
        ...document,
        projectId: currentProjectId
      })
      setDocuments(prev => [...prev, created])
      toast({
        title: "Document added",
        description: `"${created.title}" is now in this project's resources.`,
      })
    } catch (error) {
      console.error('Failed to add document:', error)
      toast({
        title: "Could not add document",
        description: "The document was not saved. Try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      await documentService.delete(id)
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      toast({
        title: "Document deleted",
        description: "The document was removed from this project's resources.",
      })
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast({
        title: "Could not delete document",
        description: "The document is still in resources. Try again.",
        variant: "destructive",
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
      const pendingTests = suiteTestCases.filter(tc => tc.status === 'Not Executed').length
      
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
      status: testCase.status || 'Not Executed',
      priority: testCase.priority || 'P2 (Medium)',
      category: testCase.category || 'Other',
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
          const pendingTests = (suite.pendingTests || 0) + savedTestCases.filter(tc => tc.status === 'Not Executed').length
          
          
          
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

  const handleExportToExcel = async () => {
    if (!currentProjectId) {
      toast({
        title: 'No project selected',
        description: 'Create or open a project first.',
        variant: 'destructive',
      })
      return
    }

    if (currentView === 'test-cases' && selectedSuiteId) {
      setExportNonce((value) => value + 1)
      return
    }

    try {
      const { exportProjectCases } = await import('@/lib/case-export')
      const result = await exportProjectCases({
        projectId: currentProjectId,
        lists: testSuites.map((suite) => ({ id: suite.id, name: suite.name })),
        projectName: currentProject,
      })
      if (result.count === 0) {
        toast({
          title: 'Nothing to export',
          description: 'There are no cases in this project yet.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Export complete',
        description: `${result.count} cases saved to ${result.fileName}`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Export failed',
        description: 'Could not create the spreadsheet.',
        variant: 'destructive',
      })
    }
  }

  // Filter test cases based on selection:
  // - If selectedSuiteId is null: show ALL test cases from ALL suites (project view)
  // - If selectedSuiteId is set: show only test cases from that specific suite
  const displayedTestCases = testCases.filter(tc =>
    tc.projectId === currentProjectId &&
    (selectedSuiteId === null || tc.suiteId === selectedSuiteId)
  )

  // Use filtered test cases from useSearchAndFilter hook with same logic
  const finalTestCases = filteredTestCases.filter(tc =>
    tc.projectId === currentProjectId &&
    (selectedSuiteId === null || tc.suiteId === selectedSuiteId)
  )





  const handleOpenShareTestSuite = (testSuite: TestSuite) => {
    if (!testSuite) {
      toast({
        title: "Error",
        description: "Cannot share test suite: Invalid test suite data.",
        variant: "destructive",
      })
      return
    }
    setShareKind('list')
    setSelectedTestSuiteForSharing(testSuite)
    setIsShareDialogOpen(true)
  }




  const handleShowDashboard = () => {
    setCurrentView('dashboard')
    setSelectedSuiteId(null)
    setGridFiltersOpen(false)
    reloadTestCases()
  }

  const handleShowTestCases = () => {
    setSelectedSuiteId(null)
    setCurrentView('test-cases')
  }

  const openCaseGrid = (addNew = false) => {
    setCurrentView('test-cases')
    if (addNew) setAddCaseNonce((value) => value + 1)
  }

  const handleExportDashboardData = () => {
    handleExportToExcel()
  }

  // Update a single custom field value on a test case
  const handleUpdateCustomField = async (testCaseId: string, fieldKey: string, value: any) => {
    try {
      const target = testCases.find(tc => tc.id === testCaseId)
      const nextCustom = { ...(target?.customFields || {}), [fieldKey]: value }
      await updateTestCase(testCaseId, { customFields: nextCustom })
    } catch (e) {
      console.error('Failed to update custom field', { testCaseId, fieldKey, value, e })
      toast({ title: 'Update failed', description: 'Could not save custom field', variant: 'destructive' })
    }
  }

  // Custom Columns Management
  const loadCustomColumns = async (projectId: string) => {
    try {
      // Validate project ID
      if (!projectId || projectId.trim() === '') {
        console.log('⚠️ No project ID provided, skipping custom columns load')
        setCustomColumnsList([])
        return
      }

      // Check if user is authenticated
      if (!user) {
        console.log('⚠️ User not authenticated, skipping custom columns load')
        setCustomColumnsList([])
        return
      }

      console.log('🔄 Loading custom columns for project:', projectId)
      
      // First try to ensure the database table exists
      try {
        const setupResponse = await fetch('/api/setup-custom-columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        
        if (setupResponse.ok) {
          const setupResult = await setupResponse.json()
          console.log('✅ Database setup verified:', setupResult.message)
        }
      } catch (setupError) {
        console.warn('⚠️ Database setup check failed:', setupError)
      }
      
      // Use the new Dynamic Column Service
      const { DynamicColumnService } = await import('@/lib/dynamic-column-service')
      const columns = await DynamicColumnService.getProjectColumns(projectId)
      console.log('✅ Dynamic columns loaded:', columns.length, 'columns')
      setCustomColumnsList(columns)
    } catch (error) {
      console.error('❌ Failed to load custom columns:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        projectId,
        errorType: typeof error,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : 'Not an object'
      })
      
      // Check if it's a database structure issue
      if (error instanceof Error && (
        error.message.includes('table') || 
        error.message.includes('column') ||
        error.message.includes('does not exist')
      )) {
        console.log('🔧 Database structure issue detected during load')
        // Try to create the table structure
        try {
          const setupResponse = await fetch('/api/setup-custom-columns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
          
          if (setupResponse.ok) {
            console.log('✅ Database structure created, retrying load...')
            // Retry loading after setup
            const retryColumns = await customColumnService.getAll(projectId)
            setCustomColumnsList(retryColumns)
            return
          }
        } catch (retryError) {
          console.warn('⚠️ Database setup retry failed:', retryError)
        }
      }
      
      // Don't show error toast - just log the error and continue
      // Custom columns are optional and shouldn't break the application
      console.log('⚠️ Custom columns feature is not available - continuing without custom columns')
      setCustomColumnsList([])
    }
  }

  const createDefaultCustomColumns = async (projectId: string) => {
    // Intentionally left empty: default custom column seeding removed per new requirements
  }

  const handleAddCustomColumn = async (column: Omit<CustomColumn, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validate column object
      if (!column || typeof column !== 'object') {
        throw new Error('Invalid column object provided')
      }
      
      if (!column.name || !column.label) {
        throw new Error('Column name and label are required')
      }
      // Check if we're editing a default column
      if (editingDefaultColumn) {
        // Update default column properties
        setTableColumns(prev => {
          const currentColumn = prev[editingDefaultColumn.key as keyof typeof tableColumns]
          if (!currentColumn) {
            console.warn(`Column ${editingDefaultColumn.key} not found in tableColumns`)
            return prev
          }
          
          return {
            ...prev,
            [editingDefaultColumn.key]: {
              ...currentColumn,
              width: column.width,
              minWidth: column.minWidth,
              visible: column.visible
            }
          }
        })
        
        setIsAddCustomColumnDialogOpen(false)
        setEditingDefaultColumn(null)
        toast({
          title: "Default Column Updated",
          description: `Column "${column.label}" has been updated successfully.`,
        })
        return
      }

      // Check if we're editing an existing custom column
      if (editingCustomColumn) {
        const updatedColumn = await customColumnService.update(editingCustomColumn.id, column)
        setCustomColumnsList(prev => prev.map(col => col.id === editingCustomColumn.id ? updatedColumn : col))
        setIsAddCustomColumnDialogOpen(false)
        setEditingCustomColumn(null)
        toast({
          title: "Custom Column Updated",
          description: `Column "${column.label}" has been updated successfully.`,
        })
        return
      }

      // Validate that we have a valid project ID for new custom columns
      if (!currentProjectId || currentProjectId.trim() === '') {
        toast({
          title: "Error",
          description: "No project selected. Please select a project first.",
          variant: "destructive",
        })
        return
      }

      // Create new custom column
      const newColumn = await customColumnService.create({
        ...column,
        projectId: currentProjectId
      })
      setCustomColumnsList(prev => [...prev, newColumn])
      setIsAddCustomColumnDialogOpen(false)
      toast({
        title: "Custom Column Added",
        description: `Column "${column.label}" has been added successfully.`,
      })
    } catch (error) {
      // Log error details separately for better debugging
      console.error('❌ Failed to handle column operation')
      console.error('Error object:', error)
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('Column data:', column)
      console.error('Current project ID:', currentProjectId)
      console.error('Editing default column:', editingDefaultColumn)
      console.error('Editing custom column:', editingCustomColumn)
      console.error('Error type:', typeof error)
      console.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'Not an object')
      toast({
        title: "Error",
        description: "Failed to complete column operation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCustomColumn = async (id: string, updates: Partial<CustomColumn>) => {
    try {
      const updatedColumn = await customColumnService.update(id, updates)
      setCustomColumnsList(prev => prev.map(col => col.id === id ? updatedColumn : col))
    } catch (error) {
      // Log error details separately for better debugging
      console.error('❌ Failed to update custom column')
      console.error('Error object:', error)
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('Column ID:', id)
      console.error('Updates:', updates)
      console.error('Error type:', typeof error)
      console.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'Not an object')
      toast({
        title: "Error",
        description: "Failed to update column. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCustomColumn = async (id: string) => {
    if (!currentProjectId || currentProjectId.trim() === '') {
      toast({
        title: "Error",
        description: "No project selected. Please select a project first.",
        variant: "destructive"
      })
      return
    }
    
    try {
      await customColumnService.delete(id)
      setCustomColumnsList(prev => prev.filter(col => col.id !== id))
      toast({
        title: "Success",
        description: "Custom column deleted successfully",
      })
    } catch (error) {
      console.error('❌ Failed to delete custom column:', error)
      toast({
        title: "Error",
        description: "Failed to delete custom column",
        variant: "destructive"
      })
    }
  }

  const handleEditDefaultColumn = (key: string, column: any) => {
    setEditingDefaultColumn({ key, column })
    setIsAddCustomColumnDialogOpen(true)
  }

  const clearSuite = () => {
    setSelectedSuiteId(null)
    setCurrentView('dashboard')
    setGridFiltersOpen(false)
  }

  const handleSuiteClick = (suiteId: string | null) => {
    setSelectedSuiteId(suiteId)
    setCurrentView('test-cases')
  }

  const openListDialog = (kind: 'suite' | 'bugs') => {
    setSuiteDialogKind(kind)
    setActiveDropdown(kind === 'bugs' ? 'bugLists' : 'testSuites')
    setIsSuiteDialogOpen(true)
  }

  const caseSuites = testSuites.filter((suite) => suite.kind !== 'bugs')
  const bugLists = testSuites.filter((suite) => suite.kind === 'bugs')
  const selectedList = testSuites.find((suite) => suite.id === selectedSuiteId)
  const activeShare = shareTick >= 0 ? getLocalShare(currentProjectId, selectedSuiteId) : null

  return (
    <>
      <GlobalLoadingIndicator />
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">


        {/* Header - Only show when there are projects */}
        {projects.length > 0 && (
          <div className="relative z-30 shrink-0 border-b border-slate-700/50 bg-slate-950/90">
          <div className="px-4">
            <div className="flex h-14 items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center">
                    <img 
                      src="/favicon.png" 
                      alt="QA Management" 
                      className="h-9 w-9 object-contain"
                      onError={(e) => {
                        // Fallback to favicon.ico if png fails
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('favicon.png')) {
                          target.src = '/favicon.ico';
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-white">QA Management</h1>
                    <p className="text-[11px] font-medium text-slate-400">Professional Test Case Management</p>
                  </div>
                </div>
                
                
              </div>
              
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="h-10 w-10 p-0 hover:bg-slate-800/60 rounded-xl transition-all duration-200"
                  >
                    <Settings className="w-5 h-5 text-white" />
                  </Button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700/60 dark:bg-slate-900/95 z-[999999999]">
                      <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-200">User Profile</p>
                      </div>
                      
                      <div className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate dark:text-white">
                              {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-xs text-blue-200 truncate">
                              {user?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={signOut}
                        className="w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10 flex items-center space-x-3 transition-colors"
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
        )}

        {projects.length > 0 ? (
          <div className="flex min-h-0 flex-1">
          <aside className="relative z-20 flex w-[272px] shrink-0 flex-col border-r border-slate-800 bg-slate-950/95">
              <div className="border-b border-slate-800 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-500">Project</p>
                <ProjectDropdown
                  ref={projectMenuRef}
                  currentProject={currentProject}
                  projects={projects}
                  testSuites={testSuites}
                  showProjectMenu={showProjectMenu}
                  onToggleProjectMenu={() => setShowProjectMenu(!showProjectMenu)}
                  onProjectChange={handleProjectChange}
                  onEditProject={handleEditProject}
                  onShareProject={handleShareProject}
                  onDeleteProject={handleDeleteProject}
                  onOpenProjectDialog={() => setIsProjectDialogOpen(true)}
                  fullWidth
                />
              </div>

              <nav className="space-y-1 border-b border-slate-800 p-2">
                <button
                  type="button"
                  onClick={handleShowDashboard}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleShowTestCases}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    currentView === 'test-cases' && !selectedSuiteId
                      ? 'bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  }`}
                >
                  <Table2 className="h-4 w-4" />
                  Cases
                </button>
              </nav>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                {/* Test Suites accordion */}
                <div>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      selectedSuiteId && selectedList?.kind !== 'bugs'
                        ? 'bg-emerald-500/15'
                        : 'hover:bg-emerald-500/10'
                    }`}
                    onClick={() => toggleDropdown('testSuites')}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/20">
                      <FileSpreadsheet className="h-3 w-3 text-emerald-300" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-white">Test Suites</span>
                    <Badge className="border-emerald-400/20 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      {caseSuites.length}
                    </Badge>
                    <ChevronDown className={`h-3 w-3 text-emerald-300 transition-transform ${activeDropdown === 'testSuites' ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === 'testSuites' && (
                    <div className="mt-1 rounded-lg border border-emerald-500/15 bg-slate-900/60">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-300/80">Suites</p>
                        <button
                          type="button"
                          onClick={() => openListDialog('suite')}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/15"
                        >
                          <Plus className="h-3 w-3" />
                          New
                        </button>
                      </div>
                      <div className="max-h-52 overflow-y-auto px-1 pb-1">
                        {caseSuites.length === 0 ? (
                          <p className="px-2 py-3 text-center text-xs text-slate-500">No test suites yet</p>
                        ) : (
                          caseSuites.map((suite) => (
                            <div
                              key={suite.id}
                              onClick={() => handleSuiteClick(suite.id)}
                              className={`group mb-0.5 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 ${
                                selectedSuiteId === suite.id
                                  ? 'bg-emerald-500/20 text-emerald-200'
                                  : 'text-slate-200 hover:bg-white/5'
                              }`}
                            >
                              <FileSpreadsheet className={`h-3.5 w-3.5 shrink-0 ${
                                selectedSuiteId === suite.id ? 'text-emerald-300' : 'text-slate-500'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">{suite.name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {testCases.filter((item) => item.suiteId === suite.id).length} cases
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenShareTestSuite(suite)
                                }}
                                className="rounded p-1 text-slate-500 opacity-0 hover:bg-sky-500/15 hover:text-sky-300 group-hover:opacity-100"
                                title="Share test suite"
                              >
                                <Share2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteTestSuite(suite.id)
                                }}
                                className="rounded p-1 text-slate-500 opacity-0 hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100"
                                title="Delete test suite"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bug Lists accordion */}
                <div>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      selectedList?.kind === 'bugs'
                        ? 'bg-rose-500/15'
                        : 'hover:bg-rose-500/10'
                    }`}
                    onClick={() => toggleDropdown('bugLists')}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-rose-400/20 bg-rose-500/20">
                      <Bug className="h-3 w-3 text-rose-300" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-white">Bug Lists</span>
                    <Badge className="border-rose-400/20 bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">
                      {bugLists.length}
                    </Badge>
                    <ChevronDown className={`h-3 w-3 text-rose-300 transition-transform ${activeDropdown === 'bugLists' ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === 'bugLists' && (
                    <div className="mt-1 rounded-lg border border-rose-500/15 bg-slate-900/60">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-rose-300/80">Lists</p>
                        <button
                          type="button"
                          onClick={() => openListDialog('bugs')}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-rose-300 hover:bg-rose-500/15"
                        >
                          <Plus className="h-3 w-3" />
                          New
                        </button>
                      </div>
                      <div className="max-h-52 overflow-y-auto px-1 pb-1">
                        {bugLists.length === 0 ? (
                          <p className="px-2 py-3 text-center text-xs text-slate-500">No bug lists yet</p>
                        ) : (
                          bugLists.map((suite) => (
                            <div
                              key={suite.id}
                              onClick={() => handleSuiteClick(suite.id)}
                              className={`group mb-0.5 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 ${
                                selectedSuiteId === suite.id
                                  ? 'bg-rose-500/20 text-rose-200'
                                  : 'text-slate-200 hover:bg-white/5'
                              }`}
                            >
                              <Bug className={`h-3.5 w-3.5 shrink-0 ${
                                selectedSuiteId === suite.id ? 'text-rose-300' : 'text-slate-500'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">{suite.name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {testCases.filter((item) => item.suiteId === suite.id).length} cases
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenShareTestSuite(suite)
                                }}
                                className="rounded p-1 text-slate-500 opacity-0 hover:bg-sky-500/15 hover:text-sky-300 group-hover:opacity-100"
                                title="Share bug list"
                              >
                                <Share2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteTestSuite(suite.id)
                                }}
                                className="rounded p-1 text-slate-500 opacity-0 hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100"
                                title="Delete bug list"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Resources accordion */}
                <div>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      activeDropdown === 'resources'
                        ? 'bg-indigo-50 dark:bg-indigo-500/15'
                        : 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                    }`}
                    onClick={() => toggleDropdown('resources')}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-indigo-300 bg-indigo-100 dark:border-indigo-400/20 dark:bg-indigo-500/20">
                      <BookOpen className="h-3 w-3 text-indigo-700 dark:text-indigo-300" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-white">Resources</span>
                    <Badge className="border-indigo-200 bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {importantLinks.length + documents.length}
                    </Badge>
                    <ChevronDown className={`h-3 w-3 text-indigo-600 transition-transform dark:text-indigo-300 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === 'resources' && (
                    <div className="mt-1 rounded-lg border border-indigo-200 bg-white dark:border-indigo-500/15 dark:bg-slate-900/60">
                      <div className="max-h-52 overflow-y-auto px-1 py-1">
                        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-300/80">Links</p>
                        {importantLinks.length === 0 ? (
                          <p className="px-2 pb-2 text-[11px] text-slate-600 dark:text-slate-400">No links yet</p>
                        ) : (
                          importantLinks.map((link, index) => (
                            <div key={link.id || index} className="group mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-indigo-50 dark:hover:bg-white/5">
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                                title={link.description || link.url}
                              >
                                <Link className="h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <span className="truncate text-xs text-slate-800 dark:text-slate-200">{link.title}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete "${link.title}" from resources?`)) {
                                    void handleDeleteImportantLink(link.id)
                                  }
                                }}
                                className="rounded p-1 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                                title="Delete link"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        )}

                        <p className="mt-1 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-300/80">Documents</p>
                        {documents.length === 0 ? (
                          <p className="px-2 pb-2 text-[11px] text-slate-600 dark:text-slate-400">No documents yet</p>
                        ) : (
                          documents.map((doc, index) => (
                            <div key={doc.id || index} className="group mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-indigo-50 dark:hover:bg-white/5">
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
                                title={doc.description || doc.url}
                              >
                                <BookOpen className="h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <span className="truncate text-xs text-slate-800 dark:text-slate-200">{doc.title}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete "${doc.title}" from resources?`)) {
                                    void handleDeleteDocument(doc.id)
                                  }
                                }}
                                className="rounded p-1 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                                title="Delete document"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-1 border-t border-slate-200 px-1 py-1 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentProjectId) {
                              toast({
                                title: "No project selected",
                                description: "Create or select a project first.",
                                variant: "destructive",
                              })
                              return
                            }
                            setIsAddLinkDialogOpen(true)
                          }}
                          className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                        >
                          <Plus className="h-3 w-3" />
                          Link
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentProjectId) {
                              toast({
                                title: "No project selected",
                                description: "Create or select a project first.",
                                variant: "destructive",
                              })
                              return
                            }
                            setIsAddDocumentDialogOpen(true)
                          }}
                          className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                        >
                          <Plus className="h-3 w-3" />
                          Doc
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-3 border-t border-slate-800 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEnhancedImportDialogOpen(true)}
                      className="h-8 justify-start border-emerald-300 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:border-emerald-400/50 dark:hover:bg-emerald-500/30"
                    >
                      <Upload className="mr-1.5 h-3 w-3 text-emerald-700 dark:text-emerald-300" />
                      Import
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEnhancedPasteDialogOpen(true)}
                      className="h-8 justify-start border-blue-300 bg-blue-50 px-2.5 text-xs font-medium text-blue-800 hover:border-blue-400 hover:bg-blue-100 hover:text-blue-900 dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:border-blue-400/50 dark:hover:bg-blue-500/30"
                    >
                      <Clipboard className="mr-1.5 h-3 w-3 text-blue-700 dark:text-blue-300" />
                      Paste
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportToExcel}
                      className="h-8 justify-start border-purple-300 bg-purple-50 px-2.5 text-xs font-medium text-purple-800 hover:border-purple-400 hover:bg-purple-100 hover:text-purple-900 dark:border-purple-400/30 dark:bg-purple-500/20 dark:text-purple-300 dark:hover:border-purple-400/50 dark:hover:bg-purple-500/30"
                    >
                      <Download className="mr-1.5 h-3 w-3 text-purple-700 dark:text-purple-300" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (!selectedSuiteId) {
                          toast({
                            title: 'Pick a list first',
                            description: 'Open a test suite or bug list to filter cases.',
                          })
                          return
                        }
                        setCurrentView('test-cases')
                        setGridFiltersOpen((open) => !open)
                      }}
                      className={`h-8 justify-start border-orange-300 bg-orange-50 px-2.5 text-xs font-medium text-orange-800 hover:border-orange-400 hover:bg-orange-100 hover:text-orange-900 dark:border-orange-400/30 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:border-orange-400/50 dark:hover:bg-orange-500/30 ${
                        gridFiltersOpen ? 'border-orange-400 bg-orange-100 dark:border-orange-400/50 dark:bg-orange-500/30' : ''
                      }`}
                    >
                      <Filter className="mr-1.5 h-3 w-3 text-orange-700 dark:text-orange-300" />
                      Filters
                    </Button>
                  </div>
              </div>
          </aside>
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
                  {currentView === 'dashboard' ? (
                    <div className="h-full overflow-auto">
                    <ProjectDashboard
                      project={{ id: currentProjectId, name: currentProject, createdAt: new Date() }}
                      testCases={testCases.filter(tc => tc.projectId === currentProjectId)}
                      testSuites={testSuites}
                      onAddTestCase={() => {
                        toast({
                          title: 'Pick a list first',
                          description: 'Open a test suite or bug list, then add cases there.',
                        })
                      }}
                      onAddTestSuite={() => openListDialog('suite')}
                      onExportData={handleExportDashboardData}
                      onViewAllTestCases={handleShowTestCases}
                    />
                    </div>
                  ) : (
                    <GoogleSheetsTable
                      projectId={currentProjectId || ''}
                      addCaseNonce={addCaseNonce}
                      reloadNonce={gridReloadNonce}
                      exportNonce={exportNonce}
                      filtersOpen={gridFiltersOpen}
                      onFiltersOpenChange={setGridFiltersOpen}
                      suiteId={selectedSuiteId}
                      listKind={selectedList?.kind === 'bugs' ? 'bugs' : 'suite'}
                      listName={selectedList?.name}
                      shareToken={activeShare?.token}
                      shareMode="owner"
                    />
                  )}
        </div>
          </main>
          </div>
        ) : projectsLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="text-slate-400">Loading your projects...</p>
                  </div>
                </div>
              ) : (
                <FullScreenWelcome 
                  onCreateProject={handleAddProject}
                  isLoading={isCreatingProject}
                  onSignOut={signOut}
                  user={user}
                />
              )}
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
        listKind={suiteDialogKind}
        onSubmit={async (suite) => {
          const created = await createTestSuite({
            ...suite,
            projectId: currentProjectId || suite.projectId,
            kind: suiteDialogKind,
          })
          if (created?.id) {
            handleSuiteClick(created.id)
          }
        }}
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

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        kind={shareKind}
        projectId={selectedProjectForSharing?.id || currentProjectId}
        projectName={selectedProjectForSharing?.name || currentProject}
        lists={testSuites}
        suite={shareKind === 'list' ? selectedTestSuiteForSharing : null}
        onChanged={() => setShareTick((value) => value + 1)}
      />




      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent
          variant="dark"
          className="w-[min(92vw,440px)] max-w-[440px] gap-0 border border-slate-200 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        >
          <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-white px-6 pb-5 pt-6 dark:border-slate-800 dark:from-blue-500/15 dark:via-slate-950 dark:to-slate-950">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative flex items-start gap-3 pr-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300 bg-blue-100 text-blue-700 shadow-inner dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-200">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300/80">Project</p>
                <DialogTitle className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">Create new project</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Organize cases, suites, and resources under one project.
                </DialogDescription>
              </div>
            </div>
          </div>
          <form
            id="create-project-form"
            className="space-y-4 px-6 py-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!newProject.trim()) return
              handleAddProject(newProject.trim())
              setIsProjectDialogOpen(false)
              setNewProject('')
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="project-name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Project name
              </Label>
              <Input
                id="project-name"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Courtmesh"
                required
                autoFocus
                className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </form>
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsProjectDialogOpen(false)
                setNewProject('')
              }}
              className="h-9 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-project-form"
              disabled={!newProject.trim()}
              className="h-9 bg-blue-600 text-white hover:bg-blue-500"
            >
              Create project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent
          variant="dark"
          className="w-[min(92vw,440px)] max-w-[440px] gap-0 border border-slate-200 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        >
          <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-white px-6 pb-5 pt-6 dark:border-slate-800 dark:from-blue-500/15 dark:via-slate-950 dark:to-slate-950">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative flex items-start gap-3 pr-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300 bg-blue-100 text-blue-700 shadow-inner dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-200">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300/80">Project</p>
                <DialogTitle className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">Edit project</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Update the name for this project.
                </DialogDescription>
              </div>
            </div>
          </div>
          <form
            id="edit-project-form"
            className="space-y-4 px-6 py-5"
            onSubmit={(event) => {
              event.preventDefault()
              handleSaveEditedProject()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="edit-project-name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Project name
              </Label>
              <Input
                id="edit-project-name"
                value={editingProjectName}
                onChange={(e) => setEditingProjectName(e.target.value)}
                placeholder="Project name"
                required
                className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </form>
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditProjectDialogOpen(false)
                setEditingProject(null)
                setEditingProjectName('')
              }}
              className="h-9 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-project-form"
              disabled={!editingProjectName.trim()}
              className="h-9 bg-blue-600 text-white hover:bg-blue-500"
            >
              Save changes
            </Button>
          </div>
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
        currentProject={currentProjectId}
        selectedSuiteId={selectedSuiteId || undefined}
        testSuites={testSuites}
        onCreateTestSuite={createTestSuite}
      />

      <EnhancedImportDialog
        isOpen={isEnhancedImportDialogOpen}
        onClose={() => setIsEnhancedImportDialogOpen(false)}
        onImported={({ suiteId }) => {
          setIsEnhancedImportDialogOpen(false)
          handleSuiteClick(suiteId)
          setGridReloadNonce((value) => value + 1)
        }}
        projectId={currentProjectId}
        selectedSuiteId={selectedSuiteId || undefined}
        testSuites={testSuites}
        onCreateTestSuite={createTestSuite}
      />

      <EnhancedPasteDialog
        isOpen={isEnhancedPasteDialogOpen}
        onClose={() => setIsEnhancedPasteDialogOpen(false)}
        onImported={({ suiteId }) => {
          setIsEnhancedPasteDialogOpen(false)
          handleSuiteClick(suiteId)
          setGridReloadNonce((value) => value + 1)
        }}
        projectId={currentProjectId}
        selectedSuiteId={selectedSuiteId || undefined}
        testSuites={testSuites}
        onCreateTestSuite={createTestSuite}
      />

             {/* Custom Column Dialog */}
       <CustomColumnDialog
         isOpen={isAddCustomColumnDialogOpen}
         onClose={() => {
           setIsAddCustomColumnDialogOpen(false)
           setEditingCustomColumn(null)
           setEditingDefaultColumn(null)
         }}
         onSubmit={handleAddCustomColumn}
         column={editingCustomColumn}
         isEditMode={!!editingCustomColumn}
         defaultColumn={editingDefaultColumn}
       />

      <AddLinkDialog
        isOpen={isAddLinkDialogOpen}
        onClose={() => setIsAddLinkDialogOpen(false)}
        onSubmit={handleAddImportantLink}
      />
      <AddDocumentDialog
        isOpen={isAddDocumentDialogOpen}
        onClose={() => setIsAddDocumentDialogOpen(false)}
        onSubmit={handleAddDocument}
      />

    </>
  )
} 