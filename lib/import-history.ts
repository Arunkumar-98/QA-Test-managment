import { TestCase } from '@/types/qa-types'

export interface ImportSession {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  projectId: string
  suiteId?: string
  timestamp: Date
  status: 'completed' | 'partial' | 'failed' | 'rolled_back'
  summary: ImportSummary
  importedTestCases: string[] // Array of test case IDs
  errors: string[]
  warnings: string[]
  metadata: {
    processingTime: number
    template?: string
    duplicatesDetected: number
    validationIssues: number
    autoFixesApplied: number
  }
  canRollback: boolean
  rollbackData?: RollbackData
}

export interface ImportSummary {
  totalRows: number
  successfulImports: number
  skippedRows: number
  errorCount: number
  warningCount: number
}

export interface RollbackData {
  originalTestCases: Partial<TestCase>[] // Test cases that existed before import
  importedTestCaseIds: string[] // IDs of test cases that were imported
  suiteStatistics?: {
    suiteId: string
    originalStats: {
      totalTests: number
      passedTests: number
      failedTests: number
      pendingTests: number
    }
  }
}

export interface ImportHistoryFilters {
  projectId?: string
  suiteId?: string
  status?: ImportSession['status']
  dateFrom?: Date
  dateTo?: Date
  fileName?: string
}

export class ImportHistoryManager {
  private sessions: Map<string, ImportSession> = new Map()
  private readonly storageKey = 'qa-import-history'
  private readonly maxHistoryItems = 100

  constructor() {
    this.loadHistory()
  }

  private loadHistory() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          const sessions: ImportSession[] = JSON.parse(stored, (key, value) => {
            // Convert date strings back to Date objects
            if (key === 'timestamp' || key === 'dateFrom' || key === 'dateTo') {
              return new Date(value)
            }
            return value
          })
          
          sessions.forEach(session => {
            this.sessions.set(session.id, session)
          })
        }
      } catch (error) {
        console.warn('Failed to load import history from localStorage:', error)
      }
    }
  }

  private saveHistory() {
    if (typeof window !== 'undefined') {
      try {
        const sessions = Array.from(this.sessions.values())
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, this.maxHistoryItems) // Keep only the most recent items

        localStorage.setItem(this.storageKey, JSON.stringify(sessions))
      } catch (error) {
        console.warn('Failed to save import history to localStorage:', error)
      }
    }
  }

  createSession(data: {
    fileName: string
    fileSize: number
    fileType: string
    projectId: string
    suiteId?: string
    summary: ImportSummary
    importedTestCases: string[]
    errors: string[]
    warnings: string[]
    processingTime: number
    template?: string
    duplicatesDetected: number
    validationIssues: number
    autoFixesApplied: number
    rollbackData?: RollbackData
  }): ImportSession {
    const session: ImportSession = {
      id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      projectId: data.projectId,
      suiteId: data.suiteId,
      timestamp: new Date(),
      status: data.errors.length === 0 ? 'completed' : data.summary.successfulImports > 0 ? 'partial' : 'failed',
      summary: data.summary,
      importedTestCases: data.importedTestCases,
      errors: data.errors,
      warnings: data.warnings,
      metadata: {
        processingTime: data.processingTime,
        template: data.template,
        duplicatesDetected: data.duplicatesDetected,
        validationIssues: data.validationIssues,
        autoFixesApplied: data.autoFixesApplied
      },
      canRollback: data.importedTestCases.length > 0 && !!data.rollbackData,
      rollbackData: data.rollbackData
    }

    this.sessions.set(session.id, session)
    this.saveHistory()
    return session
  }

  getSession(id: string): ImportSession | undefined {
    return this.sessions.get(id)
  }

  getAllSessions(filters?: ImportHistoryFilters): ImportSession[] {
    let sessions = Array.from(this.sessions.values())

    if (filters) {
      sessions = sessions.filter(session => {
        if (filters.projectId && session.projectId !== filters.projectId) return false
        if (filters.suiteId && session.suiteId !== filters.suiteId) return false
        if (filters.status && session.status !== filters.status) return false
        if (filters.dateFrom && session.timestamp < filters.dateFrom) return false
        if (filters.dateTo && session.timestamp > filters.dateTo) return false
        if (filters.fileName && !session.fileName.toLowerCase().includes(filters.fileName.toLowerCase())) return false
        return true
      })
    }

    return sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  updateSessionStatus(id: string, status: ImportSession['status']): boolean {
    const session = this.sessions.get(id)
    if (!session) return false

    session.status = status
    this.sessions.set(id, session)
    this.saveHistory()
    return true
  }

  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id)
    if (deleted) {
      this.saveHistory()
    }
    return deleted
  }

  clearHistory(olderThan?: Date): number {
    const initialSize = this.sessions.size
    
    if (olderThan) {
      // Delete sessions older than the specified date
      for (const [id, session] of this.sessions.entries()) {
        if (session.timestamp < olderThan) {
          this.sessions.delete(id)
        }
      }
    } else {
      // Clear all history
      this.sessions.clear()
    }

    this.saveHistory()
    return initialSize - this.sessions.size
  }

  // Get statistics about import history
  getStatistics(projectId?: string): {
    totalImports: number
    successfulImports: number
    partialImports: number
    failedImports: number
    totalTestCasesImported: number
    averageProcessingTime: number
    mostCommonErrors: Array<{ error: string; count: number }>
    fileTypeDistribution: Array<{ type: string; count: number }>
  } {
    const sessions = projectId 
      ? this.getAllSessions({ projectId })
      : this.getAllSessions()

    const totalImports = sessions.length
    const successfulImports = sessions.filter(s => s.status === 'completed').length
    const partialImports = sessions.filter(s => s.status === 'partial').length
    const failedImports = sessions.filter(s => s.status === 'failed').length
    
    const totalTestCasesImported = sessions.reduce((sum, s) => sum + s.summary.successfulImports, 0)
    const averageProcessingTime = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + s.metadata.processingTime, 0) / sessions.length
      : 0

    // Count error frequencies
    const errorCounts = new Map<string, number>()
    sessions.forEach(session => {
      session.errors.forEach(error => {
        const count = errorCounts.get(error) || 0
        errorCounts.set(error, count + 1)
      })
    })

    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // File type distribution
    const fileTypeCounts = new Map<string, number>()
    sessions.forEach(session => {
      const count = fileTypeCounts.get(session.fileType) || 0
      fileTypeCounts.set(session.fileType, count + 1)
    })

    const fileTypeDistribution = Array.from(fileTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalImports,
      successfulImports,
      partialImports,
      failedImports,
      totalTestCasesImported,
      averageProcessingTime,
      mostCommonErrors,
      fileTypeDistribution
    }
  }

  // Export history as JSON
  exportHistory(filters?: ImportHistoryFilters): string {
    const sessions = this.getAllSessions(filters)
    return JSON.stringify(sessions, null, 2)
  }

  // Import history from JSON
  importHistory(jsonData: string): { imported: number; errors: string[] } {
    const errors: string[] = []
    let imported = 0

    try {
      const sessions: ImportSession[] = JSON.parse(jsonData, (key, value) => {
        if (key === 'timestamp') {
          return new Date(value)
        }
        return value
      })

      sessions.forEach(session => {
        try {
          // Validate session structure
          if (!session.id || !session.fileName || !session.timestamp) {
            errors.push(`Invalid session structure: ${session.id || 'unknown'}`)
            return
          }

          this.sessions.set(session.id, session)
          imported++
        } catch (error) {
          errors.push(`Failed to import session ${session.id}: ${error}`)
        }
      })

      this.saveHistory()
    } catch (error) {
      errors.push(`Failed to parse import history JSON: ${error}`)
    }

    return { imported, errors }
  }
}

