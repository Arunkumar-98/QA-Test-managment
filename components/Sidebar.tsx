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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Folder, Link, Plus, BarChart3, Globe, BookOpen, FileSpreadsheet, Target, X, Settings, Table, Share2, Upload, Download, Clipboard, FileText } from "lucide-react"
import { PRDToTestCases } from './PRDToTestCases'

interface QASidebarProps {
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
}

export function QASidebar({
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
}: QASidebarProps) {
  const [newSuite, setNewSuite] = useState({ name: "", description: "", tags: [] as string[], owner: "" })
  const [newDocument, setNewDocument] = useState({ title: "", url: "", type: "requirement" as const, description: "" })
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "", category: "general" as const })
  const [newPlatform, setNewPlatform] = useState("")
  const [newProject, setNewProject] = useState("")
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isAddSuiteDialogOpen, setIsAddSuiteDialogOpen] = useState(false)
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false)
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false)
  const [isAddPlatformDialogOpen, setIsAddPlatformDialogOpen] = useState(false)
  const [accordionValue, setAccordionValue] = useState<string[]>([])
  const [isDeleteSuiteDialogOpen, setIsDeleteSuiteDialogOpen] = useState(false)
  const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null)

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

  const handleAddPlatform = () => {
    if (newPlatform.trim() && !platforms.includes(newPlatform.trim())) {
      onAddPlatform(newPlatform.trim())
      setNewPlatform("")
      setIsAddPlatformDialogOpen(false)
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

  const handleAccordionChange = (value: string[]) => {
    setAccordionValue(value)
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

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 border-r border-white/20 flex flex-col shadow-lg relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {/* Fixed Sections */}
        <div className="px-4 py-6 space-y-5">

          {/* Test Cases Header Section - Enhanced */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-sm"></div>
                <span className="text-sm font-semibold text-white">{currentProject}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-100 font-medium">
                  {testCasesCount} test case{testCasesCount !== 1 ? 's' : ''}
                </span>
                {testCasesCount > 0 && (
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1.5 px-2 py-1 bg-green-500/20 rounded-full border border-green-400/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-100 font-medium">{passedCount}</span>
                    </span>
                    <span className="flex items-center space-x-1.5 px-2 py-1 bg-red-500/20 rounded-full border border-red-400/30">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-red-100 font-medium">{failedCount}</span>
                    </span>
                    <span className="flex items-center space-x-1.5 px-2 py-1 bg-yellow-500/20 rounded-full border border-yellow-400/30">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-yellow-100 font-medium">{pendingCount}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <Accordion 
            type="multiple" 
            value={accordionValue} 
            onValueChange={handleAccordionChange}
          >
            {/* Projects Section */}
            <AccordionItem value="projects" className="border-none">
              <AccordionTrigger className="px-4 py-3 hover:bg-white/10 rounded-lg transition-all duration-200 group text-white">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                      <Folder className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white truncate">Projects</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-100 border-blue-400/30 flex-shrink-0 text-xs font-medium">
                      {regularProjects.length}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <div className="max-h-64 overflow-y-auto pr-2">
                  <div className="flex flex-col space-y-2.5">
                    {regularProjects.length > 0 ? (
                      regularProjects.map((project) => (
                        <div
                          key={project.id}
                          className={`group relative p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:border-white/40 hover:shadow-lg transition-all duration-200 cursor-pointer ${currentProject === project.name ? 'ring-2 ring-blue-400/50 border-blue-400/50 bg-blue-500/20' : 'hover:bg-white/20'}`}
                          onClick={() => onProjectChange(project.name)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-white/20 to-white/30 rounded-md flex items-center justify-center flex-shrink-0">
                                <Folder className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-white truncate">{project.name}</h4>
                                <p className="text-xs text-blue-200 truncate">
                                  {project.testSuiteCount} test suites
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {currentProject === project.name && (
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRemoveProject(project.name)
                                }}
                                className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl flex items-center justify-center mb-3 flex-shrink-0 border border-blue-400/30">
                          <Folder className="w-6 h-6 text-blue-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">No Projects</h3>
                        <p className="text-xs text-blue-200 mb-4 text-center">Create your first project to get started</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsProjectDialogOpen(true)}
                          className="text-xs h-8 px-3 border-blue-400/50 text-blue-200 hover:bg-blue-500/20 hover:border-blue-400"
                        >
                          <Plus className="w-3 h-3 mr-1 flex-shrink-0" />
                          Create First Project
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Add Project Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsProjectDialogOpen(true)}
                    className="w-full h-9 border-dashed border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/20 transition-all duration-200 group mt-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-5 h-5 rounded-md bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0">
                        <Plus className="w-3 h-3 text-blue-300" />
                      </div>
                      <span className="text-sm font-medium text-blue-200 group-hover:text-blue-100 transition-colors duration-200 truncate">
                        Add Project
                      </span>
                    </div>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Shared Projects Section */}
            {sharedProjects.length > 0 && (
              <AccordionItem value="shared-projects" className="border-none">
                <AccordionTrigger className="px-4 py-3 hover:bg-white/10 rounded-lg transition-all duration-200 group text-white">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                        <Share2 className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white truncate">Shared Projects</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-100 border-green-400/30 flex-shrink-0 text-xs font-medium">
                        {sharedProjects.length}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="max-h-64 overflow-y-auto pr-2">
                    <div className="flex flex-col space-y-2.5">
                      {sharedProjects.map((project) => (
                        <div
                          key={project.id}
                          className={`group relative p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:border-white/40 hover:shadow-lg transition-all duration-200 cursor-pointer ${currentProject === project.name ? 'ring-2 ring-green-400/50 border-green-400/50 bg-green-400/20' : 'hover:bg-white/20'}`}
                          onClick={() => onProjectChange(project.name)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-md flex items-center justify-center flex-shrink-0">
                                <Share2 className="w-3.5 h-3.5 text-green-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-white truncate">{project.name}</h4>
                                <p className="text-xs text-green-200 truncate">
                                  {project.testSuiteCount} test suites • Live Sync
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {currentProject === project.name && (
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRemoveProject(project.name)
                                }}
                                className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}



            {/* Test Suites Section */}
            <AccordionItem value="test-suites" className="border-none">
              <AccordionTrigger className="px-6 py-3 hover:bg-white/10 transition-colors text-white">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider truncate">Test Suites</span>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 flex-shrink-0">
                    {testSuitesWithStats.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-3">
                <div className="max-h-64 overflow-y-auto pr-2">
                <div className="flex flex-col space-y-2">
                  <div className="space-y-2">
                      {testSuitesWithStats.length > 0 ? (
                        testSuitesWithStats.map((suiteWithStats) => {
                          const { stats } = suiteWithStats
                        return (
                          <div
                              key={suiteWithStats.id}
                              className={`group relative p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:border-white/40 hover:shadow-lg transition-all duration-200 cursor-pointer ${selectedSuiteId === suiteWithStats.id ? 'ring-2 ring-emerald-400/50 border-emerald-400/50 bg-emerald-500/20' : 'hover:bg-white/20'}`}
                              onClick={() => onSuiteClick(suiteWithStats.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 min-w-0 flex-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <FileSpreadsheet className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-white truncate">{suiteWithStats.name}</h4>
                                  <p className="text-xs text-emerald-200 mt-1 truncate">{stats.total} test cases</p>
                                  {stats.total > 0 && (
                                    <div className="flex items-center space-x-2 mt-2 flex-wrap">
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                                        <span className="text-xs text-green-100">{stats.passed}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                                        <span className="text-xs text-red-100">{stats.failed}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                                        <span className="text-xs text-yellow-100">{stats.pending}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 min-w-[60px] justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                      onShareTestSuite(suiteWithStats)
                                    }}
                                    className="h-7 w-7 p-0 hover:bg-blue-500/20 hover:text-blue-300 flex-shrink-0"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSuite(suiteWithStats)
                                    }}
                                    className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-300 flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                                </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 rounded-xl flex items-center justify-center mb-3 flex-shrink-0 border border-emerald-400/30">
                          <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">No Test Suites</h3>
                        <p className="text-xs text-emerald-200 mb-4 text-center">Create test suites to organize your test cases by feature or functionality</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddSuiteDialogOpen(true)}
                          className="text-xs h-8 px-3 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-400"
                        >
                          <Plus className="w-3 h-3 mr-1 flex-shrink-0" />
                          Create First Suite
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Platforms Section */}
            <AccordionItem value="platforms" className="border-none">
              <AccordionTrigger className="px-6 py-3 hover:bg-white/10 transition-colors text-white">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <Globe className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider truncate">Platforms</span>
                  </div>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-100 border-purple-400/30 flex-shrink-0">
                    {platforms.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-3">
                <div className="max-h-64 overflow-y-auto pr-2">
                <div className="flex flex-col space-y-2">
                  <div className="space-y-2">
                    {platforms.length > 0 ? (
                      platforms.map((platform) => (
                        <div
                          key={platform}
                          className="group flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:border-white/40 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-7 h-7 bg-gradient-to-br from-white/20 to-white/30 rounded-md flex items-center justify-center">
                              <Globe className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-white">{platform}</span>
                              <p className="text-xs text-purple-200">Testing Platform</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeletePlatform(platform)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-xl flex items-center justify-center mb-3 border border-purple-400/30">
                          <Globe className="w-6 h-6 text-purple-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">No Platforms</h3>
                        <p className="text-xs text-purple-200 mb-4">Add testing platforms to categorize your test cases</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddPlatformDialogOpen(true)}
                          className="text-xs h-8 px-3 border-purple-400/50 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Platform
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Important Links Section */}
            <AccordionItem value="important-links" className="border-none">
              <AccordionTrigger className="px-6 py-3 hover:bg-white/10 transition-colors text-white">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <Link className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider truncate">Important Links</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-100 border-blue-400/30 flex-shrink-0">
                    {importantLinks.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-3">
                <div className="max-h-64 overflow-y-auto pr-2">
                <div className="flex flex-col space-y-2">
                  <div className="space-y-2">
                    {importantLinks.length > 0 ? (
                      importantLinks.map((link) => (
                        <div
                          key={link.id}
                          className="group relative p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:border-white/40 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Link className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block hover:text-blue-300 transition-colors duration-200"
                              >
                                <h4 className="font-medium text-sm text-white truncate">{link.title}</h4>
                                <p className="text-xs text-blue-200 truncate mt-1">{link.url}</p>
                                <div className="flex items-center mt-2">
                                  <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-100 border-blue-400/30">
                                    {link.category}
                                  </Badge>
                                </div>
                              </a>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteImportantLink(link.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl flex items-center justify-center mb-3 border border-blue-400/30">
                          <Link className="w-6 h-6 text-blue-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">No Important Links</h3>
                        <p className="text-xs text-blue-200 mb-4">Add important links for quick access to resources</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddLinkDialogOpen(true)}
                          className="text-xs h-8 px-3 border-blue-400/50 text-blue-200 hover:bg-blue-500/20 hover:border-blue-400"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Link
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Documents Section */}
            <AccordionItem value="documents" className="border-none">
              <AccordionTrigger className="px-6 py-3 hover:bg-white/10 transition-colors text-white">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-red-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider truncate">Documents</span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-100 border-orange-400/30 flex-shrink-0">
                    {documents.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-3">
                <div className="max-h-64 overflow-y-auto pr-2">
                <div className="flex flex-col space-y-2">
                  <div className="space-y-2">
                    {documents.length > 0 ? (
                      documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="group relative p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:border-white/40 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block hover:text-orange-300 transition-colors duration-200"
                              >
                                <h4 className="font-medium text-sm text-white truncate">{doc.title}</h4>
                                <p className="text-xs text-orange-200 truncate mt-1">{doc.url}</p>
                                <div className="flex items-center mt-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-orange-500/20 text-orange-100 border-orange-400/30 capitalize"
                                  >
                                    {doc.type}
                                  </Badge>
                                </div>
                              </a>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteDocument(doc.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-xl flex items-center justify-center mb-3 border border-orange-400/30">
                          <BookOpen className="w-6 h-6 text-orange-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">No Documents</h3>
                        <p className="text-xs text-orange-200 mb-4">Add important documents for reference</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddDocumentDialogOpen(true)}
                          className="text-xs h-8 px-3 border-orange-400/50 text-orange-200 hover:bg-orange-500/20 hover:border-orange-400"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* AI Test Case Generator Section - Temporarily Commented Out */}
            {/* 
            <AccordionItem value="ai-test-case-generator" className="border-none">
              <AccordionTrigger className="px-6 py-3 hover:bg-white/10 transition-colors text-white">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-sidebar-foreground/80 uppercase tracking-wider truncate">AI Test Case Generator</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
                    
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-3">
                <PRDToTestCases 
                  onAddTestCases={onAddTestCases}
                  currentProject={currentProject}
                />
              </AccordionContent>
            </AccordionItem>
            */}
          </Accordion>

          {/* Test Case Actions - Enhanced */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <div className="flex flex-col space-y-3">
              {/* Primary Action - Add Test Case */}
              <Button
                onClick={onAddTestCase}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Test Case
              </Button>
              
              {/* Secondary Actions - Compact Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.csv,.xlsx'
                    input.onchange = (e) => onFileUpload(e as any)
                    input.click()
                  }}
                  className="h-9 text-sm font-medium border-blue-400/50 bg-blue-500/20 hover:border-blue-400 hover:bg-blue-500/30 rounded-lg transition-all duration-200 text-white hover:text-white !text-white"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Import
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPasteDialogOpen?.(true)}
                  className="h-9 text-sm font-medium border-blue-400/50 bg-blue-500/20 hover:border-blue-400 hover:bg-blue-500/30 rounded-lg transition-all duration-200 text-white hover:text-white !text-white"
                >
                  <Clipboard className="w-3.5 h-3.5 mr-1.5" />
                  Paste
                </Button>
              </div>
              
              {/* Tertiary Actions - Compact Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="h-9 text-sm font-medium border-blue-400/50 bg-blue-500/20 hover:border-blue-400 hover:bg-blue-500/30 rounded-lg transition-all duration-200 text-white hover:text-white !text-white"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Refresh
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportToExcel}
                  className="h-9 text-sm font-medium border-blue-400/50 bg-blue-500/20 hover:border-blue-400 hover:bg-blue-500/30 rounded-lg transition-all duration-200 text-white hover:text-white !text-white"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export
                </Button>
              </div>
              
              {/* Notes Action */}
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenNotes}
                disabled={!currentProjectId || currentProjectId.trim() === ''}
                className={`w-full h-9 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentProjectId && currentProjectId.trim() !== ''
                    ? 'border-green-400/50 bg-green-500/20 hover:border-green-400 hover:bg-green-500/30 text-white hover:text-white !text-white'
                    : 'border-gray-400/30 bg-gray-500/10 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Notes
              </Button>
              
              {/* Manage Members Action */}
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenProjectMembers}
                disabled={!currentProjectId || currentProjectId.trim() === ''}
                className={`w-full h-9 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentProjectId && currentProjectId.trim() !== ''
                    ? 'border-purple-400/50 bg-purple-500/20 hover:border-purple-400 hover:bg-purple-500/30 text-white hover:text-white !text-white'
                    : 'border-gray-400/30 bg-gray-500/10 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Members
              </Button>
            </div>
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

      <Dialog open={isAddPlatformDialogOpen} onOpenChange={setIsAddPlatformDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Platform</DialogTitle>
            <DialogDescription>Add a new platform to your project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                placeholder="Enter platform name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPlatformDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPlatform}>Add Platform</Button>
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
