-- Add user_id columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'user_id') THEN
        ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_cases' AND column_name = 'user_id') THEN
        ALTER TABLE test_cases ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_suites' AND column_name = 'user_id') THEN
        ALTER TABLE test_suites ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'user_id') THEN
        ALTER TABLE documents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'important_links' AND column_name = 'user_id') THEN
        ALTER TABLE important_links ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'user_id') THEN
        ALTER TABLE comments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'status_history' AND column_name = 'user_id') THEN
        ALTER TABLE status_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_filters' AND column_name = 'user_id') THEN
        ALTER TABLE saved_filters ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes on user_id columns
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_user_id ON test_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_user_id ON test_suites(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_important_links_user_id ON important_links(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_status_history_user_id ON status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters(user_id);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
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

-- Create new RLS policies for projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for test_cases
CREATE POLICY "Users can view own test cases" ON test_cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test cases" ON test_cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own test cases" ON test_cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own test cases" ON test_cases FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for test_suites
CREATE POLICY "Users can view own test suites" ON test_suites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test suites" ON test_suites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own test suites" ON test_suites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own test suites" ON test_suites FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for documents
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for important_links
CREATE POLICY "Users can view own important_links" ON important_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own important_links" ON important_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own important_links" ON important_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own important_links" ON important_links FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for comments
CREATE POLICY "Users can view own comments" ON comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for status_history
CREATE POLICY "Users can view own status_history" ON status_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own status_history" ON status_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own status_history" ON status_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own status_history" ON status_history FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for saved_filters
CREATE POLICY "Users can view own saved_filters" ON saved_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved_filters" ON saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved_filters" ON saved_filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved_filters" ON saved_filters FOR DELETE USING (auth.uid() = user_id); 