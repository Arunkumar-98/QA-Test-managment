// QA Test Management System Types
// NOTE: Database uses snake_case (created_at), frontend uses camelCase (createdAt)

export type TestCaseStatus = 'Pending' | 'Pass' | 'Fail' | 'In Progress' | 'Blocked'
export type TestCasePriority = 'High' | 'Medium' | 'Low'
export type TestCaseCategory = 'Functional' | 'Non-Functional' | 'Regression' | 'Smoke' | 'Integration' | 'Unit' | 'E2E'

// New status types for different roles
export type QAStatus = 'Not Started' | 'In Progress' | 'Pass' | 'Fail' | 'Blocked' | 'Deferred' | 'Not Applicable'
export type DevStatus = 'Not Started' | 'In Progress' | 'Completed' | 'In Review' | 'Blocked' | 'Deferred'
export type BugStatus = 'Open' | 'In Progress' | 'Fixed' | 'Verified' | 'Closed' | 'Won\'t Fix' | 'Duplicate'
export type TestType = 'Manual' | 'Automated' | 'Semi-Automated' | 'Exploratory' | 'Performance' | 'Security'
export type TestLevel = 'Unit' | 'Integration' | 'System' | 'Acceptance' | 'Regression' | 'Smoke' | 'Sanity'
export type DefectSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Cosmetic'
export type DefectPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

export type StatusChangeReason = 'manual_update' | 'automation_run' | 'bulk_update' | 'import' | 'system'

export type StatusHistory = {
  id: string
  testCaseId: string
  oldStatus?: TestCaseStatus
  newStatus: TestCaseStatus
  changedBy: string
  changedAt: Date
  notes?: string
  reason: StatusChangeReason
  metadata?: {
    updatedAt?: Date
    assignedTester?: string
    executionDate?: string
    automationResult?: 'pass' | 'fail' | 'running' | 'not_run'
    executionTime?: number
    output?: string
    error?: string
    [key: string]: any
  }
}

// Database version of StatusHistory (snake_case)
export type StatusHistoryDB = {
  id: string
  test_case_id: string
  old_status?: TestCaseStatus
  new_status: TestCaseStatus
  changed_by: string
  changed_at: Date
  notes?: string
  reason: StatusChangeReason
  metadata?: {
    updated_at?: Date
    assigned_tester?: string
    execution_date?: string
    automation_result?: 'pass' | 'fail' | 'running' | 'not_run'
    execution_time?: number
    output?: string
    error?: string
    [key: string]: any
  }
}

export type TestCase = {
  id: string
  testCase: string
  description: string
  expectedResult: string
  status: TestCaseStatus
  priority: TestCasePriority
  category: TestCaseCategory
  assignedTester: string
  executionDate: string
  notes: string
  actualResult: string
  environment: string
  prerequisites: string
  platform: string
  stepsToReproduce: string
  projectId: string
  suiteId?: string
  position: number
  createdAt: Date
  updatedAt: Date
  // New core columns
  qaStatus: QAStatus
  devStatus: DevStatus
  assignedDev: string
  bugStatus: BugStatus
  testType: TestType
  testLevel: TestLevel
  defectSeverity: DefectSeverity
  defectPriority: DefectPriority
  estimatedTime: number // in minutes
  actualTime: number // in minutes
  testData: string
  attachments: string[]
  tags: string[]
  reviewer: string
  reviewDate: string
  reviewNotes: string
  lastModifiedBy: string
  lastModifiedDate: Date
  automationScript?: {
    path: string
    type: string
    command: string
    headlessMode: boolean
    embeddedCode: string
    lastRun?: Date
    lastResult?: 'pass' | 'fail' | 'running' | 'not_run'
    executionTime?: number
    output?: string
    error?: string
  }
  // Custom fields for dynamic columns
  customFields?: {
    [key: string]: string | number | boolean | null
  }
}

