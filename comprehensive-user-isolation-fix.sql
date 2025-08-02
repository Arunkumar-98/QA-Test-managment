-- COMPREHENSIVE USER ISOLATION FIX
-- Run this in Supabase SQL Editor to fix all user isolation issues

-- STEP 1: Add user_id columns if they don't exist
DO $$ 
BEGIN
    -- Add user_id to projects if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'user_id') THEN
        ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to projects table';
    END IF;
    
    -- Add user_id to test_cases if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_cases' AND column_name = 'user_id') THEN
        ALTER TABLE test_cases ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to test_cases table';
    END IF;
    
    -- Add user_id to test_suites if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_suites' AND column_name = 'user_id') THEN
        ALTER TABLE test_suites ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to test_suites table';
    END IF;
    
    -- Add user_id to documents if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'user_id') THEN
        ALTER TABLE documents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to documents table';
    END IF;
    
    -- Add user_id to important_links if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'important_links' AND column_name = 'user_id') THEN
        ALTER TABLE important_links ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to important_links table';
    END IF;
    
    -- Add user_id to comments if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'user_id') THEN
        ALTER TABLE comments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to comments table';
    END IF;
    
    -- Add user_id to status_history if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'status_history' AND column_name = 'user_id') THEN
        ALTER TABLE status_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to status_history table';
    END IF;
    
    -- Add user_id to saved_filters if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_filters' AND column_name = 'user_id') THEN
        ALTER TABLE saved_filters ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to saved_filters table';
    END IF;
END $$;

-- STEP 2: Create indexes on user_id columns for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_user_id ON test_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_user_id ON test_suites(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_important_links_user_id ON important_links(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_status_history_user_id ON status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters(user_id);

-- STEP 3: Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop all existing policies to start fresh
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

-- STEP 5: Create new RLS policies for projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 6: Create new RLS policies for test_cases
CREATE POLICY "Users can view own test cases" ON test_cases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test cases" ON test_cases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test cases" ON test_cases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test cases" ON test_cases
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 7: Create new RLS policies for test_suites
CREATE POLICY "Users can view own test suites" ON test_suites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test suites" ON test_suites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test suites" ON test_suites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test suites" ON test_suites
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 8: Create new RLS policies for documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 9: Create new RLS policies for important_links
CREATE POLICY "Users can view own important_links" ON important_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own important_links" ON important_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own important_links" ON important_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own important_links" ON important_links
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 10: Create new RLS policies for comments
CREATE POLICY "Users can view own comments" ON comments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 11: Create new RLS policies for status_history
CREATE POLICY "Users can view own status_history" ON status_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own status_history" ON status_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status_history" ON status_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own status_history" ON status_history
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 12: Create new RLS policies for saved_filters
CREATE POLICY "Users can view own saved_filters" ON saved_filters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved_filters" ON saved_filters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved_filters" ON saved_filters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved_filters" ON saved_filters
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 13: Update existing data to assign user_id (optional - for existing data)
-- This will assign all existing data to the first user in the system
-- Comment this out if you want to keep existing data isolated
/*
UPDATE projects SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE test_cases SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE test_suites SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE documents SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE important_links SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE comments SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE status_history SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE saved_filters SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
*/

-- STEP 14: Verification queries
SELECT 'RLS Status' as check_type, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('projects', 'test_cases', 'test_suites', 'documents', 'important_links', 'comments', 'status_history', 'saved_filters')
ORDER BY tablename;

SELECT 'Policies Created' as check_type, tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('projects', 'test_cases', 'test_suites', 'documents', 'important_links', 'comments', 'status_history', 'saved_filters')
GROUP BY tablename
ORDER BY tablename;

SELECT 'Data Distribution' as check_type, 
    'projects' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_count
FROM projects
UNION ALL
SELECT 'Data Distribution' as check_type,
    'test_cases' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_count
FROM test_cases; 