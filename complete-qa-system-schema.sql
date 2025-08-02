-- Complete QA Management System Database Schema
-- This script creates all tables, functions, and constraints needed for the system

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- Projects table
DROP TABLE IF EXISTS projects CASCADE;
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Test Cases table (with position field)
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case TEXT NOT NULL,
  description TEXT,
  expected_result TEXT,
  status TEXT CHECK (status IN ('Pending', 'Pass', 'Fail', 'In Progress', 'Blocked')) DEFAULT 'Pending',
  priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
  category TEXT,
  assigned_tester TEXT,
  execution_date TEXT,
  notes TEXT,
  actual_result TEXT,
  environment TEXT,
  prerequisites TEXT,
  platform TEXT,
  steps_to_reproduce TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  suite_id UUID,
  position INTEGER NOT NULL,
  automation_script JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Suites table
CREATE TABLE IF NOT EXISTS test_suites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  test_case_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_run TIMESTAMP WITH TIME ZONE,
  last_status TEXT CHECK (last_status IN ('Pass', 'Fail', 'Partial', 'Not Run')),
  total_tests INTEGER DEFAULT 0,
  passed_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  pending_tests INTEGER DEFAULT 0,
  estimated_duration INTEGER, -- in minutes
  tags TEXT[] DEFAULT '{}',
  owner TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('requirement', 'specification', 'test-plan', 'report')) NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by TEXT
);

-- Important Links table
CREATE TABLE IF NOT EXISTS important_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('general', 'documentation', 'tools', 'resources')) DEFAULT 'general',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platforms table
DROP TABLE IF EXISTS platforms CASCADE;
CREATE TABLE platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App Settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT CHECK (type IN ('general', 'bug', 'question', 'suggestion', 'status_update')) DEFAULT 'general',
  is_resolved BOOLEAN DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  mentions TEXT[],
  attachments JSONB
);

-- Test Case Relationships table
CREATE TABLE IF NOT EXISTS test_case_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
  target_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('depends_on', 'related_to', 'blocks', 'duplicate')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, target_id, type)
);

-- Saved Filters table
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  search_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Status History table
CREATE TABLE IF NOT EXISTS status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  notes TEXT
);

-- Project Sharing table
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  permissions JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  allowed_emails TEXT[],
  max_views INTEGER,
  current_views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Test Suite Sharing table
CREATE TABLE IF NOT EXISTS test_suite_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_suite_id UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL UNIQUE,
  test_suite_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  permissions JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  allowed_emails TEXT[],
  max_views INTEGER,
  current_views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

-- Test Cases indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_assigned_tester ON test_cases(assigned_tester);
CREATE INDEX IF NOT EXISTS idx_test_cases_position ON test_cases(project_id, position);
CREATE INDEX IF NOT EXISTS idx_test_cases_created_at ON test_cases(created_at);

