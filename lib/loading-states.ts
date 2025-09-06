// Granular Loading States Management System
// Provides detailed loading states for better user experience
import { useState, useEffect } from 'react'

export interface LoadingState {
  id: string
  type: 'global' | 'component' | 'action' | 'data' | 'background'
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
  progress?: number // 0-100
  startTime: Date
  endTime?: Date
  duration?: number // in milliseconds
  retryCount?: number
  maxRetries?: number
  context?: any
}

export interface LoadingContext {
  component?: string
  action?: string
  dataType?: string
  projectId?: string
  userId?: string
  additionalData?: any
}

// Loading state types for different operations
export const LOADING_TYPES = {
  // Global loading states
  APP_INITIALIZATION: 'app-initialization',
  AUTH_LOADING: 'auth-loading',
  PROJECT_SWITCH: 'project-switch',
  
  // Component loading states
  TABLE_LOADING: 'table-loading',
  DIALOG_LOADING: 'dialog-loading',
  DROPDOWN_LOADING: 'dropdown-loading',
  FORM_LOADING: 'form-loading',
  
  // Action loading states
  CREATE_TEST_CASE: 'create-test-case',
  UPDATE_TEST_CASE: 'update-test-case',
  DELETE_TEST_CASE: 'delete-test-case',
  BULK_DELETE: 'bulk-delete',
  BULK_UPDATE: 'bulk-update',
  IMPORT_DATA: 'import-data',
  EXPORT_DATA: 'export-data',
  CREATE_PROJECT: 'create-project',
  UPDATE_PROJECT: 'update-project',
  DELETE_PROJECT: 'delete-project',
  CREATE_TEST_SUITE: 'create-test-suite',
  UPDATE_TEST_SUITE: 'update-test-suite',
  DELETE_TEST_SUITE: 'delete-test-suite',
  CREATE_CUSTOM_COLUMN: 'create-custom-column',
  UPDATE_CUSTOM_COLUMN: 'update-custom-column',
  DELETE_CUSTOM_COLUMN: 'delete-custom-column',
  SHARE_PROJECT: 'share-project',
  SHARE_TEST_SUITE: 'share-test-suite',
  ADD_COMMENT: 'add-comment',
  UPDATE_COMMENT: 'update-comment',
  DELETE_COMMENT: 'delete-comment',
  ADD_LINK: 'add-link',
  ADD_DOCUMENT: 'add-document',
  DELETE_LINK: 'delete-link',
  DELETE_DOCUMENT: 'delete-document',
  
  // Data loading states
  LOAD_TEST_CASES: 'load-test-cases',
  LOAD_TEST_SUITES: 'load-test-suites',
  LOAD_PROJECTS: 'load-projects',
  LOAD_CUSTOM_COLUMNS: 'load-custom-columns',
  LOAD_COMMENTS: 'load-comments',
  LOAD_STATUS_HISTORY: 'load-status-history',
  LOAD_LINKS: 'load-links',
  LOAD_DOCUMENTS: 'load-documents',
  LOAD_PROJECT_MEMBERS: 'load-project-members',
  
  // Background loading states
  SYNC_DATA: 'sync-data',
  VALIDATE_DATA: 'validate-data',
  PROCESS_IMPORT: 'process-import',
  GENERATE_REPORT: 'generate-report',
  BACKUP_DATA: 'backup-data'
} as const

// Loading state manager class
export class LoadingStateManager {
  private static instance: LoadingStateManager
  private loadingStates: Map<string, LoadingState> = new Map()
  private listeners: Set<(states: LoadingState[]) => void> = new Set()

  static getInstance(): LoadingStateManager {
    if (!LoadingStateManager.instance) {
      LoadingStateManager.instance = new LoadingStateManager()
    }
    return LoadingStateManager.instance
  }

  // Start a loading state
  startLoading(
    type: keyof typeof LOADING_TYPES,
    context?: LoadingContext,
    message?: string
  ): string {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const loadingState: LoadingState = {
      id,
      type: this.getLoadingType(type),
      status: 'loading',
      message: message || this.getDefaultMessage(type),
      progress: 0,
      startTime: new Date(),
      retryCount: 0,
      maxRetries: this.getMaxRetries(type),
      context
    }

    this.loadingStates.set(id, loadingState)
    this.notifyListeners()
    
    return id
  }

  // Update loading progress
  updateProgress(id: string, progress: number, message?: string): void {
    const state = this.loadingStates.get(id)
    if (state) {
      state.progress = Math.min(100, Math.max(0, progress))
      if (message) {
        state.message = message
      }
      this.notifyListeners()
    }
  }

  // Complete loading successfully
  completeLoading(id: string, message?: string): void {
    const state = this.loadingStates.get(id)
    if (state) {
      state.status = 'success'
      state.progress = 100
      state.endTime = new Date()
      state.duration = state.endTime.getTime() - state.startTime.getTime()
      if (message) {
        state.message = message
      }
      this.notifyListeners()
      
      // Auto-remove success states after 3 seconds
      setTimeout(() => {
        this.removeLoadingState(id)
      }, 3000)
    }
  }

