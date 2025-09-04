"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  User, 
  FileText, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Pause,
  Ban,
  ArrowRight,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { StatusHistory, TestCaseStatus, StatusChangeReason } from '@/types/qa-types'
import { statusHistoryService } from '@/lib/supabase-service'
import { getStatusIcon, getStatusBadgeVariant, getStatusBadgeStyle } from '@/lib/utils'

interface StatusHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  testCaseId: string
  testCaseName: string
}

export function StatusHistoryDialog({
  isOpen,
  onClose,
  testCaseId,
  testCaseName
}: StatusHistoryDialogProps) {
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && testCaseId) {
      loadStatusHistory()
    }
  }, [isOpen, testCaseId])

  const loadStatusHistory = async () => {
    setLoading(true)
    try {
      const history = await statusHistoryService.getByTestCaseId(testCaseId)
      setStatusHistory(history)
    } catch (error) {
      console.error('Failed to load status history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReasonIcon = (reason: StatusChangeReason) => {
    switch (reason) {
      case 'manual_update':
        return <User className="w-4 h-4" />
      case 'automation_run':
        return <Play className="w-4 h-4" />
      case 'bulk_update':
        return <FileText className="w-4 h-4" />
      case 'import':
        return <FileText className="w-4 h-4" />
      case 'system':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getReasonText = (reason: StatusChangeReason) => {
    switch (reason) {
      case 'manual_update':
        return 'Manual Update'
      case 'automation_run':
        return 'Automation Run'
      case 'bulk_update':
        return 'Bulk Update'
      case 'import':
        return 'Import'
      case 'system':
        return 'System'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - new Date(date).getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return formatDate(date)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[95vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-blue-300" />
            Status History
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Track all status changes for "{testCaseName}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : statusHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="w-12 h-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No Status History</h3>
              <p className="text-sm text-slate-500">
                This test case hasn't had any status changes yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {statusHistory.map((history, index) => (
                  <div key={history.id} className="relative">
                    {/* Timeline connector */}
                    {index < statusHistory.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-slate-200"></div>
                    )}
                    
                    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                      {/* Status change indicator */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          {history.oldStatus ? (
                            <ArrowRight className="w-5 h-5 text-blue-600" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {history.oldStatus && (
                            <>
                              <Badge variant={getStatusBadgeVariant(history.oldStatus)} className={getStatusBadgeStyle(history.oldStatus)}>
                                {(() => {
                                  const StatusIcon = getStatusIcon(history.oldStatus)
                                  return (
                                    <>
                                      <StatusIcon className="w-3 h-3 mr-1" />
                                      {history.oldStatus}
                                    </>
                                  )
                                })()}
                              </Badge>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                            </>
                          )}
                          <Badge variant={getStatusBadgeVariant(history.newStatus)} className={getStatusBadgeStyle(history.newStatus)}>
                            {(() => {
                              const StatusIcon = getStatusIcon(history.newStatus)
                              return (
                                <>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {history.newStatus}
                                </>
                              )
                            })()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium">{history.changedBy}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getReasonIcon(history.reason)}
                            <span>{getReasonText(history.reason)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span title={formatDate(history.changedAt)}>
                              {formatRelativeTime(history.changedAt)}
                            </span>
                          </div>
                          {history.notes && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span className="truncate">{history.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        {history.metadata && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                              {history.metadata.assignedTester && (
                                <div>
                                  <span className="font-medium">Assigned:</span> {history.metadata.assignedTester}
                                </div>
                              )}
                              {history.metadata.executionDate && (
                                <div>
                                  <span className="font-medium">Execution:</span> {history.metadata.executionDate}
                                </div>
                              )}
                              {history.metadata.executionTime && (
                                <div>
                                  <span className="font-medium">Duration:</span> {history.metadata.executionTime}s
                                </div>
                              )}
                              {history.metadata.automationResult && (
                                <div>
                                  <span className="font-medium">Automation:</span> {history.metadata.automationResult}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 