-- Multi-User Project Ownership Setup
-- This script creates the project memberships system and updates existing tables

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
-- Add a flag to indicate if project supports multiple owners
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

-- Update RLS policies for projects table to support multi-ownership
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (
    user_id = auth.uid() OR
    id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Project owners and admins can update projects" ON projects;
CREATE POLICY "Project owners and admins can update projects" ON projects
  FOR UPDATE USING (
    user_id = auth.uid() OR
    id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;
CREATE POLICY "Project owners can delete projects" ON projects
  FOR DELETE USING (
    user_id = auth.uid() OR
    id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'accepted'
    )
  );

-- Update RLS policies for test_cases to support multi-ownership
DROP POLICY IF EXISTS "Users can view their own test cases" ON test_cases;
CREATE POLICY "Users can view their own test cases" ON test_cases
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own test cases" ON test_cases;
CREATE POLICY "Users can insert their own test cases" ON test_cases
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Project members can update test cases" ON test_cases;
CREATE POLICY "Project members can update test cases" ON test_cases
  FOR UPDATE USING (
    project_id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Project owners and admins can delete test cases" ON test_cases;
CREATE POLICY "Project owners and admins can delete test cases" ON test_cases
  FOR DELETE USING (
    project_id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'accepted'
    )
  );

-- Update RLS policies for test_suites to support multi-ownership
DROP POLICY IF EXISTS "Users can view their own test suites" ON test_suites;
CREATE POLICY "Users can view their own test suites" ON test_suites
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own test suites" ON test_suites;
CREATE POLICY "Users can insert their own test suites" ON test_suites
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Project members can update test suites" ON test_suites;
CREATE POLICY "Project members can update test suites" ON test_suites
  FOR UPDATE USING (
    project_id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Project owners and admins can delete test suites" ON test_suites;
CREATE POLICY "Project owners and admins can delete test suites" ON test_suites
  FOR DELETE USING (
    project_id IN (
      SELECT project_id FROM project_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'accepted'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE project_memberships IS 'Manages multi-user project ownership and permissions';
COMMENT ON COLUMN project_memberships.role IS 'User role: owner, admin, editor, viewer';
COMMENT ON COLUMN project_memberships.status IS 'Membership status: pending, accepted, declined';
COMMENT ON FUNCTION get_user_projects(UUID) IS 'Returns all projects a user has access to with their roles';
COMMENT ON FUNCTION has_project_permission(UUID, UUID, TEXT) IS 'Checks if user has required permission level on project'; 