  // Complete loading with error
  completeLoadingWithError(id: string, error: any, message?: string): void {
    const state = this.loadingStates.get(id)
    if (state) {
      state.status = 'error'
      state.endTime = new Date()
      state.duration = state.endTime.getTime() - state.startTime.getTime()
      if (message) {
        state.message = message
      }
      state.context = { ...state.context, error }
      this.notifyListeners()
      
      // Auto-remove error states after 10 seconds
      setTimeout(() => {
        this.removeLoadingState(id)
      }, 10000)
    }
  }

  // Retry loading
  retryLoading(id: string): void {
    const state = this.loadingStates.get(id)
    if (state && state.retryCount && state.maxRetries && state.retryCount < state.maxRetries) {
      state.retryCount++
      state.status = 'loading'
      state.progress = 0
      state.startTime = new Date()
      state.endTime = undefined
      state.duration = undefined
      this.notifyListeners()
    }
  }

  // Remove loading state
  removeLoadingState(id: string): void {
    this.loadingStates.delete(id)
    this.notifyListeners()
  }

  // Get loading state by ID
  getLoadingState(id: string): LoadingState | undefined {
    return this.loadingStates.get(id)
  }

  // Get all loading states
  getAllLoadingStates(): LoadingState[] {
    return Array.from(this.loadingStates.values())
  }

  // Get loading states by type
  getLoadingStatesByType(type: keyof typeof LOADING_TYPES): LoadingState[] {
    return this.getAllLoadingStates().filter(state => 
      state.id.startsWith(type)
    )
  }

  // Get active loading states
  getActiveLoadingStates(): LoadingState[] {
    return this.getAllLoadingStates().filter(state => 
      state.status === 'loading'
    )
  }

  // Check if any loading is active
  isAnyLoading(): boolean {
    return this.getActiveLoadingStates().length > 0
  }

  // Check if specific type is loading
  isTypeLoading(type: keyof typeof LOADING_TYPES): boolean {
    return this.getLoadingStatesByType(type).some(state => 
      state.status === 'loading'
    )
  }

