import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TestCase, Comment, TestSuite, TestCaseStatus, TestCasePriority, TestCaseCategory } from "@/types/qa-types"
import { ImportFormat } from "@/types/import-types"
import { parseHierarchicalTestCases } from "./hierarchical-parser"
import { STATUS_COLORS, PRIORITY_COLORS, COMMENT_TYPE_COLORS, COMMENT_TYPE_ICONS, AUTOMATION_STATUS_ICONS, AUTOMATION_STATUS_COLORS, STATUS_ICONS, PRIORITY_ICONS } from "./constants"
import { MessageSquare, AlertTriangle, HelpCircle, Lightbulb, Activity, CheckCircle, XCircle, Loader2, Circle, Clock, Ban, Minus, ArrowDown, AlertCircle } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const formatTimestamp = (timestamp: Date | string | null | undefined): string => {
  try {
    // Handle null, undefined, or invalid values
    if (!timestamp) {
      return 'N/A'
    }

    // Convert string to Date if needed
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (error) {
    console.error('Error formatting timestamp:', error, 'Timestamp:', timestamp)
    return 'Invalid Date'
  }
}

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Pass":
      return "default"
    case "Fail":
      return "destructive"
    case "In Progress":
      return "secondary"
    case "Blocked":
      return "outline"
    case "Not Executed":
      return "secondary"
    case "Other":
      return "outline"
    default:
      return "secondary"
  }
}

export const getStatusBadgeStyle = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS["Not Executed"]
}

export const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case "P0 (Blocker)":
      return "destructive"
    case "P1 (High)":
      return "destructive"
    case "P2 (Medium)":
      return "secondary"
    case "P3 (Low)":
      return "default"
    case "Other":
      return "outline"
    default:
      return "secondary"
  }
}

export const getPriorityBadgeStyle = (priority: string) => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS["P2 (Medium)"]
}

export const getStatusIcon = (status: string) => {
  const iconMap: Record<string, any> = {
    "Not Executed": Clock,
    Pass: CheckCircle,
    Fail: XCircle,
    "In Progress": Loader2,
    Blocked: Ban,
    Other: HelpCircle
  }
  return iconMap[status] || Clock
}

export const getPriorityIcon = (priority: string) => {
  const iconMap: Record<string, any> = {
    "P0 (Blocker)": AlertTriangle,
    "P1 (High)": AlertCircle,
    "P2 (Medium)": Minus,
    "P3 (Low)": ArrowDown,
    Other: HelpCircle
  }
  return iconMap[priority] || Minus
}

export const getCommentTypeIcon = (type: Comment["type"]) => {
  const iconMap = {
    general: MessageSquare,
    bug: AlertTriangle,
    question: HelpCircle,
    suggestion: Lightbulb,
    status_update: Activity
  }
  return iconMap[type]
}

export const getCommentTypeColor = (type: Comment["type"]) => {
  return COMMENT_TYPE_COLORS[type] || COMMENT_TYPE_COLORS.general
}

export const getAutomationStatusIcon = (testCase: TestCase) => {
  if (!testCase.automationScript) return Circle
  
  const status = testCase.automationScript.lastResult || 'not_run'
  const iconMap: Record<string, any> = {
    pass: CheckCircle,
    fail: XCircle,
    running: Loader2,
    not_run: Circle
  }
  return iconMap[status]
}

export const getAutomationStatusText = (testCase: TestCase) => {
  if (!testCase.automationScript) return "Not Automated"
  
  const status = testCase.automationScript.lastResult || 'not_run'
  const textMap: Record<string, string> = {
    pass: "Passed",
    fail: "Failed",
    running: "Running",
    not_run: "Not Run"
  }
  return textMap[status]
}

export const getAutomationStatusColor = (testCase: TestCase) => {
  if (!testCase.automationScript) return "text-gray-400"
  
  const status = testCase.automationScript.lastResult || 'not_run'
  return AUTOMATION_STATUS_COLORS[status as keyof typeof AUTOMATION_STATUS_COLORS] || AUTOMATION_STATUS_COLORS.not_run
}

export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }
  
  return mentions
}

export const getUnresolvedCommentsCount = (testCase: TestCase & { comments?: Comment[] }) => {
  return testCase.comments?.filter(comment => !comment.isResolved).length || 0
}

