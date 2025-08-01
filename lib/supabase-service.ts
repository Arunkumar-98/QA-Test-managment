import { supabase } from './supabase'
import { 
  TestCase, 
  TestCaseDB, 
  CreateTestCaseInput, 
  TestSuite, 
  TestSuiteDB, 
  CreateTestSuiteInput, 
  Document, 
  DocumentDB, 
  CreateDocumentInput, 
  ImportantLink, 
  ImportantLinkDB, 
  CreateImportantLinkInput, 
  Platform, 
  PlatformDB, 
  CreatePlatformInput, 
  Project, 
  ProjectDB, 
  CreateProjectInput, 
  Comment, 
  CommentDB, 
  StatusHistory, 
  StatusHistoryDB, 
  ProjectShare, 
  ProjectShareDB, 
  ProjectPermissions,
  TestSuiteShare,
  TestSuiteShareDB,
  TestSuitePermissions,
  mapTestCaseFromDB, 
  mapTestCaseToDB, 
  mapTestSuiteFromDB, 
  mapTestSuiteToDB, 
  mapDocumentFromDB, 
  mapDocumentToDB, 
  mapImportantLinkFromDB, 
  mapImportantLinkToDB, 
  mapPlatformFromDB, 
  mapPlatformToDB, 
  mapProjectFromDB, 
  mapProjectToDB, 
  mapCommentFromDB, 
  mapCommentToDB, 
  mapStatusHistoryFromDB, 
  mapStatusHistoryToDB, 
  mapProjectShareFromDB, 
  mapProjectShareToDB,
  mapTestSuiteShareFromDB,
  mapTestSuiteShareToDB
} from '@/types/qa-types'

// Test Cases
export const testCaseService = {
  async getAll(projectId: string): Promise<TestCase[]> {
    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('project_id', projectId)
      .order('id', { ascending: true })
    
    if (error) throw error
    return (data || []).map(mapTestCaseFromDB)
  },

  async create(testCase: CreateTestCaseInput): Promise<TestCase> {
    console.log('🔍 Creating test case with data:', testCase)
    
    const dbData: Omit<TestCaseDB, 'id'> = {
      test_case: testCase.testCase,
      description: testCase.description,
      expected_result: testCase.expectedResult,
      status: testCase.status,
      priority: testCase.priority,
      category: testCase.category,
      assigned_tester: testCase.assignedTester,
      execution_date: testCase.executionDate,
      notes: testCase.notes,
      actual_result: testCase.actualResult,
      environment: testCase.environment,
      prerequisites: testCase.prerequisites,
      platform: testCase.platform,
      steps_to_reproduce: testCase.stepsToReproduce,
      project_id: testCase.projectId,
      suite_id: testCase.suiteId || undefined, // Convert empty string to undefined
      created_at: new Date(),
      updated_at: new Date()
    }

    console.log('📊 Database data to insert:', dbData)

    const { data, error } = await supabase
      .from('test_cases')
      .insert([dbData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Database error creating test case:', error)
      throw error
    }
    
    console.log('✅ Test case created successfully:', data)
    return mapTestCaseFromDB(data)
  },

  async update(id: string, updates: Partial<TestCase>): Promise<TestCase> {
    const dbUpdates: Partial<TestCaseDB> = {}
    
    if (updates.testCase !== undefined) dbUpdates.test_case = updates.testCase
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.expectedResult !== undefined) dbUpdates.expected_result = updates.expectedResult
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.assignedTester !== undefined) dbUpdates.assigned_tester = updates.assignedTester
    if (updates.executionDate !== undefined) dbUpdates.execution_date = updates.executionDate
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.actualResult !== undefined) dbUpdates.actual_result = updates.actualResult
    if (updates.environment !== undefined) dbUpdates.environment = updates.environment
    if (updates.prerequisites !== undefined) dbUpdates.prerequisites = updates.prerequisites
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform
    if (updates.stepsToReproduce !== undefined) dbUpdates.steps_to_reproduce = updates.stepsToReproduce
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId
    if (updates.suiteId !== undefined) dbUpdates.suite_id = updates.suiteId || undefined
    if (updates.automationScript !== undefined) {
      dbUpdates.automation_script = updates.automationScript ? {
        path: updates.automationScript.path,
        type: updates.automationScript.type,
        command: updates.automationScript.command,
        headless_mode: updates.automationScript.headlessMode,
        embedded_code: updates.automationScript.embeddedCode,
        last_run: updates.automationScript.lastRun,
        last_result: updates.automationScript.lastResult,
        execution_time: updates.automationScript.executionTime,
        output: updates.automationScript.output,
        error: updates.automationScript.error
      } : undefined
    }
    
    // Always update the updated_at timestamp
    dbUpdates.updated_at = new Date()

    const { data, error } = await supabase
      .from('test_cases')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return mapTestCaseFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('test_cases')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('test_cases')
      .delete()
      .in('id', ids)
    
    if (error) throw error
  }
}