// Database version of TestCase (snake_case)
export type TestCaseDB = {
  id: string
  test_case: string
  description: string
  expected_result: string
  status: TestCaseStatus
  priority: TestCasePriority
  category: TestCaseCategory
  assigned_tester: string
  execution_date: string
  notes: string
  actual_result: string
  environment: string
  prerequisites: string
  platform: string
  steps_to_reproduce: string
  project_id: string
  suite_id?: string
  position: number
  created_at: Date
  updated_at: Date
  // New core columns (snake_case)
  qa_status: QAStatus
  dev_status: DevStatus
  assigned_dev: string
  bug_status: BugStatus
  test_type: TestType
  test_level: TestLevel
  defect_severity: DefectSeverity
  defect_priority: DefectPriority
  estimated_time: number // in minutes
  actual_time: number // in minutes
  test_data: string
  attachments: string[]
  tags: string[]
  reviewer: string
  review_date: string
  review_notes: string
  last_modified_by: string
  last_modified_date: Date
  automation_script?: {
    path: string
    type: string
    command: string
    headless_mode: boolean
    embedded_code: string
    last_run?: Date
    last_result?: 'pass' | 'fail' | 'running' | 'not_run'
    execution_time?: number
    output?: string
    error?: string
  }
  // Custom fields for dynamic columns
  custom_fields?: {
    [key: string]: string | number | boolean | null
  }
}

export type TestSuite = {
  id: string
  name: string
  description: string
  projectId: string
  testCaseIds: string[]
  createdAt: Date
  updatedAt: Date
  lastRun?: Date
  lastStatus?: 'Pass' | 'Fail' | 'Partial' | 'Not Run'
  totalTests: number
  passedTests: number
  failedTests: number
  pendingTests: number
  estimatedDuration?: number // in minutes
  tags: string[]
  owner: string
  isActive: boolean
}

// Database version of TestSuite (snake_case)
export type TestSuiteDB = {
  id: string
  name: string
  description: string
  project_id: string
  test_case_ids: string[]
  created_at: Date
  updated_at: Date
  last_run?: Date
  last_status?: 'Pass' | 'Fail' | 'Partial' | 'Not Run'
  total_tests: number
  passed_tests: number
  failed_tests: number
  pending_tests: number
  estimated_duration?: number
  tags: string[]
  owner: string
  is_active: boolean
  user_id?: string
}

export type Comment = {
  id: string
  testCaseId: string
  content: string
  author: string
  timestamp: Date
  type: 'general' | 'bug' | 'question' | 'suggestion' | 'status_update'
  mentions?: string[]
  isResolved?: boolean
  resolvedBy?: string
  resolvedAt?: Date
  attachments?: any[]
}

// Database version of Comment (snake_case)
export type CommentDB = {
  id: string
  test_case_id: string
  content: string
  author: string
  timestamp: Date
  type: 'general' | 'bug' | 'question' | 'suggestion' | 'status_update'
  mentions?: string[]
  is_resolved?: boolean
  resolved_by?: string
  resolved_at?: Date
  attachments?: any[]
}

export type Document = {
  id: string
  title: string
  url: string
  type: 'requirement' | 'specification' | 'test-plan' | 'report'
  description: string
  projectId: string
  size?: number
  uploadedBy?: string
  createdAt: Date
}

// Database version of Document (snake_case)
export type DocumentDB = {
  id: string
  title: string
  url: string
  type: 'requirement' | 'specification' | 'test-plan' | 'report'
  description: string
  project_id: string
  size?: number
  uploaded_by?: string
  created_at: Date
}

export type ImportantLink = {
  id: string
  title: string
  url: string
  description: string
  category: 'general' | 'documentation' | 'tools' | 'resources'
  projectId: string
  createdAt: Date
}

// Database version of ImportantLink (snake_case)
export type ImportantLinkDB = {
  id: string
  title: string
  url: string
  description: string
  category: 'general' | 'documentation' | 'tools' | 'resources'
  project_id: string
  created_at: Date
}

export type Platform = {
  id: string
  name: string
  description?: string
  projectId: string
  createdAt?: Date
}

// Database version of Platform (snake_case)
export type PlatformDB = {
  id: string
  name: string
  description?: string
  project_id: string
  created_at?: Date
}

export type Project = {
  id: string
  name: string
  description?: string
  createdAt?: Date
  isActive?: boolean
  tags?: string[]
}

// Database version of Project (snake_case)
export type ProjectDB = {
  id: string
  name: string
  description?: string
  created_at?: Date
  is_active?: boolean
  user_id?: string
  tags?: string[]
}

