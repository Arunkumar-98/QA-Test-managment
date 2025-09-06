-- =====================================================
-- QA Management System - Test Cases Database Schema
-- =====================================================
-- Created: 2024
-- Purpose: Complete database schema for test case management
-- Supports all 39 table headers with proper constraints and enums

-- =====================================================
-- ENUM DEFINITIONS FOR DROPDOWN VALUES
-- =====================================================

-- Status enum for test case execution status
CREATE TYPE test_case_status AS ENUM (
    'Pass',
    'Fail', 
    'Blocked',
    'In Progress',
    'Not Executed',
    'Other'
);

-- Priority enum with descriptive labels
CREATE TYPE test_case_priority AS ENUM (
    'P0 (Blocker)',
    'P1 (High)',
    'P2 (Medium)', 
    'P3 (Low)',
    'Other'
);

-- Category enum for test case types
CREATE TYPE test_case_category AS ENUM (
    'Recording',
    'Transcription',
    'Notifications',
    'Calling',
    'UI/UX',
    'Other'
);

-- Environment enum
CREATE TYPE test_environment AS ENUM (
    'Android',
    'iOS',
    'Web',
    'Backend',
    'Other'
);

-- Platform enum
CREATE TYPE test_platform AS ENUM (
    'Android',
    'iOS',
    'Web',
    'Cross-platform',
    'Other'
);

-- QA Status enum
CREATE TYPE qa_status AS ENUM (
    'New',
    'Reviewed',
    'Approved',
    'Rejected',
    'Other'
);

-- Dev Status enum
CREATE TYPE dev_status AS ENUM (
    'Open',
    'In Progress',
    'Fixed',
    'Reopened',
    'Closed',
    'Other'
);

-- Bug Status enum
CREATE TYPE bug_status AS ENUM (
    'New',
    'In Progress',
    'Verified',
    'Closed',
    'Reopened',
    'Deferred',
    'Other'
);

-- Test Type enum
CREATE TYPE test_type AS ENUM (
    'Functional',
    'Regression',
    'Smoke',
    'Performance',
    'Security',
    'Other'
);

-- Test Level enum
CREATE TYPE test_level AS ENUM (
    'Unit',
    'Integration',
    'System',
    'UAT',
    'Other'
);

-- Defect Severity enum
CREATE TYPE defect_severity AS ENUM (
    'Critical',
    'Major',
    'Minor',
    'Trivial',
    'Other'
);

