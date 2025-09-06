import { TestCase, TestCaseStatus, TestCasePriority, TestCaseCategory } from '@/types/qa-types'

export interface ValidationRule {
  field: keyof TestCase
  required: boolean
  validator?: (value: any) => boolean
  message?: string
  suggestions?: string[]
}

export interface ValidationError {
  row: number
  field: string
  value: any
  message: string
  severity: 'error' | 'warning' | 'info'
  suggestions?: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  info: ValidationError[]
  summary: {
    totalRows: number
    validRows: number
    errorRows: number
    warningRows: number
  }
}

// Default validation rules for test cases
export const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'testCase',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    message: 'Test case name is required and cannot be empty',
    suggestions: ['Provide a descriptive test case name', 'Use format: TC001 - Login Test']
  },
  {
    field: 'description',
    required: false,
    validator: (value) => !value || (typeof value === 'string' && value.length <= 1000),
    message: 'Description is too long (maximum 1000 characters)',
    suggestions: ['Keep descriptions concise and focused', 'Move detailed steps to "Steps to Reproduce"']
  },
  {
    field: 'status',
    required: false,
    validator: (value) => !value || ['Pass', 'Fail', 'Blocked', 'In Progress', 'Not Executed', 'Other'].includes(value),
    message: 'Invalid status value',
    suggestions: ['Valid statuses: Pass, Fail, Blocked, In Progress, Not Executed, Other']
  },
  {
    field: 'priority',
    required: false,
    validator: (value) => !value || ['P0 (Blocker)', 'P1 (High)', 'P2 (Medium)', 'P3 (Low)', 'Other'].includes(value),
    message: 'Invalid priority value',
    suggestions: ['Valid priorities: P0 (Blocker), P1 (High), P2 (Medium), P3 (Low), Other']
  },
  {
    field: 'category',
    required: false,
    validator: (value) => !value || ['Recording', 'Transcription', 'Notifications', 'Calling', 'UI/UX', 'Other'].includes(value),
    message: 'Invalid category value',
    suggestions: ['Valid categories: Recording, Transcription, Notifications, Calling, UI/UX, Other']
  },
  {
    field: 'executionDate',
    required: false,
    validator: (value) => {
      if (!value) return true
      const date = new Date(value)
      return !isNaN(date.getTime())
    },
    message: 'Invalid date format',
    suggestions: ['Use format: YYYY-MM-DD or MM/DD/YYYY', 'Example: 2024-01-15 or 01/15/2024']
  },
  {
    field: 'environment',
    required: false,
    validator: (value) => !value || ['Android', 'iOS', 'Web', 'Backend', 'Other'].includes(value),
    message: 'Invalid environment value',
    suggestions: ['Valid environments: Android, iOS, Web, Backend, Other']
  },
  {
    field: 'platform',
    required: false,
    validator: (value) => !value || ['Android', 'iOS', 'Web', 'Cross-platform', 'Other'].includes(value),
    message: 'Invalid platform value',
    suggestions: ['Valid platforms: Android, iOS, Web, Cross-platform, Other']
  },
  {
    field: 'qaStatus',
    required: false,
    validator: (value) => !value || ['New', 'Reviewed', 'Approved', 'Rejected', 'Other'].includes(value),
    message: 'Invalid QA status value',
    suggestions: ['Valid QA statuses: New, Reviewed, Approved, Rejected, Other']
  },
  {
    field: 'devStatus',
    required: false,
    validator: (value) => !value || ['Open', 'In Progress', 'Fixed', 'Reopened', 'Closed', 'Other'].includes(value),
    message: 'Invalid dev status value',
    suggestions: ['Valid dev statuses: Open, In Progress, Fixed, Reopened, Closed, Other']
  },
  {
    field: 'bugStatus',
    required: false,
    validator: (value) => !value || ['New', 'In Progress', 'Verified', 'Closed', 'Reopened', 'Deferred', 'Other'].includes(value),
    message: 'Invalid bug status value',
    suggestions: ['Valid bug statuses: New, In Progress, Verified, Closed, Reopened, Deferred, Other']
  },
  {
    field: 'testType',
    required: false,
    validator: (value) => !value || ['Functional', 'Regression', 'Smoke', 'Performance', 'Security', 'Other'].includes(value),
    message: 'Invalid test type value',
    suggestions: ['Valid test types: Functional, Regression, Smoke, Performance, Security, Other']
  },
  {
    field: 'testLevel',
    required: false,
    validator: (value) => !value || ['Unit', 'Integration', 'System', 'UAT', 'Other'].includes(value),
    message: 'Invalid test level value',
    suggestions: ['Valid test levels: Unit, Integration, System, UAT, Other']
  },
  {
    field: 'defectSeverity',
    required: false,
    validator: (value) => !value || ['Critical', 'Major', 'Minor', 'Trivial', 'Other'].includes(value),
    message: 'Invalid defect severity value',
    suggestions: ['Valid defect severities: Critical, Major, Minor, Trivial, Other']
  },
  {
    field: 'defectPriority',
    required: false,
    validator: (value) => !value || ['P0', 'P1', 'P2', 'P3', 'Other'].includes(value),
    message: 'Invalid defect priority value',
    suggestions: ['Valid defect priorities: P0, P1, P2, P3, Other']
  }
]

