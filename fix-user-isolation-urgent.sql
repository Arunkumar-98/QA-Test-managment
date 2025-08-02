-- URGENT: Fix User Isolation - Ensure users only see their own data
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to recreate them properly
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

-- 3. Create proper RLS policies for projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Create proper RLS policies for test_cases
CREATE POLICY "Users can view own test cases" ON test_cases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test cases" ON test_cases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test cases" ON test_cases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test cases" ON test_cases
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create proper RLS policies for test_suites
CREATE POLICY "Users can view own test suites" ON test_suites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test suites" ON test_suites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test suites" ON test_suites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test suites" ON test_suites
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create proper RLS policies for other tables
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create proper RLS policies for important_links
CREATE POLICY "Users can view own important_links" ON important_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own important_links" ON important_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own important_links" ON important_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own important_links" ON important_links
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create proper RLS policies for comments
CREATE POLICY "Users can view own comments" ON comments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Create proper RLS policies for status_history
CREATE POLICY "Users can view own status_history" ON status_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own status_history" ON status_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status_history" ON status_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own status_history" ON status_history
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Create proper RLS policies for saved_filters
CREATE POLICY "Users can view own saved_filters" ON saved_filters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved_filters" ON saved_filters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved_filters" ON saved_filters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved_filters" ON saved_filters
    FOR DELETE USING (auth.uid() = user_id);

-- 11. Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'test_cases', 'test_suites', 'documents', 'important_links', 'comments', 'status_history', 'saved_filters')
ORDER BY tablename, policyname;

-- 12. Check current user data (for debugging)
SELECT 
    'projects' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_count
FROM projects
UNION ALL
SELECT 
    'test_cases' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_count
FROM test_cases; 