export const getStatusCount = (testCases: TestCase[], status: string) => {
  return testCases.filter(tc => tc.status === status).length
}

export const getSuiteStatistics = (suite: TestSuite) => {
  return {
    total: suite.totalTests || 0,
    passed: suite.passedTests || 0,
    failed: suite.failedTests || 0,
    pending: suite.pendingTests || 0,
    percentage: (suite.totalTests || 0) > 0 ? Math.round(((suite.passedTests || 0) / (suite.totalTests || 0)) * 100) : 0
  }
}

export const reassignTCIds = (cases: TestCase[]): TestCase[] => {
  return cases.map((testCase, index) => ({
    ...testCase,
    id: (index + 1).toString().padStart(3, '0')
  }))
}

export const getTableWidth = () => {
  const minWidth = 1800
  return Math.max(minWidth, window.innerWidth - 300)
}

export function formatTestSteps(steps: string): string {
  if (!steps) return ''
  
  // Split by common step patterns
  const stepPatterns = [
    /\d+\.\s*/g,  // "1. ", "2. ", etc.
    /\d+\)\s*/g,  // "1) ", "2) ", etc.
    /\d+\s+/g,    // "1 ", "2 ", etc.
    /\*\s*/g,     // "* " bullet points
    /-\s*/g,      // "- " dashes
  ]
  
  let formattedSteps = steps.trim()
  
  // Try to detect if steps are already properly formatted
  if (formattedSteps.includes('\n')) {
    // If already has line breaks, just ensure proper spacing
    return formattedSteps
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
  }
  
  // Try to split by step patterns
  for (const pattern of stepPatterns) {
    const matches = formattedSteps.match(pattern)
    if (matches && matches.length > 1) {
      // Found step pattern, split and format
      const parts = formattedSteps.split(pattern)
      const formatted = parts
        .map((part, index) => {
          if (index === 0) return part.trim()
          return `${index}. ${part.trim()}`
        })
        .filter(part => part.length > 0)
        .join('\n')
      
      if (formatted !== formattedSteps) {
        return formatted
      }
    }
  }
  
  // If no clear step pattern found, try to split by common separators
  const separators = [' and ', ' then ', ' next ', ' after ', ' finally ']
  for (const separator of separators) {
    if (formattedSteps.toLowerCase().includes(separator)) {
      const parts = formattedSteps.split(new RegExp(separator, 'gi'))
      const formatted = parts
        .map((part, index) => {
          if (index === 0) return part.trim()
          return `${index + 1}. ${part.trim()}`
        })
        .filter(part => part.length > 0)
        .join('\n')
      
      if (formatted !== formattedSteps) {
        return formatted
      }
    }
  }
  
  // If all else fails, return as is but ensure it's not too long
  if (formattedSteps.length > 200) {
    // Split by sentences or periods
    const sentences = formattedSteps.split(/\.\s+/)
    if (sentences.length > 1) {
      return sentences
        .map((sentence, index) => `${index + 1}. ${sentence.trim()}`)
        .join('\n')
    }
  }
  
  return formattedSteps
}

export function formatExpectedResult(result: string): string {
  if (!result) return ''
  
  // If already has line breaks, format nicely
  if (result.includes('\n')) {
    return result
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
  }
  
  // If it's a long single line, try to break it up
  if (result.length > 100) {
    // Try to break at natural points
    const breakPoints = [' and ', ' or ', ' but ', ' however ', ' also ']
    for (const point of breakPoints) {
      if (result.toLowerCase().includes(point)) {
        const parts = result.split(new RegExp(point, 'gi'))
        return parts
          .map(part => part.trim())
          .filter(part => part.length > 0)
          .join('\n')
      }
    }
  }
  
  return result
}