// Validate email addresses
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate URLs
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Enhanced validation with data type detection
export const validateTestCaseData = (
  data: Partial<TestCase>[],
  rules: ValidationRule[] = DEFAULT_VALIDATION_RULES
): ValidationResult => {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const info: ValidationError[] = []

  data.forEach((row, index) => {
    rules.forEach(rule => {
      const value = row[rule.field]
      const isEmpty = value === null || value === undefined || value === ''

      // Check required fields
      if (rule.required && isEmpty) {
        errors.push({
          row: index + 1,
          field: rule.field as string,
          value,
          message: rule.message || `${rule.field} is required`,
          severity: 'error',
          suggestions: rule.suggestions
        })
        return
      }

      // Skip validation for empty optional fields
      if (!rule.required && isEmpty) return

      // Run custom validator
      if (rule.validator && !rule.validator(value)) {
        errors.push({
          row: index + 1,
          field: rule.field as string,
          value,
          message: rule.message || `Invalid value for ${rule.field}`,
          severity: 'error',
          suggestions: rule.suggestions
        })
      }

      // Additional field-specific validations
      if (rule.field === 'assignedTester' && value) {
        if (typeof value === 'string' && value.includes('@') && !isValidEmail(value)) {
          warnings.push({
            row: index + 1,
            field: 'assignedTester',
            value,
            message: 'Assigned tester looks like an email but format is invalid',
            severity: 'warning',
            suggestions: ['Check email format: user@domain.com']
          })
        }
      }

      // Check for URLs in text fields
      if (['description', 'notes', 'prerequisites'].includes(rule.field as string) && value) {
        const urlPattern = /https?:\/\/[^\s]+/g
        const urls = value.toString().match(urlPattern)
        if (urls) {
          urls.forEach(url => {
            if (!isValidUrl(url)) {
              warnings.push({
                row: index + 1,
                field: rule.field as string,
                value: url,
                message: 'Found potentially invalid URL',
                severity: 'warning',
                suggestions: ['Verify URL is accessible', 'Ensure proper format: https://example.com']
              })
            }
          })
        }
      }
    })

    // Check for common data quality issues
    const testCaseName = row.testCase?.toString() || ''
    
    // Check for generic/placeholder names (relaxed validation)
    const genericNames = ['untitled', 'new test', 'placeholder']
    if (genericNames.some(name => testCaseName.toLowerCase() === name)) {
      warnings.push({
        row: index + 1,
        field: 'testCase',
        value: testCaseName,
        message: 'Test case name appears to be generic or placeholder',
        severity: 'warning',
        suggestions: ['Use specific, descriptive test case names', 'Include the feature being tested']
      })
    }

    // Check for very short descriptions
    const description = row.description?.toString() || ''
    if (description.length > 0 && description.length < 10) {
      info.push({
        row: index + 1,
        field: 'description',
        value: description,
        message: 'Description is very short - consider adding more detail',
        severity: 'info',
        suggestions: ['Describe what the test verifies', 'Include context about the feature']
      })
    }

    // Check for missing expected results
    if (!row.expectedResult || row.expectedResult.toString().trim() === '') {
      warnings.push({
        row: index + 1,
        field: 'expectedResult',
        value: row.expectedResult,
        message: 'Expected result is missing - this is important for test execution',
        severity: 'warning',
        suggestions: ['Describe what should happen when test passes', 'Be specific about expected behavior']
      })
    }
  })

  const errorRows = new Set(errors.map(e => e.row)).size
  const warningRows = new Set(warnings.map(w => w.row)).size

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
    summary: {
      totalRows: data.length,
      validRows: data.length - errorRows,
      errorRows,
      warningRows
    }
  }
}

