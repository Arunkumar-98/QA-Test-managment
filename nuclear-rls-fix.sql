-- NUCLEAR OPTION: Drop ALL policies and recreate from scratch
-- This is the most aggressive fix for infinite recursion issues

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
-- STEP 2: DROP ALL POLICIES USING INFORMATION_SCHEMA
-- =====================================================

-- Drop ALL policies from projects table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', policy_record.policyname);
    END LOOP;
END $$;

-- Drop ALL policies from project_memberships table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'project_memberships' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON project_memberships', policy_record.policyname);
    END LOOP;
END $$;

-- Drop ALL policies from test_cases table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'test_cases' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON test_cases', policy_record.policyname);
    END LOOP;
END $$;

-- Drop ALL policies from test_suites table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'test_suites' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON test_suites', policy_record.policyname);
    END LOOP;
END $$;

-- Drop ALL policies from documents table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'documents' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON documents', policy_record.policyname);
    END LOOP;
END $$;

-- Drop ALL policies from important_links table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'important_links' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON important_links', policy_record.policyname);
    END LOOP;
END $$;

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
CREATE POLICY "simple_view_projects" ON projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "simple_insert_projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_update_projects" ON projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "simple_delete_projects" ON projects
  FOR DELETE USING (user_id = auth.uid());

-- Simple policies for project_memberships (no circular references)
CREATE POLICY "simple_view_memberships" ON project_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "simple_insert_memberships" ON project_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_update_memberships" ON project_memberships
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "simple_delete_memberships" ON project_memberships
  FOR DELETE USING (user_id = auth.uid());

-- Simple policies for test_cases (no circular references)
CREATE POLICY "simple_view_test_cases" ON test_cases
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_insert_test_cases" ON test_cases
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_update_test_cases" ON test_cases
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_delete_test_cases" ON test_cases
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Simple policies for test_suites (no circular references)
CREATE POLICY "simple_view_test_suites" ON test_suites
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_insert_test_suites" ON test_suites
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_update_test_suites" ON test_suites
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_delete_test_suites" ON test_suites
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Simple policies for documents (no circular references)
CREATE POLICY "simple_view_documents" ON documents
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_insert_documents" ON documents
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_update_documents" ON documents
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_delete_documents" ON documents
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Simple policies for important_links (no circular references)
CREATE POLICY "simple_view_important_links" ON important_links
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_insert_important_links" ON important_links
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_update_important_links" ON important_links
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "simple_delete_important_links" ON important_links
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