// Enhanced Error Handling System
// Provides detailed error messages and user-friendly notifications

export interface AppError {
  code: string
  message: string
  userMessage: string
  severity: 'error' | 'warning' | 'info'
  category: 'auth' | 'database' | 'network' | 'validation' | 'permission' | 'system'
  details?: any
  timestamp: Date
  userId?: string
  projectId?: string
}

export interface ErrorContext {
  userId?: string
  projectId?: string
  action?: string
  component?: string
  additionalData?: any
}

// Error codes and their user-friendly messages
export const ERROR_MESSAGES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: {
    message: 'Invalid email or password',
    userMessage: 'The email or password you entered is incorrect. Please try again.',
    severity: 'error' as const,
    category: 'auth' as const
  },
  AUTH_USER_NOT_FOUND: {
    message: 'User not found',
    userMessage: 'No account found with this email address. Please check your email or create a new account.',
    severity: 'error' as const,
    category: 'auth' as const
  },
  AUTH_EMAIL_NOT_CONFIRMED: {
    message: 'Email not confirmed',
    userMessage: 'Please check your email and click the confirmation link to activate your account.',
    severity: 'warning' as const,
    category: 'auth' as const
  },
  AUTH_SESSION_EXPIRED: {
    message: 'Session expired',
    userMessage: 'Your session has expired. Please log in again.',
    severity: 'warning' as const,
    category: 'auth' as const
  },
  AUTH_INSUFFICIENT_PERMISSIONS: {
    message: 'Insufficient permissions',
    userMessage: 'You don\'t have permission to perform this action. Please contact your administrator.',
    severity: 'error' as const,
    category: 'permission' as const
  },

  // Database Errors
  DB_CONNECTION_FAILED: {
    message: 'Database connection failed',
    userMessage: 'Unable to connect to the database. Please try again in a few moments.',
    severity: 'error' as const,
    category: 'database' as const
  },
  DB_QUERY_FAILED: {
    message: 'Database query failed',
    userMessage: 'An error occurred while retrieving data. Please try again.',
    severity: 'error' as const,
    category: 'database' as const
  },
  DB_INSERT_FAILED: {
    message: 'Failed to create record',
    userMessage: 'Unable to save your changes. Please check your input and try again.',
    severity: 'error' as const,
    category: 'database' as const
  },
  DB_UPDATE_FAILED: {
    message: 'Failed to update record',
    userMessage: 'Unable to update your changes. The record may have been modified by another user.',
    severity: 'error' as const,
    category: 'database' as const
  },
  DB_DELETE_FAILED: {
    message: 'Failed to delete record',
    userMessage: 'Unable to delete this item. It may be referenced by other records.',
    severity: 'error' as const,
    category: 'database' as const
  },
  DB_DUPLICATE_KEY: {
    message: 'Duplicate key violation',
    userMessage: 'This item already exists. Please use a different name or identifier.',
    severity: 'warning' as const,
    category: 'validation' as const
  },
  DB_FOREIGN_KEY_VIOLATION: {
    message: 'Foreign key constraint violation',
    userMessage: 'This operation cannot be completed because it would break data relationships.',
    severity: 'error' as const,
    category: 'database' as const
  },

  // Network Errors
  NETWORK_TIMEOUT: {
    message: 'Network timeout',
    userMessage: 'The request took too long to complete. Please check your internet connection and try again.',
    severity: 'error' as const,
    category: 'network' as const
  },
  NETWORK_OFFLINE: {
    message: 'Network offline',
    userMessage: 'You appear to be offline. Please check your internet connection and try again.',
    severity: 'error' as const,
    category: 'network' as const
  },
  NETWORK_SERVER_ERROR: {
    message: 'Server error',
    userMessage: 'The server encountered an error. Please try again later.',
    severity: 'error' as const,
    category: 'network' as const
  },
  NETWORK_RATE_LIMITED: {
    message: 'Rate limited',
    userMessage: 'Too many requests. Please wait a moment before trying again.',
    severity: 'warning' as const,
    category: 'network' as const
  },

  // Validation Errors
  VALIDATION_REQUIRED_FIELD: {
    message: 'Required field missing',
    userMessage: 'Please fill in all required fields.',
    severity: 'warning' as const,
    category: 'validation' as const
  },
  VALIDATION_INVALID_FORMAT: {
    message: 'Invalid format',
    userMessage: 'Please check the format of your input and try again.',
    severity: 'warning' as const,
    category: 'validation' as const
  },
  VALIDATION_TOO_LONG: {
    message: 'Input too long',
    userMessage: 'The input is too long. Please shorten it and try again.',
    severity: 'warning' as const,
    category: 'validation' as const
  },
  VALIDATION_INVALID_EMAIL: {
    message: 'Invalid email format',
    userMessage: 'Please enter a valid email address.',
    severity: 'warning' as const,
    category: 'validation' as const
  },
  VALIDATION_INVALID_URL: {
    message: 'Invalid URL format',
    userMessage: 'Please enter a valid URL starting with http:// or https://.',
    severity: 'warning' as const,
    category: 'validation' as const
  },

  // Project-specific Errors
  PROJECT_NOT_FOUND: {
    message: 'Project not found',
    userMessage: 'The requested project could not be found. It may have been deleted or you may not have access.',
    severity: 'error' as const,
    category: 'permission' as const
  },
  PROJECT_ACCESS_DENIED: {
    message: 'Project access denied',
    userMessage: 'You don\'t have permission to access this project. Please contact the project owner.',
    severity: 'error' as const,
    category: 'permission' as const
  },
  TEST_CASE_NOT_FOUND: {
    message: 'Test case not found',
    userMessage: 'The requested test case could not be found. It may have been deleted.',
    severity: 'error' as const,
    category: 'database' as const
  },
  TEST_SUITE_NOT_FOUND: {
    message: 'Test suite not found',
    userMessage: 'The requested test suite could not be found. It may have been deleted.',
    severity: 'error' as const,
    category: 'database' as const
  },

  // System Errors
  SYSTEM_UNKNOWN_ERROR: {
    message: 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    severity: 'error' as const,
    category: 'system' as const
  },
  SYSTEM_MAINTENANCE: {
    message: 'System maintenance',
    userMessage: 'The system is currently undergoing maintenance. Please try again later.',
    severity: 'info' as const,
    category: 'system' as const
  },
  SYSTEM_OVERLOADED: {
    message: 'System overloaded',
    userMessage: 'The system is currently experiencing high load. Please try again in a few moments.',
    severity: 'warning' as const,
    category: 'system' as const
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: AppError[] = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Create a standardized error object
  createError(
    code: keyof typeof ERROR_MESSAGES,
    context?: ErrorContext,
    originalError?: any
  ): AppError {
    const errorInfo = ERROR_MESSAGES[code]
    const error: AppError = {
      code,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      severity: errorInfo.severity,
      category: errorInfo.category,
      timestamp: new Date(),
      userId: context?.userId,
      projectId: context?.projectId,
      details: {
        originalError: originalError?.message || originalError,
        stack: originalError?.stack,
        context,
        action: context?.action,
        component: context?.component,
        additionalData: context?.additionalData
      }
    }

    // Log the error
    this.logError(error)
    
    return error
  }

  // Handle Supabase errors specifically
  handleSupabaseError(error: any, context?: ErrorContext): AppError {
    console.error('Supabase Error:', error)

    // Map Supabase error codes to our error codes
    const errorCode = this.mapSupabaseErrorCode(error.code, error.message)
    return this.createError(errorCode, context, error)
  }

  // Map Supabase error codes to our error codes
  private mapSupabaseErrorCode(code: string, message: string): keyof typeof ERROR_MESSAGES {
    switch (code) {
      case 'PGRST116':
        return 'DB_QUERY_FAILED'
      case '23505':
        return 'DB_DUPLICATE_KEY'
      case '23503':
        return 'DB_FOREIGN_KEY_VIOLATION'
      case '23502':
        return 'VALIDATION_REQUIRED_FIELD'
      case '22P02':
        return 'VALIDATION_INVALID_FORMAT'
      case '42703':
        return 'DB_QUERY_FAILED'
      case '42P01':
        return 'DB_QUERY_FAILED'
      default:
        if (message.includes('Invalid Refresh Token') || message.includes('JWT expired')) {
          return 'AUTH_SESSION_EXPIRED'
        }
        if (message.includes('Invalid API key')) {
          return 'AUTH_INSUFFICIENT_PERMISSIONS'
        }
        if (message.includes('duplicate key')) {
          return 'DB_DUPLICATE_KEY'
        }
        return 'SYSTEM_UNKNOWN_ERROR'
    }
  }

  // Handle network errors
  handleNetworkError(error: any, context?: ErrorContext): AppError {
    console.error('Network Error:', error)

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createError('NETWORK_OFFLINE', context, error)
    }

    if (error.status === 408 || error.status === 504) {
      return this.createError('NETWORK_TIMEOUT', context, error)
    }

    if (error.status === 429) {
      return this.createError('NETWORK_RATE_LIMITED', context, error)
    }

    if (error.status >= 500) {
      return this.createError('NETWORK_SERVER_ERROR', context, error)
    }

    return this.createError('NETWORK_OFFLINE', context, error)
  }

  // Handle validation errors
  handleValidationError(field: string, value: any, rule: string, context?: ErrorContext): AppError {
    const error: AppError = {
      code: 'VALIDATION_INVALID_FORMAT',
      message: `Validation failed for field ${field}: ${rule}`,
      userMessage: `Please check the ${field} field and try again.`,
      severity: 'warning',
      category: 'validation',
      timestamp: new Date(),
      userId: context?.userId,
      projectId: context?.projectId,
      details: {
        field,
        value,
        rule,
        context
      }
    }

    this.logError(error)
    return error
  }

  // Log error for debugging
  private logError(error: AppError): void {
    this.errorLog.push(error)
    
    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.severity.toUpperCase()}: ${error.code}`)
      console.log('Message:', error.message)
      console.log('User Message:', error.userMessage)
      console.log('Category:', error.category)
      console.log('Details:', error.details)
      console.log('Timestamp:', error.timestamp)
      console.groupEnd()
    }

    // In production, you might want to send to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // this.sendToErrorTracking(error)
    }
  }

  // Get error log for debugging
  getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = []
  }

  // Get error statistics
  getErrorStats(): {
    total: number
    bySeverity: Record<string, number>
    byCategory: Record<string, number>
    recentErrors: AppError[]
  } {
    const bySeverity: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    
    this.errorLog.forEach(error => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
      byCategory[error.category] = (byCategory[error.category] || 0) + 1
    })

    return {
      total: this.errorLog.length,
      bySeverity,
      byCategory,
      recentErrors: this.errorLog.slice(-10) // Last 10 errors
    }
  }

  // Utility function to check if error is retryable
  isRetryableError(error: AppError): boolean {
    const retryableCodes: (keyof typeof ERROR_MESSAGES)[] = [
      'NETWORK_TIMEOUT',
      'NETWORK_SERVER_ERROR',
      'DB_CONNECTION_FAILED',
      'SYSTEM_OVERLOADED'
    ]
    
    return retryableCodes.includes(error.code as keyof typeof ERROR_MESSAGES)
  }

  // Utility function to get retry delay for an error
  getRetryDelay(error: AppError): number {
    switch (error.code) {
      case 'NETWORK_RATE_LIMITED':
        return 5000 // 5 seconds
      case 'NETWORK_TIMEOUT':
        return 2000 // 2 seconds
      case 'SYSTEM_OVERLOADED':
        return 3000 // 3 seconds
      default:
        return 1000 // 1 second
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Utility functions for common error patterns
export const createAuthError = (code: keyof typeof ERROR_MESSAGES, context?: ErrorContext) => {
  return errorHandler.createError(code, context)
}

export const createDatabaseError = (code: keyof typeof ERROR_MESSAGES, context?: ErrorContext, originalError?: any) => {
  return errorHandler.createError(code, context, originalError)
}

export const createValidationError = (field: string, value: any, rule: string, context?: ErrorContext) => {
  return errorHandler.handleValidationError(field, value, rule, context)
}

export const createNetworkError = (error: any, context?: ErrorContext) => {
  return errorHandler.handleNetworkError(error, context)
}

export const createSupabaseError = (error: any, context?: ErrorContext) => {
  return errorHandler.handleSupabaseError(error, context)
}
