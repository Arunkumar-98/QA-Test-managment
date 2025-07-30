"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TestSuiteShare, TestSuitePermissions } from '@/types/qa-types'
import { testSuiteShareService } from '@/lib/supabase-service'
import { projectService } from '@/lib/supabase-service'
import { testSuiteService } from '@/lib/supabase-service'
import { TestCaseTable } from '@/components/TestCaseTable'
import { CommentsDialog } from '@/components/CommentsDialog'
import { TestCaseDialog } from '@/components/TestCaseDialog'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { AuthPage } from '@/components/AuthPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, MessageSquare, Edit, Plus, Download, Lock, AlertTriangle, CheckCircle, LogIn, User, Folder, Share2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TestCase, TestCaseStatus } from '@/types/qa-types'
import { useTestCases } from '@/hooks/useTestCases'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SharedTestSuiteAccess {
  testSuite: any
  project: any
  permissions: TestSuitePermissions
  accessToken: string
}

function SharedTestSuiteContent() {
  const params = useParams()
  const token = params.token as string
  const { user, loading: authLoading } = useAuth()
  const [sharedAccess, setSharedAccess] = useState<SharedTestSuiteAccess | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
  const [isTestCaseDialogOpen, setIsTestCaseDialogOpen] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [viewingTestCase, setViewingTestCase] = useState<TestCase | null>(null)
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  
  const { toast } = useToast()

  // Load shared test suite data
  useEffect(() => {
    const loadSharedTestSuite = async () => {
      try {
        setIsLoading(true)
        setError('')

        // Get share details
        console.log('🔍 Getting share details for token:', token)
        const share = await testSuiteShareService.getShareByToken(token)
        console.log('🔍 Share details:', share)
        if (!share) {
          setError('This share link is invalid or has expired.')
          return
        }

        // Check if share is expired
        if (share.expiresAt && new Date() > share.expiresAt) {
          setError('This share link has expired.')
          return
        }

        // Check if max views exceeded
        if (share.maxViews && share.currentViews >= share.maxViews) {
          setError('This share link has reached its maximum number of views.')
          return
        }

        // Get project details
        console.log('🔍 Getting project details for ID:', share.projectId)
        const project = await projectService.getById(share.projectId)
        console.log('🔍 Project details:', project)
        if (!project) {
          setError('The shared project could not be found.')
          return
        }

        // Get test suite details
        console.log('🔍 Getting test suite details for ID:', share.testSuiteId)
        const testSuite = await testSuiteService.getById(share.testSuiteId)
        console.log('🔍 Test suite details:', testSuite)
        if (!testSuite) {
          setError('The shared test suite could not be found.')
          return
        }

        // Increment view count
        await testSuiteShareService.incrementViews(share.id)

        setSharedAccess({
          testSuite,
          project,
          permissions: share.permissions,
          accessToken: share.accessToken
        })

      } catch (err) {
        console.error('Error loading shared test suite:', err)
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : 'No stack trace',
          token,
          error: err
        })
        setError(`Failed to load the shared test suite: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadSharedTestSuite()
    }
  }, [token])

  // Load test cases for the shared test suite
  const { testCases, addTestCase, updateTestCase, removeTestCase, loading: testCasesLoading } = useTestCases(sharedAccess?.project?.id || '')

  // Filter test cases to only show those in the shared test suite
  const filteredTestCases = sharedAccess?.testSuite?.id 
    ? testCases.filter(tc => tc.suiteId === sharedAccess.testSuite.id)
    : []

  // TEMPORARY: Show all test cases for debugging
  const debugFilteredTestCases = testCases.length > 0 ? testCases : filteredTestCases

  // Debug logging
  console.log('🔍 Shared Test Suite Debug:', {
    sharedAccess: !!sharedAccess,
    projectId: sharedAccess?.project?.id,
    testSuiteId: sharedAccess?.testSuite?.id,
    totalTestCases: testCases.length,
    filteredTestCases: filteredTestCases.length,
    testCasesLoading,
    testCases: testCases.slice(0, 3) // Log first 3 test cases for debugging
  })

  // Additional debugging for suiteId matching
  if (sharedAccess?.testSuite?.id && testCases.length > 0) {
    console.log('🔍 Suite ID Matching Debug:', {
      expectedSuiteId: sharedAccess.testSuite.id,
      testCasesWithSuiteId: testCases.filter(tc => tc.suiteId).length,
      testCasesWithoutSuiteId: testCases.filter(tc => !tc.suiteId).length,
      sampleTestCases: testCases.slice(0, 5).map(tc => ({
        id: tc.id,
        testCase: tc.testCase,
        suiteId: tc.suiteId,
        projectId: tc.projectId
      }))
    })
  }

  // Force re-fetch test cases when sharedAccess becomes available
  useEffect(() => {
    if (sharedAccess?.project?.id) {
      console.log('🔄 Shared access loaded, project ID:', sharedAccess.project.id)
      console.log('🔄 Test suite ID:', sharedAccess.testSuite.id)
      console.log('🔄 Current test cases count:', testCases.length)
    }
  }, [sharedAccess?.project?.id, testCases.length])

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
        projectId: sharedAccess.project.id,
        suiteId: sharedAccess.testSuite.id
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
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Loading Shared Test Suite...</h2>
          <p className="text-lg text-slate-600">Please wait while we load the test suite data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Access Error</h2>
          <p className="text-lg text-slate-600 mb-6">{error}</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!sharedAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Not Found</h2>
          <p className="text-lg text-slate-600">The shared test suite could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Folder className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{sharedAccess.testSuite.name}</h1>
                  <p className="text-sm text-slate-600">Shared Test Suite • {sharedAccess.project.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Permission Badges */}
              <div className="flex items-center space-x-2">
                {sharedAccess.permissions.canView && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Badge>
                )}
                {sharedAccess.permissions.canComment && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Comment
                  </Badge>
                )}
                {sharedAccess.permissions.canEdit && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Badge>
                )}
                {sharedAccess.permissions.canCreate && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Plus className="w-3 h-3 mr-1" />
                    Create
                  </Badge>
                )}
              </div>
              
              {!user && (
                <Button variant="outline" onClick={() => setShowLoginPrompt(true)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Suite Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              <span>Test Suite Information</span>
            </CardTitle>
            <CardDescription>
              Details about this shared test suite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Test Suite</h3>
                <p className="text-sm text-slate-600">{sharedAccess.testSuite.name}</p>
                {sharedAccess.testSuite.description && (
                  <p className="text-sm text-slate-500 mt-1">{sharedAccess.testSuite.description}</p>
                )}
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Project</h3>
                <p className="text-sm text-slate-600">{sharedAccess.project.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Statistics</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-slate-600">Total: {debugFilteredTestCases.length}</span>
                  <span className="text-green-600">Passed: {debugFilteredTestCases.filter(tc => tc.status === 'Pass').length}</span>
                  <span className="text-red-600">Failed: {debugFilteredTestCases.filter(tc => tc.status === 'Fail').length}</span>
                  <span className="text-yellow-600">Pending: {debugFilteredTestCases.filter(tc => tc.status === 'Pending').length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Cases Table with Loading State */}
        {testCasesLoading ? (
          <Card className="mt-6">
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-slate-600">Loading test cases...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <TestCaseTable
            testCases={debugFilteredTestCases}
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
              id: { visible: true, width: '80px', minWidth: '60px' },
              testCase: { visible: true, width: '200px', minWidth: '150px' },
              description: { visible: true, width: '250px', minWidth: '200px' },
              status: { visible: true, width: '120px', minWidth: '100px' },
              priority: { visible: true, width: '100px', minWidth: '80px' },
              category: { visible: true, width: '120px', minWidth: '100px' },
              assignedTester: { visible: true, width: '120px', minWidth: '100px' },
              executionDate: { visible: true, width: '120px', minWidth: '100px' },
              platform: { visible: true, width: '100px', minWidth: '80px' },
              automationScript: { visible: false, width: '100px', minWidth: '80px' },
              actions: { visible: true, width: '120px', minWidth: '100px' }
            }}
            currentPage={1}
            setCurrentPage={() => {}}
            rowsPerPage={25}
            setRowsPerPage={() => {}}
            onAddTestCase={handleAddTestCase}
            onEditTestCase={handleEditTestCase}
            onViewTestCase={handleViewTestCase}
            onRemoveTestCase={(id) => {
              const testCase = debugFilteredTestCases.find(tc => tc.id === id)
              if (testCase) {
                handleRemoveTestCase(testCase)
              }
            }}
            onRemoveSelectedTestCases={() => {}}
            onUpdateTestCaseStatus={() => {}}
            onBulkUpdateStatus={() => {}}
            onToggleTestCaseSelection={() => {}}
            onToggleSelectAll={() => {}}
            onClearAllTestCases={() => {}}
            onFileUpload={() => {}}
            onExportToExcel={() => {}}
            onSaveFilter={() => {}}
            onLoadFilter={() => {}}
            onDeleteFilter={() => {}}
            onClearAllFilters={() => {}}
            onOpenComments={handleOpenComments}
            onOpenAutomation={() => {}}
            onAddTestCaseFromPaste={handleAddTestCaseFromPaste}
            currentProject={sharedAccess.project.name}
            isPasteDialogOpen={isPasteDialogOpen}
            setIsPasteDialogOpen={setIsPasteDialogOpen}
          />
        )}
      </div>

      {/* Dialogs */}
      {selectedTestCase && (
        <TestCaseDialog
          isOpen={isTestCaseDialogOpen}
          onClose={() => setIsTestCaseDialogOpen(false)}
          onSubmit={(testCaseData) => updateTestCase(selectedTestCase.id, testCaseData)}
          testCase={selectedTestCase}
          isViewMode={false}
          testSuites={[]}
          selectedSuiteId={sharedAccess.testSuite.id}
        />
      )}

      {viewingTestCase && (
        <TestCaseDialog
          isOpen={isTestCaseDialogOpen}
          onClose={() => setIsTestCaseDialogOpen(false)}
          onSubmit={(testCaseData) => updateTestCase(viewingTestCase.id, testCaseData)}
          testCase={viewingTestCase}
          isViewMode={true}
          testSuites={[]}
          selectedSuiteId={sharedAccess.testSuite.id}
        />
      )}

      {selectedTestCase && (
        <CommentsDialog
          isOpen={isCommentsDialogOpen}
          onClose={() => setIsCommentsDialogOpen(false)}
          testCase={selectedTestCase}
          onUpdateTestCase={(updates) => updateTestCase(selectedTestCase.id, updates)}
          onCommentsUpdate={() => {}}
        />
      )}

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <LogIn className="w-5 h-5 text-blue-600" />
              <span>Login Required</span>
            </DialogTitle>
            <DialogDescription>
              To access this feature, you need to log in to your account. This ensures secure access to the test suite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Why login?</strong> This test suite has restricted access. Login to unlock full functionality.
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

export default function SharedTestSuitePage() {
  return (
    <AuthProvider>
      <SharedTestSuitePageContent />
    </AuthProvider>
  )
}

function SharedTestSuitePageContent() {
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

  return <SharedTestSuiteContent />
} 