  // Subscribe to loading state changes
  subscribe(listener: (states: LoadingState[]) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Notify all listeners
  private notifyListeners(): void {
    const states = this.getAllLoadingStates()
    this.listeners.forEach(listener => {
      try {
        listener(states)
      } catch (error) {
        console.error('Error in loading state listener:', error)
      }
    })
  }

  // Get loading type from string
  private getLoadingType(type: keyof typeof LOADING_TYPES): LoadingState['type'] {
    if (type.includes('GLOBAL') || type.includes('AUTH') || type.includes('PROJECT_SWITCH')) {
      return 'global'
    }
    if (type.includes('LOAD_')) {
      return 'data'
    }
    if (type.includes('SYNC') || type.includes('PROCESS') || type.includes('GENERATE') || type.includes('BACKUP')) {
      return 'background'
    }
    if (type.includes('CREATE') || type.includes('UPDATE') || type.includes('DELETE') || type.includes('BULK') || type.includes('IMPORT') || type.includes('EXPORT') || type.includes('SHARE') || type.includes('ADD')) {
      return 'action'
    }
    return 'component'
  }

  // Get default message for loading type
  private getDefaultMessage(type: keyof typeof LOADING_TYPES): string {
    const messages: Record<keyof typeof LOADING_TYPES, string> = {
      APP_INITIALIZATION: 'Initializing application...',
      AUTH_LOADING: 'Loading authentication...',
      PROJECT_SWITCH: 'Switching project...',
      TABLE_LOADING: 'Loading table data...',
      DIALOG_LOADING: 'Loading dialog...',
      DROPDOWN_LOADING: 'Loading options...',
      FORM_LOADING: 'Loading form...',
      CREATE_TEST_CASE: 'Creating test case...',
      UPDATE_TEST_CASE: 'Updating test case...',
      DELETE_TEST_CASE: 'Deleting test case...',
      BULK_DELETE: 'Deleting selected items...',
      BULK_UPDATE: 'Updating selected items...',
      IMPORT_DATA: 'Importing data...',
      EXPORT_DATA: 'Exporting data...',
      CREATE_PROJECT: 'Creating project...',
      UPDATE_PROJECT: 'Updating project...',
      DELETE_PROJECT: 'Deleting project...',
      CREATE_TEST_SUITE: 'Creating test suite...',
      UPDATE_TEST_SUITE: 'Updating test suite...',
      DELETE_TEST_SUITE: 'Deleting test suite...',
      CREATE_CUSTOM_COLUMN: 'Creating custom column...',
      UPDATE_CUSTOM_COLUMN: 'Updating custom column...',
      DELETE_CUSTOM_COLUMN: 'Deleting custom column...',
      SHARE_PROJECT: 'Sharing project...',
      SHARE_TEST_SUITE: 'Sharing test suite...',
      ADD_COMMENT: 'Adding comment...',
      UPDATE_COMMENT: 'Updating comment...',
      DELETE_COMMENT: 'Deleting comment...',
      ADD_LINK: 'Adding link...',
      ADD_DOCUMENT: 'Adding document...',
      DELETE_LINK: 'Deleting link...',
      DELETE_DOCUMENT: 'Deleting document...',
      LOAD_TEST_CASES: 'Loading test cases...',
      LOAD_TEST_SUITES: 'Loading test suites...',
      LOAD_PROJECTS: 'Loading projects...',
      LOAD_CUSTOM_COLUMNS: 'Loading custom columns...',
      LOAD_COMMENTS: 'Loading comments...',
      LOAD_STATUS_HISTORY: 'Loading status history...',
      LOAD_LINKS: 'Loading links...',
      LOAD_DOCUMENTS: 'Loading documents...',
      LOAD_PROJECT_MEMBERS: 'Loading project members...',
      SYNC_DATA: 'Synchronizing data...',
      VALIDATE_DATA: 'Validating data...',
      PROCESS_IMPORT: 'Processing import...',
      GENERATE_REPORT: 'Generating report...',
      BACKUP_DATA: 'Backing up data...'
    }
    
    return messages[type] || 'Loading...'
  }

  // Get max retries for loading type
  private getMaxRetries(type: keyof typeof LOADING_TYPES): number {
    const retryableTypes: (keyof typeof LOADING_TYPES)[] = [
      'LOAD_TEST_CASES',
      'LOAD_TEST_SUITES',
      'LOAD_PROJECTS',
      'LOAD_CUSTOM_COLUMNS',
      'LOAD_COMMENTS',
      'LOAD_STATUS_HISTORY',
      'LOAD_LINKS',
      'LOAD_DOCUMENTS',
      'LOAD_PROJECT_MEMBERS',
      'SYNC_DATA',
      'VALIDATE_DATA'
    ]
    
    return retryableTypes.includes(type) ? 3 : 0
  }

  // Clear all loading states
  clearAll(): void {
    this.loadingStates.clear()
    this.notifyListeners()
  }

  // Get loading statistics
  getLoadingStats(): {
    total: number
    loading: number
    success: number
    error: number
    byType: Record<string, number>
    averageDuration: number
  } {
    const states = this.getAllLoadingStates()
    const byType: Record<string, number> = {}
    let totalDuration = 0
    let completedCount = 0

    states.forEach(state => {
      byType[state.type] = (byType[state.type] || 0) + 1
      if (state.duration) {
        totalDuration += state.duration
        completedCount++
      }
    })

    return {
      total: states.length,
      loading: states.filter(s => s.status === 'loading').length,
      success: states.filter(s => s.status === 'success').length,
      error: states.filter(s => s.status === 'error').length,
      byType,
      averageDuration: completedCount > 0 ? totalDuration / completedCount : 0
    }
  }
}

// Export singleton instance
export const loadingStateManager = LoadingStateManager.getInstance()

// React hook for loading states
export const useLoadingState = (type?: keyof typeof LOADING_TYPES) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = loadingStateManager.subscribe((states) => {
      setLoadingStates(states)
      if (type) {
        setIsLoading(loadingStateManager.isTypeLoading(type))
      } else {
        setIsLoading(loadingStateManager.isAnyLoading())
      }
    })

    return unsubscribe
  }, [type])

  return {
    loadingStates,
    isLoading,
    startLoading: (context?: LoadingContext, message?: string) => 
      type ? loadingStateManager.startLoading(type, context, message) : null,
    updateProgress: loadingStateManager.updateProgress.bind(loadingStateManager),
    completeLoading: loadingStateManager.completeLoading.bind(loadingStateManager),
    completeLoadingWithError: loadingStateManager.completeLoadingWithError.bind(loadingStateManager),
    retryLoading: loadingStateManager.retryLoading.bind(loadingStateManager),
    removeLoadingState: loadingStateManager.removeLoadingState.bind(loadingStateManager)
  }
}

// Utility functions for common loading patterns
export const withLoading = async <T>(
  type: keyof typeof LOADING_TYPES,
  operation: () => Promise<T>,
  context?: LoadingContext,
  message?: string
): Promise<T> => {
  const loadingId = loadingStateManager.startLoading(type, context, message)
  
  try {
    const result = await operation()
    loadingStateManager.completeLoading(loadingId, 'Operation completed successfully')
    return result
  } catch (error) {
    loadingStateManager.completeLoadingWithError(loadingId, error, 'Operation failed')
    throw error
  }
}

export const withProgress = async <T>(
  type: keyof typeof LOADING_TYPES,
  operation: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
  context?: LoadingContext,
  message?: string
): Promise<T> => {
  const loadingId = loadingStateManager.startLoading(type, context, message)
  
  const updateProgress = (progress: number, message?: string) => {
    loadingStateManager.updateProgress(loadingId, progress, message)
  }
  
  try {
    const result = await operation(updateProgress)
    loadingStateManager.completeLoading(loadingId, 'Operation completed successfully')
    return result
  } catch (error) {
    loadingStateManager.completeLoadingWithError(loadingId, error, 'Operation failed')
    throw error
  }
}
