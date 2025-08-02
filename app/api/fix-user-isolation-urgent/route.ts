import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Only create client if both URL and key are available
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    // Check if supabase client is available
    if (!supabase) {
      console.error('❌ Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete. Please check your environment variables.' },
        { status: 500 }
      )
    }

    console.log('🔧 Applying urgent user isolation fix...')

    // 1. Enable RLS on all tables
    const enableRLSQueries = [
      'ALTER TABLE projects ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE documents ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE comments ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;'
    ]

    for (const query of enableRLSQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.warn('⚠️ Warning enabling RLS:', error.message)
      }
    }

    // 2. Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own projects" ON projects;',
      'DROP POLICY IF EXISTS "Users can insert own projects" ON projects;',
      'DROP POLICY IF EXISTS "Users can update own projects" ON projects;',
      'DROP POLICY IF EXISTS "Users can delete own projects" ON projects;',
      'DROP POLICY IF EXISTS "Users can view own test cases" ON test_cases;',
      'DROP POLICY IF EXISTS "Users can insert own test cases" ON test_cases;',
      'DROP POLICY IF EXISTS "Users can update own test cases" ON test_cases;',
      'DROP POLICY IF EXISTS "Users can delete own test cases" ON test_cases;',
      'DROP POLICY IF EXISTS "Users can view own test suites" ON test_suites;',
      'DROP POLICY IF EXISTS "Users can insert own test suites" ON test_suites;',
      'DROP POLICY IF EXISTS "Users can update own test suites" ON test_suites;',
      'DROP POLICY IF EXISTS "Users can delete own test suites" ON test_suites;'
    ]

    for (const query of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.warn('⚠️ Warning dropping policies:', error.message)
      }
    }

    // 3. Create new policies
    const createPolicies = [
      // Projects policies
      `CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);`,
      
      // Test cases policies
      `CREATE POLICY "Users can view own test cases" ON test_cases FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert own test cases" ON test_cases FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own test cases" ON test_cases FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete own test cases" ON test_cases FOR DELETE USING (auth.uid() = user_id);`,
      
      // Test suites policies
      `CREATE POLICY "Users can view own test suites" ON test_suites FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert own test suites" ON test_suites FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own test suites" ON test_suites FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete own test suites" ON test_suites FOR DELETE USING (auth.uid() = user_id);`
    ]

    for (const query of createPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.error('❌ Error creating policy:', error.message)
        return NextResponse.json(
          { error: `Failed to create policy: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // 4. Check current data
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .limit(10)

    const { data: testCasesData, error: testCasesError } = await supabase
      .from('test_cases')
      .select('id, test_case, user_id')
      .limit(10)

    console.log('📊 Current data check:')
    console.log('Projects:', projectsData?.length || 0, 'projects')
    console.log('Test cases:', testCasesData?.length || 0, 'test cases')

    return NextResponse.json({
      success: true,
      message: 'User isolation fix applied successfully',
      data: {
        projectsCount: projectsData?.length || 0,
        testCasesCount: testCasesData?.length || 0,
        projects: projectsData,
        testCases: testCasesData
      }
    })

  } catch (error) {
    console.error('❌ Error applying user isolation fix:', error)
    return NextResponse.json(
      { error: 'Failed to apply user isolation fix' },
      { status: 500 }
    )
  }
} 