// Dynamic field mapping for import functionality
export const mapImportField = (row: any, fieldName: string, possibleNames: string[], defaultValue: any = ''): any => {
  // Try exact match first
  if (row[fieldName] !== undefined) {
    return row[fieldName]
  }
  
  // Try different case variations
  const lowerFieldName = fieldName.toLowerCase()
  const upperFieldName = fieldName.toUpperCase()
  const titleFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase()
  
  if (row[lowerFieldName] !== undefined) return row[lowerFieldName]
  if (row[upperFieldName] !== undefined) return row[upperFieldName]
  if (row[titleFieldName] !== undefined) return row[titleFieldName]
  
  // Try with spaces and underscores
  const spaceFieldName = fieldName.replace(/([A-Z])/g, ' $1').trim()
  const underscoreFieldName = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
  const dashFieldName = fieldName.replace(/([A-Z])/g, '-$1').toLowerCase()
  
  if (row[spaceFieldName] !== undefined) return row[spaceFieldName]
  if (row[underscoreFieldName] !== undefined) return row[underscoreFieldName]
  if (row[dashFieldName] !== undefined) return row[dashFieldName]
  
  // Try all possible names
  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name]
    if (row[name.toLowerCase()] !== undefined) return row[name.toLowerCase()]
    if (row[name.toUpperCase()] !== undefined) return row[name.toUpperCase()]
  }
  
  return defaultValue
}

// Parse CSV content - Legacy function, use parseCSVEnhanced for new code
export const parseCSV = (csvContent: string): any[] => {
  // Import the enhanced parser
  const { parseCSVEnhanced } = require('./enhanced-csv-parser')
  const result = parseCSVEnhanced(csvContent)
  return result.data
}

// Dynamic test case mapping from imported data
export const mapImportedDataToTestCase = (
  row: any, 
  index: number, 
  currentProjectId: string, 
  selectedSuiteId?: string
): Partial<TestCase> => {
  return {
    testCase: mapImportField(row, 'testCase', [
      'Test Case Title', 'Test Case', 'Test Case Name', 'Title', 'Name', 'Test Name', 'Test Title'
    ], `Imported Test Case ${index + 1}`),
    
    description: mapImportField(row, 'description', [
      'Description', 'Desc', 'Details', 'Summary', 'Functional Area'
    ], ''),
    
    expectedResult: mapImportField(row, 'expectedResult', [
      'Expected Result', 'Expected', 'Expected Outcome', 'Expected Output'
    ], ''),
    
    status: mapImportField(row, 'status', [
      'Status', 'Test Status', 'Execution Status'
    ], 'Not Executed') as TestCase['status'],
    
    priority: mapImportField(row, 'priority', [
      'Priority', 'Test Priority', 'Severity', 'Importance'
    ], 'P2 (Medium)') as TestCase['priority'],
    
    category: mapImportField(row, 'category', [
      'Category', 'Test Category', 'Type', 'Test Type', 'Functional Area'
    ], 'Other') as TestCase['category'],
    
    assignedTester: mapImportField(row, 'assignedTester', [
      'Assigned Tester', 'Assigned To', 'Tester', 'Owner', 'Assignee'
    ], ''),
    
    executionDate: mapImportField(row, 'executionDate', [
      'Execution Date', 'Date', 'Test Date', 'Run Date'
    ], ''),
    
    notes: mapImportField(row, 'notes', [
      'Notes', 'Comments', 'Remarks', 'Additional Info'
    ], ''),
    
    actualResult: mapImportField(row, 'actualResult', [
      'Actual Result', 'Actual', 'Result', 'Output'
    ], ''),
    
    environment: mapImportField(row, 'environment', [
      'Environment', 'Env', 'Test Environment'
    ], 'Other'),
    
    prerequisites: mapImportField(row, 'prerequisites', [
      'Prerequisites', 'Pre-requisites', 'Requirements', 'Setup'
    ], ''),
    
    platform: mapImportField(row, 'platform', [
      'Platform', 'OS', 'Operating System', 'Device'
    ], 'Other'),
    
    stepsToReproduce: mapImportField(row, 'stepsToReproduce', [
      'Steps to Reproduce', 'Test Steps', 'Steps', 'Procedure', 'Actions'
    ], ''),
    
    // New core columns
    qaStatus: mapImportField(row, 'qaStatus', [
      'QA Status', 'QA State', 'Quality Status'
    ], 'New') as TestCase['qaStatus'],
    
    devStatus: mapImportField(row, 'devStatus', [
      'Dev Status', 'Development Status', 'Developer Status'
    ], 'Open') as TestCase['devStatus'],
    
    assignedDev: mapImportField(row, 'assignedDev', [
      'Assigned Developer', 'Assigned Dev', 'Developer', 'Dev Assignee'
    ], ''),
    
    bugStatus: mapImportField(row, 'bugStatus', [
      'Bug Status', 'Defect Status', 'Issue Status'
    ], 'New') as TestCase['bugStatus'],
    
    testType: mapImportField(row, 'testType', [
      'Test Type', 'Testing Type', 'Type'
    ], 'Functional') as TestCase['testType'],
    
    testLevel: mapImportField(row, 'testLevel', [
      'Test Level', 'Level', 'Testing Level'
    ], 'System') as TestCase['testLevel'],
    
    defectSeverity: mapImportField(row, 'defectSeverity', [
      'Defect Severity', 'Severity', 'Bug Severity'
    ], 'Major') as TestCase['defectSeverity'],
    
    defectPriority: mapImportField(row, 'defectPriority', [
      'Defect Priority', 'Bug Priority', 'Issue Priority'
    ], 'P2') as TestCase['defectPriority'],
    
    estimatedTime: parseInt(mapImportField(row, 'estimatedTime', [
      'Estimated Time', 'Estimate', 'Time Estimate', 'Est Time'
    ], '0')) || 0,
    
    actualTime: parseInt(mapImportField(row, 'actualTime', [
      'Actual Time', 'Time Spent', 'Duration', 'Elapsed Time'
    ], '0')) || 0,
    
    testData: mapImportField(row, 'testData', [
      'Test Data', 'Data', 'Test Input', 'Input Data'
    ], ''),
    
    attachments: mapImportField(row, 'attachments', [
      'Attachments', 'Files', 'Documents'
    ], '').split(',').filter(Boolean) || [],
    
    tags: mapImportField(row, 'tags', [
      'Tags', 'Labels', 'Keywords'
    ], '').split(',').filter(Boolean) || [],
    
    reviewer: mapImportField(row, 'reviewer', [
      'Reviewer', 'Reviewed By', 'Review Owner'
    ], ''),
    
    reviewDate: mapImportField(row, 'reviewDate', [
      'Review Date', 'Reviewed Date', 'Review Time'
    ], ''),
    
    reviewNotes: mapImportField(row, 'reviewNotes', [
      'Review Notes', 'Review Comments', 'Review Feedback'
    ], ''),
    
    lastModifiedBy: mapImportField(row, 'lastModifiedBy', [
      'Last Modified By', 'Modified By', 'Changed By'
    ], 'Import System'),
    
    projectId: currentProjectId,
    suiteId: selectedSuiteId || undefined
  }
}

