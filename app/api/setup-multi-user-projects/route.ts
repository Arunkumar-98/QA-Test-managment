import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Missing Supabase configuration' },
      { status: 500 }
    )
  }

  try {
    // Check if project_memberships table exists
    const { error: checkError } = await supabase.from('project_memberships').select('id').limit(1)
    
    if (checkError && checkError.message.includes('relation "project_memberships" does not exist')) {
      console.log('Multi-user project tables do not exist, creating them...')
      
      // Create the multi-user project system using SQL
      const setupSQL = `
        -- Create project_memberships table
        CREATE TABLE IF NOT EXISTS project_memberships (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
          invited_by UUID REFERENCES auth.users(id),
          invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          accepted_at TIMESTAMP WITH TIME ZONE,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(project_id, user_id)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_project_memberships_project_id ON project_memberships(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_memberships_user_id ON project_memberships(user_id);
        CREATE INDEX IF NOT EXISTS idx_project_memberships_role ON project_memberships(role);
        CREATE INDEX IF NOT EXISTS idx_project_memberships_status ON project_memberships(status);

        -- Enable Row Level Security
        ALTER TABLE project_memberships ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for project_memberships
        DROP POLICY IF EXISTS "Users can view project memberships they're part of" ON project_memberships;
        CREATE POLICY "Users can view project memberships they're part of" ON project_memberships
          FOR SELECT USING (
            user_id = auth.uid() OR 
            project_id IN (
              SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
            )
          );

        DROP POLICY IF EXISTS "Project owners and admins can manage memberships" ON project_memberships;
        CREATE POLICY "Project owners and admins can manage memberships" ON project_memberships
          FOR ALL USING (
            project_id IN (
              SELECT project_id FROM project_memberships 
              WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
          );

        -- Grant permissions
        GRANT ALL ON project_memberships TO authenticated;

        -- Update projects table to support multi-ownership
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_multi_user BOOLEAN DEFAULT false;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

        -- Update existing projects to set created_by
        UPDATE projects SET created_by = user_id WHERE created_by IS NULL;

        -- Create function to get user's projects (including shared ones)
        CREATE OR REPLACE FUNCTION get_user_projects(user_uuid UUID)
        RETURNS TABLE (
          project_id UUID,
          project_name TEXT,
          project_description TEXT,
          user_role TEXT,
          is_owner BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE,
          member_count INTEGER
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            p.id as project_id,
            p.name as project_name,
            p.description as project_description,
            pm.role as user_role,
            (pm.role = 'owner') as is_owner,
            p.created_at,
            (SELECT COUNT(*) FROM project_memberships WHERE project_id = p.id AND status = 'accepted') as member_count
          FROM projects p
          INNER JOIN project_memberships pm ON p.id = pm.project_id
          WHERE pm.user_id = user_uuid AND pm.status = 'accepted'
          ORDER BY p.created_at DESC;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create function to check if user has permission on project
        CREATE OR REPLACE FUNCTION has_project_permission(
          project_uuid UUID,
          user_uuid UUID,
          required_role TEXT
        )
        RETURNS BOOLEAN AS $$
        DECLARE
          user_role TEXT;
        BEGIN
          SELECT role INTO user_role
          FROM project_memberships
          WHERE project_id = project_uuid 
            AND user_id = user_uuid 
            AND status = 'accepted';
          
          IF user_role IS NULL THEN
            RETURN FALSE;
          END IF;
          
          -- Role hierarchy: owner > admin > editor > viewer
          CASE required_role
            WHEN 'owner' THEN RETURN user_role = 'owner';
            WHEN 'admin' THEN RETURN user_role IN ('owner', 'admin');
            WHEN 'editor' THEN RETURN user_role IN ('owner', 'admin', 'editor');
            WHEN 'viewer' THEN RETURN user_role IN ('owner', 'admin', 'editor', 'viewer');
            ELSE RETURN FALSE;
          END CASE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      // Try to execute the SQL using rpc if available
      try {
        const { error: execError } = await supabase.rpc('exec_sql', { sql: setupSQL })
        
        if (execError) {
          console.log('RPC exec_sql failed, providing manual instructions...')
          return NextResponse.json({
            success: false,
            message: 'Multi-user project setup requires manual SQL execution. Please run the SQL script manually in your Supabase dashboard.',
            sql: setupSQL
          })
        }
      } catch (rpcError) {
        console.log('RPC not available, providing manual instructions...')
        return NextResponse.json({
          success: false,
          message: 'Multi-user project setup requires manual SQL execution. Please run the SQL script manually in your Supabase dashboard.',
          sql: setupSQL
        })
      }
    }

    // Verify the table was created successfully
    const { data: verifyData, error: verifyError } = await supabase
      .from('project_memberships')
      .select('id')
      .limit(1)

    if (verifyError) {
      return NextResponse.json(
        { error: `Failed to verify project_memberships table: ${verifyError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Multi-user project system setup completed successfully!',
      tableExists: true
    })

  } catch (error) {
    console.error('Error setting up multi-user project system:', error)
    return NextResponse.json(
      { error: 'Failed to setup multi-user project system' },
      { status: 500 }
    )
  }
} 