-- =====================================================
-- QA Management System - Database Setup Script
-- =====================================================
-- This script sets up the complete database for the QA Management System
-- Run this script to create all tables, indexes, and sample data

-- =====================================================
-- DATABASE CONFIGURATION
-- =====================================================

-- Set timezone
SET timezone = 'UTC';

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CREATE DATABASE SCHEMA
-- =====================================================

-- Run the main schema file
\i database/test_cases_schema.sql

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Run the sample data file
\i database/sample_test_cases_data.sql

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify database setup
SELECT 'Database Setup Complete' as status;

-- Check table counts
SELECT 
    'projects' as table_name,
    COUNT(*) as record_count
FROM projects
UNION ALL
SELECT 
    'test_suites' as table_name,
    COUNT(*) as record_count
FROM test_suites
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'test_cases' as table_name,
    COUNT(*) as record_count
FROM test_cases;

-- Check test case distribution
SELECT 
    'Test Cases by Status' as category,
    status as value,
    COUNT(*) as count
FROM test_cases
GROUP BY status
UNION ALL
SELECT 
    'Test Cases by Priority' as category,
    priority as value,
    COUNT(*) as count
FROM test_cases
GROUP BY priority
UNION ALL
SELECT 
    'Test Cases by Category' as category,
    category as value,
    COUNT(*) as count
FROM test_cases
GROUP BY category;