// Test Suites
export const testSuiteService = {
  async getAll(projectId: string): Promise<TestSuite[]> {
    const { data, error } = await supabase
      .from('test_suites')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapTestSuiteFromDB)
  },

  async create(testSuite: CreateTestSuiteInput): Promise<TestSuite> {
    const dbData: Omit<TestSuiteDB, 'id'> = {
      name: testSuite.name,
      description: testSuite.description,
      project_id: testSuite.projectId,
      test_case_ids: testSuite.testCaseIds,
      created_at: new Date(),
      updated_at: new Date(),
      total_tests: 0,
      passed_tests: 0,
      failed_tests: 0,
      pending_tests: 0,
      tags: testSuite.tags,
      owner: testSuite.owner,
      is_active: testSuite.isActive
    }

    const { data, error } = await supabase
      .from('test_suites')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapTestSuiteFromDB(data)
  },

  async update(id: string, updates: Partial<TestSuite>): Promise<TestSuite> {
    const dbUpdates: Partial<TestSuiteDB> = {}
    
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId
    if (updates.testCaseIds !== undefined) dbUpdates.test_case_ids = updates.testCaseIds
    if (updates.lastRun !== undefined) dbUpdates.last_run = updates.lastRun
    if (updates.lastStatus !== undefined) dbUpdates.last_status = updates.lastStatus
    if (updates.totalTests !== undefined) dbUpdates.total_tests = updates.totalTests
    if (updates.passedTests !== undefined) dbUpdates.passed_tests = updates.passedTests
    if (updates.failedTests !== undefined) dbUpdates.failed_tests = updates.failedTests
    if (updates.pendingTests !== undefined) dbUpdates.pending_tests = updates.pendingTests
    if (updates.estimatedDuration !== undefined) dbUpdates.estimated_duration = updates.estimatedDuration
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags
    if (updates.owner !== undefined) dbUpdates.owner = updates.owner
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt

    const { data, error } = await supabase
      .from('test_suites')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return mapTestSuiteFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('test_suites')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getById(id: string): Promise<TestSuite | null> {
    const { data, error } = await supabase
      .from('test_suites')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    
    return mapTestSuiteFromDB(data)
  }
}

// Documents
export const documentService = {
  async getAll(projectId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapDocumentFromDB)
  },

  async create(document: CreateDocumentInput): Promise<Document> {
    const dbData: Omit<DocumentDB, 'id'> = {
      title: document.title,
      url: document.url,
      type: document.type,
      description: document.description,
      project_id: document.projectId,
      size: document.size,
      uploaded_by: document.uploadedBy,
      created_at: new Date()
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapDocumentFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Important Links
export const importantLinkService = {
  async getAll(projectId: string): Promise<ImportantLink[]> {
    const { data, error } = await supabase
      .from('important_links')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapImportantLinkFromDB)
  },

  async create(link: CreateImportantLinkInput): Promise<ImportantLink> {
    const dbData: Omit<ImportantLinkDB, 'id'> = {
      title: link.title,
      url: link.url,
      description: link.description,
      category: link.category,
      project_id: link.projectId,
      created_at: new Date()
    }

    const { data, error } = await supabase
      .from('important_links')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapImportantLinkFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('important_links')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Platforms
export const platformService = {
  async getAll(projectId: string): Promise<Platform[]> {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapPlatformFromDB)
  },

  async create(platform: CreatePlatformInput): Promise<Platform> {
    const dbData: Omit<PlatformDB, 'id'> = {
      name: platform.name,
      description: platform.description,
      project_id: platform.projectId,
      created_at: new Date()
    }

    const { data, error } = await supabase
      .from('platforms')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapPlatformFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('platforms')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Projects
export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapProjectFromDB)
  },

  async create(project: CreateProjectInput): Promise<Project> {
    const dbData: Omit<ProjectDB, 'id'> = {
      name: project.name,
      description: project.description,
      created_at: new Date(),
      is_active: true
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapProjectFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    
    return mapProjectFromDB(data)
  }
}

// Settings
export const settingsService = {
  async getSettings(): Promise<any> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
    
    if (error) throw error
    return data || []
  },

  async updateSettings(settings: any): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .upsert(settings)
    
    if (error) throw error
  }
}