export type ProjectShare = {
  id: string
  projectId: string
  projectName: string
  accessToken: string
  permissions: ProjectPermissions
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
  allowedEmails?: string[]
  maxViews?: number
  currentViews: number
}

export type TestSuiteShare = {
  id: string
  testSuiteId: string
  testSuiteName: string
  projectId: string
  projectName: string
  accessToken: string
  permissions: TestSuitePermissions
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
  allowedEmails?: string[]
  maxViews?: number
  currentViews: number
}

export type TestSuitePermissions = {
  canView: boolean
  canComment: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  canExport: boolean
}

export type ProjectPermissions = {
  canView: boolean
  canComment: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  canExport: boolean
}

export type SharedProjectAccess = {
  project: Project
  permissions: ProjectPermissions
  accessToken: string
  userEmail?: string
}

export type SharedProjectReference = {
  id: string
  userId: string
  originalProjectId: string
  originalProjectName: string
  shareToken: string
  permissions: ProjectPermissions
  createdAt: Date
  isActive: boolean
  lastSyncedAt: Date
}

export type SharedProjectReferenceDB = {
  id: string
  user_id: string
  original_project_id: string
  original_project_name: string
  share_token: string
  permissions: ProjectPermissions
  created_at: Date
  is_active: boolean
  last_synced_at: Date
}

// Database version of ProjectShare (snake_case)
export type ProjectShareDB = {
  id: string
  project_id: string
  project_name: string
  access_token: string
  permissions: ProjectPermissions
  created_by: string
  created_at: Date
  expires_at?: Date
  is_active: boolean
  allowed_emails?: string[]
  max_views?: number
  current_views: number
}

// Database version of TestSuiteShare (snake_case)
export type TestSuiteShareDB = {
  id: string
  test_suite_id: string
  test_suite_name: string
  project_id: string
  project_name: string
  access_token: string
  permissions: TestSuitePermissions
  created_by: string
  created_at: Date
  expires_at?: Date
  is_active: boolean
  allowed_emails?: string[]
  max_views?: number
  current_views: number
}

// Utility types for database operations
export type CreateTestCaseInput = Omit<TestCase, 'id' | 'createdAt' | 'updatedAt' | 'position'>
export type CreateTestSuiteInput = Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt' | 'totalTests' | 'passedTests' | 'failedTests' | 'pendingTests'>
export type CreateDocumentInput = Omit<Document, 'id' | 'createdAt'>
export type CreateImportantLinkInput = Omit<ImportantLink, 'id' | 'createdAt'>
export type CreatePlatformInput = Omit<Platform, 'id' | 'createdAt'>
export type CreateProjectInput = Omit<Project, 'id' | 'createdAt'>

// Mapping functions
export const mapTestCaseFromDB = (db: TestCaseDB): TestCase => ({
  id: db.id,
  testCase: db.test_case,
  description: db.description,
  expectedResult: db.expected_result,
  status: db.status,
  priority: db.priority,
  category: db.category,
  assignedTester: db.assigned_tester,
  executionDate: db.execution_date,
  notes: db.notes,
  actualResult: db.actual_result,
  environment: db.environment,
  prerequisites: db.prerequisites,
  platform: db.platform,
  stepsToReproduce: db.steps_to_reproduce,
  projectId: db.project_id,
  suiteId: db.suite_id,
  position: db.position,
  createdAt: db.created_at instanceof Date ? db.created_at : new Date(db.created_at),
  updatedAt: db.updated_at instanceof Date ? db.updated_at : new Date(db.updated_at),
  // New core columns
  qaStatus: db.qa_status || 'Not Started',
  devStatus: db.dev_status || 'Not Started',
  assignedDev: db.assigned_dev || '',
  bugStatus: db.bug_status || 'Open',
  testType: db.test_type || 'Manual',
  testLevel: db.test_level || 'System',
  defectSeverity: db.defect_severity || 'Medium',
  defectPriority: db.defect_priority || 'P3',
  estimatedTime: db.estimated_time || 0,
  actualTime: db.actual_time || 0,
  testData: db.test_data || '',
  attachments: db.attachments || [],
  tags: db.tags || [],
  reviewer: db.reviewer || '',
  reviewDate: db.review_date || '',
  reviewNotes: db.review_notes || '',
  lastModifiedBy: db.last_modified_by || '',
  lastModifiedDate: db.last_modified_date instanceof Date ? db.last_modified_date : new Date(db.last_modified_date || db.updated_at),
  automationScript: db.automation_script ? {
    path: db.automation_script.path,
    type: db.automation_script.type,
    command: db.automation_script.command,
    headlessMode: db.automation_script.headless_mode,
    embeddedCode: db.automation_script.embedded_code,
    lastRun: db.automation_script.last_run ? (db.automation_script.last_run instanceof Date ? db.automation_script.last_run : new Date(db.automation_script.last_run)) : undefined,
    lastResult: db.automation_script.last_result,
    executionTime: db.automation_script.execution_time,
    output: db.automation_script.output,
    error: db.automation_script.error
  } : undefined,
  customFields: db.custom_fields || {}
})