// Rollback functionality
export class ImportRollbackManager {
  constructor(private historyManager: ImportHistoryManager) {}

  async rollbackImport(
    sessionId: string,
    deleteTestCases: (testCaseIds: string[]) => Promise<boolean>,
    updateSuiteStatistics?: (suiteId: string, stats: any) => Promise<boolean>
  ): Promise<{ success: boolean; message: string; details?: any }> {
    const session = this.historyManager.getSession(sessionId)
    
    if (!session) {
      return { success: false, message: 'Import session not found' }
    }

    if (!session.canRollback || session.status === 'rolled_back') {
      return { success: false, message: 'Import cannot be rolled back' }
    }

    if (!session.rollbackData) {
      return { success: false, message: 'No rollback data available' }
    }

    try {
      // Delete imported test cases
      const deleteSuccess = await deleteTestCases(session.importedTestCases)
      if (!deleteSuccess) {
        return { success: false, message: 'Failed to delete imported test cases' }
      }

      // Restore suite statistics if applicable
      if (session.rollbackData.suiteStatistics && updateSuiteStatistics) {
        const statsSuccess = await updateSuiteStatistics(
          session.rollbackData.suiteStatistics.suiteId,
          session.rollbackData.suiteStatistics.originalStats
        )
        if (!statsSuccess) {
          return { 
            success: false, 
            message: 'Test cases deleted but failed to restore suite statistics' 
          }
        }
      }

      // Mark session as rolled back
      this.historyManager.updateSessionStatus(sessionId, 'rolled_back')

      return {
        success: true,
        message: `Successfully rolled back import of ${session.importedTestCases.length} test cases`,
        details: {
          deletedTestCases: session.importedTestCases.length,
          restoredSuiteStats: !!session.rollbackData.suiteStatistics
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  canRollback(sessionId: string): boolean {
    const session = this.historyManager.getSession(sessionId)
    return !!(session?.canRollback && session.status !== 'rolled_back')
  }

  getRollbackPreview(sessionId: string): {
    testCasesToDelete: number
    suiteStatsToRestore: boolean
    estimatedTime: number
  } | null {
    const session = this.historyManager.getSession(sessionId)
    if (!session?.rollbackData) return null

    return {
      testCasesToDelete: session.importedTestCases.length,
      suiteStatsToRestore: !!session.rollbackData.suiteStatistics,
      estimatedTime: Math.max(session.importedTestCases.length * 0.1, 1) // Rough estimate in seconds
    }
  }
}

// Global instances
export const importHistoryManager = new ImportHistoryManager()
export const importRollbackManager = new ImportRollbackManager(importHistoryManager)
