-- 🚨 URGENT: Fix User Isolation Issue
-- Run this in Supabase SQL Editor immediately to fix the security breach

-- STEP 1: Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can view own test cases" ON test_cases;
DROP POLICY IF EXISTS "Users can insert own test cases" ON test_cases;
DROP POLICY IF EXISTS "Users can update own test cases" ON test_cases;
DROP POLICY IF EXISTS "Users can delete own test cases" ON test_cases;

DROP POLICY IF EXISTS "Users can view own test suites" ON test_suites;
DROP POLICY IF EXISTS "Users can insert own test suites" ON test_suites;
DROP POLICY IF EXISTS "Users can update own test suites" ON test_suites;
DROP POLICY IF EXISTS "Users can delete own test suites" ON test_suites;

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

DROP POLICY IF EXISTS "Users can view own important_links" ON important_links;
DROP POLICY IF EXISTS "Users can insert own important_links" ON important_links;
DROP POLICY IF EXISTS "Users can update own important_links" ON important_links;
DROP POLICY IF EXISTS "Users can delete own important_links" ON important_links;

DROP POLICY IF EXISTS "Users can view own comments" ON comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

DROP POLICY IF EXISTS "Users can view own status_history" ON status_history;
DROP POLICY IF EXISTS "Users can insert own status_history" ON status_history;
DROP POLICY IF EXISTS "Users can update own status_history" ON status_history;
DROP POLICY IF EXISTS "Users can delete own status_history" ON status_history;

DROP POLICY IF EXISTS "Users can view own saved_filters" ON saved_filters;
DROP POLICY IF EXISTS "Users can insert own saved_filters" ON saved_filters;
DROP POLICY IF EXISTS "Users can update own saved_filters" ON saved_filters;
DROP POLICY IF EXISTS "Users can delete own saved_filters" ON saved_filters;

-- STEP 3: Create new RLS policies for projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 4: Create new RLS policies for test_cases
CREATE POLICY "Users can view own test cases" ON test_cases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = test_cases.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own test cases" ON test_cases
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = test_cases.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own test cases" ON test_cases
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = test_cases.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own test cases" ON test_cases
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = test_cases.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- STEP 5: Create new RLS policies for test_suites
CREATE POLICY "Users can view own test suites" ON test_suites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = test_suites.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own test suites" ON test_suites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = test_suites.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own test suites" ON test_suites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = test_suites.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own test suites" ON test_suites
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = test_suites.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- STEP 6: Create new RLS policies for documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = documents.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = documents.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = documents.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = documents.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- STEP 7: Create new RLS policies for important_links
CREATE POLICY "Users can view own important_links" ON important_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = important_links.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own important_links" ON important_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = important_links.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own important_links" ON important_links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = important_links.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own important_links" ON important_links
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = important_links.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- STEP 8: Create new RLS policies for comments
CREATE POLICY "Users can view own comments" ON comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM test_cases tc
            JOIN projects p ON tc.project_id = p.id
            WHERE tc.id = comments.test_case_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own comments" ON comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM test_cases tc
            JOIN projects p ON tc.project_id = p.id
            WHERE tc.id = comments.test_case_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM test_cases tc
            JOIN projects p ON tc.project_id = p.id
            WHERE tc.id = comments.test_case_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM test_cases tc
            JOIN projects p ON tc.project_id = p.id
            WHERE tc.id = comments.test_case_id 
            AND p.user_id = auth.uid()
        )
    );

-- STEP 9: Create new RLS policies for status_history
CREATE POLICY "Users can view own status_history" ON status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM test_cases tc
            JOIN projects p ON tc.project_id = p.id
            WHERE tc.id = status_history.test_case_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own status_history" ON status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM test_cases tc
            JOIN projects p ON tc.project_id = p.id
            WHERE tc.id = status_history.test_case_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own status_history" ON status_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM test_cases tc
            JOIN projects p ON tc.project_id = p.id
            WHERE tc.id = status_history.test_case_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own status_history" ON status_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM test_cases tc
            JOIN projects p ON tc.project_id = p.id
            WHERE tc.id = status_history.test_case_id 
            AND p.user_id = auth.uid()
        )
    );

-- STEP 10: Create new RLS policies for saved_filters
CREATE POLICY "Users can view own saved_filters" ON saved_filters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved_filters" ON saved_filters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved_filters" ON saved_filters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved_filters" ON saved_filters
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 11: Verification queries
SELECT 'RLS Status' as check_type, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('projects', 'test_cases', 'test_suites', 'documents', 'important_links', 'comments', 'status_history', 'saved_filters')
ORDER BY tablename;

SELECT 'Policies Created' as check_type, tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('projects', 'test_cases', 'test_suites', 'documents', 'important_links', 'comments', 'status_history', 'saved_filters')
GROUP BY tablename
ORDER BY tablename;

-- STEP 12: Test the fix
-- This should now only return projects for the current user
SELECT 'Test Query' as check_type, COUNT(*) as project_count
FROM projects 
WHERE user_id = auth.uid(); 