export const mapTestCaseToDB = (tc: TestCase): TestCaseDB => ({
  id: tc.id,
  test_case: tc.testCase,
  description: tc.description,
  expected_result: tc.expectedResult,
  status: tc.status,
  priority: tc.priority,
  category: tc.category,
  assigned_tester: tc.assignedTester,
  execution_date: tc.executionDate,
  notes: tc.notes,
  actual_result: tc.actualResult,
  environment: tc.environment,
  prerequisites: tc.prerequisites,
  platform: tc.platform,
  steps_to_reproduce: tc.stepsToReproduce,
  project_id: tc.projectId,
  suite_id: tc.suiteId,
  position: tc.position,
  created_at: tc.createdAt,
  updated_at: tc.updatedAt,
  // New core columns (snake_case)
  qa_status: tc.qaStatus,
  dev_status: tc.devStatus,
  assigned_dev: tc.assignedDev,
  bug_status: tc.bugStatus,
  test_type: tc.testType,
  test_level: tc.testLevel,
  defect_severity: tc.defectSeverity,
  defect_priority: tc.defectPriority,
  estimated_time: tc.estimatedTime,
  actual_time: tc.actualTime,
  test_data: tc.testData,
  attachments: tc.attachments,
  tags: tc.tags,
  reviewer: tc.reviewer,
  review_date: tc.reviewDate,
  review_notes: tc.reviewNotes,
  last_modified_by: tc.lastModifiedBy,
  last_modified_date: tc.lastModifiedDate,
  automation_script: tc.automationScript ? {
    path: tc.automationScript.path,
    type: tc.automationScript.type,
    command: tc.automationScript.command,
    headless_mode: tc.automationScript.headlessMode,
    embedded_code: tc.automationScript.embeddedCode,
    last_run: tc.automationScript.lastRun,
    last_result: tc.automationScript.lastResult,
    execution_time: tc.automationScript.executionTime,
    output: tc.automationScript.output,
    error: tc.automationScript.error
  } : undefined,
  custom_fields: tc.customFields || {}
})

export const mapTestSuiteFromDB = (db: TestSuiteDB): TestSuite => ({
  id: db.id,
  name: db.name,
  description: db.description,
  projectId: db.project_id,
  testCaseIds: db.test_case_ids,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  lastRun: db.last_run,
  lastStatus: db.last_status,
  totalTests: db.total_tests,
  passedTests: db.passed_tests,
  failedTests: db.failed_tests,
  pendingTests: db.pending_tests,
  estimatedDuration: db.estimated_duration,
  tags: db.tags,
  owner: db.owner,
  isActive: db.is_active
})

export const mapTestSuiteToDB = (ts: TestSuite): TestSuiteDB => ({
  id: ts.id,
  name: ts.name,
  description: ts.description,
  project_id: ts.projectId,
  test_case_ids: ts.testCaseIds,
  created_at: ts.createdAt,
  updated_at: ts.updatedAt,
  last_run: ts.lastRun,
  last_status: ts.lastStatus,
  total_tests: ts.totalTests,
  passed_tests: ts.passedTests,
  failed_tests: ts.failedTests,
  pending_tests: ts.pendingTests,
  estimated_duration: ts.estimatedDuration,
  tags: ts.tags,
  owner: ts.owner,
  is_active: ts.isActive
})

