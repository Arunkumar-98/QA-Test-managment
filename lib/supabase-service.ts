import {
  TestCase,
  CreateTestCaseInput,
  TestSuite,
  CreateTestSuiteInput,
  Document,
  CreateDocumentInput,
  ImportantLink,
  CreateImportantLinkInput,
  Platform,
  CreatePlatformInput,
  Project,
  CreateProjectInput,
  Comment,
  StatusHistory,
  ProjectShare,
  ProjectPermissions,
  TestSuiteShare,
  TestSuitePermissions,
  SharedProjectReference,
  CustomColumn,
  CreateCustomColumnInput,
} from '@/types/qa-types'
import { createId, readCollection, reviveDates, writeCollection } from '@/lib/local-db'
import { getCurrentUser } from '@/lib/local-auth'
import { dashboardService } from '@/lib/dashboard-service'

export { dashboardService }

function requireUser() {
  const user = getCurrentUser()
  if (!user) throw new Error('User not authenticated')
  return user
}

function nextPosition(items: Array<{ position?: number }>) {
  return items.reduce((max, item) => Math.max(max, item.position || 0), 0) + 1
}

export const testCaseService = {
  async getAll(projectId: string): Promise<TestCase[]> {
    return readCollection<TestCase>('test_cases')
      .filter((item) => item.projectId === projectId)
      .map((item) => reviveDates(item))
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  },

  async create(testCase: CreateTestCaseInput | any): Promise<TestCase> {
    const items = readCollection<any>('test_cases')
    const position =
      typeof testCase.position === 'number'
        ? testCase.position
        : nextPosition(items.filter((item) => item.projectId === testCase.projectId))
    const now = new Date()
    const created = {
      ...testCase,
      id: testCase.id || createId(),
      position,
      createdAt: now,
      updatedAt: now,
      dynamicFields: testCase.dynamicFields || {},
    }
    items.push(created)
    await writeCollection('test_cases', items)
    return reviveDates(created)
  },

  async getById(id: string): Promise<TestCase | null> {
    const item = readCollection<TestCase>('test_cases').find((row) => row.id === id)
    return item ? reviveDates(item) : null
  },

  async update(id: string, updates: Partial<TestCase> | any): Promise<TestCase> {
    const items = readCollection<any>('test_cases')
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) throw new Error('Test case not found')
    const current = items[index]
    items[index] = {
      ...current,
      ...updates,
      id,
      updatedAt: new Date(),
      dynamicFields: updates.dynamicFields
        ? { ...(current.dynamicFields || {}), ...updates.dynamicFields }
        : current.dynamicFields,
    }
    await writeCollection('test_cases', items)
    return reviveDates(items[index])
  },

  async delete(id: string): Promise<void> {
    await writeCollection('test_cases', readCollection('test_cases').filter((item) => item.id !== id))
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    const idSet = new Set(ids)
    await writeCollection('test_cases', readCollection('test_cases').filter((item) => !idSet.has(item.id)))
  },

  async deleteUnassigned(projectId: string): Promise<number> {
    const items = readCollection<any>('test_cases')
    const remaining = items.filter((item) => item.projectId !== projectId || Boolean(item.suiteId))
    const removed = items.length - remaining.length
    if (removed > 0) {
      await writeCollection('test_cases', remaining)
    }
    return removed
  },

  async reorderTestCase(testCaseId: string, newPosition: number): Promise<void> {
    const items = readCollection<any>('test_cases')
    const current = items.find((item) => item.id === testCaseId)
    if (!current) throw new Error('Test case not found')

    const projectItems = items
      .filter((item) => item.projectId === current.projectId)
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    const withoutCurrent = projectItems.filter((item) => item.id !== testCaseId)
    withoutCurrent.splice(Math.max(0, newPosition - 1), 0, current)
    withoutCurrent.forEach((item, index) => {
      item.position = index + 1
    })
    await writeCollection('test_cases', items)
  },

  async insertAtPosition(testCaseData: CreateTestCaseInput | any, position: number): Promise<TestCase> {
    const items = readCollection<any>('test_cases')
    items
      .filter((item) => item.projectId === testCaseData.projectId && (item.position || 0) >= position)
      .forEach((item) => {
        item.position = (item.position || 0) + 1
      })

    const now = new Date()
    const created = {
      ...testCaseData,
      id: createId(),
      position,
      createdAt: now,
      updatedAt: now,
      dynamicFields: testCaseData.dynamicFields || {},
    }
    items.push(created)
    await writeCollection('test_cases', items)
    return reviveDates(created)
  },

  async deleteAndReorder(testCaseId: string): Promise<void> {
    await this.delete(testCaseId)
  },
}

