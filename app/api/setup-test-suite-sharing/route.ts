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

    console.log('🔧 Setting up test suite sharing schema...')

    // Create test_suite_shares table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS test_suite_shares (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        test_suite_id UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
        test_suite_name TEXT NOT NULL,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        project_name TEXT NOT NULL,
        access_token TEXT NOT NULL UNIQUE,
        permissions JSONB NOT NULL DEFAULT '{"canView": true, "canComment": false, "canEdit": false, "canCreate": false, "canDelete": false, "canExport": false}',
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        allowed_emails TEXT[],
        max_views INTEGER,
        current_views INTEGER DEFAULT 0
      );
    `

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableQuery })
    
    if (tableError) {
      console.error('❌ Error creating test_suite_shares table:', tableError)
      return NextResponse.json(
        { error: `Failed to create test_suite_shares table: ${tableError.message}` },
        { status: 500 }
      )
    }

    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_test_suite_shares_access_token ON test_suite_shares(access_token);',
      'CREATE INDEX IF NOT EXISTS idx_test_suite_shares_test_suite_id ON test_suite_shares(test_suite_id);',
      'CREATE INDEX IF NOT EXISTS idx_test_suite_shares_project_id ON test_suite_shares(project_id);',
      'CREATE INDEX IF NOT EXISTS idx_test_suite_shares_created_by ON test_suite_shares(created_by);'
    ]

    for (const indexQuery of indexQueries) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexQuery })
      if (indexError) {
        console.error('❌ Error creating index:', indexError)
        return NextResponse.json(
          { error: `Failed to create index: ${indexError.message}` },
          { status: 500 }
        )
      }
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE test_suite_shares ENABLE ROW LEVEL SECURITY;' 
    })
    
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError)
      return NextResponse.json(
        { error: `Failed to enable RLS: ${rlsError.message}` },
        { status: 500 }
      )
    }

    // Create RLS policies
    const policyQueries = [
      `CREATE POLICY "Users can view their own test suite shares" ON test_suite_shares
         FOR SELECT USING (auth.uid() = created_by);`,
      `CREATE POLICY "Users can create their own test suite shares" ON test_suite_shares
         FOR INSERT WITH CHECK (auth.uid() = created_by);`,
      `CREATE POLICY "Users can update their own test suite shares" ON test_suite_shares
         FOR UPDATE USING (auth.uid() = created_by);`,
      `CREATE POLICY "Users can delete their own test suite shares" ON test_suite_shares
         FOR DELETE USING (auth.uid() = created_by);`,
      `CREATE POLICY "Public can view active test suite shares" ON test_suite_shares
         FOR SELECT USING (is_active = true);`
    ]

    for (const policyQuery of policyQueries) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policyQuery })
      if (policyError && !policyError.message.includes('already exists')) {
        console.error('❌ Error creating policy:', policyError)
        return NextResponse.json(
          { error: `Failed to create policy: ${policyError.message}` },
          { status: 500 }
        )
      }
    }

    // Create function to validate test suite share access
    const validateFunctionQuery = `
      CREATE OR REPLACE FUNCTION validate_test_suite_share_access(share_token TEXT, user_email TEXT DEFAULT NULL)
      RETURNS TABLE(
          is_valid BOOLEAN,
          test_suite_id UUID,
          project_id UUID,
          permissions JSONB,
          error_message TEXT
      ) AS $$
      DECLARE
          share_record RECORD;
      BEGIN
          -- Get share details
          SELECT * INTO share_record
          FROM test_suite_shares
          WHERE access_token = share_token AND is_active = true;
          
          -- Check if share exists
          IF NOT FOUND THEN
              RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, 'Test suite share link is invalid or has expired.'::TEXT;
              RETURN;
          END IF;
          
          -- Check if share is expired
          IF share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW() THEN
              RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, 'Test suite share link has expired.'::TEXT;
              RETURN;
          END IF;
          
          -- Check if max views exceeded
          IF share_record.max_views IS NOT NULL AND share_record.current_views >= share_record.max_views THEN
              RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, 'Test suite share link has reached its maximum number of views.'::TEXT;
              RETURN;
          END IF;
          
          -- Check if email is restricted
          IF share_record.allowed_emails IS NOT NULL AND array_length(share_record.allowed_emails, 1) > 0 THEN
              IF user_email IS NULL OR NOT (user_email = ANY(share_record.allowed_emails)) THEN
                  RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, 'Access denied. Your email is not authorized to view this test suite.'::TEXT;
                  RETURN;
              END IF;
          END IF;
          
          -- Increment view count
          UPDATE test_suite_shares 
          SET current_views = current_views + 1
          WHERE id = share_record.id;
          
          -- Return valid access
          RETURN QUERY SELECT true, share_record.test_suite_id, share_record.project_id, share_record.permissions, NULL::TEXT;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: validateFunctionQuery })
    if (functionError) {
      console.error('❌ Error creating validation function:', functionError)
      return NextResponse.json(
        { error: `Failed to create validation function: ${functionError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Test suite sharing schema setup completed!')

    return NextResponse.json({
      success: true,
      message: 'Test suite sharing schema has been set up successfully',
      tables: ['test_suite_shares'],
      indexes: ['idx_test_suite_shares_access_token', 'idx_test_suite_shares_test_suite_id', 'idx_test_suite_shares_project_id', 'idx_test_suite_shares_created_by'],
      policies: ['Users can view their own test suite shares', 'Users can create their own test suite shares', 'Users can update their own test suite shares', 'Users can delete their own test suite shares', 'Public can view active test suite shares'],
      functions: ['validate_test_suite_share_access']
    })

  } catch (error) {
    console.error('❌ Error setting up test suite sharing schema:', error)
    return NextResponse.json(
      { 
        error: 'Failed to set up test suite sharing schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
