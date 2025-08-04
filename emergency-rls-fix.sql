-- EMERGENCY FIX: Disable RLS temporarily and re-enable with simple policies
-- This is a nuclear option to fix infinite recursion issues

-- =====================================================
-- STEP 1: TEMPORARILY DISABLE RLS ON ALL TABLES
-- =====================================================

-- Disable RLS on all problematic tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE important_links DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: DROP ALL EXISTING POLICIES (COMPREHENSIVE)
-- =====================================================

-- Drop ALL possible policies from projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Project owners and admins can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners and admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view project memberships they're part of" ON projects;
DROP POLICY IF EXISTS "Project owners and admins can manage memberships" ON projects;
DROP POLICY IF EXISTS "Users can view memberships of projects they own" ON projects;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON projects;

-- Drop ALL possible policies from project_memberships
DROP POLICY IF EXISTS "Users can view project memberships they're part of" ON project_memberships;
DROP POLICY IF EXISTS "Project owners and admins can manage memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can view memberships of projects they own" ON project_memberships;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can delete their own memberships" ON project_memberships;

-- Drop ALL possible policies from test_cases
DROP POLICY IF EXISTS "Users can view test cases in their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can insert test cases in their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can update test cases in their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can delete test cases in their projects" ON test_cases;

-- Drop ALL possible policies from test_suites
DROP POLICY IF EXISTS "Users can view test suites in their projects" ON test_suites;
DROP POLICY IF EXISTS "Users can insert test suites in their projects" ON test_suites;
DROP POLICY IF EXISTS "Users can update test suites in their projects" ON test_suites;
DROP POLICY IF EXISTS "Users can delete test suites in their projects" ON test_suites;

-- Drop ALL possible policies from documents
DROP POLICY IF EXISTS "Users can view documents in their projects" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their projects" ON documents;
DROP POLICY IF EXISTS "Users can update documents in their projects" ON documents;
DROP POLICY IF EXISTS "Users can delete documents in their projects" ON documents;

-- Drop ALL possible policies from important_links
DROP POLICY IF EXISTS "Users can view important links in their projects" ON important_links;
DROP POLICY IF EXISTS "Users can insert important links in their projects" ON important_links;
DROP POLICY IF EXISTS "Users can update important links in their projects" ON important_links;
DROP POLICY IF EXISTS "Users can delete important links in their projects" ON important_links;

-- =====================================================
-- STEP 3: RE-ENABLE RLS WITH SIMPLE POLICIES
-- =====================================================

-- Re-enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =====================================================

-- Simple policies for projects (no circular references)
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id = auth.uid());

-- Simple policies for project_memberships (no circular references)
CREATE POLICY "Users can view their own memberships" ON project_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships" ON project_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own memberships" ON project_memberships
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own memberships" ON project_memberships
  FOR DELETE USING (user_id = auth.uid());

-- Simple policies for test_cases (no circular references)
CREATE POLICY "Users can view test cases in their projects" ON test_cases
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert test cases in their projects" ON test_cases
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update test cases in their projects" ON test_cases
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete test cases in their projects" ON test_cases
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Simple policies for test_suites (no circular references)
CREATE POLICY "Users can view test suites in their projects" ON test_suites
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert test suites in their projects" ON test_suites
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update test suites in their projects" ON test_suites
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete test suites in their projects" ON test_suites
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Simple policies for documents (no circular references)
CREATE POLICY "Users can view documents in their projects" ON documents
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents in their projects" ON documents
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in their projects" ON documents
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents in their projects" ON documents
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Simple policies for important_links (no circular references)
CREATE POLICY "Users can view important links in their projects" ON important_links
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert important links in their projects" ON important_links
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update important links in their projects" ON important_links
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete important links in their projects" ON important_links
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 5: GRANT PERMISSIONS
-- =====================================================

-- Grant basic permissions to authenticated users
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_memberships TO authenticated;
GRANT ALL ON test_cases TO authenticated;
GRANT ALL ON test_suites TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON important_links TO authenticated; 