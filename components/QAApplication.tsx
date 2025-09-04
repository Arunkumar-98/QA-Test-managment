"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { useTestCases } from "@/hooks/useTestCases"
import { useTestSuites } from "@/hooks/useTestSuites"
import { useSearchAndFilter } from "@/hooks/useSearchAndFilter"

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

import { ProjectMembersDialog } from './ProjectMembersDialog'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Settings, Eye, Trash2, LogOut, User, Share2, Plus, Upload, Clipboard, Download, X, Folder, Table, FileText, Share, RefreshCw, Mail, EyeOff, BarChart3, RotateCcw, ChevronDown, Briefcase, BookOpen, Users, Link, FileSpreadsheet, Search, Filter } from "lucide-react"
import { useAuth } from "./AuthProvider"
import { CustomColumnDialog } from './CustomColumnDialog'
import { ProjectDashboard } from './ProjectDashboard'



export function QAApplication() {
  // Auth context
  const { user, signOut } = useAuth()
  
  // UI state - declare these first
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)

  // Helper functions for dropdown management
  const openDropdown = (dropdownName: string) => {
    setActiveDropdown(dropdownName)
  }

  const closeDropdown = () => {
    setActiveDropdown(null)
  }

  const toggleDropdown = (dropdownName: string) => {
    if (activeDropdown === dropdownName) {
      setActiveDropdown(null)
    } else {
      setActiveDropdown(dropdownName)
    }
  }

  // Handler functions for adding links and documents
  const handleAddLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      const linkToAdd: ImportantLink = {
        id: Date.now().toString(),
        title: newLink.title.trim(),
        url: newLink.url.trim(),
        description: newLink.description.trim(),
        category: 'general',
        projectId: currentProjectId || '',
        createdAt: new Date()
      }
      
      setImportantLinks(prev => [...prev, linkToAdd])
      setNewLink({ title: '', url: '', description: '' })
      setIsAddLinkDialogOpen(false)
      
      toast({
        title: "Link Added",
        description: `"${linkToAdd.title}" has been added to your resources.`,
      })
    } else {
      toast({
        title: "Missing Information",
        description: "Please provide both title and URL for the link.",
        variant: "destructive",
      })
    }
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

  const [isProjectMembersDialogOpen, setIsProjectMembersDialogOpen] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'test-cases'>('dashboard')
  const [coreColumnSettings, setCoreColumnSettings] = useState<{[key: string]: { visible: boolean; width: string; minWidth: string; label: string; deleted?: boolean }}>({})

  
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
  const [newLink, setNewLink] = useState({ title: '', url: '', description: '' })
  const [newDocument, setNewDocument] = useState({ title: '', url: '', type: '', description: '' })
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
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
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
      // Close dropdowns when clicking outside
      const target = event.target as Node
      
      const testSuitesDropdown = document.querySelector('[data-test-suites-dropdown]')
      const resourcesDropdown = document.querySelector('[data-resources-dropdown]')

      const membersDropdown = document.querySelector('[data-members-dropdown]')
      
      // Check if click is outside all dropdowns
      const isOutsideAllDropdowns = 
        (!testSuitesDropdown || !testSuitesDropdown.contains(target)) &&
        (!resourcesDropdown || !resourcesDropdown.contains(target)) &&

        (!membersDropdown || !membersDropdown.contains(target))
      
      if (isOutsideAllDropdowns) {
        closeDropdown()
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
    setIsShareProjectDialogOpen(true)
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
        
        // Load core column settings
        loadCoreColumnSettings()
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
      setCurrentView('dashboard') // Show dashboard by default for project view
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
    setSelectedTestSuiteForSharing(testSuite)
    setIsShareTestSuiteDialogOpen(true)
  }



  const handleOpenProjectMembers = () => {
    if (!currentProjectId || currentProjectId.trim() === '' || currentProjectId.trim().length !== 36) {
      toast({
        title: 'No Project Selected',
        description: 'Please select a project first before opening members.',
        variant: 'destructive',
      })
      return
    }
    setIsProjectMembersDialogOpen(true)
  }

  const handleShowDashboard = () => {
    setCurrentView('dashboard')
    // Clear suite filter when switching to dashboard
    setSelectedSuiteId(null)
  }

  const handleShowTestCases = () => {
    setCurrentView('test-cases')
  }

  const handleExportDashboardData = () => {
    handleExportToExcel()
  }

  const handleOpenDashboardSettings = () => {
    setIsProjectSettingsOpen(true)
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
      
      const columns = await customColumnService.getAll(projectId)
      console.log('✅ Custom columns loaded:', columns.length, 'columns')
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

  // Load core column settings from localStorage
  const loadCoreColumnSettings = () => {
    if (typeof window !== 'undefined' && currentProjectId) {
      const savedSettings = localStorage.getItem(`qa.coreColumns:${currentProjectId}`)
      if (savedSettings) {
        setCoreColumnSettings(JSON.parse(savedSettings))
      } else {
        // Set default settings
        const defaultSettings = {
          testCase: { visible: true, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Test Case' },
          description: { visible: true, width: 'w-80', minWidth: 'min-w-[300px]', label: 'Description' },
          expectedResult: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Expected Result' },
          status: { visible: true, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Status' },
          priority: { visible: false, width: 'w-24', minWidth: 'min-w-[100px]', label: 'Priority' },
          category: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Category' },
          assignedTester: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Assigned Tester' },
          executionDate: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Execution Date' },
  
          actualResult: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Actual Result' },
          environment: { visible: false, width: 'w-24', minWidth: 'min-w-[100px]', label: 'Environment' },
          prerequisites: { visible: false, width: 'w-64', minWidth: 'min-w-[250px]', label: 'Prerequisites' },
          platform: { visible: false, width: 'w-24', minWidth: 'min-w-[100px]', label: 'Platform' },
          stepsToReproduce: { visible: true, width: 'w-80', minWidth: 'min-w-[300px]', label: 'Steps to Reproduce' },
          suite: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Test Suite' },
          position: { visible: false, width: 'w-16', minWidth: 'min-w-[80px]', label: 'Position' },
          createdAt: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Created At' },
          updatedAt: { visible: false, width: 'w-32', minWidth: 'min-w-[120px]', label: 'Updated At' },
          automationScript: { visible: false, width: 'w-48', minWidth: 'min-w-[200px]', label: 'Automation Script' },
          customFields: { visible: false, width: 'w-48', minWidth: 'min-w-[200px]', label: 'Custom Fields' }
        }
        setCoreColumnSettings(defaultSettings)
        localStorage.setItem(`qa.coreColumns:${currentProjectId}`, JSON.stringify(defaultSettings))
      }
    }
  }

  // Handle permanent deletion of core columns
  const handleDeleteCoreColumn = (columnName: string, columnLabel: string) => {
    const updatedSettings = {
      ...coreColumnSettings,
      [columnName]: { 
        ...coreColumnSettings[columnName], 
        deleted: true,
        visible: false 
      }
    }
    setCoreColumnSettings(updatedSettings)
    localStorage.setItem(`qa.coreColumns:${currentProjectId}`, JSON.stringify(updatedSettings))
    
    toast({
      title: 'Column Deleted',
      description: `${columnLabel} has been permanently deleted.`,
      variant: 'destructive'
    })
  }

  // Handle restoration of deleted core columns
  const handleRestoreCoreColumn = (columnName: string, columnLabel: string) => {
    const updatedSettings = {
      ...coreColumnSettings,
      [columnName]: { 
        ...coreColumnSettings[columnName], 
        deleted: false,
        visible: false // Start hidden when restored
      }
    }
    setCoreColumnSettings(updatedSettings)
    localStorage.setItem(`qa.coreColumns:${currentProjectId}`, JSON.stringify(updatedSettings))
    
    toast({
      title: 'Column Restored',
      description: `${columnLabel} has been restored.`,
    })
  }

  // Handle restoration of all deleted core columns
  const handleRestoreAllDeletedColumns = () => {
    const deletedColumns = Object.entries(coreColumnSettings).filter(([_, settings]) => settings.deleted)
    
    if (deletedColumns.length === 0) {
      toast({
        title: 'No Deleted Columns',
        description: 'There are no deleted columns to restore.',
      })
      return
    }

    const updatedSettings = { ...coreColumnSettings }
    deletedColumns.forEach(([columnName, settings]) => {
      updatedSettings[columnName] = {
        ...settings,
        deleted: false,
        visible: false // Start hidden when restored
      }
    })
    
    setCoreColumnSettings(updatedSettings)
    localStorage.setItem(`qa.coreColumns:${currentProjectId}`, JSON.stringify(updatedSettings))
    
    toast({
      title: 'All Columns Restored',
      description: `${deletedColumns.length} deleted columns have been restored.`,
    })
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
  }

  const handleSuiteClick = (suiteId: string | null) => {
    setSelectedSuiteId(suiteId)
    // Always switch to test cases view when a suite is clicked (including "All Test Cases")
    setCurrentView('test-cases')
  }

  return (
    <>
      <GlobalLoadingIndicator />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">


        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 border-b border-slate-700/50 shadow-lg relative z-40">
          <div className="w-full px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img 
                      src="/favicon.png" 
                      alt="QA Management" 
                      className="w-12 h-12 object-contain"
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
                    <h1 className="text-2xl font-bold text-white">QA Management</h1>
                    <p className="text-sm text-blue-200 font-medium">Professional Test Case Management</p>
                  </div>
                </div>
                
                
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Project Selector */}
                <div className="relative" ref={projectMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                    onClick={() => setShowProjectMenu(!showProjectMenu)}
                    className="h-10 px-4 bg-slate-900/50 border-slate-700/60 text-slate-200 hover:bg-slate-800/70 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Briefcase className="w-4 h-4 text-blue-300" />
                    <span className="text-sm font-medium truncate max-w-40">
                      {currentProject || 'Select Project'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                  
                  {showProjectMenu && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/60 py-2 z-[999999] max-h-96 overflow-y-auto">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Projects</p>
                      </div>
                      
                      {projects.length > 0 ? (
                        <div className="py-2">
                          {projects.map((project) => (
                            <div
                              key={project.id}
                              onClick={() => {
                                handleProjectChange(project.name)
                                setShowProjectMenu(false)
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-white/10 flex items-center space-x-3 transition-colors group cursor-pointer rounded-lg mx-2 ${
                                currentProject === project.name ? 'bg-blue-500/20 text-blue-200' : 'text-white'
                              }`}
                            >
                              <Briefcase className={`w-4 h-4 ${
                                currentProject === project.name ? 'text-blue-300' : 'text-slate-400'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${
                                  currentProject === project.name ? 'text-blue-200' : 'text-white'
                                }`}>
                                  {project.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  {testSuites.filter(suite => suite.projectId === project.id).length} test suites
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {currentProject === project.name && (
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-emerald-300 font-medium">Active</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditProject(project)
                                    }}
                                    className="p-1 hover:bg-blue-500/20 rounded text-blue-300 hover:text-blue-200 transition-colors"
                                    title="Edit Project"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleShareProject(project)
                                    }}
                                    className="p-1 hover:bg-green-500/20 rounded text-green-300 hover:text-green-200 transition-colors"
                                    title="Share Project"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteProject(project)
                                    }}
                                    className="p-1 hover:bg-red-500/20 rounded text-red-300 hover:text-red-200 transition-colors"
                                    title="Delete Project"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-slate-400 mb-3">No projects available</p>
                          <Button
                            onClick={() => {
                              setIsProjectDialogOpen(true)
                              setShowProjectMenu(false)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Project
                </Button>
              </div>
                      )}
                      
                      <div className="px-4 py-3 border-t border-white/10">
                        <button
                          onClick={() => {
                            setIsProjectDialogOpen(true)
                            setShowProjectMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-blue-300 hover:bg-blue-500/20 flex items-center space-x-3 transition-colors rounded-lg mx-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="font-medium">Create New Project</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/60 py-2 z-[99999]">
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
                        onClick={() => {
                          if (!currentProjectId || currentProjectId.trim() === '') {
                            toast({
                              title: 'No Project Selected',
                              description: 'Please select a project first to configure table settings.',
                              variant: 'destructive',
                            })
                            return
                          }
                          setIsTableSettingsOpen(true)
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-3 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-amber-300" />
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

        {/* Second Navbar */}
        <div className="bg-slate-900/80 border-b border-slate-700/30 shadow-sm relative z-[999999]">
          <div className="w-full px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-between h-14">
              {/* Left side - Search and Actions */}
              <div className="flex items-center space-x-6">
                {/* Search Bar */}
                <div className="flex-1 max-w-md relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                  </div>
                  <Input
                    className="pl-9 pr-9 h-8 bg-slate-800/70 border-slate-600/60 text-slate-200 placeholder:text-slate-400 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="Search test cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-blue-500/20 rounded-md"
                    title="Advanced Search Options"
                  >
                    <Settings className="w-3 h-3 text-blue-400 hover:text-blue-300 transition-colors" />
                  </Button>
                </div>

                {/* Partition Line */}
                <div className="w-px h-6 bg-slate-600/50 mx-2"></div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* All Test Cases Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSuiteClick(null)}
                    className={`h-8 px-3 text-xs ${
                      selectedSuiteId === null 
                        ? 'bg-blue-500/30 border-blue-400/50 text-blue-200' 
                        : 'bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30 hover:border-blue-400/50'
                    }`}
                  >
                    <Folder className="w-3 h-3 mr-1.5" />
                    All Test Cases
                  </Button>

                  {/* Import */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.csv,.xlsx'
                      input.onchange = (e) => handleFileUpload(e as any)
                      input.click()
                    }}
                    className="h-8 px-3 bg-emerald-500/20 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400/50 text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1.5 text-emerald-300" />
                    Import
                  </Button>
                  
                  {/* Paste */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEnhancedPasteDialogOpen(true)}
                    className="h-8 px-3 bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30 hover:border-blue-400/50 text-xs"
                  >
                    <Clipboard className="w-3 h-3 mr-1.5 text-blue-300" />
                    Paste
                  </Button>

                  {/* Export */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportToExcel}
                    className="h-8 px-3 bg-purple-500/20 border-purple-400/30 text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/50 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1.5 text-purple-300" />
                    Export
                  </Button>
                  
                  {/* Filters */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className="h-8 px-3 bg-orange-500/20 border-orange-400/30 text-orange-300 hover:bg-orange-500/30 hover:border-orange-400/50 text-xs"
                  >
                    <Filter className="w-3 h-3 mr-1.5 text-orange-300" />
                    Filters
                  </Button>

                  {/* Reset Widths */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Reset to default column widths
                      const defaultWidths: Record<string, number> = {
                        index: 80,
                        testCase: 320,
                        description: 400,
                        status: 160,
                        priority: 140,
                        category: 160,
                        stepsToReproduce: 400,
                        expectedResult: 320,
                        actions: 240
                      }
                      setColumnWidths(defaultWidths)
                      // Clear localStorage
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('table-column-widths')
                      }
                    }}
                    className="h-8 px-3 bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30 hover:border-red-400/50 text-xs"
                    title="Reset all column widths to default"
                  >
                    <RefreshCw className="w-3 h-3 mr-1.5 text-red-300" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Right side - Navigation sections */}
              <div className="flex items-center space-x-4">
                {/* Partition Line */}
                <div className="w-px h-6 bg-slate-600/50 mx-2"></div>
                
                {/* Test Suites Section */}
                <div className="relative z-[999999]">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-emerald-500/10 rounded-lg px-3 py-2 transition-colors"
                    onClick={() => toggleDropdown('testSuites')}
                  >
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-400/20">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-300" />
                    </div>
                    <span className="text-sm font-medium text-white">Test Suites</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/20 text-xs px-2 py-0.5">
                      {testSuites.length}
                    </Badge>
                    <ChevronDown className={`w-3 h-3 text-emerald-300 transition-transform ${activeDropdown === 'testSuites' ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {activeDropdown === 'testSuites' && (
                    <div 
                      data-test-suites-dropdown
                      className="absolute top-full left-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/60 py-2 z-[999999] max-h-96 overflow-y-auto"
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-xs font-medium text-emerald-200 uppercase tracking-wide">Test Suites</p>
                      </div>
                      

                      
                      {testSuites.length > 0 && (
                        <div className="py-2 border-t border-white/10">
                          {testSuites.map((suite) => (
                            <div
                              key={suite.id}
                              onClick={() => {
                                handleSuiteClick(suite.id)
                                closeDropdown()
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-white/10 flex items-center space-x-3 transition-colors group cursor-pointer ${
                                selectedSuiteId === suite.id ? 'bg-emerald-500/20 text-emerald-200' : 'text-white'
                              }`}
                            >
                              <FileSpreadsheet className={`w-4 h-4 ${
                                selectedSuiteId === suite.id ? 'text-emerald-300' : 'text-slate-400'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${
                                  selectedSuiteId === suite.id ? 'text-emerald-200' : 'text-white'
                                }`}>
                                  {suite.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  {suite.totalTests || 0} test cases
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                {selectedSuiteId === suite.id && (
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-emerald-300 font-medium">Active</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenShareTestSuite(suite)
                                      closeDropdown()
                                    }}
                                    className="p-1 hover:bg-blue-500/20 rounded text-blue-300 hover:text-blue-200 transition-colors"
                                    title="Share Test Suite"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteTestSuite(suite.id)
                                      closeDropdown()
                                    }}
                                    className="p-1 hover:bg-red-500/20 rounded text-red-300 hover:text-red-200 transition-colors"
                                    title="Delete Test Suite"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {testSuites.length === 0 && (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-slate-400 mb-3">No test suites available</p>
                          <Button
                            onClick={() => {
                              setIsSuiteDialogOpen(true)
                              closeDropdown()
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Test Suite
                          </Button>
                        </div>
                      )}
                      
                      <div className="px-4 py-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            setIsSuiteDialogOpen(true)
                            closeDropdown()
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-emerald-300 hover:bg-emerald-500/20 flex items-center space-x-3 transition-colors rounded-lg"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="font-medium">Create New Test Suite</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Partition Line */}
                <div className="w-px h-6 bg-slate-600/50 mx-3"></div>

                {/* Resources Section */}
                <div className="relative z-[999999]">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-indigo-500/10 rounded-lg px-3 py-2 transition-colors"
                    onClick={() => toggleDropdown('resources')}
                  >
                    <div className="w-6 h-6 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-400/20">
                      <BookOpen className="w-3 h-3 text-indigo-300" />
                    </div>
                    <span className="text-sm font-medium text-white">Resources</span>
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/20 text-xs px-2 py-0.5">
                      {importantLinks.length + documents.length}
                    </Badge>
                    <ChevronDown className={`w-3 h-3 text-indigo-300 transition-transform ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {activeDropdown === 'resources' && (
                    <div 
                      data-resources-dropdown
                      className="absolute top-full left-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/60 py-2 z-[999999] max-h-96 overflow-y-auto"
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">Resources</p>
                      </div>
                      
                      <div className="py-2">
                        {/* Links Section */}
                        <div className="px-4 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-indigo-300">Important Links</p>
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/20 text-xs px-2 py-0.5">
                              {importantLinks.length}
                            </Badge>
                          </div>
                          {importantLinks.length > 0 ? (
                            <div className="space-y-1">
                              {importantLinks.map((link, index) => (
                                <div key={index} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group">
                                  <div 
                                    className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0"
                                    onClick={() => {
                                      window.open(link.url, '_blank', 'noopener,noreferrer')
                                    }}
                                    title={`Click to open: ${link.url}`}
                                  >
                                    <Link className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                    <span className="text-xs text-white truncate hover:text-indigo-300 transition-colors">{link.title}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm(`Are you sure you want to delete "${link.title}"?`)) {
                                        setImportantLinks(prev => prev.filter(l => l.id !== link.id))
                toast({
                                          title: "Link Deleted",
                                          description: `"${link.title}" has been removed from your resources.`,
                                        })
                                      }
                                    }}
                                    className="ml-2 p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete link"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No links added yet</p>
                          )}
                        </div>
                        
                        {/* Documents Section */}
                        <div className="px-4 py-2 border-t border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-indigo-300">Documents</p>
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/20 text-xs px-2 py-0.5">
                              {documents.length}
                            </Badge>
                          </div>
                          {documents.length > 0 ? (
                            <div className="space-y-1">
                              {documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group">
                                  <div 
                                    className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0"
                                    onClick={() => {
                                      window.open(doc.url, '_blank', 'noopener,noreferrer')
                                    }}
                                    title={`Click to open: ${doc.url}`}
                                  >
                                    <BookOpen className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                    <span className="text-xs text-white truncate hover:text-indigo-300 transition-colors">{doc.title}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                                        setDocuments(prev => prev.filter(d => d.id !== doc.id))
                                        toast({
                                          title: "Document Deleted",
                                          description: `"${doc.title}" has been removed from your resources.`,
                                        })
                                      }
                                    }}
                                    className="ml-2 p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete document"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No documents added yet</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="px-4 py-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            setIsAddLinkDialogOpen(true)
                            closeDropdown()
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-indigo-300 hover:bg-indigo-500/20 flex items-center space-x-3 transition-colors rounded-lg"
                        >
                          <Link className="w-4 h-4" />
                          <span className="font-medium">Add New Link</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsAddDocumentDialogOpen(true)
                            closeDropdown()
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-indigo-300 hover:bg-indigo-500/20 flex items-center space-x-3 transition-colors rounded-lg mt-1"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span className="font-medium">Add New Document</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>



                {/* Partition Line */}
                <div className="w-px h-6 bg-slate-600/50 mx-3"></div>

                {/* Members Section */}
                <div className="relative z-[999999]">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-purple-500/10 rounded-lg px-3 py-2 transition-colors"
                    onClick={() => toggleDropdown('members')}
                  >
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-400/20">
                      <Users className="w-3 h-3 text-purple-300" />
                    </div>
                    <span className="text-sm font-medium text-white">Members</span>
                    <ChevronDown className={`w-3 h-3 text-purple-300 transition-transform ${activeDropdown === 'members' ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {activeDropdown === 'members' && (
                    <div 
                      data-members-dropdown
                      className="absolute top-full left-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/60 py-2 z-[999999] max-h-96 overflow-y-auto"
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-xs font-medium text-purple-200 uppercase tracking-wide">Project Members</p>
                      </div>
                      
                      <div className="px-4 py-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">Project Owner</p>
                            <p className="text-xs text-purple-300">Full access</p>
                          </div>
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/20 text-xs px-2 py-0.5">
                            Owner
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 p-2 hover:bg-white/5 rounded-lg">
                            <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-300" />
                            </div>
                            <span className="text-sm text-white">QA Team</span>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/20 text-xs px-2 py-0.5 ml-auto">
                              Editor
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 p-2 hover:bg-white/5 rounded-lg">
                            <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <User className="w-3 h-3 text-green-300" />
                            </div>
                            <span className="text-sm text-white">Development Team</span>
                            <Badge className="bg-green-500/20 text-green-300 border-green-400/20 text-xs px-2 py-0.5 ml-auto">
                              Viewer
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-4 py-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            setIsProjectMembersDialogOpen(true)
                            closeDropdown()
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-purple-300 hover:bg-purple-500/20 flex items-center space-x-3 transition-colors rounded-lg"
                        >
                          <Users className="w-4 h-4" />
                          <span className="font-medium">Manage Members</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right side - Empty for now, all actions moved to dropdowns */}
              <div className="flex items-center space-x-3">
                {/* Future action buttons can be added here if needed */}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Width */}
          <div className="flex flex-col h-full overflow-hidden relative">
            {/* Loading Overlay */}

            


            {/* Suite Filter Banner - moved out of table area; now shown via sidebar indicator only */}

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
                /* Main Content Area */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Removed top section header per request */}

                  {/* Dashboard or Test Cases Content */}
                  {currentView === 'dashboard' ? (
                    <ProjectDashboard
                      project={{ id: currentProjectId, name: currentProject, createdAt: new Date() }}
                      testCases={finalTestCases}
                      testSuites={testSuites}
                      onAddTestCase={() => setIsAddDialogOpen(true)}
                      onAddTestSuite={() => setIsSuiteDialogOpen(true)}
                      onExportData={handleExportDashboardData}
                      onOpenSettings={handleOpenDashboardSettings}
                    />
                  ) : (
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
                      onUpdateTestCase={(testCase) => updateTestCase(testCase.id, testCase)}
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
                      currentProject={currentProjectId}
                      isPasteDialogOpen={isPasteDialogOpen}
                      setIsPasteDialogOpen={setIsPasteDialogOpen}
                      customColumns={customColumnsList}
                      onUpdateCustomField={handleUpdateCustomField}
                    />
                  )}
                </div>
              )}
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



      {/* Project Members Dialog */}
      <ProjectMembersDialog
        isOpen={isProjectMembersDialogOpen}
        onClose={() => setIsProjectMembersDialogOpen(false)}
        project={{
          id: currentProjectId,
          name: currentProject,
          userRole: 'owner', // TODO: Fetch actual role from membership service
          isOwner: true,
          memberCount: 1,
          isMultiUser: true
        }}
      />

      {/* Create Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-2xl w-[90vw] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
          <DialogHeader className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">Create New Project</DialogTitle>
                <DialogDescription className="text-sm text-slate-300">
                  Create a new project to organize your test cases and suites.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-sm font-medium text-white">
                Project Name
              </Label>
              <Input
                id="project-name"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Enter project name"
                className="h-11 border-slate-600/50 bg-slate-800/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-slate-400">Choose a descriptive name for your project</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsProjectDialogOpen(false)
                setNewProject('')
              }} 
              className="h-10 border-slate-600/50 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (newProject.trim()) {
                  handleAddProject(newProject.trim())
                  setIsProjectDialogOpen(false)
                  setNewProject('')
                }
              }}
              className="h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!newProject.trim()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent className="max-w-2xl w-[90vw] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
          <DialogHeader className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">Edit Project</DialogTitle>
                <DialogDescription className="text-sm text-slate-300">
                  Update your project name and description.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name" className="text-sm font-medium text-white">
                Project Name
              </Label>
              <Input
                id="edit-project-name"
                value={editingProjectName}
                onChange={(e) => setEditingProjectName(e.target.value)}
                placeholder="Enter project name"
                className="h-11 border-slate-600/50 bg-slate-800/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-slate-400">Update the name for your project</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsEditProjectDialogOpen(false)
                setEditingProject(null)
                setEditingProjectName('')
              }} 
              className="h-10 border-slate-600/50 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditedProject}
              className="h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!editingProjectName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Settings Dialog */}
      <Dialog open={isTableSettingsOpen} onOpenChange={setIsTableSettingsOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
          <DialogHeader className="border-b border-slate-700/60 pb-4">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
              <Settings className="w-6 h-6 text-blue-400" />
              Table Settings & Customization
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Configure table columns, add custom fields, and manage data options.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 pt-4">
            {/* Column Management */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700/60">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white">Column Management</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      // Navigate to the enhanced table settings page
                      window.open('/table-settings?projectId=' + currentProjectId, '_blank')
                    }}
                    variant="outline"
                    className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/60"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Show All Columns
                  </Button>
                <Button
                  onClick={() => setIsAddCustomColumnDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Column
                </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {/* Column Summary */}
                <div className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-300">
                        <strong className="text-white">{customColumnsList.length + Object.values(coreColumnSettings).filter(s => !s.deleted).length}</strong> total columns available
                      </span>
                      <span className="text-slate-300">
                        <strong className="text-green-400">{customColumnsList.filter(c => c.visible).length + Object.values(coreColumnSettings).filter(s => s.visible && !s.deleted).length}</strong> visible
                      </span>
                      <span className="text-slate-300">
                        <strong className="text-amber-400">{customColumnsList.filter(c => !c.visible).length + Object.values(coreColumnSettings).filter(s => !s.visible && !s.deleted).length}</strong> hidden
                      </span>
                      {Object.values(coreColumnSettings).some(s => s.deleted) && (
                        <span className="text-red-400">
                          <strong>{Object.values(coreColumnSettings).filter(s => s.deleted).length}</strong> deleted
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400">
                      {Object.values(coreColumnSettings).filter(s => !s.deleted).length} core columns • {customColumnsList.length} custom columns
                    </div>
                  </div>
                </div>

                {/* Core Columns Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Core Columns
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'testCase', label: 'Test Case', type: 'text' },
                      { name: 'description', label: 'Description', type: 'text' },
                      { name: 'expectedResult', label: 'Expected Result', type: 'text' },
                      { name: 'status', label: 'Status', type: 'select' },
                      { name: 'priority', label: 'Priority', type: 'select' },
                      { name: 'category', label: 'Category', type: 'select' },
                      { name: 'assignedTester', label: 'Assigned Tester', type: 'text' },
                      { name: 'executionDate', label: 'Execution Date', type: 'date' },
                      { name: 'actualResult', label: 'Actual Result', type: 'text' },
                      { name: 'environment', label: 'Environment', type: 'select' },
                      { name: 'prerequisites', label: 'Prerequisites', type: 'text' },
                      { name: 'platform', label: 'Platform', type: 'select' },
                      { name: 'stepsToReproduce', label: 'Steps to Reproduce', type: 'text' },
                      { name: 'suite', label: 'Test Suite', type: 'select' },
                      { name: 'position', label: 'Position', type: 'number' },
                      { name: 'createdAt', label: 'Created At', type: 'date' },
                      { name: 'updatedAt', label: 'Updated At', type: 'date' },
                      { name: 'automationScript', label: 'Automation Script', type: 'text' },
                      { name: 'customFields', label: 'Custom Fields', type: 'text' }
                    ].map((column) => {
                      const settings = coreColumnSettings[column.name] || { visible: false, label: column.label, deleted: false }
                      
                      // Skip deleted columns in the main list
                      if (settings.deleted) return null
                      
                      return (
                        <div key={column.name} className="flex items-center justify-between p-3 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-colors bg-slate-800/30">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={settings.visible}
                              onCheckedChange={(checked) => {
                                // Update core column visibility in localStorage and state
                                const updatedSettings = {
                                  ...coreColumnSettings,
                                  [column.name]: { 
                                    ...settings, 
                                    visible: checked as boolean,
                                    label: column.label
                                  }
                                }
                                setCoreColumnSettings(updatedSettings)
                                localStorage.setItem(`qa.coreColumns:${currentProjectId}`, JSON.stringify(updatedSettings))
                                
                                // Show toast notification
                                toast({
                                  title: checked ? 'Column Shown' : 'Column Hidden',
                                  description: `${column.label} is now ${checked ? 'visible' : 'hidden'}.`
                                })
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Label className="font-medium text-white">{settings.label}</Label>
                                <Badge variant="outline" className="text-xs bg-slate-600/50 text-slate-300 border-slate-500/50">
                                  {column.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-400">
                                {column.name} • Core column
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-300 bg-blue-500/20">
                              Core
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCoreColumn(column.name, column.label)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              title="Delete column permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Deleted Core Columns Section */}
                {Object.values(coreColumnSettings).some(s => s.deleted) && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        Deleted Core Columns
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestoreAllDeletedColumns}
                        className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restore All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'testCase', label: 'Test Case', type: 'text' },
                        { name: 'description', label: 'Description', type: 'text' },
                        { name: 'expectedResult', label: 'Expected Result', type: 'text' },
                        { name: 'status', label: 'Status', type: 'select' },
                        { name: 'priority', label: 'Priority', type: 'select' },
                        { name: 'category', label: 'Category', type: 'select' },
                        { name: 'assignedTester', label: 'Assigned Tester', type: 'text' },
                        { name: 'executionDate', label: 'Execution Date', type: 'date' },
                        { name: 'actualResult', label: 'Actual Result', type: 'text' },
                        { name: 'environment', label: 'Environment', type: 'select' },
                        { name: 'prerequisites', label: 'Prerequisites', type: 'text' },
                        { name: 'platform', label: 'Platform', type: 'select' },
                        { name: 'stepsToReproduce', label: 'Steps to Reproduce', type: 'text' },
                        { name: 'suite', label: 'Test Suite', type: 'select' },
                        { name: 'position', label: 'Position', type: 'number' },
                        { name: 'createdAt', label: 'Created At', type: 'date' },
                        { name: 'updatedAt', label: 'Updated At', type: 'date' },
                        { name: 'automationScript', label: 'Automation Script', type: 'text' },
                        { name: 'customFields', label: 'Custom Fields', type: 'text' }
                      ].map((column) => {
                        const settings = coreColumnSettings[column.name]
                        
                        // Only show deleted columns
                        if (!settings || !settings.deleted) return null
                        
                        return (
                          <div key={column.name} className="flex items-center justify-between p-3 border border-red-500/50 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-4 h-4 bg-red-500/30 rounded flex items-center justify-center">
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Label className="font-medium text-slate-300 line-through">{settings.label}</Label>
                                  <Badge variant="outline" className="text-xs bg-slate-600/50 text-slate-300 border-slate-500/50">
                                    {column.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-400">
                                  {column.name} • Deleted core column
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                Deleted
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestoreCoreColumn(column.name, column.label)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Restore column"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Columns Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Custom Columns
                  </h4>
                {customColumnsList.map((column) => (
                  <div key={column.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={column.visible}
                        onCheckedChange={(checked) => 
                          handleUpdateCustomColumn(column.id, { visible: checked as boolean })
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium text-slate-900">{column.label}</Label>
                          <Badge variant="outline" className="text-xs">
                            {column.type}
                          </Badge>
                          {column.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {column.name} • {column.width} • {column.options?.length || 0} options
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        Custom
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCustomColumn(column)
                          setIsAddCustomColumnDialogOpen(true)
                        }}
                        title="Edit column"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCustomColumn(column.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete column"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                  {/* Empty Custom Columns State */}
                {customColumnsList.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Table className="w-4 h-4 text-purple-600" />
                    </div>
                      <h4 className="text-sm font-medium text-slate-900 mb-1">No Custom Columns</h4>
                      <p className="text-xs text-slate-600 mb-3">Create custom columns to track additional data.</p>
                    <Button
                      onClick={() => setIsAddCustomColumnDialogOpen(true)}
                      variant="outline"
                        size="sm"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Custom Column
                    </Button>
                  </div>
                )}
                </div>
              </div>
            </div>
            
            {/* Data Options */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700/60">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white">Data Options</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Rows per page</Label>
                  <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(parseInt(value))}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="25">25 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-300">Table Density</Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Auto-save Settings</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Checkbox id="auto-save" defaultChecked />
                    <Label htmlFor="auto-save" className="text-sm text-slate-300">Automatically save changes</Label>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-300">Show Row Numbers</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Checkbox id="row-numbers" />
                    <Label htmlFor="row-numbers" className="text-sm text-slate-300">Display row numbers</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-6 rounded-xl border-t border-slate-700/60">
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
                className="text-red-400 hover:text-red-300 border-red-500/50 hover:bg-red-500/20"
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
        <DialogContent className="max-w-4xl w-[90vw]">
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
        currentProject={currentProjectId}
        selectedSuiteId={selectedSuiteId || undefined}
        testSuites={testSuites}
        onCreateTestSuite={createTestSuite}
      />

      {/* Enhanced Paste Dialog */}
      <EnhancedPasteDialog
        isOpen={isEnhancedPasteDialogOpen}
        onClose={() => setIsEnhancedPasteDialogOpen(false)}
        onImport={(importedTestCases) => {
          setIsEnhancedPasteDialogOpen(false)
          handleAddMultipleTestCases(importedTestCases)
        }}
        currentProject={currentProjectId}
        selectedSuiteId={selectedSuiteId || undefined}
        onCustomColumnsCreated={(newColumns) => {
          // Add new columns to the existing list
          setCustomColumnsList(prev => [...prev, ...newColumns])
        }}
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

      {/* Add Link Dialog */}
      <Dialog open={isAddLinkDialogOpen} onOpenChange={setIsAddLinkDialogOpen}>
        <DialogContent className="max-w-2xl w-[90vw] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
          <DialogHeader className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">Add New Link</DialogTitle>
                <DialogDescription className="text-sm text-slate-300">
                  Add an important link to your project resources.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-title" className="text-sm font-medium text-white">
                Link Title
              </Label>
              <Input
                id="link-title"
                value={newLink.title}
                onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter link title"
                className="h-11 border-slate-600/50 bg-slate-800/50 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-xs text-slate-400">Give your link a descriptive name</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url" className="text-sm font-medium text-white">
                URL
              </Label>
              <Input
                id="link-url"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="h-11 border-slate-600/50 bg-slate-800/50 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-xs text-slate-400">Enter the full URL including https://</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-description" className="text-sm font-medium text-white">
                Description (Optional)
              </Label>
              <Textarea
                id="link-description"
                placeholder="Brief description of this link..."
                className="border-slate-600/50 bg-slate-800/50 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAddLinkDialogOpen(false)} 
              className="h-10 border-slate-600/50 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddLink}
              className="h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
        <DialogContent className="max-w-2xl w-[90vw] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
          <DialogHeader className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">Add New Document</DialogTitle>
                <DialogDescription className="text-sm text-slate-300">
                  Add a document to your project resources.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-title" className="text-sm font-medium text-white">
                Document Title
              </Label>
              <Input
                id="document-title"
                value={newDocument.title}
                onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
                className="h-11 border-slate-600/50 bg-slate-800/50 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <p className="text-xs text-slate-400">Give your document a descriptive name</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-url" className="text-sm font-medium text-white">
                Document URL
              </Label>
              <Input
                id="document-url"
                value={newDocument.url}
                onChange={(e) => setNewDocument(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/document.pdf"
                className="h-11 border-slate-600/50 bg-slate-800/50 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <p className="text-xs text-slate-400">Enter the URL where the document is hosted</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-type" className="text-sm font-medium text-white">
                Document Type
              </Label>
              <Select value={newDocument.type} onValueChange={(value) => setNewDocument(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="h-11 border-slate-600/50 bg-slate-800/50 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="requirement">Requirement Document</SelectItem>
                  <SelectItem value="specification">Specification Document</SelectItem>
                  <SelectItem value="test-plan">Test Plan</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-description" className="text-sm font-medium text-white">
                Description (Optional)
              </Label>
              <Textarea
                id="document-description"
                value={newDocument.description}
                onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this document..."
                className="border-slate-600/50 bg-slate-800/50 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAddDocumentDialogOpen(false)} 
              className="h-10 border-slate-600/50 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (newDocument.title.trim() && newDocument.url.trim()) {
                  handleAddDocument({
                    title: newDocument.title.trim(),
                    url: newDocument.url.trim(),
                    type: (newDocument.type as 'requirement' | 'specification' | 'test-plan' | 'report') || 'requirement',
                    description: newDocument.description.trim(),
                    projectId: currentProjectId || ''
                  })
                  setNewDocument({ title: '', url: '', type: '', description: '' })
                  setIsAddDocumentDialogOpen(false)
                } else {
                  toast({
                    title: "Missing Information",
                    description: "Please provide both title and URL for the document.",
                    variant: "destructive",
                  })
                }
              }}
              className="h-10 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
} 