// Comments service
export const commentService = {
  async getByTestCaseId(testCaseId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('test_case_id', testCaseId)
      .order('timestamp', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapCommentFromDB)
  },

  async create(comment: Omit<Comment, 'id'>): Promise<Comment> {
    const dbData = {
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
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapCommentFromDB(data)
  },

  async update(id: string, updates: Partial<Comment>): Promise<Comment> {
    const dbUpdates: any = {}
    
    if (updates.content !== undefined) dbUpdates.content = updates.content
    if (updates.author !== undefined) dbUpdates.author = updates.author
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.mentions !== undefined) dbUpdates.mentions = updates.mentions
    if (updates.isResolved !== undefined) dbUpdates.is_resolved = updates.isResolved
    if (updates.resolvedBy !== undefined) dbUpdates.resolved_by = updates.resolvedBy
    if (updates.resolvedAt !== undefined) dbUpdates.resolved_at = updates.resolvedAt
    if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments

    const { data, error } = await supabase
      .from('comments')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return mapCommentFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
} 

// Project Sharing Service
export const projectShareService = {
  async createShare(projectId: string, projectName: string, permissions: ProjectPermissions, options?: {
    expiresAt?: Date
    allowedEmails?: string[]
    maxViews?: number
  }): Promise<ProjectShare> {
    const accessToken = crypto.randomUUID()
    const shareData: Omit<ProjectShareDB, 'id'> = {
      project_id: projectId,
      project_name: projectName,
      access_token: accessToken,
      permissions,
      created_by: (await supabase.auth.getUser()).data.user?.id || 'anonymous',
      created_at: new Date(),
      expires_at: options?.expiresAt,
      is_active: true,
      allowed_emails: options?.allowedEmails,
      max_views: options?.maxViews,
      current_views: 0
    }

    const { data, error } = await supabase
      .from('project_shares')
      .insert([shareData])
      .select()
      .single()
    
    if (error) throw error
    return mapProjectShareFromDB(data)
  },

  async getShareByToken(accessToken: string): Promise<ProjectShare | null> {
    const { data, error } = await supabase
      .from('project_shares')
      .select('*')
      .eq('access_token', accessToken)
      .eq('is_active', true)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    
    return mapProjectShareFromDB(data)
  },

  async incrementViews(shareId: string): Promise<void> {
    // First get the current views count
    const { data: currentShare, error: fetchError } = await supabase
      .from('project_shares')
      .select('current_views')
      .eq('id', shareId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Then increment it
    const { error } = await supabase
      .from('project_shares')
      .update({ current_views: (currentShare.current_views || 0) + 1 })
      .eq('id', shareId)
    
    if (error) throw error
  },

  async getAllShares(projectId?: string): Promise<ProjectShare[]> {
    let query = supabase
      .from('project_shares')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data || []).map(mapProjectShareFromDB)
  },

  async deactivateShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('project_shares')
      .update({ is_active: false })
      .eq('id', shareId)
    
    if (error) throw error
  },

  async deleteShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('project_shares')
      .delete()
      .eq('id', shareId)
    
    if (error) throw error
  }
}