// Normalize status values from various formats
export const normalizeStatus = (status: string): TestCaseStatus => {
  const statusMap: { [key: string]: TestCaseStatus } = {
    'not started': 'Not Executed',
    'notstarted': 'Not Executed',
    'not_started': 'Not Executed',
    'pending': 'Not Executed',
    'not executed': 'Not Executed',
    'notexecuted': 'Not Executed',
    'not_executed': 'Not Executed',
    'in progress': 'In Progress',
    'inprogress': 'In Progress',
    'in_progress': 'In Progress',
    'running': 'In Progress',
    'pass': 'Pass',
    'passed': 'Pass',
    'fail': 'Fail',
    'failed': 'Fail',
    'blocked': 'Blocked',
    'block': 'Blocked'
  }
  
  const normalized = statusMap[status.toLowerCase()] || status
  return normalized as TestCaseStatus
}

// Normalize priority values from various formats
export const normalizePriority = (priority: string): TestCasePriority => {
  const priorityMap: { [key: string]: TestCasePriority } = {
    'critical': 'P0 (Blocker)',
    'urgent': 'P0 (Blocker)',
    'blocker': 'P0 (Blocker)',
    'p0': 'P0 (Blocker)',
    'high': 'P1 (High)',
    'p1': 'P1 (High)',
    'medium': 'P2 (Medium)',
    'normal': 'P2 (Medium)',
    'p2': 'P2 (Medium)',
    'low': 'P3 (Low)',
    'minor': 'P3 (Low)',
    'p3': 'P3 (Low)'
  }
  
  const normalized = priorityMap[priority.toLowerCase()] || priority
  return normalized as TestCasePriority
}