-- =====================================================
-- CREATE ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_test_cases_status_priority ON test_cases(status, priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_category_status ON test_cases(category, status);
CREATE INDEX IF NOT EXISTS idx_test_cases_environment_platform ON test_cases(environment, platform);
CREATE INDEX IF NOT EXISTS idx_test_cases_qa_dev_status ON test_cases(qa_status, dev_status);

-- Indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_test_cases_created_at_date ON test_cases(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_test_cases_updated_at_date ON test_cases(DATE(updated_at));
CREATE INDEX IF NOT EXISTS idx_test_cases_execution_date_date ON test_cases(execution_date);

-- Indexes for text search
CREATE INDEX IF NOT EXISTS idx_test_cases_test_case_trgm ON test_cases USING gin(test_case gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_test_cases_description_trgm ON test_cases USING gin(description gin_trgm_ops);

-- =====================================================
-- CREATE ADDITIONAL VIEWS FOR REPORTING
-- =====================================================

-- View for test case execution summary
CREATE OR REPLACE VIEW test_execution_summary AS
SELECT 
    DATE(execution_date) as execution_date,
    COUNT(*) as total_executed,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'Blocked' THEN 1 END) as blocked,
    ROUND(
        (COUNT(CASE WHEN status = 'Pass' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as pass_rate
FROM test_cases 
WHERE execution_date IS NOT NULL
GROUP BY DATE(execution_date)
ORDER BY execution_date DESC;

-- View for team workload
CREATE OR REPLACE VIEW team_workload AS
SELECT 
    'QA' as team,
    assigned_tester as member,
    COUNT(*) as total_assigned,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'Not Executed' THEN 1 END) as pending
FROM test_cases 
WHERE assigned_tester IS NOT NULL
GROUP BY assigned_tester
UNION ALL
SELECT 
    'Development' as team,
    assigned_dev as member,
    COUNT(*) as total_assigned,
    COUNT(CASE WHEN dev_status IN ('Fixed', 'Closed') THEN 1 END) as completed,
    COUNT(CASE WHEN dev_status = 'Open' THEN 1 END) as pending
FROM test_cases 
WHERE assigned_dev IS NOT NULL
GROUP BY assigned_dev
ORDER BY team, total_assigned DESC;

-- View for defect tracking
CREATE OR REPLACE VIEW defect_tracking AS
SELECT 
    defect_severity,
    defect_priority,
    bug_status,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_cases)), 2) as percentage
FROM test_cases 
GROUP BY defect_severity, defect_priority, bug_status
ORDER BY 
    CASE defect_severity
        WHEN 'Critical' THEN 1
        WHEN 'Major' THEN 2
        WHEN 'Minor' THEN 3
        WHEN 'Trivial' THEN 4
        ELSE 5
    END,
    CASE defect_priority
        WHEN 'P0' THEN 1
        WHEN 'P1' THEN 2
        WHEN 'P2' THEN 3
        WHEN 'P3' THEN 4
        ELSE 5
    END;

-- =====================================================
-- CREATE STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

-- Procedure to update test case status
CREATE OR REPLACE PROCEDURE update_test_case_status(
    p_test_case_id UUID,
    p_status test_case_status,
    p_actual_result TEXT DEFAULT NULL,
    p_actual_time INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE test_cases 
    SET 
        status = p_status,
        actual_result = COALESCE(p_actual_result, actual_result),
        actual_time = COALESCE(p_actual_time, actual_time),
        notes = COALESCE(p_notes, notes),
        execution_date = CASE WHEN p_status IN ('Pass', 'Fail', 'Blocked') THEN CURRENT_DATE ELSE execution_date END,
        updated_at = NOW(),
        last_modified_date = NOW()
    WHERE id = p_test_case_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test case with ID % not found', p_test_case_id;
    END IF;
END;
$$;

-- Procedure to assign test case to tester
CREATE OR REPLACE PROCEDURE assign_test_case(
    p_test_case_id UUID,
    p_assigned_tester VARCHAR(255),
    p_assigned_dev VARCHAR(255) DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE test_cases 
    SET 
        assigned_tester = p_assigned_tester,
        assigned_dev = COALESCE(p_assigned_dev, assigned_dev),
        updated_at = NOW(),
        last_modified_date = NOW()
    WHERE id = p_test_case_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test case with ID % not found', p_test_case_id;
    END IF;
END;
$$;

-- Procedure to create new test case
CREATE OR REPLACE PROCEDURE create_test_case(
    p_test_case VARCHAR(500),
    p_description TEXT DEFAULT NULL,
    p_expected_result TEXT DEFAULT NULL,
    p_priority test_case_priority DEFAULT 'P2 (Medium)',
    p_category test_case_category DEFAULT 'Other',
    p_project_id UUID,
    p_suite_id UUID DEFAULT NULL,
    p_assigned_tester VARCHAR(255) DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_test_case_id UUID;
BEGIN
    INSERT INTO test_cases (
        test_case,
        description,
        expected_result,
        priority,
        category,
        project_id,
        suite_id,
        assigned_tester
    ) VALUES (
        p_test_case,
        p_description,
        p_expected_result,
        p_priority,
        p_category,
        p_project_id,
        p_suite_id,
        p_assigned_tester
    ) RETURNING id INTO v_test_case_id;
    
    RAISE NOTICE 'Test case created with ID: %', v_test_case_id;
END;
$$;

-- =====================================================
-- CREATE FUNCTIONS FOR DATA ANALYSIS
-- =====================================================

-- Function to calculate test execution metrics
CREATE OR REPLACE FUNCTION get_test_execution_metrics(
    p_project_id UUID DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    total_test_cases BIGINT,
    executed_test_cases BIGINT,
    passed_test_cases BIGINT,
    failed_test_cases BIGINT,
    blocked_test_cases BIGINT,
    pass_rate NUMERIC,
    execution_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_test_cases,
        COUNT(CASE WHEN status IN ('Pass', 'Fail', 'Blocked') THEN 1 END) as executed_test_cases,
        COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed_test_cases,
        COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed_test_cases,
        COUNT(CASE WHEN status = 'Blocked' THEN 1 END) as blocked_test_cases,
        ROUND(
            (COUNT(CASE WHEN status = 'Pass' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(CASE WHEN status IN ('Pass', 'Fail', 'Blocked') THEN 1 END), 0)), 2
        ) as pass_rate,
        ROUND(
            (COUNT(CASE WHEN status IN ('Pass', 'Fail', 'Blocked') THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as execution_rate
    FROM test_cases tc
    WHERE 
        (p_project_id IS NULL OR tc.project_id = p_project_id) AND
        (p_date_from IS NULL OR tc.created_at >= p_date_from) AND
        (p_date_to IS NULL OR tc.created_at <= p_date_to);
END;
$$;

-- Function to get test case statistics by time period
CREATE OR REPLACE FUNCTION get_test_case_trends(
    p_project_id UUID DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    new_test_cases BIGINT,
    executed_test_cases BIGINT,
    passed_test_cases BIGINT,
    failed_test_cases BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(tc.created_at) as date,
        COUNT(*) as new_test_cases,
        COUNT(CASE WHEN tc.status IN ('Pass', 'Fail', 'Blocked') THEN 1 END) as executed_test_cases,
        COUNT(CASE WHEN tc.status = 'Pass' THEN 1 END) as passed_test_cases,
        COUNT(CASE WHEN tc.status = 'Fail' THEN 1 END) as failed_test_cases
    FROM test_cases tc
    WHERE 
        (p_project_id IS NULL OR tc.project_id = p_project_id) AND
        tc.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY DATE(tc.created_at)
    ORDER BY date DESC;
END;
$$;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

SELECT 'QA Management System Database Setup Complete!' as message;
SELECT 'All tables, indexes, views, procedures, and sample data have been created.' as details;
SELECT 'You can now use the system with the comprehensive test case management features.' as next_steps;

COMMIT;