-- Test Suites indexes
CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON test_suites(project_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_owner ON test_suites(owner);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- Important Links indexes
CREATE INDEX IF NOT EXISTS idx_important_links_project_id ON important_links(project_id);
CREATE INDEX IF NOT EXISTS idx_important_links_category ON important_links(category);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_test_case_id ON comments(test_case_id);
CREATE INDEX IF NOT EXISTS idx_comments_timestamp ON comments(timestamp);

-- Status History indexes
CREATE INDEX IF NOT EXISTS idx_status_history_test_case_id ON status_history(test_case_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON status_history(changed_at);

-- Sharing indexes
CREATE INDEX IF NOT EXISTS idx_project_shares_token ON project_shares(access_token);
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_token ON test_suite_shares(access_token);

-- =====================================================
-- 3. CONSTRAINTS
-- =====================================================

-- Unique constraint for test case positions within a project
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_position_per_project' 
        AND table_name = 'test_cases'
    ) THEN
        ALTER TABLE test_cases ADD CONSTRAINT unique_position_per_project 
        UNIQUE (project_id, position);
    END IF;
END $$;

-- =====================================================
-- 4. FUNCTIONS FOR POSITION MANAGEMENT
-- =====================================================

-- Function to atomically insert test case with next available position
CREATE OR REPLACE FUNCTION insert_test_case_with_next_position(
    p_test_case_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_next_position INTEGER;
    v_project_id UUID;
    v_result JSONB;
BEGIN
    -- Extract project_id from the test case data
    v_project_id := (p_test_case_data->>'project_id')::UUID;
    
    -- Get the next available position atomically
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
    FROM test_cases 
    WHERE project_id = v_project_id;
    
    -- Insert the test case with the calculated position
    INSERT INTO test_cases (
        test_case,
        description,
        expected_result,
        status,
        priority,
        category,
        assigned_tester,
        execution_date,
        notes,
        actual_result,
        environment,
        prerequisites,
        platform,
        steps_to_reproduce,
        project_id,
        suite_id,
        position,
        automation_script,
        created_at,
        updated_at
    )
    VALUES (
        p_test_case_data->>'test_case',
        p_test_case_data->>'description',
        p_test_case_data->>'expected_result',
        (p_test_case_data->>'status')::text,
        (p_test_case_data->>'priority')::text,
        (p_test_case_data->>'category')::text,
        p_test_case_data->>'assigned_tester',
        p_test_case_data->>'execution_date',
        p_test_case_data->>'notes',
        p_test_case_data->>'actual_result',
        p_test_case_data->>'environment',
        p_test_case_data->>'prerequisites',
        p_test_case_data->>'platform',
        p_test_case_data->>'steps_to_reproduce',
        v_project_id,
        (p_test_case_data->>'suite_id')::UUID,
        v_next_position,
        p_test_case_data->'automation_script',
        (p_test_case_data->>'created_at')::timestamp with time zone,
        (p_test_case_data->>'updated_at')::timestamp with time zone
    )
    RETURNING to_jsonb(test_cases.*) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to delete test case and reorder remaining ones
CREATE OR REPLACE FUNCTION delete_test_case_and_reorder(
    p_test_case_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_project_id UUID;
    v_position INTEGER;
BEGIN
    -- Get the project_id and position of the test case to delete
    SELECT project_id, position INTO v_project_id, v_position
    FROM test_cases 
    WHERE id = p_test_case_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Test case not found';
    END IF;
    
    -- Delete the test case
    DELETE FROM test_cases WHERE id = p_test_case_id;
    
    -- Reorder remaining test cases in the same project
    UPDATE test_cases 
    SET position = position - 1
    WHERE project_id = v_project_id 
    AND position > v_position;
    
END;
$$ LANGUAGE plpgsql;

-- Function to reorder test cases when moving to a new position
CREATE OR REPLACE FUNCTION reorder_test_cases(
    p_test_case_id UUID,
    p_new_position INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_project_id UUID;
    v_old_position INTEGER;
BEGIN
    -- Get the project_id and current position of the test case
    SELECT project_id, position INTO v_project_id, v_old_position
    FROM test_cases 
    WHERE id = p_test_case_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Test case not found';
    END IF;
    
    -- If moving to the same position, do nothing
    IF v_old_position = p_new_position THEN
        RETURN;
    END IF;
    
    -- If moving to a higher position (down in the list)
    IF v_old_position < p_new_position THEN
        -- Shift other test cases down
        UPDATE test_cases 
        SET position = position - 1
        WHERE project_id = v_project_id 
        AND position > v_old_position 
        AND position <= p_new_position;
    ELSE
        -- If moving to a lower position (up in the list)
        -- Shift other test cases up
        UPDATE test_cases 
        SET position = position + 1
        WHERE project_id = v_project_id 
        AND position >= p_new_position 
        AND position < v_old_position;
    END IF;
    
    -- Update the target test case to the new position
    UPDATE test_cases 
    SET position = p_new_position
    WHERE id = p_test_case_id;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_test_cases_updated_at'
        AND event_object_table = 'test_cases'
    ) THEN
        CREATE TRIGGER update_test_cases_updated_at 
            BEFORE UPDATE ON test_cases 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_test_suites_updated_at'
        AND event_object_table = 'test_suites'
    ) THEN
        CREATE TRIGGER update_test_suites_updated_at 
            BEFORE UPDATE ON test_suites 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_app_settings_updated_at'
        AND event_object_table = 'app_settings'
    ) THEN
        CREATE TRIGGER update_app_settings_updated_at 
            BEFORE UPDATE ON app_settings 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_case_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suite_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access (for demo purposes)
-- In production, you should implement proper authentication and authorization

-- Test Cases policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_cases' AND policyname = 'Allow public read access to test cases') THEN
        CREATE POLICY "Allow public read access to test cases" ON test_cases FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_cases' AND policyname = 'Allow public insert access to test cases') THEN
        CREATE POLICY "Allow public insert access to test cases" ON test_cases FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_cases' AND policyname = 'Allow public update access to test cases') THEN
        CREATE POLICY "Allow public update access to test cases" ON test_cases FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_cases' AND policyname = 'Allow public delete access to test cases') THEN
        CREATE POLICY "Allow public delete access to test cases" ON test_cases FOR DELETE USING (true);
    END IF;
END $$;

-- Test Suites policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suites' AND policyname = 'Allow public read access to test suites') THEN
        CREATE POLICY "Allow public read access to test suites" ON test_suites FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suites' AND policyname = 'Allow public insert access to test suites') THEN
        CREATE POLICY "Allow public insert access to test suites" ON test_suites FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suites' AND policyname = 'Allow public update access to test suites') THEN
        CREATE POLICY "Allow public update access to test suites" ON test_suites FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suites' AND policyname = 'Allow public delete access to test suites') THEN
        CREATE POLICY "Allow public delete access to test suites" ON test_suites FOR DELETE USING (true);
    END IF;
END $$;

-- Projects policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow public read access to projects') THEN
        CREATE POLICY "Allow public read access to projects" ON projects FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow public insert access to projects') THEN
        CREATE POLICY "Allow public insert access to projects" ON projects FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow public update access to projects') THEN
        CREATE POLICY "Allow public update access to projects" ON projects FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow public delete access to projects') THEN
        CREATE POLICY "Allow public delete access to projects" ON projects FOR DELETE USING (true);
    END IF;
END $$;

-- Documents policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow public read access to documents') THEN
        CREATE POLICY "Allow public read access to documents" ON documents FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow public insert access to documents') THEN
        CREATE POLICY "Allow public insert access to documents" ON documents FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow public update access to documents') THEN
        CREATE POLICY "Allow public update access to documents" ON documents FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow public delete access to documents') THEN
        CREATE POLICY "Allow public delete access to documents" ON documents FOR DELETE USING (true);
    END IF;
END $$;

-- Important Links policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'important_links' AND policyname = 'Allow public read access to important links') THEN
        CREATE POLICY "Allow public read access to important links" ON important_links FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'important_links' AND policyname = 'Allow public insert access to important links') THEN
        CREATE POLICY "Allow public insert access to important links" ON important_links FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'important_links' AND policyname = 'Allow public update access to important links') THEN
        CREATE POLICY "Allow public update access to important links" ON important_links FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'important_links' AND policyname = 'Allow public delete access to important links') THEN
        CREATE POLICY "Allow public delete access to important links" ON important_links FOR DELETE USING (true);
    END IF;
