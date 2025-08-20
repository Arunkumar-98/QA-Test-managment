"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

import type { 
  TestSuite, 
  CreateTestSuiteInput, 
  Document, 
  CreateDocumentInput, 
  ImportantLink, 
  CreateImportantLinkInput, 
  Project,
  TestCase,
  SharedProjectReference
} from "@/types/qa-types"
import { Folder, Link, Plus, BarChart3, BookOpen, FileSpreadsheet, Target, X, Settings, Table, Share2, Upload, Download, Clipboard, FileText, Users, Database, ChevronDown } from "lucide-react"
import { PRDToTestCases } from './PRDToTestCases'

interface QASidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  testSuites: TestSuite[]
  onAddTestSuite: (suite: CreateTestSuiteInput) => Promise<TestSuite>
  onDeleteTestSuite: (id: string) => Promise<void>
  testCasesCount: number
  passedCount: number
  failedCount: number
  pendingCount: number
  getSuiteStatistics: (suite: TestSuite) => { total: number; passed: number; failed: number; pending: number; percentage: number }
  currentProject: string
  currentProjectId: string
  onProjectChange: (projectName: string) => Promise<void>
  projects: Project[]
  sharedProjectReferences?: SharedProjectReference[]
  onAddProject: (projectName: string) => Promise<void>
  onRemoveProject: (projectName: string) => Promise<void>
  documents: Document[]
  onAddDocument: (document: CreateDocumentInput) => Promise<void>
  onDeleteDocument: (id: string) => Promise<void>
  importantLinks: ImportantLink[]
  onAddImportantLink: (link: CreateImportantLinkInput) => Promise<void>
  onDeleteImportantLink: (id: string) => Promise<void>
  platforms: string[]
  onAddPlatform: (platformName: string) => Promise<void>
  onDeletePlatform: (platformName: string) => Promise<void>
  onOpenTableSettings: () => void
  onOpenProjectSettings: () => void
  onSuiteClick: (suiteId: string | null) => void
  selectedSuiteId: string | null
  onAddTestCases: (testCases: Partial<TestCase>[]) => void
  onShareTestSuite: (testSuite: TestSuite) => void
  // Test Case Actions
  onAddTestCase: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onExportToExcel: () => void
  onOpenNotes: () => void
  onOpenProjectMembers: () => void
  isPasteDialogOpen?: boolean
  setIsPasteDialogOpen?: (open: boolean) => void
  onSetupDatabase?: () => Promise<void>
}

