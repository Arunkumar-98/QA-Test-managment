import React from 'react'
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/lib/loading-states'

interface LoadingIndicatorProps {
  state?: LoadingState
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'inline' | 'overlay' | 'skeleton'
  showProgress?: boolean
  showMessage?: boolean
  className?: string
  children?: React.ReactNode
}

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  progress?: number
  onRetry?: () => void
  className?: string
}

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  state,
  size = 'md',
  variant = 'default',
  showProgress = true,
  showMessage = true,
  className,
  children
}) => {
  if (!state) return null

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const getStatusIcon = () => {
    switch (state.status) {
      case 'loading':
        return <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
      case 'success':
        return <CheckCircle className={cn(sizeClasses[size], 'text-green-500')} />
      case 'error':
        return <XCircle className={cn(sizeClasses[size], 'text-red-500')} />
      default:
        return null
    }
  }

  const getProgressBar = () => {
    if (!showProgress || state.status !== 'loading' || state.progress === undefined) return null

    return (
      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${state.progress}%` }}
        />
      </div>
    )
  }

  const getRetryButton = () => {
    if (state.status !== 'error' || !state.retryCount || !state.maxRetries || state.retryCount >= state.maxRetries) {
      return null
    }

    return (
      <button
        onClick={() => {
          // This would need to be connected to the loading state manager
          console.log('Retry clicked for:', state.id)
        }}
        className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry ({state.maxRetries - state.retryCount} left)
      </button>
    )
  }

  if (variant === 'overlay') {
    return (
      <LoadingOverlay
        isVisible={state.status === 'loading'}
        message={showMessage ? state.message : undefined}
        progress={showProgress ? state.progress : undefined}
        className={className}
      />
    )
  }

  if (variant === 'skeleton') {
    return <LoadingSkeleton lines={3} className={className} />
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {getStatusIcon()}
      <div className="flex-1 min-w-0">
        {showMessage && state.message && (
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {state.message}
          </p>
        )}
        {getProgressBar()}
        {getRetryButton()}
      </div>
    </div>
  )
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message,
  progress,
  onRetry,
  className
}) => {
  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50',
      className
    )}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {message || 'Loading...'}
            </p>
            {progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse',
            i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : 'w-5/6'
          )}
        />
      ))}
    </div>
  )
}

// Global loading indicator that shows when any loading is active
export const GlobalLoadingIndicator: React.FC = () => {
  const [loadingStates, setLoadingStates] = React.useState<LoadingState[]>([])

  React.useEffect(() => {
    // This would need to be connected to the loading state manager
    // For now, we'll use a simple state
    const interval = setInterval(() => {
      // Simulate checking for loading states
      setLoadingStates([])
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const globalLoadingStates = loadingStates.filter(state => 
    state.type === 'global' && state.status === 'loading'
  )

  if (globalLoadingStates.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {globalLoadingStates[0]?.message || 'Loading...'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {globalLoadingStates.length} operation{globalLoadingStates.length > 1 ? 's' : ''} in progress
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline loading indicator for buttons and small elements
export const InlineLoadingIndicator: React.FC<{
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
}> = ({ isLoading, children, loadingText, className }) => {
  if (!isLoading) return <>{children}</>

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{loadingText || 'Loading...'}</span>
    </div>
  )
}

// Progress indicator for long-running operations
export const ProgressIndicator: React.FC<{
  progress: number
  message?: string
  showPercentage?: boolean
  className?: string
}> = ({ progress, message, showPercentage = true, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {message && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  )
}

// Error state indicator
export const ErrorIndicator: React.FC<{
  error: string
  onRetry?: () => void
  className?: string
}> = ({ error, onRetry, className }) => {
  return (
    <div className={cn('flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg', className)}>
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