END $$;

-- Platforms policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platforms' AND policyname = 'Allow public read access to platforms') THEN
        CREATE POLICY "Allow public read access to platforms" ON platforms FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platforms' AND policyname = 'Allow public insert access to platforms') THEN
        CREATE POLICY "Allow public insert access to platforms" ON platforms FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platforms' AND policyname = 'Allow public update access to platforms') THEN
        CREATE POLICY "Allow public update access to platforms" ON platforms FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platforms' AND policyname = 'Allow public delete access to platforms') THEN
        CREATE POLICY "Allow public delete access to platforms" ON platforms FOR DELETE USING (true);
    END IF;
END $$;

-- App Settings policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Allow public read access to app settings') THEN
        CREATE POLICY "Allow public read access to app settings" ON app_settings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Allow public insert access to app settings') THEN
        CREATE POLICY "Allow public insert access to app settings" ON app_settings FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Allow public update access to app settings') THEN
        CREATE POLICY "Allow public update access to app settings" ON app_settings FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Allow public delete access to app settings') THEN
        CREATE POLICY "Allow public delete access to app settings" ON app_settings FOR DELETE USING (true);
    END IF;
END $$;

-- Comments policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Allow public read access to comments') THEN
        CREATE POLICY "Allow public read access to comments" ON comments FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Allow public insert access to comments') THEN
        CREATE POLICY "Allow public insert access to comments" ON comments FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Allow public update access to comments') THEN
        CREATE POLICY "Allow public update access to comments" ON comments FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Allow public delete access to comments') THEN
        CREATE POLICY "Allow public delete access to comments" ON comments FOR DELETE USING (true);
    END IF;
END $$;

