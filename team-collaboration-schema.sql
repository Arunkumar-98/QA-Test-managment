-- Team Collaboration Schema
-- This enables project sharing with proper permissions and history tracking

-- =====================================================
-- 1. ADD USER_ID TO ALL TABLES (for private data)
-- =====================================================

-- Add user_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to test_cases table  
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to test_suites table
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to important_links table
ALTER TABLE important_links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to status_history table
ALTER TABLE status_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to saved_filters table
ALTER TABLE saved_filters ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- 2. PROJECT SHARING SYSTEM
-- =====================================================

-- Project Members table (for team collaboration)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- who shared it
  permission_level TEXT CHECK (permission_level IN ('view', 'edit', 'admin')) DEFAULT 'view',
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Project Activity Log (for tracking who made changes)
CREATE TABLE IF NOT EXISTS project_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'share', 'unshare'
  entity_type TEXT NOT NULL, -- 'test_case', 'test_suite', 'document', 'project'
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_owner_id ON project_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_project_id ON project_activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_user_id ON project_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_timestamp ON project_activity_log(timestamp);

-- =====================================================
-- 4. RLS POLICIES FOR TEAM COLLABORATION
-- =====================================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_log ENABLE ROW LEVEL SECURITY;

-- Projects: Users can see their own projects + shared projects
DROP POLICY IF EXISTS "Users can view own and shared projects" ON projects;
CREATE POLICY "Users can view own and shared projects" ON projects
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
  );

-- Projects: Users can create their own projects
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Projects: Users can update their own projects + shared projects with edit/admin permission
DROP POLICY IF EXISTS "Users can update own and shared projects" ON projects;
CREATE POLICY "Users can update own and shared projects" ON projects
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
      AND permission_level IN ('edit', 'admin')
    )
  );

-- Projects: Only owners can delete projects
DROP POLICY IF EXISTS "Only owners can delete projects" ON projects;
CREATE POLICY "Only owners can delete projects" ON projects
  FOR DELETE USING (user_id = auth.uid());

-- Test Cases: Users can see test cases from their own projects + shared projects
DROP POLICY IF EXISTS "Users can view own and shared test cases" ON test_cases;
CREATE POLICY "Users can view own and shared test cases" ON test_cases
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE p.id = test_cases.project_id 
      AND pm.user_id = auth.uid()
    )
  );

-- Test Cases: Users can create test cases in their own projects + shared projects with edit/admin permission
DROP POLICY IF EXISTS "Users can create test cases in own and shared projects" ON test_cases;
CREATE POLICY "Users can create test cases in own and shared projects" ON test_cases
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE p.id = test_cases.project_id 
      AND pm.user_id = auth.uid()
      AND pm.permission_level IN ('edit', 'admin')
    )
  );

-- Test Cases: Users can update test cases in their own projects + shared projects with edit/admin permission
DROP POLICY IF EXISTS "Users can update test cases in own and shared projects" ON test_cases;
CREATE POLICY "Users can update test cases in own and shared projects" ON test_cases
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE p.id = test_cases.project_id 
      AND pm.user_id = auth.uid()
      AND pm.permission_level IN ('edit', 'admin')
    )
  );

-- Test Cases: Only owners can delete test cases
DROP POLICY IF EXISTS "Only owners can delete test cases" ON test_cases;
CREATE POLICY "Only owners can delete test cases" ON test_cases
  FOR DELETE USING (user_id = auth.uid());

-- Project Members: Users can see members of projects they own or are members of
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    owner_id = auth.uid() OR user_id = auth.uid()
  );

-- Project Members: Only project owners can add/remove members
DROP POLICY IF EXISTS "Only project owners can manage members" ON project_members;
CREATE POLICY "Only project owners can manage members" ON project_members
  FOR ALL USING (owner_id = auth.uid());

-- Activity Log: Users can see activity for projects they own or are members of
DROP POLICY IF EXISTS "Users can view project activity" ON project_activity_log;
CREATE POLICY "Users can view project activity" ON project_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_activity_log.project_id
      AND (p.user_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM project_members pm
             WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
           ))
    )
  );

-- Activity Log: System can insert activity logs
DROP POLICY IF EXISTS "System can insert activity logs" ON project_activity_log;
CREATE POLICY "System can insert activity logs" ON project_activity_log
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. FUNCTIONS FOR TEAM COLLABORATION
-- =====================================================

-- Function to share a project with a user
CREATE OR REPLACE FUNCTION share_project_with_user(
  p_project_id UUID,
  p_target_user_email TEXT,
  p_permission_level TEXT DEFAULT 'view'
)
RETURNS JSONB AS $$
DECLARE
  v_target_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get the target user ID by email
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE email = p_target_user_email;
  
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_target_user_email;
  END IF;
  
  -- Check if current user owns the project
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not own this project';
  END IF;
  
  -- Add the user to project members
  INSERT INTO project_members (project_id, user_id, owner_id, permission_level)
  VALUES (p_project_id, v_target_user_id, auth.uid(), p_permission_level)
  ON CONFLICT (project_id, user_id) 
  DO UPDATE SET permission_level = p_permission_level;
  
  -- Log the activity
  INSERT INTO project_activity_log (project_id, user_id, action_type, entity_type, description)
  VALUES (p_project_id, auth.uid(), 'share', 'project', 
          format('Shared project with %s (%s permission)', p_target_user_email, p_permission_level));
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Project shared with %s', p_target_user_email),
    'permission_level', p_permission_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a user from a project
CREATE OR REPLACE FUNCTION remove_user_from_project(
  p_project_id UUID,
  p_target_user_email TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_target_user_id UUID;
BEGIN
  -- Get the target user ID by email
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE email = p_target_user_email;
  
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_target_user_email;
  END IF;
  
  -- Check if current user owns the project
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not own this project';
  END IF;
  
  -- Remove the user from project members
  DELETE FROM project_members 
  WHERE project_id = p_project_id AND user_id = v_target_user_id;
  
  -- Log the activity
  INSERT INTO project_activity_log (project_id, user_id, action_type, entity_type, description)
  VALUES (p_project_id, auth.uid(), 'unshare', 'project', 
          format('Removed %s from project', p_target_user_email));
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('User %s removed from project', p_target_user_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's projects (own + shared)
CREATE OR REPLACE FUNCTION get_user_projects()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  user_id UUID,
  is_owner BOOLEAN,
  shared_by TEXT,
  permission_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.created_at,
    p.is_active,
    p.user_id,
    (p.user_id = auth.uid()) as is_owner,
    CASE 
      WHEN p.user_id = auth.uid() THEN NULL
      ELSE (SELECT email FROM auth.users WHERE id = pm.owner_id)
    END as shared_by,
    pm.permission_level
  FROM projects p
  LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
  WHERE p.user_id = auth.uid() OR pm.user_id = auth.uid()
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_project_activity(
  p_project_id UUID,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO project_activity_log (
    project_id, user_id, action_type, entity_type, entity_id, 
    old_values, new_values, description
  )
  VALUES (
    p_project_id, auth.uid(), p_action_type, p_entity_type, p_entity_id,
    p_old_values, p_new_values, p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 