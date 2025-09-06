"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  History, 
  Download, 
  Upload,
  Trash2,
  RotateCcw,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Filter,
  Search,
  Calendar,
  FileType
} from 'lucide-react'
import { importHistoryManager, importRollbackManager, ImportSession, ImportHistoryFilters } from '@/lib/import-history'
import { toast } from '@/hooks/use-toast'

interface ImportHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  currentProject: string
  onRollbackComplete?: () => void
  deleteTestCases: (testCaseIds: string[]) => Promise<boolean>
}

export function ImportHistoryDialog({
  isOpen,
  onClose,
  currentProject,
  onRollbackComplete,
  deleteTestCases
}: ImportHistoryDialogProps) {
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ImportSession[]>([])
  const [filters, setFilters] = useState<ImportHistoryFilters>({ projectId: currentProject })
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ImportSession | null>(null)
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false)

  // Load import history when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, currentProject])

  // Apply filters and search
  useEffect(() => {
    let filtered = sessions

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status)
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(s => s.timestamp >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(s => s.timestamp <= filters.dateTo!)
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredSessions(filtered)
  }, [sessions, filters, searchTerm])

  const loadHistory = () => {
    const allSessions = importHistoryManager.getAllSessions(filters)
    setSessions(allSessions)
  }

  const handleRollback = async (session: ImportSession) => {
    if (!session.canRollback) {
      toast({
        title: "Cannot Rollback",
        description: "This import session cannot be rolled back",
        variant: "destructive"
      })
      return
    }

    setSelectedSession(session)
    setShowRollbackConfirm(true)
  }

  const confirmRollback = async () => {
    if (!selectedSession) return

    setIsLoading(true)
    try {
      const result = await importRollbackManager.rollbackImport(
        selectedSession.id,
        deleteTestCases
      )

      if (result.success) {
        toast({
          title: "Rollback Successful",
          description: result.message
        })
        loadHistory() // Refresh the history
        onRollbackComplete?.()
      } else {
        toast({
          title: "Rollback Failed",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Rollback Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setShowRollbackConfirm(false)
      setSelectedSession(null)
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    const success = importHistoryManager.deleteSession(sessionId)
    if (success) {
      toast({
        title: "Session Deleted",
        description: "Import session has been removed from history"
      })
      loadHistory()
    } else {
      toast({
        title: "Delete Failed",
        description: "Could not delete the import session",
        variant: "destructive"
      })
    }
  }

  const handleClearHistory = () => {
    const deleted = importHistoryManager.clearHistory()
    toast({
      title: "History Cleared",
      description: `Removed ${deleted} import sessions from history`
    })
    loadHistory()
  }

  const handleExportHistory = () => {
    const jsonData = importHistoryManager.exportHistory(filters)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `import-history-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    toast({
      title: "Export Successful",
      description: "Import history exported successfully"
    })
  }

  const getStatusIcon = (status: ImportSession['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'rolled_back':
        return <RotateCcw className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusBadge = (status: ImportSession['status']) => {
    const variants = {
      completed: 'default',
      partial: 'secondary',
      failed: 'destructive',
      rolled_back: 'outline'
    } as const

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const statistics = importHistoryManager.getStatistics(currentProject)

  const renderHistoryTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by filename or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>

        <Select value={filters.status || ''} onValueChange={(value) => 
          setFilters(prev => ({ ...prev, status: value as ImportSession['status'] || undefined }))
        }>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="rolled_back">Rolled Back</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportHistory}>
            <Download className="w-4 h-4 mr-2" />
            Export History
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearHistory}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Import Sessions Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.map((session) => {
              const successRate = session.summary.totalRows > 0 
                ? Math.round((session.summary.successfulImports / session.summary.totalRows) * 100)
                : 0

              return (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(session.status)}
                      {getStatusBadge(session.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{session.fileName}</div>
                      <div className="text-xs text-slate-500">
                        {Math.round(session.fileSize / 1024)} KB • {session.fileType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{session.timestamp.toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">
                        {session.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{session.summary.successfulImports} / {session.summary.totalRows}</div>
                      {session.summary.skippedRows > 0 && (
                        <div className="text-xs text-amber-600">
                          {session.summary.skippedRows} skipped
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            successRate === 100 ? 'bg-green-500' : 
                            successRate >= 80 ? 'bg-blue-500' : 
                            successRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                      <span className="text-sm">{successRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {session.canRollback && session.status !== 'rolled_back' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRollback(session)}
                          disabled={isLoading}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Rollback
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredSessions.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No import history found</p>
            <p className="text-sm">Import sessions will appear here after you import test cases</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderStatisticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalImports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.totalImports > 0 
                ? Math.round((statistics.successfulImports / statistics.totalImports) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Test Cases Imported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.totalTestCasesImported}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(statistics.averageProcessingTime / 1000)}s</div>
          </CardContent>
        </Card>
      </div>

      {/* File Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileType className="w-5 h-5" />
            File Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statistics.fileTypeDistribution.map(({ type, count }) => (
              <div key={type} className="flex items-center justify-between">
                <span className="capitalize">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ 
                        width: `${(count / statistics.totalImports) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Common Errors */}
      {statistics.mostCommonErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Most Common Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.mostCommonErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="flex items-start justify-between gap-4">
                  <span className="text-sm text-slate-600 flex-1">{error.error}</span>
                  <Badge variant="outline">{error.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Import History
            </DialogTitle>
            <DialogDescription>
              View and manage your test case import history
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Import History</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="space-y-4">
              {renderHistoryTab()}
            </TabsContent>
            
            <TabsContent value="statistics" className="space-y-4">
              {renderStatisticsTab()}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={showRollbackConfirm} onOpenChange={setShowRollbackConfirm}>
        <DialogContent className="max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Rollback
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to rollback this import? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div><strong>File:</strong> {selectedSession.fileName}</div>
                <div><strong>Imported:</strong> {selectedSession.summary.successfulImports} test cases</div>
                <div><strong>Date:</strong> {selectedSession.timestamp.toLocaleString()}</div>
              </div>

              <div className="text-sm text-slate-600">
                This will permanently delete all {selectedSession.importedTestCases.length} test cases 
                that were imported in this session.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRollbackConfirm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRollback}
              disabled={isLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? 'Rolling back...' : 'Confirm Rollback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