-- Test Case Relationships policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_case_relationships' AND policyname = 'Allow public read access to test case relationships') THEN
        CREATE POLICY "Allow public read access to test case relationships" ON test_case_relationships FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_case_relationships' AND policyname = 'Allow public insert access to test case relationships') THEN
        CREATE POLICY "Allow public insert access to test case relationships" ON test_case_relationships FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_case_relationships' AND policyname = 'Allow public update access to test case relationships') THEN
        CREATE POLICY "Allow public update access to test case relationships" ON test_case_relationships FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_case_relationships' AND policyname = 'Allow public delete access to test case relationships') THEN
        CREATE POLICY "Allow public delete access to test case relationships" ON test_case_relationships FOR DELETE USING (true);
    END IF;
END $$;

-- Saved Filters policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'Allow public read access to saved filters') THEN
        CREATE POLICY "Allow public read access to saved filters" ON saved_filters FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'Allow public insert access to saved filters') THEN
        CREATE POLICY "Allow public insert access to saved filters" ON saved_filters FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'Allow public update access to saved filters') THEN
        CREATE POLICY "Allow public update access to saved filters" ON saved_filters FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'Allow public delete access to saved filters') THEN
        CREATE POLICY "Allow public delete access to saved filters" ON saved_filters FOR DELETE USING (true);
    END IF;
END $$;

-- Status History policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'status_history' AND policyname = 'Allow public read access to status history') THEN
        CREATE POLICY "Allow public read access to status history" ON status_history FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'status_history' AND policyname = 'Allow public insert access to status history') THEN
        CREATE POLICY "Allow public insert access to status history" ON status_history FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'status_history' AND policyname = 'Allow public update access to status history') THEN
        CREATE POLICY "Allow public update access to status history" ON status_history FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'status_history' AND policyname = 'Allow public delete access to status history') THEN
        CREATE POLICY "Allow public delete access to status history" ON status_history FOR DELETE USING (true);
    END IF;
END $$;

-- Project Shares policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_shares' AND policyname = 'Allow public read access to project shares') THEN
        CREATE POLICY "Allow public read access to project shares" ON project_shares FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_shares' AND policyname = 'Allow public insert access to project shares') THEN
        CREATE POLICY "Allow public insert access to project shares" ON project_shares FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_shares' AND policyname = 'Allow public update access to project shares') THEN
        CREATE POLICY "Allow public update access to project shares" ON project_shares FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_shares' AND policyname = 'Allow public delete access to project shares') THEN
        CREATE POLICY "Allow public delete access to project shares" ON project_shares FOR DELETE USING (true);
    END IF;
END $$;

-- Test Suite Shares policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suite_shares' AND policyname = 'Allow public read access to test suite shares') THEN
        CREATE POLICY "Allow public read access to test suite shares" ON test_suite_shares FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suite_shares' AND policyname = 'Allow public insert access to test suite shares') THEN
        CREATE POLICY "Allow public insert access to test suite shares" ON test_suite_shares FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suite_shares' AND policyname = 'Allow public update access to test suite shares') THEN
        CREATE POLICY "Allow public update access to test suite shares" ON test_suite_shares FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suite_shares' AND policyname = 'Allow public delete access to test suite shares') THEN
        CREATE POLICY "Allow public delete access to test suite shares" ON test_suite_shares FOR DELETE USING (true);
    END IF;
END $$;

-- =====================================================
-- 7. SAMPLE DATA (Optional)
-- =====================================================

-- Insert a default project if none exists
INSERT INTO projects (name, description) 
VALUES ('Default Project', 'Default project for testing')
ON CONFLICT (name) DO NOTHING;

-- Insert some default platforms
INSERT INTO platforms (name, description) VALUES 
('Web', 'Web browsers and web applications'),
('Mobile', 'Mobile applications (iOS/Android)'),
('Desktop', 'Desktop applications'),
('API', 'Application Programming Interfaces')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check if all tables were created successfully
SELECT 
    'Tables created successfully!' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'projects', 'test_cases', 'test_suites', 'documents', 
    'important_links', 'platforms', 'app_settings', 'comments',
    'test_case_relationships', 'saved_filters', 'status_history',
    'project_shares', 'test_suite_shares'
);

-- Check if functions were created successfully
SELECT 
    'Functions created successfully!' as status,
    COUNT(*) as total_functions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'insert_test_case_with_next_position',
    'delete_test_case_and_reorder',
    'reorder_test_cases',
    'update_updated_at_column'
);

-- Check if constraints were created successfully
SELECT 
    'Constraints created successfully!' as status,
    COUNT(*) as total_constraints
FROM information_schema.table_constraints 
WHERE constraint_schema = 'public' 
AND constraint_name = 'unique_position_per_project'
AND table_name = 'test_cases'; 