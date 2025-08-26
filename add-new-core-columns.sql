-- Add new core columns to test_cases table
-- This migration adds comprehensive QA management columns

ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS qa_status VARCHAR(50) DEFAULT 'Not Started',
ADD COLUMN IF NOT EXISTS dev_status VARCHAR(50) DEFAULT 'Not Started',
ADD COLUMN IF NOT EXISTS assigned_dev VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS bug_status VARCHAR(50) DEFAULT 'Open',
ADD COLUMN IF NOT EXISTS test_type VARCHAR(50) DEFAULT 'Manual',
ADD COLUMN IF NOT EXISTS test_level VARCHAR(50) DEFAULT 'System',
ADD COLUMN IF NOT EXISTS defect_severity VARCHAR(50) DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS defect_priority VARCHAR(10) DEFAULT 'P3',
ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS test_data TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reviewer VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS review_date VARCHAR(50) DEFAULT '',
ADD COLUMN IF NOT EXISTS review_notes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS last_modified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN test_cases.qa_status IS 'Current QA status: Not Started, In Progress, Pass, Fail, Blocked, Deferred, Not Applicable';
COMMENT ON COLUMN test_cases.dev_status IS 'Current development status: Not Started, In Progress, Completed, In Review, Blocked, Deferred';
COMMENT ON COLUMN test_cases.assigned_dev IS 'Developer assigned to this test case';
COMMENT ON COLUMN test_cases.bug_status IS 'Status of any associated bug: Open, In Progress, Fixed, Verified, Closed, Won''t Fix, Duplicate';
COMMENT ON COLUMN test_cases.test_type IS 'Type of testing: Manual, Automated, Semi-Automated, Exploratory, Performance, Security';
COMMENT ON COLUMN test_cases.test_level IS 'Level of testing: Unit, Integration, System, Acceptance, Regression, Smoke, Sanity';
COMMENT ON COLUMN test_cases.defect_severity IS 'Severity level: Critical, High, Medium, Low, Cosmetic';
COMMENT ON COLUMN test_cases.defect_priority IS 'Priority level: P1, P2, P3, P4, P5';
COMMENT ON COLUMN test_cases.estimated_time IS 'Estimated time to complete test in minutes';
COMMENT ON COLUMN test_cases.actual_time IS 'Actual time taken to complete test in minutes';
COMMENT ON COLUMN test_cases.test_data IS 'Test data requirements or setup information';
COMMENT ON COLUMN test_cases.attachments IS 'Array of file attachments';
COMMENT ON COLUMN test_cases.tags IS 'Array of tags for categorizing test cases';
COMMENT ON COLUMN test_cases.reviewer IS 'Person responsible for reviewing the test case';
COMMENT ON COLUMN test_cases.review_date IS 'Date when the test case was reviewed';
COMMENT ON COLUMN test_cases.review_notes IS 'Notes from the review process';
COMMENT ON COLUMN test_cases.last_modified_by IS 'Person who last modified the test case';
COMMENT ON COLUMN test_cases.last_modified_date IS 'Timestamp of last modification';
