import { useState, useEffect } from 'react'
import { loadingStateManager, LoadingState, LoadingContext, LOADING_TYPES } from '@/lib/loading-states'

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

// Hook for specific loading types
export const useTestCasesLoading = () => useLoadingState(LOADING_TYPES.LOAD_TEST_CASES)
export const useProjectsLoading = () => useLoadingState(LOADING_TYPES.LOAD_PROJECTS)
export const useTestSuitesLoading = () => useLoadingState(LOADING_TYPES.LOAD_TEST_SUITES)
export const useCustomColumnsLoading = () => useLoadingState(LOADING_TYPES.LOAD_CUSTOM_COLUMNS)
export const useCommentsLoading = () => useLoadingState(LOADING_TYPES.LOAD_COMMENTS)
export const useLinksLoading = () => useLoadingState(LOADING_TYPES.LOAD_LINKS)
export const useDocumentsLoading = () => useLoadingState(LOADING_TYPES.LOAD_DOCUMENTS)

// Hook for action loading states
export const useCreateTestCaseLoading = () => useLoadingState(LOADING_TYPES.CREATE_TEST_CASE)
export const useUpdateTestCaseLoading = () => useLoadingState(LOADING_TYPES.UPDATE_TEST_CASE)
export const useDeleteTestCaseLoading = () => useLoadingState(LOADING_TYPES.DELETE_TEST_CASE)
export const useBulkDeleteLoading = () => useLoadingState(LOADING_TYPES.BULK_DELETE)
export const useBulkUpdateLoading = () => useLoadingState(LOADING_TYPES.BULK_UPDATE)
export const useImportDataLoading = () => useLoadingState(LOADING_TYPES.IMPORT_DATA)
export const useExportDataLoading = () => useLoadingState(LOADING_TYPES.EXPORT_DATA)

// Hook for project operations
export const useCreateProjectLoading = () => useLoadingState(LOADING_TYPES.CREATE_PROJECT)
export const useUpdateProjectLoading = () => useLoadingState(LOADING_TYPES.UPDATE_PROJECT)
export const useDeleteProjectLoading = () => useLoadingState(LOADING_TYPES.DELETE_PROJECT)
export const useProjectSwitchLoading = () => useLoadingState(LOADING_TYPES.PROJECT_SWITCH)

// Hook for test suite operations
export const useCreateTestSuiteLoading = () => useLoadingState(LOADING_TYPES.CREATE_TEST_SUITE)
export const useUpdateTestSuiteLoading = () => useLoadingState(LOADING_TYPES.UPDATE_TEST_SUITE)
export const useDeleteTestSuiteLoading = () => useLoadingState(LOADING_TYPES.DELETE_TEST_SUITE)

// Hook for custom column operations
export const useCreateCustomColumnLoading = () => useLoadingState(LOADING_TYPES.CREATE_CUSTOM_COLUMN)
export const useUpdateCustomColumnLoading = () => useLoadingState(LOADING_TYPES.UPDATE_CUSTOM_COLUMN)
export const useDeleteCustomColumnLoading = () => useLoadingState(LOADING_TYPES.DELETE_CUSTOM_COLUMN)

// Hook for sharing operations
export const useShareProjectLoading = () => useLoadingState(LOADING_TYPES.SHARE_PROJECT)
export const useShareTestSuiteLoading = () => useLoadingState(LOADING_TYPES.SHARE_TEST_SUITE)

// Hook for comment operations
export const useAddCommentLoading = () => useLoadingState(LOADING_TYPES.ADD_COMMENT)
export const useUpdateCommentLoading = () => useLoadingState(LOADING_TYPES.UPDATE_COMMENT)
export const useDeleteCommentLoading = () => useLoadingState(LOADING_TYPES.DELETE_COMMENT)

// Hook for resource operations
export const useAddLinkLoading = () => useLoadingState(LOADING_TYPES.ADD_LINK)
export const useAddDocumentLoading = () => useLoadingState(LOADING_TYPES.ADD_DOCUMENT)
export const useDeleteLinkLoading = () => useLoadingState(LOADING_TYPES.DELETE_LINK)
export const useDeleteDocumentLoading = () => useLoadingState(LOADING_TYPES.DELETE_DOCUMENT)

// Hook for global loading states
export const useGlobalLoading = () => useLoadingState(LOADING_TYPES.APP_INITIALIZATION)
export const useAuthLoading = () => useLoadingState(LOADING_TYPES.AUTH_LOADING)

// Hook for background operations
export const useSyncDataLoading = () => useLoadingState(LOADING_TYPES.SYNC_DATA)
export const useValidateDataLoading = () => useLoadingState(LOADING_TYPES.VALIDATE_DATA)
export const useProcessImportLoading = () => useLoadingState(LOADING_TYPES.PROCESS_IMPORT)
export const useGenerateReportLoading = () => useLoadingState(LOADING_TYPES.GENERATE_REPORT)
export const useBackupDataLoading = () => useLoadingState(LOADING_TYPES.BACKUP_DATA)