export const mapDocumentFromDB = (db: DocumentDB): Document => ({
  id: db.id,
  title: db.title,
  url: db.url,
  type: db.type,
  description: db.description,
  projectId: db.project_id,
  size: db.size,
  uploadedBy: db.uploaded_by,
  createdAt: db.created_at
})

export const mapDocumentToDB = (doc: Document): DocumentDB => ({
  id: doc.id,
  title: doc.title,
  url: doc.url,
  type: doc.type,
  description: doc.description,
  project_id: doc.projectId,
  size: doc.size,
  uploaded_by: doc.uploadedBy,
  created_at: doc.createdAt
})

export const mapImportantLinkFromDB = (db: ImportantLinkDB): ImportantLink => ({
  id: db.id,
  title: db.title,
  url: db.url,
  description: db.description,
  category: db.category,
  projectId: db.project_id,
  createdAt: db.created_at
})

export const mapImportantLinkToDB = (link: ImportantLink): ImportantLinkDB => ({
  id: link.id,
  title: link.title,
  url: link.url,
  description: link.description,
  category: link.category,
  project_id: link.projectId,
  created_at: link.createdAt
})

export const mapPlatformFromDB = (db: PlatformDB): Platform => ({
  id: db.id,
  name: db.name,
  description: db.description,
  projectId: db.project_id,
  createdAt: db.created_at
})

export const mapPlatformToDB = (platform: Platform): PlatformDB => ({
  id: platform.id,
  name: platform.name,
  description: platform.description,
  project_id: platform.projectId,
  created_at: platform.createdAt
})

export const mapProjectFromDB = (db: ProjectDB): Project => ({
  id: db.id,
  name: db.name,
  description: db.description,
  createdAt: db.created_at,
  isActive: db.is_active,
  tags: db.tags || []
})

export const mapProjectToDB = (project: Project): ProjectDB => ({
  id: project.id,
  name: project.name,
  description: project.description,
  created_at: project.createdAt,
  is_active: project.isActive,
  tags: project.tags
})

export const mapProjectShareFromDB = (db: ProjectShareDB): ProjectShare => ({
  id: db.id,
  projectId: db.project_id,
  projectName: db.project_name,
  accessToken: db.access_token,
  permissions: db.permissions,
  createdBy: db.created_by,
  createdAt: db.created_at,
  expiresAt: db.expires_at,
  isActive: db.is_active,
  allowedEmails: db.allowed_emails,
  maxViews: db.max_views,
  currentViews: db.current_views
})

export const mapProjectShareToDB = (share: ProjectShare): ProjectShareDB => ({
  id: share.id,
  project_id: share.projectId,
  project_name: share.projectName,
  access_token: share.accessToken,
  permissions: share.permissions,
  created_by: share.createdBy,
  created_at: share.createdAt,
  expires_at: share.expiresAt,
  is_active: share.isActive,
  allowed_emails: share.allowedEmails,
  max_views: share.maxViews,
  current_views: share.currentViews
})

export const mapTestSuiteShareFromDB = (db: TestSuiteShareDB): TestSuiteShare => ({
  id: db.id,
  testSuiteId: db.test_suite_id,
  testSuiteName: db.test_suite_name,
  projectId: db.project_id,
  projectName: db.project_name,
  accessToken: db.access_token,
  permissions: db.permissions,
  createdBy: db.created_by,
  createdAt: db.created_at,
  expiresAt: db.expires_at,
  isActive: db.is_active,
  allowedEmails: db.allowed_emails,
  maxViews: db.max_views,
  currentViews: db.current_views
})

export const mapTestSuiteShareToDB = (share: TestSuiteShare): TestSuiteShareDB => ({
  id: share.id,
  test_suite_id: share.testSuiteId,
  test_suite_name: share.testSuiteName,
  project_id: share.projectId,
  project_name: share.projectName,
  access_token: share.accessToken,
  permissions: share.permissions,
  created_by: share.createdBy,
  created_at: share.createdAt,
  expires_at: share.expiresAt,
  is_active: share.isActive,
  allowed_emails: share.allowedEmails,
  max_views: share.maxViews,
  current_views: share.currentViews
})