-- Defect Priority enum
CREATE TYPE defect_priority AS ENUM (
    'P0',
    'P1',
    'P2',
    'P3',
    'Other'
);

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Test Suites table
CREATE TABLE test_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Users table for team members
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('QA', 'Developer', 'Reviewer', 'Admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Main Test Cases table with all fields
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields (Required)
    test_case VARCHAR(500) NOT NULL,
    description TEXT,
    expected_result TEXT,
    
    -- Status and Priority
    status test_case_status DEFAULT 'Not Executed',
    priority test_case_priority DEFAULT 'P2 (Medium)',
    category test_case_category DEFAULT 'Other',
    
    -- Assignment fields
    assigned_tester VARCHAR(255),
    assigned_dev VARCHAR(255),
    reviewer VARCHAR(255),
    
    -- Dates
    execution_date DATE,
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Results and Notes
    actual_result TEXT,
    notes TEXT,
    review_notes TEXT,
    
    -- Environment and Platform
    environment test_environment DEFAULT 'Other',
    platform test_platform DEFAULT 'Other',
    prerequisites TEXT,
    steps_to_reproduce TEXT,
    
    -- Status tracking
    qa_status qa_status DEFAULT 'New',
    dev_status dev_status DEFAULT 'Open',
    bug_status bug_status DEFAULT 'New',
    
    -- Test classification
    test_type test_type DEFAULT 'Functional',
    test_level test_level DEFAULT 'System',
    defect_severity defect_severity DEFAULT 'Major',
    defect_priority defect_priority DEFAULT 'P2',
    
    -- Time tracking
    estimated_time INTEGER DEFAULT 0, -- in minutes
    actual_time INTEGER DEFAULT 0,    -- in minutes
    
    -- Additional data
    test_data TEXT,
    tags TEXT[], -- Array of tags
    attachments TEXT[], -- Array of file paths/URLs
    
    -- Automation
    automation_script JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- Organization
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    suite_id UUID REFERENCES test_suites(id) ON DELETE SET NULL,
    position INTEGER,
    
    -- Audit fields
    last_modified_by VARCHAR(255) DEFAULT 'Import System',
    
    -- Constraints
    CONSTRAINT test_case_unique_per_project UNIQUE (test_case, project_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for common queries
CREATE INDEX idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX idx_test_cases_suite_id ON test_cases(suite_id);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_priority ON test_cases(priority);
CREATE INDEX idx_test_cases_category ON test_cases(category);
CREATE INDEX idx_test_cases_assigned_tester ON test_cases(assigned_tester);
CREATE INDEX idx_test_cases_assigned_dev ON test_cases(assigned_dev);
CREATE INDEX idx_test_cases_qa_status ON test_cases(qa_status);
CREATE INDEX idx_test_cases_dev_status ON test_cases(dev_status);
CREATE INDEX idx_test_cases_bug_status ON test_cases(bug_status);
CREATE INDEX idx_test_cases_test_type ON test_cases(test_type);
CREATE INDEX idx_test_cases_environment ON test_cases(environment);
CREATE INDEX idx_test_cases_platform ON test_cases(platform);
CREATE INDEX idx_test_cases_created_at ON test_cases(created_at);
CREATE INDEX idx_test_cases_execution_date ON test_cases(execution_date);

-- Full text search indexes
CREATE INDEX idx_test_cases_test_case_fts ON test_cases USING gin(to_tsvector('english', test_case));
CREATE INDEX idx_test_cases_description_fts ON test_cases USING gin(to_tsvector('english', description));
CREATE INDEX idx_test_cases_expected_result_fts ON test_cases USING gin(to_tsvector('english', expected_result));

-- Composite indexes for common queries
CREATE INDEX idx_test_cases_project_status ON test_cases(project_id, status);
CREATE INDEX idx_test_cases_project_priority ON test_cases(project_id, priority);
CREATE INDEX idx_test_cases_suite_status ON test_cases(suite_id, status);
CREATE INDEX idx_test_cases_assigned_tester_status ON test_cases(assigned_tester, status);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for test_cases table
CREATE TRIGGER update_test_cases_updated_at 
    BEFORE UPDATE ON test_cases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for test_suites table
CREATE TRIGGER update_test_suites_updated_at 
    BEFORE UPDATE ON test_suites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for test case summary
CREATE VIEW test_case_summary AS
SELECT 
    tc.id,
    tc.test_case,
    tc.status,
    tc.priority,
    tc.category,
    tc.assigned_tester,
    tc.assigned_dev,
    tc.qa_status,
    tc.dev_status,
    tc.bug_status,
    tc.test_type,
    tc.environment,
    tc.platform,
    tc.estimated_time,
    tc.actual_time,
    p.name as project_name,
    ts.name as suite_name,
    tc.created_at,
    tc.execution_date
FROM test_cases tc
LEFT JOIN projects p ON tc.project_id = p.id
LEFT JOIN test_suites ts ON tc.suite_id = ts.id
WHERE tc.project_id = p.id;

-- View for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(tc.id) as total_test_cases,
    COUNT(CASE WHEN tc.status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN tc.status = 'Fail' THEN 1 END) as failed,
    COUNT(CASE WHEN tc.status = 'Blocked' THEN 1 END) as blocked,
    COUNT(CASE WHEN tc.status = 'In Progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN tc.status = 'Not Executed' THEN 1 END) as not_executed,
    COUNT(CASE WHEN tc.priority = 'P0 (Blocker)' THEN 1 END) as blocker_priority,
    COUNT(CASE WHEN tc.priority = 'P1 (High)' THEN 1 END) as high_priority,
    COUNT(CASE WHEN tc.qa_status = 'New' THEN 1 END) as new_qa,
    COUNT(CASE WHEN tc.dev_status = 'Open' THEN 1 END) as open_dev,
    COUNT(CASE WHEN tc.bug_status = 'New' THEN 1 END) as new_bugs
FROM projects p
LEFT JOIN test_cases tc ON p.id = tc.project_id
GROUP BY p.id, p.name;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE test_cases IS 'Main table for storing test cases with all 39 fields';
COMMENT ON COLUMN test_cases.test_case IS 'Unique test case identifier or title (Required)';
COMMENT ON COLUMN test_cases.status IS 'Execution status: Pass, Fail, Blocked, In Progress, Not Executed, Other';
COMMENT ON COLUMN test_cases.priority IS 'Priority level: P0 (Blocker), P1 (High), P2 (Medium), P3 (Low), Other';
COMMENT ON COLUMN test_cases.category IS 'Test category: Recording, Transcription, Notifications, Calling, UI/UX, Other';
COMMENT ON COLUMN test_cases.environment IS 'Test environment: Android, iOS, Web, Backend, Other';
COMMENT ON COLUMN test_cases.platform IS 'Platform: Android, iOS, Web, Cross-platform, Other';
COMMENT ON COLUMN test_cases.qa_status IS 'QA review status: New, Reviewed, Approved, Rejected, Other';
COMMENT ON COLUMN test_cases.dev_status IS 'Development status: Open, In Progress, Fixed, Reopened, Closed, Other';
COMMENT ON COLUMN test_cases.bug_status IS 'Bug tracking status: New, In Progress, Verified, Closed, Reopened, Deferred, Other';
COMMENT ON COLUMN test_cases.test_type IS 'Type of test: Functional, Regression, Smoke, Performance, Security, Other';
COMMENT ON COLUMN test_cases.test_level IS 'Test level: Unit, Integration, System, UAT, Other';
COMMENT ON COLUMN test_cases.defect_severity IS 'Defect severity: Critical, Major, Minor, Trivial, Other';
COMMENT ON COLUMN test_cases.defect_priority IS 'Defect priority: P0, P1, P2, P3, Other';
COMMENT ON COLUMN test_cases.estimated_time IS 'Estimated time in minutes';
COMMENT ON COLUMN test_cases.actual_time IS 'Actual time spent in minutes';
COMMENT ON COLUMN test_cases.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN test_cases.attachments IS 'Array of file paths or URLs for attachments';
COMMENT ON COLUMN test_cases.automation_script IS 'JSON object containing automation script details';
COMMENT ON COLUMN test_cases.custom_fields IS 'JSON object for project-specific custom fields';

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample project
INSERT INTO projects (name, description) VALUES 
('QA Management System', 'Comprehensive test case management system');

-- Insert sample test suites
INSERT INTO test_suites (name, description, project_id) VALUES 
('Smoke Tests', 'Critical functionality tests', (SELECT id FROM projects WHERE name = 'QA Management System')),
('Regression Tests', 'Full regression test suite', (SELECT id FROM projects WHERE name = 'QA Management System')),
('Functional Tests', 'Core functionality tests', (SELECT id FROM projects WHERE name = 'QA Management System')),
('Performance Tests', 'Performance and load tests', (SELECT id FROM projects WHERE name = 'QA Management System')),
('Security Tests', 'Security and vulnerability tests', (SELECT id FROM projects WHERE name = 'QA Management System'));

-- Insert sample users
INSERT INTO users (email, name, role) VALUES 
('john.doe@example.com', 'John Doe', 'QA'),
('jane.smith@example.com', 'Jane Smith', 'QA'),
('mike.johnson@example.com', 'Mike Johnson', 'QA'),
('sarah.wilson@example.com', 'Sarah Wilson', 'QA'),
('alex.brown@example.com', 'Alex Brown', 'QA'),
('dev.smith@example.com', 'Dev Smith', 'Developer'),
('dev.jones@example.com', 'Dev Jones', 'Developer'),
('dev.brown@example.com', 'Dev Brown', 'Developer'),
('dev.garcia@example.com', 'Dev Garcia', 'Developer'),
('dev.davis@example.com', 'Dev Davis', 'Developer'),
('reviewer@example.com', 'Reviewer User', 'Reviewer');

COMMIT;
