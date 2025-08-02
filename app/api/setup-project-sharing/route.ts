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

    console.log('🔧 Setting up project sharing schema...')

    // Create project_shares table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS project_shares (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
      console.error('❌ Error creating project_shares table:', tableError)
      return NextResponse.json(
        { error: `Failed to create project_shares table: ${tableError.message}` },
        { status: 500 }
      )
    }

    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_project_shares_access_token ON project_shares(access_token);',
      'CREATE INDEX IF NOT EXISTS idx_project_shares_project_id ON project_shares(project_id);',
      'CREATE INDEX IF NOT EXISTS idx_project_shares_created_by ON project_shares(created_by);'
    ]

    for (const query of indexQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.warn('⚠️ Warning creating index:', error.message)
      }
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;' })
    
    if (rlsError) {
      console.warn('⚠️ Warning enabling RLS:', rlsError.message)
    }

    // Create RLS policies
    const policyQueries = [
      `CREATE POLICY "Users can view their own shares" ON project_shares FOR SELECT USING (auth.uid() = created_by);`,
      `CREATE POLICY "Users can create their own shares" ON project_shares FOR INSERT WITH CHECK (auth.uid() = created_by);`,
      `CREATE POLICY "Users can update their own shares" ON project_shares FOR UPDATE USING (auth.uid() = created_by);`,
      `CREATE POLICY "Users can delete their own shares" ON project_shares FOR DELETE USING (auth.uid() = created_by);`,
      `CREATE POLICY "Public can view active shares" ON project_shares FOR SELECT USING (is_active = true);`
    ]

    for (const query of policyQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.warn('⚠️ Warning creating policy:', error.message)
      }
    }

    // Grant permissions
    const { error: grantError } = await supabase.rpc('exec_sql', { sql: 'GRANT ALL ON project_shares TO anon, authenticated;' })
    
    if (grantError) {
      console.warn('⚠️ Warning granting permissions:', grantError.message)
    }

    console.log('✅ Project sharing schema setup completed!')

    return NextResponse.json({
      success: true,
      message: 'Project sharing schema has been set up successfully',
      tables: ['project_shares']
    })

  } catch (error) {
    console.error('❌ Unexpected error in setup project sharing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 