export const testSuiteService = {
  async getAll(projectId: string): Promise<TestSuite[]> {
    return readCollection<TestSuite>('test_suites')
      .filter((item) => item.projectId === projectId)
      .map((item) => reviveDates(item, ['createdAt', 'updatedAt', 'lastRun']))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async create(testSuite: CreateTestSuiteInput): Promise<TestSuite> {
    const items = readCollection<TestSuite>('test_suites')
    const now = new Date()
    const created: TestSuite = {
      ...testSuite,
      kind: testSuite.kind || 'suite',
      id: createId(),
      createdAt: now,
      updatedAt: now,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      pendingTests: 0,
    }
    items.push(created)
    await writeCollection('test_suites', items)
    return reviveDates(created, ['createdAt', 'updatedAt', 'lastRun'])
  },

  async update(id: string, updates: Partial<TestSuite>): Promise<TestSuite> {
    const items = readCollection<TestSuite>('test_suites')
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) throw new Error('Test suite not found')
    items[index] = { ...items[index], ...updates, id, updatedAt: new Date() }
    await writeCollection('test_suites', items)
    return reviveDates(items[index], ['createdAt', 'updatedAt', 'lastRun'])
  },

  async delete(id: string): Promise<void> {
    const cases = readCollection<any>('test_cases').map((item) =>
      item.suiteId === id ? { ...item, suiteId: undefined } : item
    )
    await writeCollection('test_cases', cases)
    await writeCollection('test_suites', readCollection('test_suites').filter((item) => item.id !== id))
  },

  async getById(id: string): Promise<TestSuite | null> {
    const item = readCollection<TestSuite>('test_suites').find((suite) => suite.id === id)
    return item ? reviveDates(item, ['createdAt', 'updatedAt', 'lastRun']) : null
  },
}

export const documentService = {
  async getAll(projectId: string): Promise<Document[]> {
    return readCollection<Document>('documents')
      .filter((item) => item.projectId === projectId)
      .map((item) => reviveDates(item))
  },

  async create(document: CreateDocumentInput): Promise<Document> {
    const items = readCollection<Document>('documents')
    const created = { ...document, id: createId(), createdAt: new Date() } as Document
    items.push(created)
    await writeCollection('documents', items)
    return reviveDates(created)
  },

  async delete(id: string): Promise<void> {
    await writeCollection('documents', readCollection('documents').filter((item) => item.id !== id))
  },
}

export const importantLinkService = {
  async getAll(projectId: string): Promise<ImportantLink[]> {
    return readCollection<ImportantLink>('important_links')
      .filter((item) => item.projectId === projectId)
      .map((item) => reviveDates(item))
  },

  async create(link: CreateImportantLinkInput): Promise<ImportantLink> {
    const items = readCollection<ImportantLink>('important_links')
    const created = { ...link, id: createId(), createdAt: new Date() } as ImportantLink
    items.push(created)
    await writeCollection('important_links', items)
    return reviveDates(created)
  },

  async delete(id: string): Promise<void> {
    await writeCollection('important_links', readCollection('important_links').filter((item) => item.id !== id))
  },
}

export const platformService = {
  async getAll(_projectId?: string): Promise<Platform[]> {
    return readCollection<Platform>('platforms').map((item) => reviveDates(item))
  },

  async create(platform: CreatePlatformInput): Promise<Platform> {
    const items = readCollection<Platform>('platforms')
    const created = { ...platform, id: createId(), createdAt: new Date() } as Platform
    items.push(created)
    await writeCollection('platforms', items)
    return reviveDates(created)
  },

  async delete(id: string): Promise<void> {
    await writeCollection('platforms', readCollection('platforms').filter((item) => item.id !== id))
  },
}

