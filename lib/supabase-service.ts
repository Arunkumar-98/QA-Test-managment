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
  SharedProjectReference,
  SharedProjectReferenceDB,
  Note,
  NoteDB,
  CreateNoteInput,
  ProjectMembership,
  ProjectMembershipDB,
  CreateProjectMembershipInput,
  ProjectWithMembership,
  ProjectRole,
  MembershipStatus,
  ProjectInvitation,
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
  mapTestSuiteShareToDB,
  mapSharedProjectReferenceFromDB,
  mapSharedProjectReferenceToDB,
  mapNoteFromDB,
  mapNoteToDB,
  mapProjectMembershipFromDB,
  mapProjectMembershipToDB,
  CustomColumn,
  CreateCustomColumnInput,
  mapCustomColumnFromDB,
  mapCustomColumnToDB
} from '@/types/qa-types'

// Test Cases
export const testCaseService = {
  async getAll(projectId: string): Promise<TestCase[]> {
    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
    
    if (error) throw error
    return (data || []).map(mapTestCaseFromDB)
  },

  async create(testCase: CreateTestCaseInput): Promise<TestCase> {
    // Use a database function to atomically get the next position and insert
    // This prevents race conditions where multiple test cases could get the same position
    
    const dbData = {
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

    // Only add automation_script if it exists and has data
    if (testCase.automationScript) {
      (dbData as any).automation_script = {
        path: testCase.automationScript.path,
        type: testCase.automationScript.type,
        command: testCase.automationScript.command,
        headless_mode: testCase.automationScript.headlessMode,
        embedded_code: testCase.automationScript.embeddedCode,
        last_run: testCase.automationScript.lastRun,
        last_result: testCase.automationScript.lastResult,
        execution_time: testCase.automationScript.executionTime,
        output: testCase.automationScript.output,
        error: testCase.automationScript.error
      }
    }

    console.log('📊 Database data to insert:', dbData)

    // Try to use the atomic database function first
    try {
      console.log('🚀 Attempting to use atomic function with data:', dbData)
      const { data, error } = await supabase.rpc('insert_test_case_with_next_position', {
        p_test_case_data: dbData
      })
      
      if (error) {
        console.error('❌ Atomic function error:', error)
        throw error // This will trigger the fallback
      }
      
      console.log('✅ Test case created successfully using atomic function:', data)
      return mapTestCaseFromDB(data)
    } catch (atomicError) {
      console.error('❌ Atomic function failed, error details:', {
        message: atomicError instanceof Error ? atomicError.message : String(atomicError),
        code: (atomicError as any)?.code,
        details: (atomicError as any)?.details
      })
      console.log('🔄 Falling back to manual position assignment...')
      
      // Fallback: Manual position assignment with retry logic
      let retries = 10 // Increased retries
      let baseDelay = 50 // Start with shorter delay
      
      while (retries > 0) {
        try {
          // Get the current max position with a more reliable query
          const { data: maxPositionResult, error: queryError } = await supabase
            .from('test_cases')
            .select('position')
            .eq('project_id', testCase.projectId)
            .order('position', { ascending: false })
            .limit(1)
          
          if (queryError) throw queryError
          
          let position = 1
          if (maxPositionResult && maxPositionResult.length > 0) {
            position = maxPositionResult[0].position + 1
          }

          // Add position to the data
          const dbDataWithPosition = {
            ...dbData,
            position: position
          }

          console.log(`🔄 Attempting to insert with position ${position} (${retries} retries left)`)

          // Try to insert with the calculated position
          const { data, error } = await supabase
            .from('test_cases')
            .insert([dbDataWithPosition])
            .select()
            .single()
          
          if (error) {
            // If it's a constraint violation, retry with a different position
            if (error.code === '23505' && error.message.includes('unique_position_per_project')) {
              console.log(`❌ Position ${position} already taken, retrying... (${retries} retries left)`)
              retries--
              if (retries > 0) {
                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, 10 - retries) + Math.random() * 50
                await new Promise(resolve => setTimeout(resolve, delay))
                position += Math.floor(Math.random() * 3) + 1 // Random increment 1-3
                continue
              }
            }
            throw error
          }
          
          console.log('✅ Test case created successfully with manual position assignment:', data)
          return mapTestCaseFromDB(data)
        } catch (fallbackError) {
          console.error('❌ Error in fallback position assignment:', fallbackError)
          if (retries <= 1) {
            throw fallbackError
          }
          retries--
          await new Promise(resolve => setTimeout(resolve, baseDelay))
        }
      }
      
      throw new Error('Failed to create test case after multiple retries')
    }
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
    if (updates.position !== undefined) dbUpdates.position = updates.position
    if (updates.automationScript !== undefined) {
      if (updates.automationScript) {
        (dbUpdates as any).automation_script = {
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
        }
      } else {
        (dbUpdates as any).automation_script = null
      }
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
    console.log('🗑️ Attempting to delete test case:', id)
    
    try {
      // Try to use the position-aware delete function first
      const { error } = await supabase.rpc('delete_test_case_and_reorder', {
        p_test_case_id: id
      })
      
      if (error) {
        console.warn('⚠️ Atomic delete function failed, falling back to manual delete:', error.message)
        throw error // This will trigger the fallback
      }
      
      console.log('✅ Test case deleted successfully using atomic function:', id)
      return
    } catch (atomicError) {
      console.log('🔄 Falling back to manual delete with position reordering...')
      
      // Fallback: Manual delete with position reordering
      try {
        // First, get the test case details to know its position and project
        const { data: testCase, error: fetchError } = await supabase
          .from('test_cases')
          .select('position, project_id')
          .eq('id', id)
          .single()
        
        if (fetchError) {
          console.error('❌ Failed to fetch test case for deletion:', fetchError)
          throw fetchError
        }
        
        if (!testCase) {
          console.error('❌ Test case not found for deletion:', id)
          throw new Error('Test case not found')
        }
        
        console.log('📊 Test case details for deletion:', testCase)
        
        // Delete the test case
        const { error: deleteError } = await supabase
          .from('test_cases')
          .delete()
          .eq('id', id)
        
        if (deleteError) {
          console.error('❌ Failed to delete test case:', deleteError)
          throw deleteError
        }
        
        // Reorder remaining test cases in the same project
        // Get all test cases that need position adjustment
        const { data: testCasesToUpdate, error: fetchUpdateError } = await supabase
          .from('test_cases')
          .select('id, position')
          .eq('project_id', testCase.project_id)
          .gte('position', testCase.position + 1)
          .order('position', { ascending: true })
        
        if (fetchUpdateError) {
          console.warn('⚠️ Failed to fetch test cases for position update:', fetchUpdateError)
        } else if (testCasesToUpdate && testCasesToUpdate.length > 0) {
          // Update positions one by one to avoid conflicts
          for (const tc of testCasesToUpdate) {
            const { error: updateError } = await supabase
              .from('test_cases')
              .update({ position: tc.position - 1 })
              .eq('id', tc.id)
            
            if (updateError) {
              console.warn(`⚠️ Failed to update position for test case ${tc.id}:`, updateError)
            }
          }
        }
        
        console.log('✅ Test case deleted successfully with manual fallback:', id)
      } catch (fallbackError) {
        console.error('❌ Manual delete fallback also failed:', fallbackError)
        throw fallbackError
      }
    }
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    // For multiple deletions, we need to handle position reordering properly
    console.log('🗑️ Starting bulk deletion of test cases:', { ids, count: ids.length })
    
    if (ids.length === 0) return
    
    try {
      // Get all test cases to be deleted with their positions
      const { data: testCasesToDelete, error: fetchError } = await supabase
        .from('test_cases')
        .select('id, position, project_id')
        .in('id', ids)
        .order('position', { ascending: true })
      
      if (fetchError) {
        console.error('❌ Failed to fetch test cases for deletion:', fetchError)
        throw fetchError
      }
      
      if (!testCasesToDelete || testCasesToDelete.length === 0) {
        console.warn('⚠️ No test cases found to delete')
        return
      }
      
      // Group by project to handle position reordering properly
      const testCasesByProject = testCasesToDelete.reduce((acc, tc) => {
        if (!acc[tc.project_id]) {
          acc[tc.project_id] = []
        }
        acc[tc.project_id].push(tc)
        return acc
      }, {} as Record<string, typeof testCasesToDelete>)
      
      // Delete test cases and handle position reordering for each project
      for (const [projectId, projectTestCases] of Object.entries(testCasesByProject)) {
        console.log(`🗑️ Processing project ${projectId} with ${projectTestCases.length} test cases to delete`)
        
        // Delete test cases in reverse position order to minimize position conflicts
        const sortedTestCases = [...projectTestCases].sort((a, b) => b.position - a.position)
        
        for (const testCase of sortedTestCases) {
          try {
            console.log(`🗑️ Deleting test case ${testCase.id} at position ${testCase.position}`)
            
            // Delete the test case
            const { error: deleteError } = await supabase
              .from('test_cases')
              .delete()
              .eq('id', testCase.id)
            
            if (deleteError) {
              console.error(`❌ Failed to delete test case ${testCase.id}:`, deleteError)
              throw deleteError
            }
            
            // Update positions of remaining test cases in this project
            // Get all test cases that need position adjustment
            const { data: testCasesToUpdate, error: fetchUpdateError } = await supabase
              .from('test_cases')
              .select('id, position')
              .eq('project_id', projectId)
              .gt('position', testCase.position)
              .order('position', { ascending: true })
            
            if (fetchUpdateError) {
              console.warn(`⚠️ Failed to fetch test cases for position update:`, fetchUpdateError)
            } else if (testCasesToUpdate && testCasesToUpdate.length > 0) {
              // Update positions one by one to avoid conflicts
              for (const tc of testCasesToUpdate) {
                const { error: updateError } = await supabase
                  .from('test_cases')
                  .update({ position: tc.position - 1 })
                  .eq('id', tc.id)
                
                if (updateError) {
                  console.warn(`⚠️ Failed to update position for test case ${tc.id}:`, updateError)
                }
              }
            }
            
            console.log(`✅ Successfully deleted test case ${testCase.id}`)
          } catch (error) {
            console.error(`❌ Failed to delete test case ${testCase.id}:`, error)
            throw error
          }
        }
      }
      
      console.log('✅ Bulk deletion completed successfully')
    } catch (error) {
      console.error('❌ Bulk deletion failed:', error)
      throw error
    }
  },

  async reorderTestCase(testCaseId: string, newPosition: number): Promise<void> {
    const { error } = await supabase.rpc('reorder_test_cases', {
      p_test_case_id: testCaseId,
      p_new_position: newPosition
    })
    
    if (error) throw error
  },

  async insertAtPosition(testCaseData: CreateTestCaseInput, position: number): Promise<TestCase> {
    const { data, error } = await supabase.rpc('insert_test_case_at_position', {
      p_test_case_data: testCaseData,
      p_position: position
    })
    
    if (error) throw error
    
    // Fetch the created test case
    const { data: createdTestCase, error: fetchError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('id', data)
      .single()
    
    if (fetchError) throw fetchError
    return mapTestCaseFromDB(createdTestCase)
  },

  async deleteAndReorder(testCaseId: string): Promise<void> {
    // This is just an alias for the delete method now
    await this.delete(testCaseId)
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
  async getAll(projectId?: string): Promise<Platform[]> {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapPlatformFromDB)
  },

  async create(platform: CreatePlatformInput): Promise<Platform> {
    const dbData = {
      name: platform.name,
      description: platform.description,
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
    // Get only projects belonging to the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No authenticated user found')
      return []
    }
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching projects:', error)
      throw error
    }
    
    console.log('📊 Projects fetched:', data?.length || 0, 'projects')
    if (data && data.length > 0) {
      console.log('📋 Project details:', data.map(p => ({ id: p.id, name: p.name, user_id: p.user_id })))
    }
    
    // Transform to include team collaboration fields (when available)
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      isActive: row.is_active,
      userId: row.user_id,
      isOwner: true, // For now, assume user owns all projects they can see
      sharedBy: null, // Will be populated when team collaboration is working
      permissionLevel: 'admin' // Will be populated when team collaboration is working
    }))
  },

  async create(project: CreateProjectInput): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No authenticated user found')
      throw new Error('User not authenticated')
    }
    
    const dbData: Omit<ProjectDB, 'id'> = {
      name: project.name,
      description: project.description,
      created_at: new Date(),
      is_active: true,
      user_id: user.id
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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No authenticated user found')
      throw new Error('User not authenticated')
    }
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

  async getById(id: string): Promise<Project | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No authenticated user found')
      return null
    }
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    
    return mapProjectFromDB(data)
  },

  // Team collaboration methods
  async shareProject(projectId: string, userEmail: string, permissionLevel: 'view' | 'edit' | 'admin' = 'view'): Promise<any> {
    const { data, error } = await supabase.rpc('share_project_with_user', {
      p_project_id: projectId,
      p_target_user_email: userEmail,
      p_permission_level: permissionLevel
    })
    
    if (error) throw error
    return data
  },

  async removeUserFromProject(projectId: string, userEmail: string): Promise<any> {
    const { data, error } = await supabase.rpc('remove_user_from_project', {
      p_project_id: projectId,
      p_target_user_email: userEmail
    })
    
    if (error) throw error
    return data
  },

  async getProjectMembers(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        *,
        user:user_id(email),
        owner:owner_id(email)
      `)
      .eq('project_id', projectId)
    
    if (error) throw error
    return data || []
  },

  async getProjectActivity(projectId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_activity_log')
      .select(`
        *,
        user:user_id(email)
      `)
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  async logActivity(projectId: string, actionType: string, entityType: string, entityId?: string, oldValues?: any, newValues?: any, description?: string): Promise<void> {
    const { error } = await supabase.rpc('log_project_activity', {
      p_project_id: projectId,
      p_action_type: actionType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_old_values: oldValues,
      p_new_values: newValues,
      p_description: description
    })
    
    if (error) {
      console.error('Failed to log activity:', error)
      // Don't throw error for logging failures
    }
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

// Shared Project References Service (Live Sync)
export const sharedProjectReferenceService = {
  async getAll(): Promise<SharedProjectReference[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const { data, error } = await supabase
      .from('shared_project_references')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapSharedProjectReferenceFromDB)
  },

  async getById(id: string): Promise<SharedProjectReference | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const { data, error } = await supabase
      .from('shared_project_references')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    
    return mapSharedProjectReferenceFromDB(data)
  },

  async create(reference: Omit<SharedProjectReference, 'id' | 'createdAt' | 'lastSyncedAt'>): Promise<SharedProjectReference> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const dbData = mapSharedProjectReferenceToDB({
      ...reference,
      id: '',
      createdAt: new Date(),
      lastSyncedAt: new Date()
    })
    
    const { data, error } = await supabase
      .from('shared_project_references')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapSharedProjectReferenceFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const { error } = await supabase
      .from('shared_project_references')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

  async updateLastSynced(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const { error } = await supabase
      .from('shared_project_references')
      .update({ last_synced_at: new Date() })
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) throw error
  }
}

// Notes Service
export const noteService = {
  async getAll(projectId: string): Promise<Note[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapNoteFromDB)
  },

  async create(note: CreateNoteInput): Promise<Note> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const dbData = mapNoteToDB({
      ...note,
      id: '', // Will be generated by database
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const { data, error } = await supabase
      .from('notes')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return mapNoteFromDB(data)
  },

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const updateData = {
      ...updates,
      updated_at: new Date()
    }

    // Remove fields that shouldn't be updated
    delete (updateData as any).id
    delete (updateData as any).created_at
    delete (updateData as any).user_id
    delete (updateData as any).project_id

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return mapNoteFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

  async getById(id: string): Promise<Note | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    
    return mapNoteFromDB(data)
  },

  async togglePin(id: string): Promise<Note> {
    const note = await this.getById(id)
    if (!note) {
      throw new Error('Note not found')
    }

    return this.update(id, { isPinned: !note.isPinned })
  }
}

// Project Membership Service
export const projectMembershipService = {
  async getAllForUser(): Promise<ProjectWithMembership[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .rpc('get_user_projects', { user_uuid: user.id })
    
    if (error) throw error
    
    return (data || []).map(row => ({
      id: row.project_id,
      name: row.project_name,
      description: row.project_description,
      userRole: row.user_role,
      isOwner: row.is_owner,
      memberCount: row.member_count,
      isMultiUser: true,
      createdAt: row.created_at
    }))
  },

  async getProjectMembers(projectId: string): Promise<ProjectMembership[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('project_memberships')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(mapProjectMembershipFromDB)
  },

  async inviteUser(projectId: string, userEmail: string, role: ProjectRole): Promise<ProjectMembership> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // First, get the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) throw userError

    const invitedUser = userData.users.find(u => u.email === userEmail)
    if (!invitedUser) {
      throw new Error('User not found with that email address')
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('project_memberships')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', invitedUser.id)
      .single()

    if (existingMembership) {
      throw new Error('User is already a member of this project')
    }

    // Create membership
    const membershipData = mapProjectMembershipToDB({
      id: '',
      projectId,
      userId: invitedUser.id,
      role,
      invitedBy: user.id,
      invitedAt: new Date(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const { data, error } = await supabase
      .from('project_memberships')
      .insert([membershipData])
      .select()
      .single()
    
    if (error) throw error
    return mapProjectMembershipFromDB(data)
  },

  async acceptInvitation(membershipId: string): Promise<ProjectMembership> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('project_memberships')
      .update({ 
        status: 'accepted',
        accepted_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', membershipId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return mapProjectMembershipFromDB(data)
  },

  async declineInvitation(membershipId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('project_memberships')
      .update({ 
        status: 'declined',
        updated_at: new Date()
      })
      .eq('id', membershipId)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

  async updateUserRole(projectId: string, userId: string, newRole: ProjectRole): Promise<ProjectMembership> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('project_memberships')
      .update({ 
        role: newRole,
        updated_at: new Date()
      })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return mapProjectMembershipFromDB(data)
  },

  async removeUser(projectId: string, userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('project_memberships')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  async getPendingInvitations(): Promise<ProjectInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('project_memberships')
      .select(`
        id,
        project_id,
        role,
        invited_at,
        status,
        projects!inner(name),
        auth.users!invited_by(email)
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('invited_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map(row => ({
      id: row.id,
      projectId: row.project_id,
      projectName: row.projects.name,
      invitedBy: row.invited_by,
      invitedByEmail: row.auth?.users?.email || 'Unknown',
      role: row.role,
      invitedAt: row.invited_at,
      status: row.status
    }))
  },

  async hasPermission(projectId: string, requiredRole: ProjectRole): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .rpc('has_project_permission', {
        project_uuid: projectId,
        user_uuid: user.id,
        required_role: requiredRole
      })
    
    if (error) return false
    return data || false
  }
} 

// Custom Column Service
export const customColumnService = {
  async getAll(projectId: string): Promise<CustomColumn[]> {
    const { data, error } = await supabase
      .from('custom_columns')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data.map(mapCustomColumnFromDB)
  },

  async create(column: CreateCustomColumnInput): Promise<CustomColumn> {
    const { data, error } = await supabase
      .from('custom_columns')
      .insert(mapCustomColumnToDB({ ...column, id: '', createdAt: new Date(), updatedAt: new Date() }))
      .select()
      .single()

    if (error) throw error
    return mapCustomColumnFromDB(data)
  },

  async update(id: string, updates: Partial<CustomColumn>): Promise<CustomColumn> {
    const { data, error } = await supabase
      .from('custom_columns')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapCustomColumnFromDB(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_columns')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async updateTestCaseCustomFields(testCaseId: string, customFields: { [key: string]: any }): Promise<void> {
    const { error } = await supabase
      .from('test_cases')
      .update({ custom_fields: customFields, updated_at: new Date() })
      .eq('id', testCaseId)

    if (error) throw error
  }
} 