// Test Suite Sharing Service
export const testSuiteShareService = {
  async createShare(
    testSuiteId: string, 
    testSuiteName: string, 
    projectId: string, 
    projectName: string, 
    permissions: TestSuitePermissions, 
    options?: {
      expiresAt?: Date
      allowedEmails?: string[]
      maxViews?: number
    }
  ): Promise<TestSuiteShare> {
    const accessToken = crypto.randomUUID()
    const shareData: Omit<TestSuiteShareDB, 'id'> = {
      test_suite_id: testSuiteId,
      test_suite_name: testSuiteName,
      project_id: projectId,
      project_name: projectName,
      access_token: accessToken,
      permissions,
      created_by: (await supabase.auth.getUser()).data.user?.id || 'anonymous',
      created_at: new Date(),
      expires_at: options?.expiresAt,
      is_active: true,
      allowed_emails: options?.allowedEmails,
      max_views: options?.maxViews,
      current_views: 0
    }

    const { data, error } = await supabase
      .from('test_suite_shares')
      .insert([shareData])
      .select()
      .single()
    
    if (error) throw error
    return mapTestSuiteShareFromDB(data)
  },

  async getShareByToken(accessToken: string): Promise<TestSuiteShare | null> {
    const { data, error } = await supabase
      .from('test_suite_shares')
      .select('*')
      .eq('access_token', accessToken)
      .eq('is_active', true)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    
    return mapTestSuiteShareFromDB(data)
  },

  async incrementViews(shareId: string): Promise<void> {
    // First get the current views count
    const { data: currentShare, error: fetchError } = await supabase
      .from('test_suite_shares')
      .select('current_views')
      .eq('id', shareId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Then increment it
    const { error } = await supabase
      .from('test_suite_shares')
      .update({ current_views: (currentShare.current_views || 0) + 1 })
      .eq('id', shareId)
    
    if (error) throw error
  },

  async getAllShares(testSuiteId?: string): Promise<TestSuiteShare[]> {
    let query = supabase
      .from('test_suite_shares')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (testSuiteId) {
      query = query.eq('test_suite_id', testSuiteId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data || []).map(mapTestSuiteShareFromDB)
  },

  async deactivateShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('test_suite_shares')
      .update({ is_active: false })
      .eq('id', shareId)
    
    if (error) throw error
  },

  async deleteShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('test_suite_shares')
      .delete()
      .eq('id', shareId)
    
    if (error) throw error
  }
} 

export const statusHistoryService = {
  async getByTestCaseId(testCaseId: string): Promise<StatusHistory[]> {
    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('test_case_id', testCaseId)
      .order('changed_at', { ascending: false })
    
    if (error) throw error
    return data.map(mapStatusHistoryFromDB)
  },

  async create(history: Omit<StatusHistory, 'id'>): Promise<StatusHistory> {
    const dbData: Omit<StatusHistoryDB, 'id'> = {
      test_case_id: history.testCaseId,
      old_status: history.oldStatus,
      new_status: history.newStatus,
      changed_by: history.changedBy,
      changed_at: history.changedAt,
      notes: history.notes,
      reason: history.reason,
      metadata: history.metadata
    }

    const { data, error } = await supabase
      .from('status_history')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapStatusHistoryFromDB(data)
  },

  async getStatusChangeStats(projectId?: string, startDate?: Date, endDate?: Date) {
    let query = supabase.rpc('get_status_change_stats')
    
    if (projectId) {
      query = query.eq('project_uuid', projectId)
    }
    if (startDate) {
      query = query.gte('start_date', startDate.toISOString())
    }
    if (endDate) {
      query = query.lte('end_date', endDate.toISOString())
    }

    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  async getRecentChanges(limit: number = 10): Promise<StatusHistory[]> {
    const { data, error } = await supabase
      .from('status_history')
      .select(`
        *,
        test_cases!inner(test_case, project_id)
      `)
      .order('changed_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data.map(mapStatusHistoryFromDB)
  },

  async deleteByTestCaseId(testCaseId: string): Promise<void> {
    const { error } = await supabase
      .from('status_history')
      .delete()
      .eq('test_case_id', testCaseId)
    
    if (error) throw error
  }
} 