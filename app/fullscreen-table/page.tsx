'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { TestCaseTable } from '@/components/TestCaseTable'
import { useTestCases } from '@/hooks/useTestCases'
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter'
import { TestCase, TestCaseStatus, TestCasePriority, TestCaseCategory } from '@/types/qa-types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function FullscreenTablePage() {
  const searchParams = useSearchParams()
  const projectParam = searchParams.get('project') || ''
  
  const [currentProject, setCurrentProject] = useState(projectParam)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { toast } = useToast()

  // Initialize hooks
  const {
    testCases,
    selectedTestCases,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    onAddTestCase,
    onEditTestCase,
    onViewTestCase,
    onRemoveTestCase,
    onRemoveSelectedTestCases,
    onUpdateTestCaseStatus,
    onBulkUpdateStatus,
    onToggleTestCaseSelection,
    onToggleSelectAll,
    onClearAllTestCases,
    onFileUpload,
    onExportToExcel,
    onOpenComments,
    onOpenAutomation,
    onAddTestCaseFromPaste,
    isPasteDialogOpen,
    setIsPasteDialogOpen
  } = useTestCases(currentProject)

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    platformFilter,
    setPlatformFilter,
    categoryFilter,
    setCategoryFilter,
    assignedTesterFilter,
    setAssignedTesterFilter,
    savedFilters,
    onSaveFilter,
    onLoadFilter,
    onDeleteFilter,
    onClearAllFilters
  } = useSearchAndFilter()

  // Default table columns configuration for full-screen view
  const tableColumns = {
    id: { visible: true, width: '80px', minWidth: '60px' },
    testCase: { visible: true, width: '200px', minWidth: '150px' },
    description: { visible: true, width: '300px', minWidth: '200px' },
    status: { visible: true, width: '120px', minWidth: '100px' },
    priority: { visible: true, width: '100px', minWidth: '80px' },
    category: { visible: true, width: '120px', minWidth: '100px' },
    assignedTester: { visible: true, width: '120px', minWidth: '100px' },
    executionDate: { visible: true, width: '120px', minWidth: '100px' },
    platform: { visible: true, width: '100px', minWidth: '80px' },
    automationScript: { visible: true, width: '150px', minWidth: '100px' },
    actions: { visible: true, width: '120px', minWidth: '100px' }
  }

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.close()}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Close</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-800">
                Full Screen Test Cases
              </h1>
              {currentProject && (
                <span className="text-sm text-slate-500">
                  • {currentProject}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Fullscreen</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <TestCaseTable
          testCases={testCases}
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
          onAddTestCase={onAddTestCase}
          onEditTestCase={onEditTestCase}
          onViewTestCase={onViewTestCase}
          onRemoveTestCase={onRemoveTestCase}
          onRemoveSelectedTestCases={onRemoveSelectedTestCases}
          onUpdateTestCaseStatus={onUpdateTestCaseStatus}
          onBulkUpdateStatus={onBulkUpdateStatus}
          onToggleTestCaseSelection={onToggleTestCaseSelection}
          onToggleSelectAll={onToggleSelectAll}
          onClearAllTestCases={onClearAllTestCases}
          onFileUpload={onFileUpload}
          onExportToExcel={onExportToExcel}
          onSaveFilter={onSaveFilter}
          onLoadFilter={onLoadFilter}
          onDeleteFilter={onDeleteFilter}
          onClearAllFilters={onClearAllFilters}
          onOpenComments={onOpenComments}
          onOpenAutomation={onOpenAutomation}
          onAddTestCaseFromPaste={onAddTestCaseFromPaste}
          currentProject={currentProject}
          isPasteDialogOpen={isPasteDialogOpen}
          setIsPasteDialogOpen={setIsPasteDialogOpen}
        />
      </div>
    </div>
  )
} 