export const mapCommentFromDB = (db: CommentDB): Comment => ({
  id: db.id,
  testCaseId: db.test_case_id,
  content: db.content,
  author: db.author,
  timestamp: db.timestamp instanceof Date ? db.timestamp : new Date(db.timestamp),
  type: db.type,
  mentions: db.mentions || [],
  isResolved: db.is_resolved || false,
  resolvedBy: db.resolved_by,
  resolvedAt: db.resolved_at ? (db.resolved_at instanceof Date ? db.resolved_at : new Date(db.resolved_at)) : undefined,
  attachments: db.attachments || []
})

export const mapCommentToDB = (comment: Comment): CommentDB => ({
  id: comment.id,
  test_case_id: comment.testCaseId,
  content: comment.content,
  author: comment.author,
  timestamp: comment.timestamp,
  type: comment.type,
  mentions: comment.mentions || [],
  is_resolved: comment.isResolved || false,
  resolved_by: comment.resolvedBy,
  resolved_at: comment.resolvedAt,
  attachments: comment.attachments || []
})

export const mapStatusHistoryFromDB = (db: StatusHistoryDB): StatusHistory => ({
  id: db.id,
  testCaseId: db.test_case_id,
  oldStatus: db.old_status,
  newStatus: db.new_status,
  changedBy: db.changed_by,
  changedAt: db.changed_at instanceof Date ? db.changed_at : new Date(db.changed_at),
  notes: db.notes,
  reason: db.reason,
  metadata: db.metadata ? {
    updatedAt: db.metadata.updated_at ? (db.metadata.updated_at instanceof Date ? db.metadata.updated_at : new Date(db.metadata.updated_at)) : undefined,
    assignedTester: db.metadata.assigned_tester,
    executionDate: db.metadata.execution_date,
    automationResult: db.metadata.automation_result,
    executionTime: db.metadata.execution_time,
    output: db.metadata.output,
    error: db.metadata.error,
    ...db.metadata
  } : undefined
})

export const mapStatusHistoryToDB = (sh: StatusHistory): StatusHistoryDB => ({
  id: sh.id,
  test_case_id: sh.testCaseId,
  old_status: sh.oldStatus,
  new_status: sh.newStatus,
  changed_by: sh.changedBy,
  changed_at: sh.changedAt,
  notes: sh.notes,
  reason: sh.reason,
  metadata: sh.metadata ? {
    updated_at: sh.metadata.updatedAt,
    assigned_tester: sh.metadata.assignedTester,
    execution_date: sh.metadata.executionDate,
    automation_result: sh.metadata.automationResult,
    execution_time: sh.metadata.executionTime,
    output: sh.metadata.output,
    error: sh.metadata.error,
    ...sh.metadata
  } : undefined
})

export const mapSharedProjectReferenceFromDB = (db: SharedProjectReferenceDB): SharedProjectReference => ({
  id: db.id,
  userId: db.user_id,
  originalProjectId: db.original_project_id,
  originalProjectName: db.original_project_name,
  shareToken: db.share_token,
  permissions: db.permissions,
  createdAt: db.created_at,
  isActive: db.is_active,
  lastSyncedAt: db.last_synced_at
})

export const mapSharedProjectReferenceToDB = (ref: SharedProjectReference): SharedProjectReferenceDB => ({
  id: ref.id,
  user_id: ref.userId,
  original_project_id: ref.originalProjectId,
  original_project_name: ref.originalProjectName,
  share_token: ref.shareToken,
  permissions: ref.permissions,
  created_at: ref.createdAt,
  is_active: ref.isActive,
  last_synced_at: ref.lastSyncedAt
})

// Notes Types
export type Note = {
  id: string
  title: string
  content: string
  projectId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
  tags: string[]
  color?: string
}

export type NoteDB = {
  id: string
  title: string
  content: string
  project_id: string
  user_id: string
  created_at: Date
  updated_at: Date
  is_pinned: boolean
  tags: string[]
  color?: string
}

export type CreateNoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>

export const mapNoteFromDB = (db: NoteDB): Note => ({
  id: db.id,
  title: db.title,
  content: db.content,
  projectId: db.project_id,
  userId: db.user_id,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  isPinned: db.is_pinned,
  tags: db.tags || [],
  color: db.color
})

export const mapNoteToDB = (note: Note): NoteDB => ({
  id: note.id,
  title: note.title,
  content: note.content,
  project_id: note.projectId,
  user_id: note.userId,
  created_at: note.createdAt,
  updated_at: note.updatedAt,
  is_pinned: note.isPinned,
  tags: note.tags || [],
  color: note.color
})

