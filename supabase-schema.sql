-- Create tables for QA Test Management System

-- Test Cases table
CREATE TABLE test_cases (
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
  project TEXT NOT NULL,
  suite_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Suites table
CREATE TABLE test_suites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project TEXT NOT NULL,
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
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('requirement', 'specification', 'test-plan', 'report')) NOT NULL,
  description TEXT,
  project TEXT NOT NULL,
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by TEXT
);

-- Important Links table
CREATE TABLE important_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('general', 'documentation', 'tools', 'resources')) DEFAULT 'general',
  project TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platforms table
CREATE TABLE platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- App Settings table
CREATE TABLE app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID,
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
CREATE TABLE test_case_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID,
  target_id UUID,
  type TEXT CHECK (type IN ('depends_on', 'related_to', 'blocks', 'duplicate')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, target_id, type)
);

-- Saved Filters table
CREATE TABLE saved_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  search_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_test_cases_project ON test_cases(project);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_priority ON test_cases(priority);
CREATE INDEX idx_test_cases_assigned_tester ON test_cases(assigned_tester);
CREATE INDEX idx_test_suites_project ON test_suites(project);
CREATE INDEX idx_documents_project ON documents(project);
CREATE INDEX idx_important_links_project ON important_links(project);
CREATE INDEX idx_comments_test_case_id ON comments(test_case_id);

-- Enable Row Level Security (RLS)
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

-- Create policies for public read/write access (for demo purposes)
-- In production, you should implement proper authentication and authorization

-- Test Cases policies
CREATE POLICY "Allow public read access to test cases" ON test_cases FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to test cases" ON test_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to test cases" ON test_cases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to test cases" ON test_cases FOR DELETE USING (true);

-- Test Suites policies
CREATE POLICY "Allow public read access to test suites" ON test_suites FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to test suites" ON test_suites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to test suites" ON test_suites FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to test suites" ON test_suites FOR DELETE USING (true);

-- Documents policies
CREATE POLICY "Allow public read access to documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to documents" ON documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to documents" ON documents FOR DELETE USING (true);

-- Important Links policies
CREATE POLICY "Allow public read access to important links" ON important_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to important links" ON important_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to important links" ON important_links FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to important links" ON important_links FOR DELETE USING (true);

-- Platforms policies
CREATE POLICY "Allow public read access to platforms" ON platforms FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to platforms" ON platforms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to platforms" ON platforms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to platforms" ON platforms FOR DELETE USING (true);

-- Projects policies
CREATE POLICY "Allow public read access to projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to projects" ON projects FOR DELETE USING (true);

-- App Settings policies
CREATE POLICY "Allow public read access to app settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to app settings" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to app settings" ON app_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to app settings" ON app_settings FOR DELETE USING (true);

-- Comments policies
CREATE POLICY "Allow public read access to comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to comments" ON comments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to comments" ON comments FOR DELETE USING (true);

-- Test Case Relationships policies
CREATE POLICY "Allow public read access to test case relationships" ON test_case_relationships FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to test case relationships" ON test_case_relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to test case relationships" ON test_case_relationships FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to test case relationships" ON test_case_relationships FOR DELETE USING (true);

-- Saved Filters policies
CREATE POLICY "Allow public read access to saved filters" ON saved_filters FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to saved filters" ON saved_filters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to saved filters" ON saved_filters FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to saved filters" ON saved_filters FOR DELETE USING (true);

-- Insert default data
INSERT INTO projects (name, description) VALUES 
  ('Default Project', 'Default project for QA testing'),
  ('Web Application', 'Web application testing project'),
  ('Mobile App', 'Mobile application testing project'),
  ('API Testing', 'API testing project');

INSERT INTO platforms (name, description) VALUES 
  ('Web', 'Web browser testing'),
  ('Mobile', 'Mobile device testing'),
  ('Desktop', 'Desktop application testing'),
  ('API', 'API testing'),
  ('Database', 'Database testing');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON test_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_suites_updated_at BEFORE UPDATE ON test_suites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 