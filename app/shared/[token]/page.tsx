"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SharedProjectAccess, ProjectPermissions } from '@/types/qa-types'
import { projectShareService } from '@/lib/supabase-service'
import { projectService } from '@/lib/supabase-service'
import { TestCaseTable } from '@/components/TestCaseTable'
import { CommentsDialog } from '@/components/CommentsDialog'
import { TestCaseDialog } from '@/components/TestCaseDialog'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { AuthPage } from '@/components/AuthPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, MessageSquare, Edit, Plus, Download, Lock, AlertTriangle, CheckCircle, LogIn, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TestCase, TestCaseStatus } from '@/types/qa-types'
import { useTestCases } from '@/hooks/useTestCases'
import { useTestSuites } from '@/hooks/useTestSuites'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function SharedProjectContent() {
  const params = useParams()
  const token = params.token as string
  const { user, loading: authLoading } = useAuth()
  const [sharedAccess, setSharedAccess] = useState<SharedProjectAccess | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
  const [isTestCaseDialogOpen, setIsTestCaseDialogOpen] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [viewingTestCase, setViewingTestCase] = useState<TestCase | null>(null)
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  
  const { toast } = useToast()

  // Load shared project data
  useEffect(() => {
    const loadSharedProject = async () => {
      try {
        setIsLoading(true)
        setError('')

        // Get shared project data from API (bypasses RLS)
        const response = await fetch(`/api/shared/${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to load the shared project.')
          return
        }

        const { share, project } = data

        setSharedAccess({
          project,
          permissions: share.permissions,
          accessToken: share.accessToken
        })

      } catch (err) {
        console.error('Error loading shared project:', err)
        setError('Failed to load the shared project. Please check the link and try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadSharedProject()
    }
  }, [token])

  // Load test cases for the shared project
  const { testCases, addTestCase, updateTestCase, removeTestCase } = useTestCases(sharedAccess?.project.id || '')
  const { testSuites } = useTestSuites(sharedAccess?.project.id || '')

  const handleOpenComments = (testCase: TestCase) => {
    if (!sharedAccess?.permissions.canComment) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view comments.",
        variant: "destructive",
      })
      return
    }
    
    // Check if user is logged in for comment actions
    if (!user && sharedAccess.permissions.canComment) {
      setShowLoginPrompt(true)
      return
    }
    
    setSelectedTestCase(testCase)
    setIsCommentsDialogOpen(true)
  }

  const handleEditTestCase = (testCase: TestCase) => {
    if (!sharedAccess?.permissions.canEdit) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit test cases.",
        variant: "destructive",
      })
      return
    }
    
    // Check if user is logged in for edit actions
    if (!user && sharedAccess.permissions.canEdit) {
      setShowLoginPrompt(true)
      return
    }
    
    setSelectedTestCase(testCase)
    setIsTestCaseDialogOpen(true)
  }

  const handleViewTestCase = (testCase: TestCase) => {
    if (!sharedAccess?.permissions.canView) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view test cases.",
        variant: "destructive",
      })
      return
    }
    setViewingTestCase(testCase)
    setIsTestCaseDialogOpen(true)
  }

  const handleAddTestCase = () => {
    if (!sharedAccess?.permissions.canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create test cases.",
        variant: "destructive",
      })
      return
    }
    
    // Check if user is logged in for create actions
    if (!user && sharedAccess.permissions.canCreate) {
      setShowLoginPrompt(true)
      return
    }
    
    setSelectedTestCase(null)
    setIsTestCaseDialogOpen(true)
  }

  const handleRemoveTestCase = (testCase: TestCase) => {
    if (!sharedAccess?.permissions.canDelete) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete test cases.",
        variant: "destructive",
      })
      return
    }
    
    // Check if user is logged in for delete actions
    if (!user && sharedAccess.permissions.canDelete) {
      setShowLoginPrompt(true)
      return
    }
    
    removeTestCase(testCase.id)
  }

  const handleAddTestCaseFromPaste = async (testCase: Partial<TestCase>) => {
    if (!sharedAccess?.permissions.canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create test cases.",
        variant: "destructive",
      })
      return
    }
    
    // Check if user is logged in for create actions
    if (!user && sharedAccess.permissions.canCreate) {
      setShowLoginPrompt(true)
      return
    }
    
    try {
      await addTestCase({
        testCase: testCase.testCase || 'Untitled Test Case',
        description: testCase.description || '',
        status: testCase.status || 'Pending',
        priority: testCase.priority || 'Medium',
        category: testCase.category || 'Functional',
        platform: testCase.platform || '',
        assignedTester: testCase.assignedTester || '',
        executionDate: testCase.executionDate || '',
        notes: testCase.notes || '',
        actualResult: testCase.actualResult || '',
        environment: testCase.environment || '',
        prerequisites: testCase.prerequisites || '',
        stepsToReproduce: testCase.stepsToReproduce || '',
        expectedResult: testCase.expectedResult || '',
        projectId: sharedAccess.project.id
      })
      
      toast({
        title: "Test Case Created",
        description: "Test case has been successfully created from pasted data.",
      })
    } catch (error) {
      toast({
        title: "Error Creating Test Case",
        description: "Failed to create test case from pasted data.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Loading Shared Project...</h2>
          <p className="text-lg text-slate-600">Please wait while we load the project data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription className="text-lg mt-2">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button onClick={() => window.history.back()} variant="outline" size="lg" className="px-8">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sharedAccess) {
    return null
  }

  const { project, permissions } = sharedAccess

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Shared Project</h1>
                <p className="text-lg text-slate-600 font-medium">{project.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 px-4 py-2 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Shared Access
              </Badge>
              {!user ? (
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              ) : (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm">
                  <User className="w-4 h-4 mr-2" />
                  {user.email}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Info */}
      <div className="w-full px-6 lg:px-8 xl:px-12 py-6">
        <Alert className="mb-8 border-2">
          <Lock className="w-5 h-5" />
          <AlertDescription className="text-base">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-slate-900">Your permissions for this shared project:</span>
              <div className="flex items-center space-x-3">
                {permissions.canView && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <Eye className="w-4 h-4 mr-2" />View
                  </Badge>
                )}
                {permissions.canComment && (
                  <Badge variant="outline" className={`text-sm px-3 py-1 ${!user ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}`}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comment{!user && ' (Login Required)'}
                  </Badge>
                )}
                {permissions.canEdit && (
                  <Badge variant="outline" className={`text-sm px-3 py-1 ${!user ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit{!user && ' (Login Required)'}
                  </Badge>
                )}
                {permissions.canCreate && (
                  <Badge variant="outline" className={`text-sm px-3 py-1 ${!user ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create{!user && ' (Login Required)'}
                  </Badge>
                )}
                {permissions.canExport && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <Download className="w-4 h-4 mr-2" />Export
                  </Badge>
                )}
              </div>
            </div>
            {!user && (permissions.canComment || permissions.canEdit || permissions.canCreate) && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <LogIn className="w-5 h-5 text-yellow-600" />
                  <span className="text-base text-yellow-800">
                    <strong>Login Required:</strong> Some features require you to log in to access full functionality.
                  </span>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 lg:px-8 xl:px-12 pb-12">
        <TestCaseTable
          testCases={testCases}
          selectedTestCases={new Set()}
          searchQuery=""
          setSearchQuery={() => {}}
          statusFilter={[]}
          setStatusFilter={() => {}}
          priorityFilter={[]}
          setPriorityFilter={() => {}}
          platformFilter={[]}
          setPlatformFilter={() => {}}
          categoryFilter={[]}
          setCategoryFilter={() => {}}
          assignedTesterFilter={[]}
          setAssignedTesterFilter={() => {}}
          savedFilters={[]}
          tableColumns={{
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
          }}
          currentPage={1}
          setCurrentPage={() => {}}
          rowsPerPage={25}
          setRowsPerPage={() => {}}
          onAddTestCase={permissions.canCreate ? handleAddTestCase : () => {}}
          onEditTestCase={permissions.canEdit ? handleEditTestCase : () => {}}
          onViewTestCase={permissions.canView ? handleViewTestCase : () => {}}
          onRemoveTestCase={permissions.canDelete ? (id: string) => {
            const testCase = testCases.find(tc => tc.id === id)
            if (testCase) handleRemoveTestCase(testCase)
          } : () => {}}
          onRemoveSelectedTestCases={() => {}}
        deleteLoading={false}
          onUpdateTestCaseStatus={() => {}}
          onBulkUpdateStatus={() => {}}
          onToggleTestCaseSelection={() => {}}
          onToggleSelectAll={() => {}}
          onClearAllTestCases={() => {}}
          onFileUpload={() => {}}
          onExportToExcel={permissions.canExport ? () => {} : () => {}}
          onSaveFilter={() => {}}
          onLoadFilter={() => {}}
          onDeleteFilter={() => {}}
          onClearAllFilters={() => {}}
          onOpenComments={permissions.canComment ? handleOpenComments : () => {}}
          onOpenAutomation={() => {}}
          onAddTestCaseFromPaste={permissions.canCreate ? handleAddTestCaseFromPaste : undefined}
          currentProject={project.name}
          isPasteDialogOpen={isPasteDialogOpen}
          setIsPasteDialogOpen={setIsPasteDialogOpen}
        />
      </div>

      {/* Dialogs */}
      {selectedTestCase && (
        <CommentsDialog
          isOpen={isCommentsDialogOpen}
          onClose={() => setIsCommentsDialogOpen(false)}
          testCase={selectedTestCase}
          onUpdateTestCase={(updates) => updateTestCase(selectedTestCase.id, updates)}
          onCommentsUpdate={() => {}}
        />
      )}

      <TestCaseDialog
        isOpen={isTestCaseDialogOpen}
        onClose={() => {
          setIsTestCaseDialogOpen(false)
          setSelectedTestCase(null)
          setViewingTestCase(null)
        }}
        onSubmit={addTestCase}
        testCase={selectedTestCase || viewingTestCase}
        isViewMode={!!viewingTestCase}
        onEdit={() => {
          if (viewingTestCase) {
            setSelectedTestCase(viewingTestCase)
            setViewingTestCase(null)
          }
        }}
        testSuites={testSuites}
        selectedSuiteId={null}
      />

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <LogIn className="w-5 h-5 text-blue-600" />
              <span>Login Required</span>
            </DialogTitle>
            <DialogDescription>
              To access this feature, you need to log in to your account. This ensures secure access to the project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Why login?</strong> This project has restricted access. Login to unlock full functionality.
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowLoginPrompt(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowLoginPrompt(false)
                  // Redirect to login page
                  window.location.href = '/'
                }} 
                className="flex-1"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Go to Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SharedProjectPage() {
  return (
    <AuthProvider>
      <SharedProjectPageContent />
    </AuthProvider>
  )
}

function SharedProjectPageContent() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Loading Authentication...</h2>
          <p className="text-lg text-slate-600">Please wait while we check your authentication status.</p>
        </div>
      </div>
    )
  }

  return <SharedProjectContent />
} 