// Multi-User Project Types
export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type MembershipStatus = 'pending' | 'accepted' | 'declined'

export type ProjectMembership = {
  id: string
  projectId: string
  userId: string
  role: ProjectRole
  invitedBy?: string
  invitedAt: Date
  acceptedAt?: Date
  status: MembershipStatus
  createdAt: Date
  updatedAt: Date
}

export type ProjectMembershipDB = {
  id: string
  project_id: string
  user_id: string
  role: ProjectRole
  invited_by?: string
  invited_at: Date
  accepted_at?: Date
  status: MembershipStatus
  created_at: Date
  updated_at: Date
}

export type CreateProjectMembershipInput = Omit<ProjectMembership, 'id' | 'createdAt' | 'updatedAt'>

// Custom Column Types
export type CustomColumnType = 'text' | 'number' | 'boolean' | 'select' | 'date'

export type CustomColumn = {
  id: string
  name: string
  label: string
  type: CustomColumnType
  visible: boolean
  width: string
  minWidth: string
  options?: string[] // For select type
  optionColors?: { [key: string]: string } // Colors for individual options
  defaultValue?: string | number | boolean
  required?: boolean
  color?: string // Color for the column (hex code)
  projectId: string
  createdAt: Date
  updatedAt: Date
}

export type CustomColumnDB = {
  id: string
  name: string
  label: string
  type: CustomColumnType
  visible: boolean
  width: string
  min_width: string
  options?: string[]
  option_colors?: { [key: string]: string } // Colors for individual options
  default_value?: string | number | boolean
  required?: boolean
  color?: string
  project_id: string
  created_at: Date
  updated_at: Date
}

export type CreateCustomColumnInput = Omit<CustomColumn, 'id' | 'createdAt' | 'updatedAt'>

export const mapCustomColumnFromDB = (db: CustomColumnDB): CustomColumn => ({
  id: db.id,
  name: db.name,
  label: db.label,
  type: db.type,
  visible: db.visible,
  width: db.width,
  minWidth: db.min_width,
  options: db.options,
  optionColors: db.option_colors,
  defaultValue: db.default_value,
  required: db.required,
  color: db.color,
  projectId: db.project_id,
  createdAt: db.created_at,
  updatedAt: db.updated_at
})

export const mapCustomColumnToDB = (column: CustomColumn): CustomColumnDB => ({
  id: column.id,
  name: column.name,
  label: column.label,
  type: column.type,
  visible: column.visible,
  width: column.width,
  min_width: column.minWidth,
  options: column.options,
  option_colors: column.optionColors,
  default_value: column.defaultValue,
  required: column.required,
  color: column.color,
  project_id: column.projectId,
  created_at: column.createdAt,
  updated_at: column.updatedAt
})

export type ProjectWithMembership = {
  id: string
  name: string
  description?: string
  createdAt?: Date
  isActive?: boolean
  tags?: string[]
  userRole: ProjectRole
  isOwner: boolean
  memberCount: number
  isMultiUser: boolean
  createdBy?: string
}

export type ProjectInvitation = {
  id: string
  projectId: string
  projectName: string
  invitedBy: string
  invitedByEmail: string
  role: ProjectRole
  invitedAt: Date
  status: MembershipStatus
}

export const mapProjectMembershipFromDB = (db: ProjectMembershipDB): ProjectMembership => ({
  id: db.id,
  projectId: db.project_id,
  userId: db.user_id,
  role: db.role,
  invitedBy: db.invited_by,
  invitedAt: db.invited_at,
  acceptedAt: db.accepted_at,
  status: db.status,
  createdAt: db.created_at,
  updatedAt: db.updated_at
})

export const mapProjectMembershipToDB = (membership: ProjectMembership): ProjectMembershipDB => ({
  id: membership.id,
  project_id: membership.projectId,
  user_id: membership.userId,
  role: membership.role,
  invited_by: membership.invitedBy,
  invited_at: membership.invitedAt,
  accepted_at: membership.acceptedAt,
  status: membership.status,
  created_at: membership.createdAt,
  updated_at: membership.updatedAt
}) 