// Validate and clean imported data
export const validateImportedTestCase = (testCase: Partial<TestCase>): {
  isValid: boolean
  errors: string[]
  cleanedTestCase: Partial<TestCase>
} => {
  const errors: string[] = []
  const cleanedTestCase = { ...testCase }
  
  // Validate required fields
  if (!testCase.testCase?.trim()) {
    errors.push('Test case name is required')
    cleanedTestCase.testCase = `Imported Test Case ${Date.now()}`
  }
  
  // Normalize and validate status
  if (testCase.status) {
    cleanedTestCase.status = normalizeStatus(testCase.status)
  }
  
  const validStatuses: TestCaseStatus[] = ['Pass', 'Fail', 'Blocked', 'In Progress', 'Not Executed', 'Other']
  if (cleanedTestCase.status && !validStatuses.includes(cleanedTestCase.status)) {
    errors.push(`Invalid status: ${testCase.status}. Must be one of: ${validStatuses.join(', ')}`)
    cleanedTestCase.status = 'Not Executed'
  }
  
  // Normalize and validate priority
  if (testCase.priority) {
    cleanedTestCase.priority = normalizePriority(testCase.priority)
  }
  
  const validPriorities: TestCasePriority[] = ['P0 (Blocker)', 'P1 (High)', 'P2 (Medium)', 'P3 (Low)', 'Other']
  if (cleanedTestCase.priority && !validPriorities.includes(cleanedTestCase.priority)) {
    errors.push(`Invalid priority: ${testCase.priority}. Must be one of: ${validPriorities.join(', ')}`)
    cleanedTestCase.priority = 'P2 (Medium)'
  }
  
  // Validate category
  const validCategories: TestCaseCategory[] = ['Recording', 'Transcription', 'Notifications', 'Calling', 'UI/UX', 'Other']
  if (testCase.category && !validCategories.includes(testCase.category)) {
    errors.push(`Invalid category: ${testCase.category}. Must be one of: ${validCategories.join(', ')}`)
    cleanedTestCase.category = 'Other'
  }
  
  // Clean and trim string fields
  const stringFields = ['testCase', 'description', 'expectedResult', 'assignedTester', 'notes', 'actualResult', 'environment', 'prerequisites', 'platform', 'stepsToReproduce']
  stringFields.forEach(field => {
    const fieldKey = field as keyof TestCase
    if (cleanedTestCase[fieldKey] && typeof cleanedTestCase[fieldKey] === 'string') {
      (cleanedTestCase as any)[fieldKey] = (cleanedTestCase[fieldKey] as string).trim()
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanedTestCase
  }
}

// Bulk import utilities
export interface ImportProgress {
  total: number
  processed: number
  successful: number
  failed: number
  currentBatch: number
  totalBatches: number
  errors: string[]
  warnings: string[]
}

export const processBulkImport = async (
  testCases: Partial<TestCase>[],
  batchSize: number = 10,
  onProgress?: (progress: ImportProgress) => void
): Promise<{
  success: boolean
  imported: TestCase[]
  errors: string[]
  progress: ImportProgress
}> => {
  const total = testCases.length
  const totalBatches = Math.ceil(total / batchSize)
  const imported: TestCase[] = []
  const errors: string[] = []
  const warnings: string[] = []

  let processed = 0
  let successful = 0
  let failed = 0

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * batchSize
    const endIndex = Math.min(startIndex + batchSize, total)
    const batch = testCases.slice(startIndex, endIndex)

    // Process batch
    const batchPromises = batch.map(async (testCase, batchOffset) => {
      const globalIndex = startIndex + batchOffset
      try {
        // Validate test case
        const validation = validateImportedTestCase(testCase)
        if (!validation.isValid) {
          warnings.push(`Row ${globalIndex + 1}: ${validation.errors.join(', ')}`)
        }

        // Here you would typically call your addTestCase function
        // For now, we'll simulate the import
        const importedTestCase = {
          ...validation.cleanedTestCase,
          id: `imported-${Date.now()}-${globalIndex}`,
          createdAt: new Date(),
          updatedAt: new Date()
        } as TestCase

        return { success: true, testCase: importedTestCase, error: null }
      } catch (error) {
        return { 
          success: false, 
          testCase: null, 
          error: `Row ${globalIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)

    // Update progress
    batchResults.forEach(result => {
      processed++
      if (result.success && result.testCase) {
        successful++
        imported.push(result.testCase)
      } else {
        failed++
        if (result.error) errors.push(result.error)
      }
    })

    // Report progress
    if (onProgress) {
      onProgress({
        total,
        processed,
        successful,
        failed,
        currentBatch: batchIndex + 1,
        totalBatches,
        errors,
        warnings
      })
    }

    // Small delay to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return {
    success: failed === 0,
    imported,
    errors,
    progress: {
      total,
      processed,
      successful,
      failed,
      currentBatch: totalBatches,
      totalBatches,
      errors,
      warnings
    }
  }
}

// Enhanced CSV parsing with better error handling
export const parseCSVEnhanced = (csvContent: string): {
  data: any[]
  errors: string[]
  warnings: string[]
} => {
  const errors: string[] = []
  const warnings: string[] = []
  const lines = csvContent.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    errors.push('No data found in CSV file')
    return { data: [], errors, warnings }
  }

  try {
    // Parse header
    const headerLine = lines[0]
    const header = headerLine.split(',').map((col, index) => {
      const cleanCol = col.trim().replace(/"/g, '')
      if (!cleanCol) {
        warnings.push(`Column ${index + 1} has no header, using default name`)
        return `Column${index + 1}`
      }
      return cleanCol
    })

    // Check for duplicate headers
    const duplicateHeaders = header.filter((item, index) => header.indexOf(item) !== index)
    if (duplicateHeaders.length > 0) {
      warnings.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`)
    }

    // Parse data rows
    const data = lines.slice(1).map((line, rowIndex) => {
      const values = line.split(',').map(val => val.trim().replace(/"/g, ''))
      const row: any = {}
      
      header.forEach((col, colIndex) => {
        row[col] = values[colIndex] || ''
      })

      // Check for empty rows
      const hasData = Object.values(row).some(val => val && val.toString().trim())
      if (!hasData) {
        warnings.push(`Row ${rowIndex + 2} appears to be empty`)
      }

      return row
    })

    return { data, errors, warnings }
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { data: [], errors, warnings }
  }
}

// Enhanced TSV parsing for tab-separated data (common when copying from Excel/Google Sheets)
export const parseTSVEnhanced = (tsvContent: string): {
  data: any[]
  errors: string[]
  warnings: string[]
} => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const lines = tsvContent.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return { data: [], errors: ['No data found'], warnings }
    }

    // Parse header row
    const header = lines[0].split('\t').map(col => col.trim().replace(/"/g, ''))
    
    if (header.length === 0) {
      errors.push('No headers found')
      return { data: [], errors, warnings }
    }

    // Check for empty headers
    const emptyHeaders = header.filter(h => !h)
    if (emptyHeaders.length > 0) {
      warnings.push(`${emptyHeaders.length} empty header(s) found`)
    }

    // Check for duplicate headers
    const duplicateHeaders = header.filter((item, index) => header.indexOf(item) !== index)
    if (duplicateHeaders.length > 0) {
      warnings.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`)
    }

    // Parse data rows
    const data = lines.slice(1).map((line, rowIndex) => {
      const values = line.split('\t').map(val => val.trim().replace(/"/g, ''))
      const row: any = {}
      
      header.forEach((col, colIndex) => {
        row[col] = values[colIndex] || ''
      })

      // Check for empty rows
      const hasData = Object.values(row).some(val => val && val.toString().trim())
      if (!hasData) {
        warnings.push(`Row ${rowIndex + 2} appears to be empty`)
      }

      return row
    })

    return { data, errors, warnings }
  } catch (error) {
    errors.push(`Failed to parse TSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { data: [], errors, warnings }
  }
}

// Smart text parsing for various formats
export const parseTextIntelligently = (text: string): {
  format: ImportFormat
  data: any[]
  confidence: number
} => {
  const lines = text.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    return { format: 'freeform', data: [], confidence: 0 }
  }

  // Check if it's a hierarchical test case format
  if (lines.length > 1) {
    // Check for section headers (e.g., "1. BASIC FUNCTIONALITY")
    const hasSectionHeaders = lines.some(line => /^\d+\.\s+[A-Z][A-Z\s]+$/.test(line))
    // Check for subsection headers (e.g., "1.1 User Authentication")
    const hasSubsectionHeaders = lines.some(line => /^\d+\.\d+\s+[A-Z]/.test(line))
    // Check for test case IDs (e.g., "TC001:")
    const hasTestCaseIds = lines.some(line => /^TC\d{3}:/.test(line))
    // Check for expected results
    const hasExpectedResults = lines.some(line => line.trim().startsWith('Expected Result:'))

    // Count test cases
    const testCaseCount = lines.filter(line => /^TC\d{3}:/.test(line)).length

    // Debug logging
    console.log('Format detection:', {
      hasSectionHeaders,
      hasSubsectionHeaders,
      hasTestCaseIds,
      hasExpectedResults,
      testCaseCount,
      firstLine: lines[0],
      sectionMatch: /^\d+\.\s+[A-Z][A-Z\s]+$/.test(lines[0]),
      subsectionMatch: /^\d+\.\d+\s+[A-Z]/.test(lines[0])
    })

    // Check for hierarchical format
    if (hasTestCaseIds && hasExpectedResults && (hasSectionHeaders || hasSubsectionHeaders)) {
      try {
        const result = parseHierarchicalTestCases(text)
        if (result.testCases.length > 0) {
          return { format: 'hierarchical', data: result.testCases, confidence: 0.98 }
        }
      } catch (error) {
        console.error('Error parsing hierarchical format:', error)
        // Fall through to other formats
      }
    }
  }

  // Check if it's TSV (Tab-Separated Values) - common format for copied tables
  if (lines.length > 1 && lines[0].includes('\t')) {
    try {
      const { data } = parseTSVEnhanced(text)
      return { format: 'tsv', data, confidence: 0.95 }
    } catch {
      // Fall through to other formats
    }
  }

  // Check if it's CSV
  if (lines.length > 1 && lines[0].includes(',')) {
    try {
      const { data } = parseCSVEnhanced(text)
      return { format: 'csv', data, confidence: 0.9 }
    } catch {
      // Fall through to other formats
    }
  }

  // Check if it's structured text (with keywords)
  const structuredKeywords = [
    'test case id:', 'title:', 'description:', 'steps to reproduce:', 'expected result:', 'priority:', 'status:',
    'test case:', 'steps:', 'expected:', 'test case name:', 'test steps:', 'test priority:', 'test status:'
  ]
  
  const hasStructuredFormat = structuredKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  )

  if (hasStructuredFormat) {
    // Parse structured text
    const testCase: any = {}
    const sections = text.split(/(?=^(?:test case id|title|description|steps to reproduce|expected result|priority|status):)/mi)
    
    sections.forEach(section => {
      const lines = section.trim().split('\n')
      if (lines.length > 0) {
        const firstLine = lines[0].toLowerCase()
        const content = lines.slice(1).join('\n').trim()
        
        if (firstLine.includes('test case id')) {
          testCase.testCase = content || firstLine.replace(/^test case id:\s*/i, '').trim()
        } else if (firstLine.includes('title')) {
          testCase.testCase = (testCase.testCase || '') + ': ' + (content || firstLine.replace(/^title:\s*/i, '').trim())
        } else if (firstLine.includes('description')) {
          testCase.description = content || firstLine.replace(/^description:\s*/i, '').trim()
        } else if (firstLine.includes('steps to reproduce')) {
          testCase.stepsToReproduce = content || firstLine.replace(/^steps to reproduce:\s*/i, '').trim()
        } else if (firstLine.includes('expected result')) {
          testCase.expectedResult = content || firstLine.replace(/^expected result:\s*/i, '').trim()
        } else if (firstLine.includes('priority')) {
          testCase.priority = content || firstLine.replace(/^priority:\s*/i, '').trim()
        } else if (firstLine.includes('status')) {
          testCase.status = content || firstLine.replace(/^status:\s*/i, '').trim()
        }
      }
    })

    return { format: 'structured', data: [testCase], confidence: 0.7 }
  }

  // Freeform text - try to extract test case info
  const testCase: any = {
    testCase: lines[0] || 'Imported Test Case',
    description: lines.slice(1).join(' ').trim()
  }

  return { format: 'freeform', data: [testCase], confidence: 0.3 }
}