export const projectService = {
  async getAll(): Promise<Project[]> {
    const user = getCurrentUser()
    if (!user) return []

    return readCollection<any>('projects')
      .filter((item) => item.userId === user.id)
      .map((item) => ({
        ...reviveDates(item),
        isOwner: true,
        sharedBy: null,
        permissionLevel: 'admin',
      }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  },

  async create(project: CreateProjectInput): Promise<Project> {
    const user = requireUser()
    const items = readCollection<any>('projects')
    const created = {
      ...project,
      id: createId(),
      createdAt: new Date(),
      isActive: true,
      userId: user.id,
    }
    items.push(created)
    await writeCollection('projects', items)
    return reviveDates(created)
  },

  async delete(id: string): Promise<void> {
    const user = requireUser()
    await writeCollection(
      'projects',
      readCollection<any>('projects').filter((item) => !(item.id === id && item.userId === user.id))
    )
    await writeCollection('test_cases', readCollection('test_cases').filter((item) => item.projectId !== id))
    await writeCollection('test_suites', readCollection('test_suites').filter((item) => item.projectId !== id))
    await writeCollection('custom_columns', readCollection('custom_columns').filter((item) => item.projectId !== id))
  },

  async update(id: string, updates: Partial<CreateProjectInput>): Promise<Project> {
    const user = requireUser()
    const items = readCollection<any>('projects')
    const index = items.findIndex((item) => item.id === id && item.userId === user.id)
    if (index === -1) throw new Error('Project not found')
    items[index] = { ...items[index], ...updates, id }
    await writeCollection('projects', items)
    return reviveDates(items[index])
  },

  async getById(id: string): Promise<Project | null> {
    const item = readCollection<any>('projects').find((project) => project.id === id)
    return item ? reviveDates(item) : null
  },

  async shareProject(projectId: string, userEmail: string, permissionLevel: 'view' | 'edit' | 'admin' = 'view') {
    await this.logActivity(projectId, 'share', 'project', projectId, null, { userEmail, permissionLevel }, `Shared with ${userEmail}`)
    return { success: true, userEmail, permissionLevel }
  },

  async removeUserFromProject(projectId: string, userEmail: string) {
    await this.logActivity(projectId, 'unshare', 'project', projectId, null, { userEmail }, `Removed ${userEmail}`)
    return { success: true, userEmail }
  },

  async getProjectActivity(projectId: string, limit: number = 50) {
    return readCollection<any>('project_activity_log')
      .filter((item) => item.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map((item) => ({
        ...reviveDates(item, ['timestamp']),
        user: { email: item.userEmail },
      }))
  },

  async logActivity(
    projectId: string,
    actionType: string,
    entityType: string,
    entityId?: string,
    oldValues?: any,
    newValues?: any,
    description?: string
  ): Promise<void> {
    const user = getCurrentUser()
    const items = readCollection<any>('project_activity_log')
    items.push({
      id: createId(),
      projectId,
      actionType,
      entityType,
      entityId,
      oldValues,
      newValues,
      description,
      timestamp: new Date(),
      userEmail: user?.email || 'local-user',
      user: { email: user?.email || 'local-user' },
    })
    await writeCollection('project_activity_log', items)
  },
}

export const settingsService = {
  async getSettings(): Promise<any> {
    return readCollection('app_settings')
  },

  async updateSettings(settings: any): Promise<void> {
    await writeCollection('app_settings', Array.isArray(settings) ? settings : [settings])
  },
}

export const commentService = {
  async getByTestCaseId(testCaseId: string): Promise<Comment[]> {
    return readCollection<Comment>('comments')
      .filter((item) => item.testCaseId === testCaseId)
      .map((item) => reviveDates(item, ['timestamp', 'resolvedAt']))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  async create(comment: Omit<Comment, 'id'>): Promise<Comment> {
    const items = readCollection<Comment>('comments')
    const created = { ...comment, id: createId() } as Comment
    items.push(created)
    await writeCollection('comments', items)
    return reviveDates(created, ['timestamp', 'resolvedAt'])
  },

  async update(id: string, updates: Partial<Comment>): Promise<Comment> {
    const items = readCollection<Comment>('comments')
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) throw new Error('Comment not found')
    items[index] = { ...items[index], ...updates, id }
    await writeCollection('comments', items)
    return reviveDates(items[index], ['timestamp', 'resolvedAt'])
  },

  async delete(id: string): Promise<void> {
    await writeCollection('comments', readCollection('comments').filter((item) => item.id !== id))
  },
}

export const projectShareService = {
  async createShare(
    projectId: string,
    projectName: string,
    permissions: ProjectPermissions,
    options?: { expiresAt?: Date; allowedEmails?: string[]; maxViews?: number }
  ): Promise<ProjectShare> {
    const items = readCollection<ProjectShare>('project_shares')
    const created: ProjectShare = {
      id: createId(),
      projectId,
      projectName,
      accessToken: createId(),
      permissions,
      createdBy: getCurrentUser()?.id || 'local-user',
      createdAt: new Date(),
      expiresAt: options?.expiresAt,
      isActive: true,
      allowedEmails: options?.allowedEmails,
      maxViews: options?.maxViews,
      currentViews: 0,
    }
    items.push(created)
    await writeCollection('project_shares', items)
    return reviveDates(created, ['createdAt', 'expiresAt'])
  },

  async getShareByToken(accessToken: string): Promise<ProjectShare | null> {
    const item = readCollection<ProjectShare>('project_shares').find(
      (share) => share.accessToken === accessToken && share.isActive
    )
    return item ? reviveDates(item, ['createdAt', 'expiresAt']) : null
  },

  async incrementViews(shareId: string): Promise<void> {
    const items = readCollection<ProjectShare>('project_shares')
    const index = items.findIndex((item) => item.id === shareId)
    if (index === -1) return
    items[index].currentViews = (items[index].currentViews || 0) + 1
    await writeCollection('project_shares', items)
  },

  async getAllShares(projectId?: string): Promise<ProjectShare[]> {
    return readCollection<ProjectShare>('project_shares')
      .filter((item) => (projectId ? item.projectId === projectId : true))
      .map((item) => reviveDates(item, ['createdAt', 'expiresAt']))
  },

  async deactivateShare(shareId: string): Promise<void> {
    const items = readCollection<ProjectShare>('project_shares')
    const index = items.findIndex((item) => item.id === shareId)
    if (index === -1) return
    items[index].isActive = false
    await writeCollection('project_shares', items)
  },

  async deleteShare(shareId: string): Promise<void> {
    await writeCollection('project_shares', readCollection('project_shares').filter((item) => item.id !== shareId))
  },
}

export const testSuiteShareService = {
  async createShare(
    testSuiteId: string,
    testSuiteName: string,
    projectId: string,
    projectName: string,
    permissions: TestSuitePermissions,
    options?: { expiresAt?: Date; allowedEmails?: string[]; maxViews?: number }
  ): Promise<TestSuiteShare> {
    const items = readCollection<TestSuiteShare>('test_suite_shares')
    const created: TestSuiteShare = {
      id: createId(),
      testSuiteId,
      testSuiteName,
      projectId,
      projectName,
      accessToken: createId(),
      permissions,
      createdBy: getCurrentUser()?.id || 'local-user',
      createdAt: new Date(),
      expiresAt: options?.expiresAt,
      isActive: true,
      allowedEmails: options?.allowedEmails,
      maxViews: options?.maxViews,
      currentViews: 0,
    }
    items.push(created)
    await writeCollection('test_suite_shares', items)
    return reviveDates(created, ['createdAt', 'expiresAt'])
  },

  async getShareByToken(accessToken: string): Promise<TestSuiteShare | null> {
    const item = readCollection<TestSuiteShare>('test_suite_shares').find(
      (share) => share.accessToken === accessToken && share.isActive
    )
    return item ? reviveDates(item, ['createdAt', 'expiresAt']) : null
  },

  async incrementViews(shareId: string): Promise<void> {
    const items = readCollection<TestSuiteShare>('test_suite_shares')
    const index = items.findIndex((item) => item.id === shareId)
    if (index === -1) return
    items[index].currentViews = (items[index].currentViews || 0) + 1
    await writeCollection('test_suite_shares', items)
  },

  async getAllShares(testSuiteId?: string): Promise<TestSuiteShare[]> {
    return readCollection<TestSuiteShare>('test_suite_shares')
      .filter((item) => (testSuiteId ? item.testSuiteId === testSuiteId : true))
      .map((item) => reviveDates(item, ['createdAt', 'expiresAt']))
  },

  async deactivateShare(shareId: string): Promise<void> {
    const items = readCollection<TestSuiteShare>('test_suite_shares')
    const index = items.findIndex((item) => item.id === shareId)
    if (index === -1) return
    items[index].isActive = false
    await writeCollection('test_suite_shares', items)
  },

  async deleteShare(shareId: string): Promise<void> {
    await writeCollection('test_suite_shares', readCollection('test_suite_shares').filter((item) => item.id !== shareId))
  },
}

export const statusHistoryService = {
  async getByTestCaseId(testCaseId: string): Promise<StatusHistory[]> {
    return readCollection<StatusHistory>('status_history')
      .filter((item) => item.testCaseId === testCaseId)
      .map((item) => reviveDates(item, ['changedAt']))
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
  },

  async create(history: Omit<StatusHistory, 'id'>): Promise<StatusHistory> {
    const items = readCollection<StatusHistory>('status_history')
    const created = { ...history, id: createId() } as StatusHistory
    items.push(created)
    await writeCollection('status_history', items)
    return reviveDates(created, ['changedAt'])
  },

  async getStatusChangeStats() {
    return []
  },

  async getRecentChanges(limit: number = 10): Promise<StatusHistory[]> {
    return readCollection<StatusHistory>('status_history')
      .map((item) => reviveDates(item, ['changedAt']))
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
      .slice(0, limit)
  },

  async deleteByTestCaseId(testCaseId: string): Promise<void> {
    await writeCollection(
      'status_history',
      readCollection('status_history').filter((item) => item.testCaseId !== testCaseId)
    )
  },
}

export const sharedProjectReferenceService = {
  async getAll(): Promise<SharedProjectReference[]> {
    const user = requireUser()
    return readCollection<any>('shared_project_references')
      .filter((item) => item.userId === user.id && item.isActive !== false)
      .map((item) => reviveDates(item, ['createdAt', 'lastSyncedAt']))
  },

  async getById(id: string): Promise<SharedProjectReference | null> {
    const user = requireUser()
    const item = readCollection<any>('shared_project_references').find(
      (reference) => reference.id === id && reference.userId === user.id
    )
    return item ? reviveDates(item, ['createdAt', 'lastSyncedAt']) : null
  },

  async create(reference: Omit<SharedProjectReference, 'id' | 'createdAt' | 'lastSyncedAt'>): Promise<SharedProjectReference> {
    const user = requireUser()
    const items = readCollection<any>('shared_project_references')
    const created = {
      ...reference,
      id: createId(),
      userId: user.id,
      createdAt: new Date(),
      lastSyncedAt: new Date(),
      isActive: true,
    }
    items.push(created)
    await writeCollection('shared_project_references', items)
    return reviveDates(created, ['createdAt', 'lastSyncedAt'])
  },

  async delete(id: string): Promise<void> {
    const user = requireUser()
    await writeCollection(
      'shared_project_references',
      readCollection<any>('shared_project_references').filter((item) => !(item.id === id && item.userId === user.id))
    )
  },

  async updateLastSynced(id: string): Promise<void> {
    const user = requireUser()
    const items = readCollection<any>('shared_project_references')
    const index = items.findIndex((item) => item.id === id && item.userId === user.id)
    if (index === -1) return
    items[index].lastSyncedAt = new Date()
    await writeCollection('shared_project_references', items)
  },
}

export const customColumnService = {
  async getAll(projectId: string): Promise<CustomColumn[]> {
    if (!projectId?.trim()) return []
    const userId = getCurrentUser()?.id
    return readCollection<CustomColumn>('custom_columns')
      .filter((item) => item.projectId === projectId)
      .filter((item) => !item.ownerUserId || item.ownerUserId === userId)
      .map((item) => reviveDates(item))
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  },

  async create(column: CreateCustomColumnInput | CustomColumn): Promise<CustomColumn> {
    const items = readCollection<CustomColumn>('custom_columns')
    const duplicate = items.find(
      (item) =>
        item.projectId === column.projectId &&
        item.name === column.name &&
        (item.ownerUserId || '') === ((column as any).ownerUserId || '')
    )
    if (duplicate) return reviveDates(duplicate)

    const now = new Date()
    const created: CustomColumn = {
      ...column,
      id: createId(),
      position: column.position ?? nextPosition(items.filter((item) => item.projectId === column.projectId)),
      createdAt: now,
      updatedAt: now,
    }
    items.push(created)
    await writeCollection('custom_columns', items)
    return reviveDates(created)
  },

  async update(id: string, updates: Partial<CustomColumn>): Promise<CustomColumn> {
    const items = readCollection<CustomColumn>('custom_columns')
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) throw new Error('Custom column not found')
    items[index] = { ...items[index], ...updates, id, updatedAt: new Date() }
    await writeCollection('custom_columns', items)
    return reviveDates(items[index])
  },

  async delete(id: string): Promise<void> {
    await writeCollection('custom_columns', readCollection('custom_columns').filter((item) => item.id !== id))
  },
}
