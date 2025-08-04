-- Comprehensive fix for infinite recursion in RLS policies
-- This script replaces ALL problematic policies with non-recursive ones

-- =====================================================
-- 1. FIX PROJECT_MEMBERSHIPS TABLE
-- =====================================================

-- Drop ALL existing project_memberships policies first
DROP POLICY IF EXISTS "Users can view project memberships they're part of" ON project_memberships;
DROP POLICY IF EXISTS "Project owners and admins can manage memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can view memberships of projects they own" ON project_memberships;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_memberships;

-- Create simplified, non-recursive policies for project_memberships
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

-- =====================================================
-- 2. FIX PROJECTS TABLE
-- =====================================================

-- Drop ALL existing project policies first
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Project owners and admins can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners and admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;

-- Create simplified, non-recursive policies for projects
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

-- =====================================================
-- 3. FIX TEST_CASES TABLE
-- =====================================================

-- Drop ALL existing test_cases policies first
DROP POLICY IF EXISTS "Users can view test cases in their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can insert test cases in their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can update test cases in their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can delete test cases in their projects" ON test_cases;

-- Create simplified, non-recursive policies for test_cases
CREATE POLICY "Users can view test cases in their projects" ON test_cases
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert test cases in their projects" ON test_cases
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'editor') AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can update test cases in their projects" ON test_cases
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'editor') AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can delete test cases in their projects" ON test_cases
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'accepted'
    )
  );

-- =====================================================
-- 4. FIX TEST_SUITES TABLE
-- =====================================================

-- Drop ALL existing test_suites policies first
DROP POLICY IF EXISTS "Users can view test suites in their projects" ON test_suites;
DROP POLICY IF EXISTS "Users can insert test suites in their projects" ON test_suites;
DROP POLICY IF EXISTS "Users can update test suites in their projects" ON test_suites;
DROP POLICY IF EXISTS "Users can delete test suites in their projects" ON test_suites;

-- Create simplified, non-recursive policies for test_suites
CREATE POLICY "Users can view test suites in their projects" ON test_suites
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert test suites in their projects" ON test_suites
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'editor') AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can update test suites in their projects" ON test_suites
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'editor') AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can delete test suites in their projects" ON test_suites
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'accepted'
    )
  );

-- =====================================================
-- 5. FIX DOCUMENTS TABLE
-- =====================================================

-- Drop ALL existing documents policies first
DROP POLICY IF EXISTS "Users can view documents in their projects" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their projects" ON documents;
DROP POLICY IF EXISTS "Users can update documents in their projects" ON documents;
DROP POLICY IF EXISTS "Users can delete documents in their projects" ON documents;

-- Create simplified, non-recursive policies for documents
CREATE POLICY "Users can view documents in their projects" ON documents
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert documents in their projects" ON documents
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'editor') AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can update documents in their projects" ON documents
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'editor') AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can delete documents in their projects" ON documents
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'accepted'
    )
  );

-- =====================================================
-- 6. FIX IMPORTANT_LINKS TABLE
-- =====================================================

-- Drop ALL existing important_links policies first
DROP POLICY IF EXISTS "Users can view important links in their projects" ON important_links;
DROP POLICY IF EXISTS "Users can insert important links in their projects" ON important_links;
DROP POLICY IF EXISTS "Users can update important links in their projects" ON important_links;
DROP POLICY IF EXISTS "Users can delete important links in their projects" ON important_links;

-- Create simplified, non-recursive policies for important_links
CREATE POLICY "Users can view important links in their projects" ON important_links
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert important links in their projects" ON important_links
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'editor') AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can update important links in their projects" ON important_links
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'editor') AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can delete important links in their projects" ON important_links
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid()
      UNION
      SELECT pm.project_id FROM project_memberships pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'accepted'
    )
  );

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

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

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_project_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_project_permission(UUID, UUID, TEXT) TO authenticated; 