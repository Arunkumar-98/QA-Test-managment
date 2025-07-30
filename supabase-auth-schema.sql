-- Enable Row Level Security (RLS) for all tables
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Add user_id column to all tables if not exists
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE important_links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for test_cases
CREATE POLICY "Users can view their own test cases" ON test_cases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test cases" ON test_cases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test cases" ON test_cases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test cases" ON test_cases
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for test_suites
CREATE POLICY "Users can view their own test suites" ON test_suites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test suites" ON test_suites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test suites" ON test_suites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test suites" ON test_suites
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for important_links
CREATE POLICY "Users can view their own important links" ON important_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own important links" ON important_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own important links" ON important_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own important links" ON important_links
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for platforms
CREATE POLICY "Users can view their own platforms" ON platforms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platforms" ON platforms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platforms" ON platforms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platforms" ON platforms
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for comments
CREATE POLICY "Users can view their own comments" ON comments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id
CREATE TRIGGER set_user_id_test_cases
    BEFORE INSERT ON test_cases
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_test_suites
    BEFORE INSERT ON test_suites
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_projects
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_documents
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_important_links
    BEFORE INSERT ON important_links
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_platforms
    BEFORE INSERT ON platforms
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_comments
    BEFORE INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id(); 