export function QASidebar({
  isCollapsed = false,
  onToggleCollapse,
  testSuites,
  onAddTestSuite,
  onDeleteTestSuite,
  testCasesCount,
  passedCount,
  failedCount,
  pendingCount,
  getSuiteStatistics,
  currentProject,
  currentProjectId,
  onProjectChange,
  projects,
  sharedProjectReferences = [],
  onAddProject,
  onRemoveProject,
  documents,
  onAddDocument,
  onDeleteDocument,
  importantLinks,
  onAddImportantLink,
  onDeleteImportantLink,
  platforms,
  onAddPlatform,
  onDeletePlatform,
  onOpenTableSettings,
  onOpenProjectSettings,
  onSuiteClick,
  selectedSuiteId,
  onAddTestCases,
  onShareTestSuite,
  // Test Case Actions
  onAddTestCase,
  onFileUpload,
  onExportToExcel,
  onOpenNotes,
  onOpenProjectMembers,
  isPasteDialogOpen,
  setIsPasteDialogOpen,
  onSetupDatabase,
}: QASidebarProps) {
  const [newSuite, setNewSuite] = useState({ name: "", description: "", tags: [] as string[], owner: "" })
  const [newDocument, setNewDocument] = useState({ title: "", url: "", type: "requirement" as const, description: "" })
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "", category: "general" as const })
  const [newProject, setNewProject] = useState("")
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isAddSuiteDialogOpen, setIsAddSuiteDialogOpen] = useState(false)
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false)
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false)
  const [isDeleteSuiteDialogOpen, setIsDeleteSuiteDialogOpen] = useState(false)
  const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null)
  const [projectQuery, setProjectQuery] = useState("")
  const [showAllProjects, setShowAllProjects] = useState(false)
  // Accordion state: start with Projects open, others closed
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false)
  const [isTestSuitesCollapsed, setIsTestSuitesCollapsed] = useState(true)
  const [isResourcesCollapsed, setIsResourcesCollapsed] = useState(true)
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(true)
  const [isMembersCollapsed, setIsMembersCollapsed] = useState(true)
  // Collapsed-rail icon menu state (hoisted to top-level to keep hook order stable)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Ensure only one accordion section is open at a time
  const openOnly = (section: 'projects' | 'suites' | 'resources') => {
    setIsProjectsCollapsed(section !== 'projects')
    setIsTestSuitesCollapsed(section !== 'suites')
    setIsResourcesCollapsed(section !== 'resources')
    setIsNotesCollapsed(true)
    setIsMembersCollapsed(true)
  }

  const handleToggleProjectsSection = () => {
    if (isProjectsCollapsed) {
      openOnly('projects')
    } else {
      setIsProjectsCollapsed(true)
    }
  }

  const handleToggleSuitesSection = () => {
    if (isTestSuitesCollapsed) {
      openOnly('suites')
    } else {
      setIsTestSuitesCollapsed(true)
    }
  }

  const handleToggleResourcesSection = () => {
    if (isResourcesCollapsed) {
      openOnly('resources')
    } else {
      setIsResourcesCollapsed(true)
    }
  }

  const handleToggleNotesSection = () => {
    // independent accordion but close others for cleanliness
    setIsNotesCollapsed(v => !v)
    if (isNotesCollapsed) {
      setIsProjectsCollapsed(true)
      setIsTestSuitesCollapsed(true)
      setIsResourcesCollapsed(true)
      setIsMembersCollapsed(true)
    }
  }

  const handleToggleMembersSection = () => {
    setIsMembersCollapsed(v => !v)
    if (isMembersCollapsed) {
      setIsProjectsCollapsed(true)
      setIsTestSuitesCollapsed(true)
      setIsResourcesCollapsed(true)
      setIsNotesCollapsed(true)
    }
  }

  const handleAddTestSuite = () => {
    if (newSuite.name.trim()) {
      onAddTestSuite({
        ...newSuite,
        projectId: "",
        testCaseIds: [],
        isActive: true
      })
      setNewSuite({ name: "", description: "", tags: [], owner: "" })
      setIsAddSuiteDialogOpen(false)
    }
  }

  const handleAddDocument = () => {
    if (newDocument.title.trim() && newDocument.url.trim()) {
      onAddDocument({
        ...newDocument,
        projectId: ""
      })
      setNewDocument({ title: "", url: "", type: "requirement", description: "" })
      setIsAddDocumentDialogOpen(false)
    }
  }

  const handleAddImportantLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      onAddImportantLink({
        ...newLink,
        projectId: ""
      })
      setNewLink({ title: "", url: "", description: "", category: "general" })
      setIsAddLinkDialogOpen(false)
    }
  }



  const handleAddProject = async () => {
    if (newProject.trim()) {
      await onAddProject(newProject.trim())
      setNewProject("")
      setIsProjectDialogOpen(false)
    }
  }

  const handleDeleteSuite = (suite: TestSuite) => {
    setSuiteToDelete(suite)
    setIsDeleteSuiteDialogOpen(true)
  }

  const confirmDeleteSuite = async () => {
    if (suiteToDelete) {
      await onDeleteTestSuite(suiteToDelete.id)
      setSuiteToDelete(null)
      setIsDeleteSuiteDialogOpen(false)
    }
  }



  // Only show test suites for the current project
  const filteredTestSuites = useMemo(() => 
    testSuites.filter(suite => suite.projectId === currentProjectId), 
    [testSuites, currentProjectId]
  )

  const testSuitesWithStats = useMemo(() => 
    filteredTestSuites.map(suite => ({
      ...suite,
      stats: {
        total: suite.totalTests || 0,
        passed: suite.passedTests || 0,
        failed: suite.failedTests || 0,
        pending: suite.pendingTests || 0,
        percentage: (suite.totalTests || 0) > 0 ? Math.round(((suite.passedTests || 0) / (suite.totalTests || 0)) * 100) : 0
      }
    })), 
    [filteredTestSuites]
  )

  const projectsWithStats = useMemo(() => 
    projects.map(project => ({
      ...project,
      testSuiteCount: testSuites.filter((suite) => suite.projectId === project.id).length
    })), 
    [projects, testSuites]
  )

  // Separate regular projects from shared projects
  const regularProjects = projectsWithStats.filter(project => !project.tags || !project.tags.includes('Shared Project'))
  
  // Filtered projects by search query
  const filteredRegularProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase()
    if (!query) return regularProjects
    return regularProjects.filter(p => p.name.toLowerCase().includes(query))
  }, [regularProjects, projectQuery])
  
  // Create shared projects from references (Live Sync)
  const sharedProjects = sharedProjectReferences.map(ref => ({
    id: ref.originalProjectId,
    name: ref.originalProjectName,
    testSuiteCount: testSuites.filter((suite) => suite.projectId === ref.originalProjectId).length,
    isShared: true,
    shareToken: ref.shareToken,
    permissions: ref.permissions,
    lastSyncedAt: ref.lastSyncedAt
  }))

  // Compact rail when collapsed (icon-only)
  if (isCollapsed) {
  return (
      <div className="h-full w-18 md:w-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 flex flex-col items-center py-4 gap-4 relative">
        {/* Collapse/expand */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 text-slate-300 hover:text-white"
            title="Expand sidebar"
          >
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </Button>
        )}
        {/* Rail icons */}
        {/* Projects menu */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-300" title="Projects" onClick={()=>setOpenMenu(openMenu==='projects'?null:'projects')}>
            <Folder className="w-5 h-5" />
          </Button>
          {openMenu==='projects' && (
            <div className="absolute left-12 top-0 w-60 bg-slate-900/95 border border-white/15 rounded-xl shadow-xl p-2 z-50">
              <button className="w-full text-left px-3 py-2 rounded-lg text-blue-200 hover:bg-white/5" onClick={()=>{setOpenMenu(null);}}>
                Projects List
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-blue-200 hover:bg-white/5" onClick={()=>{setOpenMenu(null); setIsProjectDialogOpen(true);}}>
                Create Project
              </button>
            </div>
          )}
      </div>

        {/* Suites menu */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-emerald-300" title="Test Suites" onClick={()=>setOpenMenu(openMenu==='suites'?null:'suites')}>
            <FileSpreadsheet className="w-5 h-5" />
          </Button>
          {openMenu==='suites' && (
            <div className="absolute left-12 top-0 w-60 bg-slate-900/95 border border-white/15 rounded-xl shadow-xl p-2 z-50">
              <button className="w-full text-left px-3 py-2 rounded-lg text-emerald-200 hover:bg-white/5" onClick={()=>{setOpenMenu(null);}}>
                Suites List
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-emerald-200 hover:bg-white/5" onClick={()=>{setOpenMenu(null); setIsAddSuiteDialogOpen(true);}}>
                Create Suite
              </button>
              </div>
          )}
        </div>

        {/* Resources menu */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-indigo-300" title="Resources" onClick={()=>setOpenMenu(openMenu==='resources'?null:'resources')}>
            <BookOpen className="w-5 h-5" />
          </Button>
          {openMenu==='resources' && (
            <div className="absolute left-12 top-0 w-60 bg-slate-900/95 border border-white/15 rounded-xl shadow-xl p-2 z-50">
              <button className="w-full text-left px-3 py-2 rounded-lg text-indigo-200 hover:bg-white/5" onClick={()=>{setOpenMenu(null); setIsAddLinkDialogOpen(true);}}>
                Add Link
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-indigo-200 hover:bg-white/5" onClick={()=>{setOpenMenu(null); setIsAddDocumentDialogOpen(true);}}>
                Add Document
              </button>
                  </div>
                )}
              </div>
        {/* bottom spacer */}
        <div className="mt-auto pb-2" />
            </div>
    )
  }

  return (
    <div className={`h-full transition-all duration-300 ${isCollapsed ? 'w-18 md:w-20' : 'w-full'} bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 flex flex-col relative`}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
          </div>

            {/* Navigation Sections */}
      <div className={`flex-1 overflow-y-auto relative z-10 ${isCollapsed ? 'px-2' : 'px-6'}`}>
        <div className="space-y-4 py-6">
          {/* Collapse Toggle */}
          <div className="flex justify-end">
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-8 w-8 p-0 text-slate-300 hover:text-white"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-90'}`} />
              </Button>
            )}
                    </div>

          {/* Database Setup Button */}
          {onSetupDatabase && (
            <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl border border-amber-400/20 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Database className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">Database Setup</span>
              </div>
              <p className="text-xs text-amber-200/80 mb-3">
                Custom columns feature requires database setup
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onSetupDatabase}
                className="w-full bg-amber-500/20 border-amber-400/30 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400/50 rounded-lg"
              >
                <Database className="w-4 h-4 mr-2" />
                Setup Database
              </Button>
                  </div>
                )}

          {/* Projects Section - Top Level */}
          <div className="bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10 backdrop-blur-sm rounded-2xl border border-blue-400/20 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Folder className="w-5 h-5 text-white" />
              </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Projects</h2>
                  <p className="text-blue-200/80 text-xs">Workspace organization</p>
            </div>
                  </div>
                  <div className="flex items-center space-x-2">
                <Badge className="bg-blue-500/30 text-blue-100 border-blue-400/40 text-xs px-3 py-1 font-semibold">
                      {regularProjects.length}
                    </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setIsProjectDialogOpen(true) }}
                  className="w-8 h-8 p-0 hover:bg-blue-500/20 text-blue-200 hover:text-white rounded-lg transition-all duration-200"
                  aria-label="Add Project"
                  title="Add Project"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <button
                  onClick={handleToggleProjectsSection}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/20"
                  aria-expanded={!isProjectsCollapsed}
                >
                  <ChevronDown className={`w-4 h-4 text-blue-200 transition-transform duration-200 ${isProjectsCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                </button>
                  </div>
                </div>
            {/* Search and controls */}
            {!isProjectsCollapsed && (
            <div className="sticky top-0 z-10 -mx-5 px-5 pb-3 bg-gradient-to-b from-slate-900/60 to-transparent backdrop-blur-md">
                  <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    value={projectQuery}
                    onChange={(e) => setProjectQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="h-9 bg-slate-800/60 border-slate-600/50 text-slate-200 placeholder:text-slate-400 pr-8"
                  />
                  {projectQuery && (
                    <button
                      onClick={() => setProjectQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                  </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllProjects((v) => !v)}
                  className="h-9 bg-slate-800/60 border-slate-600/50 text-slate-200 hover:bg-slate-700/60"
                >
                  {showAllProjects ? 'Collapse' : 'Show all'}
                </Button>
                </div>
            </div>
            )}

            {/* Project list with capped height and smooth scroll */}
            {!isProjectsCollapsed && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbars">
                    {regularProjects.length > 0 ? (
                (showAllProjects ? filteredRegularProjects : filteredRegularProjects.slice(0, 6)).map((project) => (
                        <div
                          key={project.id}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                      currentProject === project.name 
                        ? 'bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 border-blue-400/60 shadow-lg shadow-blue-500/20' 
                        : 'bg-slate-800/40 border-slate-600/40 hover:bg-slate-700/50 hover:border-slate-500/60 hover:shadow-md'
                    }`}
                          onClick={() => onProjectChange(project.name)}
                        >
                          <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          currentProject === project.name 
                            ? 'bg-gradient-to-br from-blue-400/30 to-indigo-500/30 border border-blue-300/40' 
                            : 'bg-slate-600/50 border border-slate-500/30'
                        }`}>
                          <Folder className={`w-4 h-4 ${
                            currentProject === project.name ? 'text-blue-200' : 'text-slate-300'
                          }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-base truncate ${
                            currentProject === project.name ? 'text-white' : 'text-slate-200'
                          }`}>
                            {project.name}
                          </h3>
                          <p className={`text-sm truncate ${
                            currentProject === project.name ? 'text-blue-200/80' : 'text-slate-400'
                          }`}>
                                  {project.testSuiteCount} test suites
                                </p>
                              </div>
                            </div>
                      <div className="flex items-center space-x-2">
                              {currentProject === project.name && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-emerald-300 font-medium">Active</span>
                          </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRemoveProject(project.name)
                                }}
                          className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg"
                              >
                          <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-400/30">
                    <Folder className="w-8 h-8 text-blue-300" />
                        </div>
                  <h3 className="text-base font-bold text-white mb-2">No Projects Yet</h3>
                  <p className="text-sm text-blue-200/70 mb-6 max-w-48">Create your first project to start organizing your test cases</p>
                        <Button
                          onClick={() => setIsProjectDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                    <Plus className="w-4 h-4 mr-2" />
                          Create First Project
                        </Button>
                      </div>
                    )}
                  </div>
            )}
            {/* Footer reveal button when truncated */}
            {!isProjectsCollapsed && !showAllProjects && filteredRegularProjects.length > 6 && (
              <div className="mt-3 text-center">
                  <Button
                  variant="ghost"
                    size="sm"
                  onClick={() => setShowAllProjects(true)}
                  className="text-blue-300 hover:text-white hover:bg-blue-500/20"
                >
                  Show all {filteredRegularProjects.length} projects
                  </Button>
                </div>
            )}
                      </div>
          {/* Test Suites Section */}
          <div className="space-y-3">
            <div
              className="w-full flex items-center justify-between px-1 group cursor-pointer"
              onClick={handleToggleSuitesSection}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsTestSuitesCollapsed(v => !v) } }}
              role="button"
              tabIndex={0}
              aria-expanded={!isTestSuitesCollapsed}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-400/20">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                              </div>
                <span className="text-white font-semibold">Test Suites</span>
                              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/20 text-xs px-2 py-1">
                  {testSuitesWithStats.length}
                </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                  onClick={(e) => { e.stopPropagation(); setIsAddSuiteDialogOpen(true) }}
                  className="w-6 h-6 p-0 hover:bg-emerald-500/20 text-emerald-300"
                >
                  <Plus className="w-3 h-3" />
                              </Button>
                <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform duration-200 ${isTestSuitesCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                            </div>
                          </div>

            {!isTestSuitesCollapsed && (
                  <div className="space-y-2">
                      {testSuitesWithStats.length > 0 ? (
                        testSuitesWithStats.map((suiteWithStats) => {
                          const { stats } = suiteWithStats
                        return (
                          <div
                              key={suiteWithStats.id}
                      className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        selectedSuiteId === suiteWithStats.id 
                          ? 'bg-emerald-500/20 border-emerald-400/40 shadow-lg shadow-emerald-500/10' 
                          : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/40'
                      }`}
                              onClick={() => onSuiteClick(suiteWithStats.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 min-w-0 flex-1">
                          <div className="w-6 h-6 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-white truncate">{suiteWithStats.name}</h4>
                            <p className="text-xs text-slate-400 mt-1 truncate">{stats.total} test cases</p>
                                  {stats.total > 0 && (
                              <div className="flex items-center space-x-2 mt-2">
                                      <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                                  <span className="text-xs text-emerald-300">{stats.passed}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                                  <span className="text-xs text-red-300">{stats.failed}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                                  <span className="text-xs text-amber-300">{stats.pending}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                      onShareTestSuite(suiteWithStats)
                                    }}
                            className="h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-300"
                                  >
                            <Share2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSuite(suiteWithStats)
                                    }}
                            className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-300"
                              >
                            <X className="w-3 h-3" />
                              </Button>
                                </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3 border border-emerald-400/20">
                          <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
                        </div>
                  <h3 className="text-sm font-semibold text-white mb-2">No Test Suites</h3>
                  <p className="text-xs text-slate-400 mb-4">Create test suites to organize your test cases</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddSuiteDialogOpen(true)}
                    className="text-xs bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20"
                        >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Suite
                        </Button>
                      </div>
                    )}
                  </div>
            )}

          {/* Shared Projects Section */}
          {sharedProjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-400/20">
                    <Share2 className="w-4 h-4 text-emerald-300" />
                    </div>
                  <span className="text-white font-semibold">Shared Projects</span>
                  </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/20 text-xs px-2 py-1">
                  {sharedProjects.length}
                  </Badge>
                </div>
              
                  <div className="space-y-2">
                {sharedProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      currentProject === project.name 
                        ? 'bg-emerald-500/20 border-emerald-400/40 shadow-lg shadow-emerald-500/10' 
                        : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/40'
                    }`}
                    onClick={() => onProjectChange(project.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-6 h-6 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Share2 className="w-3.5 h-3.5 text-emerald-300" />
                            </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-white truncate">{project.name}</h4>
                          <p className="text-xs text-slate-400 truncate">
                            {project.testSuiteCount} test suites • Live Sync
                          </p>
                            </div>
                          </div>
                      <div className="flex items-center space-x-1">
                        {currentProject === project.name && (
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        )}
                          <Button
                            variant="ghost"
                            size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveProject(project.name)
                          }}
                          className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                          </Button>
                        </div>
                        </div>
                      </div>
                ))}
                  </div>
                </div>
          )}



          {/* Resources Section (Links + Documents) */}
          <div className="space-y-3">
            <div
              className="w-full flex items-center justify-between px-1 group cursor-pointer"
              onClick={handleToggleResourcesSection}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsResourcesCollapsed(v => !v) } }}
              role="button"
              tabIndex={0}
              aria-expanded={!isResourcesCollapsed}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-400/20">
                  <BookOpen className="w-4 h-4 text-indigo-300" />
                    </div>
                <span className="text-white font-semibold">Resources</span>
                  </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/20 text-xs px-2 py-1">
                  {importantLinks.length + documents.length}
                  </Badge>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setIsAddLinkDialogOpen(true) }}
                    className="w-6 h-6 p-0 hover:bg-indigo-500/20 text-indigo-300"
                    title="Add Link"
                  >
                    <Link className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setIsAddDocumentDialogOpen(true) }}
                    className="w-6 h-6 p-0 hover:bg-indigo-500/20 text-indigo-300"
                    title="Add Document"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <ChevronDown className={`w-4 h-4 text-indigo-300 transition-transform duration-200 ${isResourcesCollapsed ? '-rotate-90' : 'rotate-0'}`} />
              </div>
            </div>
            
            {!isResourcesCollapsed && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {/* Important Links */}
              {importantLinks.map((link) => (
                <div
                  key={`link-${link.id}`}
                  className="group relative p-3 bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/40 rounded-xl transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Link className="w-3.5 h-3.5 text-cyan-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                        className="block hover:text-cyan-300 transition-colors duration-200"
                              >
                                <h4 className="font-medium text-sm text-white truncate">{link.title}</h4>
                        <p className="text-xs text-slate-400 truncate mt-1">{link.url}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-400/20 text-xs">
                            Link
                          </Badge>
                          <Badge className="bg-slate-500/10 text-slate-400 border-slate-400/20 text-xs">
                                    {link.category}
                                  </Badge>
                                </div>
                              </a>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteImportantLink(link.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-300"
                            >
                      <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
              ))}

              {/* Documents */}
              {documents.map((doc) => (
                <div
                  key={`doc-${doc.id}`}
                  className="group relative p-3 bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/40 rounded-xl transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-orange-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block hover:text-orange-300 transition-colors duration-200"
                              >
                                <h4 className="font-medium text-sm text-white truncate">{doc.title}</h4>
                        <p className="text-xs text-slate-400 truncate mt-1">{doc.url}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className="bg-orange-500/10 text-orange-300 border-orange-400/20 text-xs">
                            Document
                          </Badge>
                          <Badge className="bg-slate-500/10 text-slate-400 border-slate-400/20 text-xs capitalize">
                                    {doc.type}
                                  </Badge>
                                </div>
                              </a>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteDocument(doc.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-300"
                            >
                      <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
              ))}

              {/* Empty State */}
              {importantLinks.length === 0 && documents.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3 border border-indigo-400/20">
                    <BookOpen className="w-6 h-6 text-indigo-300" />
                        </div>
                  <h3 className="text-sm font-semibold text-white mb-2">No Resources</h3>
                  <p className="text-xs text-slate-400 mb-4">Add links and documents for quick access</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddLinkDialogOpen(true)}
                      className="text-xs bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20"
                    >
                      <Link className="w-3 h-3 mr-1" />
                      Add Link
                    </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddDocumentDialogOpen(true)}
                      className="text-xs bg-orange-500/10 border-orange-400/30 text-orange-300 hover:bg-orange-500/20"
                        >
                      <BookOpen className="w-3 h-3 mr-1" />
                          Add Document
                        </Button>
                  </div>
                      </div>
                    )}
                  </div>
            )}
                </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <div
              className="w-full flex items-center justify-between px-1 group cursor-pointer"
              onClick={handleToggleNotesSection}
              role="button"
              tabIndex={0}
              aria-expanded={!isNotesCollapsed}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-400/20">
                  <FileText className="w-4 h-4 text-emerald-300" />
                    </div>
                <span className="text-white font-semibold">Notes</span>
                  </div>
              <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform duration-200 ${isNotesCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                </div>

            {!isNotesCollapsed && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={onOpenNotes}
                  disabled={!currentProjectId || currentProjectId.trim() === ''}
                  className={`w-full h-10 rounded-lg transition-all duration-200 ${
                    currentProjectId && currentProjectId.trim() !== ''
                      ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/50'
                      : 'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Open Notes
                </Button>
              </div>
            )}
              </div>
              
          {/* Members Section */}
          <div className="space-y-3">
            <div
              className="w-full flex items-center justify-between px-1 group cursor-pointer"
              onClick={handleToggleMembersSection}
              role="button"
              tabIndex={0}
              aria-expanded={!isMembersCollapsed}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-400/20">
                  <Users className="w-4 h-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold">Members</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform duration-200 ${isMembersCollapsed ? '-rotate-90' : 'rotate-0'}`} />
              </div>
              
            {!isMembersCollapsed && (
              <div className="space-y-2">
              <Button
                variant="outline"
                onClick={onOpenProjectMembers}
                disabled={!currentProjectId || currentProjectId.trim() === ''}
                  className={`w-full h-10 rounded-lg transition-all duration-200 ${
                  currentProjectId && currentProjectId.trim() !== ''
                      ? 'bg-purple-500/10 border-purple-400/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/50'
                      : 'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed'
                }`}
              >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Members
              </Button>
            </div>
            )}
          </div>

      {/* Action Buttons Section */}
      <div className="relative z-10 p-6 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="space-y-3">
          {/* moved Import, Paste, Export to table header */}
          {/* Tertiary Actions moved into accordions */}
            </div>
          </div>
      {/* End navigation sections */}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Create New Project</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Create a new project to organize your test cases and suites.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-sm font-medium">
                Project Name
              </Label>
              <Input
                id="project-name"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Enter project name"
                className="h-11 border-input focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-muted-foreground">Choose a descriptive name for your project</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsProjectDialogOpen(false)} className="h-10">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddProject}
              className="h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!newProject.trim()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddSuiteDialogOpen} onOpenChange={setIsAddSuiteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test Suite</DialogTitle>
            <DialogDescription>Create a new test suite to organize your test cases.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suite-name">Suite Name</Label>
              <Input
                id="suite-name"
                value={newSuite.name}
                onChange={(e) => setNewSuite({ ...newSuite, name: e.target.value })}
                placeholder="Enter suite name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suite-description">Description</Label>
              <Textarea
                id="suite-description"
                value={newSuite.description}
                onChange={(e) => setNewSuite({ ...newSuite, description: e.target.value })}
                placeholder="Enter suite description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suite-owner">Owner</Label>
              <Input
                id="suite-owner"
                value={newSuite.owner}
                onChange={(e) => setNewSuite({ ...newSuite, owner: e.target.value })}
                placeholder="Enter owner name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSuiteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTestSuite}>Add Suite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>Add a new document reference to your project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                placeholder="Enter document title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-url">URL</Label>
              <Input
                id="doc-url"
                value={newDocument.url}
                onChange={(e) => setNewDocument({ ...newDocument, url: e.target.value })}
                placeholder="Enter document URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-type">Type</Label>
              <Select
                value={newDocument.type}
                onValueChange={(value) =>
                  setNewDocument({ ...newDocument, type: value as 'requirement' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requirement">Requirement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                placeholder="Enter document description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDocument}>Add Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddLinkDialogOpen} onOpenChange={setIsAddLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Important Link</DialogTitle>
            <DialogDescription>Add a new important link to your project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="Enter link title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="Enter link URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-category">Category</Label>
              <Select
                value={newLink.category}
                onValueChange={(value) =>
                  setNewLink({ ...newLink, category: value as 'general' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-description">Description</Label>
              <Textarea
                id="link-description"
                value={newLink.description}
                onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                placeholder="Enter link description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddImportantLink}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <Dialog open={isDeleteSuiteDialogOpen} onOpenChange={setIsDeleteSuiteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the test suite "{suiteToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteSuiteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSuite}>
              Delete Suite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
