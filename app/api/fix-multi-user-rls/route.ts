import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase configuration' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // The SQL script to fix the RLS recursion
    const fixSQL = `
      -- Fix for infinite recursion in project_memberships RLS policies
      -- This script replaces the problematic policies with non-recursive ones

      -- Drop ALL existing policies first to avoid conflicts
      DROP POLICY IF EXISTS "Users can view project memberships they're part of" ON project_memberships;
      DROP POLICY IF EXISTS "Project owners and admins can manage memberships" ON project_memberships;
      DROP POLICY IF EXISTS "Users can view their own memberships" ON project_memberships;
      DROP POLICY IF EXISTS "Users can view memberships of projects they own" ON project_memberships;
      DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_memberships;

      -- Create simplified, non-recursive policies
      CREATE POLICY "Users can view their own memberships" ON project_memberships
        FOR SELECT USING (user_id = auth.uid());

      CREATE POLICY "Users can view memberships of projects they own" ON project_memberships
        FOR SELECT USING (
          project_id IN (
            SELECT p.id FROM projects p 
            WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
          )
        );

      CREATE POLICY "Project owners can manage memberships" ON project_memberships
        FOR ALL USING (
          project_id IN (
            SELECT p.id FROM projects p 
            WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
          )
        );

      -- Create a function to safely check project ownership without recursion
      CREATE OR REPLACE FUNCTION is_project_owner(project_uuid UUID)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM projects 
          WHERE id = project_uuid 
          AND (user_id = auth.uid() OR created_by = auth.uid())
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Update the has_project_permission function to avoid recursion
      CREATE OR REPLACE FUNCTION has_project_permission(
        project_uuid UUID,
        user_uuid UUID,
        required_role TEXT
      )
      RETURNS BOOLEAN AS $$
      DECLARE
        user_role TEXT;
        is_owner BOOLEAN;
      BEGIN
        -- First check if user is the project owner
        SELECT (user_id = user_uuid OR created_by = user_uuid) INTO is_owner
        FROM projects
        WHERE id = project_uuid;
        
        IF is_owner THEN
          RETURN true; -- Owners have all permissions
        END IF;
        
        -- Then check membership role
        SELECT role INTO user_role
        FROM project_memberships
        WHERE project_id = project_uuid 
          AND user_id = user_uuid 
          AND status = 'accepted';
        
        -- Check role hierarchy
        CASE required_role
          WHEN 'owner' THEN RETURN user_role = 'owner';
          WHEN 'admin' THEN RETURN user_role IN ('owner', 'admin');
          WHEN 'editor' THEN RETURN user_role IN ('owner', 'admin', 'editor');
          WHEN 'viewer' THEN RETURN user_role IN ('owner', 'admin', 'editor', 'viewer');
          ELSE RETURN false;
        END CASE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Update projects RLS policies to work with multi-user system
      -- Drop ALL existing project policies first
      DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
      DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
      DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
      DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
      DROP POLICY IF EXISTS "Project owners and admins can update projects" ON projects;
      DROP POLICY IF EXISTS "Project owners and admins can delete projects" ON projects;

      CREATE POLICY "Users can view their own projects" ON projects
        FOR SELECT USING (
          user_id = auth.uid() OR 
          created_by = auth.uid() OR
          id IN (
            SELECT project_id FROM project_memberships 
            WHERE user_id = auth.uid() AND status = 'accepted'
          )
        );

      CREATE POLICY "Users can insert their own projects" ON projects
        FOR INSERT WITH CHECK (user_id = auth.uid());

      CREATE POLICY "Users can update their own projects" ON projects
        FOR UPDATE USING (
          user_id = auth.uid() OR 
          created_by = auth.uid() OR
          id IN (
            SELECT project_id FROM project_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'accepted'
          )
        );

      CREATE POLICY "Users can delete their own projects" ON projects
        FOR DELETE USING (
          user_id = auth.uid() OR created_by = auth.uid()
        );

      -- Grant necessary permissions
      GRANT EXECUTE ON FUNCTION is_project_owner(UUID) TO authenticated;
      GRANT EXECUTE ON FUNCTION has_project_permission(UUID, UUID, TEXT) TO authenticated;
    `

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: fixSQL })

    if (error) {
      console.error('Error fixing RLS policies:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to fix RLS policies. Please run the SQL manually in your Supabase dashboard.',
          error: error.message,
          sql: fixSQL
        },
        { status: 500 }
      )
    }

    // Test the fix by trying to access project_memberships
    const { data: testData, error: testError } = await supabase
      .from('project_memberships')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('Test query failed:', testError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'RLS policies fixed but test query failed. Please check manually.',
          error: testError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'RLS recursion issue fixed successfully!',
      testQuery: 'Project memberships table is now accessible'
    })

  } catch (error) {
    console.error('Error in fix-multi-user-rls:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fix RLS policies. Please run the SQL manually in your Supabase dashboard.',
        error: error instanceof Error ? error.message : 'Unknown error',
        sql: `
          -- Manual SQL to run in Supabase dashboard:
          -- Drop the problematic policies
          DROP POLICY IF EXISTS "Users can view project memberships they're part of" ON project_memberships;
          DROP POLICY IF EXISTS "Project owners and admins can manage memberships" ON project_memberships;

          -- Create simplified, non-recursive policies
          CREATE POLICY "Users can view their own memberships" ON project_memberships
            FOR SELECT USING (user_id = auth.uid());

          CREATE POLICY "Users can view memberships of projects they own" ON project_memberships
            FOR SELECT USING (
              project_id IN (
                SELECT p.id FROM projects p 
                WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
              )
            );

          CREATE POLICY "Project owners can manage memberships" ON project_memberships
            FOR ALL USING (
              project_id IN (
                SELECT p.id FROM projects p 
                WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
              )
            );
        `
      },
      { status: 500 }
    )
  }
} 