// Auto-fix common data issues
export const autoFixData = (
  data: Partial<TestCase>[],
  options: {
    trimWhitespace: boolean
    normalizeStatus: boolean
    normalizePriority: boolean
    normalizeCategory: boolean
    generateMissingFields: boolean
  } = {
    trimWhitespace: true,
    normalizeStatus: true,
    normalizePriority: true,
    normalizeCategory: true,
    generateMissingFields: false
  }
): { fixedData: Partial<TestCase>[], fixesApplied: string[] } => {
  const fixesApplied: string[] = []
  
  const fixedData = data.map((row, index) => {
    const fixed = { ...row }

    // Trim whitespace from string fields
    if (options.trimWhitespace) {
      Object.keys(fixed).forEach(key => {
        if (typeof fixed[key as keyof TestCase] === 'string') {
          const trimmed = (fixed[key as keyof TestCase] as string).trim()
          if (trimmed !== fixed[key as keyof TestCase]) {
            fixed[key as keyof TestCase] = trimmed as any
            fixesApplied.push(`Row ${index + 1}: Trimmed whitespace from ${key}`)
          }
        }
      })
    }

    // Normalize status values
    if (options.normalizeStatus && fixed.status) {
      const statusMap: Record<string, TestCaseStatus> = {
        'not started': 'Not Executed',
        'not_started': 'Not Executed',
        'notstarted': 'Not Executed',
        'pending': 'Not Executed',
        'in progress': 'In Progress',
        'in_progress': 'In Progress',
        'inprogress': 'In Progress',
        'running': 'In Progress',
        'passed': 'Pass',
        'pass': 'Pass',
        'success': 'Pass',
        'failed': 'Fail',
        'fail': 'Fail',
        'failure': 'Fail',
        'error': 'Fail',
        'blocked': 'Blocked',
        'block': 'Blocked',
        'stuck': 'Blocked'
      }

      const normalizedStatus = statusMap[fixed.status.toString().toLowerCase()]
      if (normalizedStatus && normalizedStatus !== fixed.status) {
        fixed.status = normalizedStatus
        fixesApplied.push(`Row ${index + 1}: Normalized status from "${row.status}" to "${normalizedStatus}"`)
      }
    }

    // Normalize priority values
    if (options.normalizePriority && fixed.priority) {
      const priorityMap: Record<string, TestCasePriority> = {
        'critical': 'P0 (Blocker)',
        'high': 'P1 (High)',
        'important': 'P1 (High)',
        'urgent': 'P0 (Blocker)',
        'medium': 'P2 (Medium)',
        'normal': 'P2 (Medium)',
        'standard': 'P2 (Medium)',
        'low': 'P3 (Low)',
        'minor': 'P3 (Low)',
        'trivial': 'P3 (Low)'
      }

      const normalizedPriority = priorityMap[fixed.priority.toString().toLowerCase()]
      if (normalizedPriority && normalizedPriority !== fixed.priority) {
        fixed.priority = normalizedPriority
        fixesApplied.push(`Row ${index + 1}: Normalized priority from "${row.priority}" to "${normalizedPriority}"`)
      }
    }

    // Generate missing fields
    if (options.generateMissingFields) {
      if (!fixed.status) {
        fixed.status = 'Not Executed'
        fixesApplied.push(`Row ${index + 1}: Set default status to "Pending"`)
      }
      
      if (!fixed.priority) {
        fixed.priority = 'P2 (Medium)'
        fixesApplied.push(`Row ${index + 1}: Set default priority to "Medium"`)
      }
      
      if (!fixed.category) {
        fixed.category = 'Other'
        fixesApplied.push(`Row ${index + 1}: Set default category to "Functional"`)
      }
    }

    return fixed
  })

  return { fixedData, fixesApplied }
}

// Generate validation summary report
export const generateValidationReport = (result: ValidationResult): string => {
  const { summary, errors, warnings, info } = result
  
  let report = `Validation Report\n`
  report += `================\n\n`
  report += `Total rows: ${summary.totalRows}\n`
  report += `Valid rows: ${summary.validRows}\n`
  report += `Rows with errors: ${summary.errorRows}\n`
  report += `Rows with warnings: ${summary.warningRows}\n\n`

  if (errors.length > 0) {
    report += `Errors (${errors.length}):\n`
    errors.forEach(error => {
      report += `- Row ${error.row}, ${error.field}: ${error.message}\n`
    })
    report += `\n`
  }

  if (warnings.length > 0) {
    report += `Warnings (${warnings.length}):\n`
    warnings.forEach(warning => {
      report += `- Row ${warning.row}, ${warning.field}: ${warning.message}\n`
    })
    report += `\n`
  }

  return report
}
