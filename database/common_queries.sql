-- =====================================================
-- Common SQL Queries for QA Management System
-- =====================================================
-- This file contains useful queries for daily operations, reporting, and data analysis

-- =====================================================
-- DASHBOARD AND OVERVIEW QUERIES
-- =====================================================

-- 1. Overall Test Case Statistics
SELECT 
    COUNT(*) as total_test_cases,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'Blocked' THEN 1 END) as blocked,
    COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'Not Executed' THEN 1 END) as not_executed,
    ROUND(
        (COUNT(CASE WHEN status = 'Pass' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as pass_rate_percentage
FROM test_cases;

-- 2. Test Cases by Project and Suite
SELECT 
    p.name as project_name,
    ts.name as suite_name,
    COUNT(tc.id) as total_cases,
    COUNT(CASE WHEN tc.status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN tc.status = 'Fail' THEN 1 END) as failed,
    COUNT(CASE WHEN tc.status = 'Not Executed' THEN 1 END) as not_executed
FROM test_cases tc
JOIN projects p ON tc.project_id = p.id
LEFT JOIN test_suites ts ON tc.suite_id = ts.id
GROUP BY p.name, ts.name
ORDER BY p.name, ts.name;

-- 3. Priority Distribution
SELECT 
    priority,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_cases)), 2) as percentage
FROM test_cases 
GROUP BY priority 
ORDER BY 
    CASE priority 
        WHEN 'P0 (Blocker)' THEN 1
        WHEN 'P1 (High)' THEN 2
        WHEN 'P2 (Medium)' THEN 3
        WHEN 'P3 (Low)' THEN 4
        ELSE 5
    END;

-- =====================================================
-- ASSIGNMENT AND WORKLOAD QUERIES
-- =====================================================

-- 4. Test Cases Assigned to Each Tester
SELECT 
    assigned_tester,
    COUNT(*) as total_assigned,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'Not Executed' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
    ROUND(
        (COUNT(CASE WHEN status = 'Pass' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as completion_rate
FROM test_cases 
WHERE assigned_tester IS NOT NULL
GROUP BY assigned_tester
ORDER BY total_assigned DESC;

-- 5. Developer Workload
SELECT 
    assigned_dev,
    COUNT(*) as total_assigned,
    COUNT(CASE WHEN dev_status = 'Open' THEN 1 END) as open,
    COUNT(CASE WHEN dev_status = 'In Progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN dev_status = 'Fixed' THEN 1 END) as fixed,
    COUNT(CASE WHEN dev_status = 'Closed' THEN 1 END) as closed
FROM test_cases 
WHERE assigned_dev IS NOT NULL
GROUP BY assigned_dev
ORDER BY total_assigned DESC;

-- 6. QA Status Overview
SELECT 
    qa_status,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_cases)), 2) as percentage
FROM test_cases 
GROUP BY qa_status
ORDER BY count DESC;

-- =====================================================
-- CATEGORY AND TYPE ANALYSIS
-- =====================================================

-- 7. Test Cases by Category
SELECT 
    category,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'Not Executed' THEN 1 END) as not_executed,
    ROUND(
        (COUNT(CASE WHEN status = 'Pass' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as pass_rate
FROM test_cases 
GROUP BY category
ORDER BY total DESC;

-- 8. Test Cases by Environment
SELECT 
    environment,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed
FROM test_cases 
GROUP BY environment
ORDER BY count DESC;

-- 9. Test Cases by Platform
SELECT 
    platform,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed
FROM test_cases 
GROUP BY platform
ORDER BY count DESC;

-- 10. Test Type Distribution
SELECT 
    test_type,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_cases)), 2) as percentage
FROM test_cases 
GROUP BY test_type
ORDER BY count DESC;

-- =====================================================
-- TIME TRACKING AND EFFICIENCY
-- =====================================================

-- 11. Time Tracking Summary
SELECT 
    COUNT(*) as total_test_cases,
    SUM(estimated_time) as total_estimated_minutes,
    SUM(actual_time) as total_actual_minutes,
    ROUND(AVG(estimated_time), 2) as avg_estimated_minutes,
    ROUND(AVG(actual_time), 2) as avg_actual_minutes,
    ROUND(
        (SUM(actual_time) * 100.0 / NULLIF(SUM(estimated_time), 0)), 2
    ) as time_efficiency_percentage
FROM test_cases 
WHERE estimated_time > 0 OR actual_time > 0;

-- 12. Test Cases Taking Longer Than Estimated
SELECT 
    test_case,
    estimated_time,
    actual_time,
    (actual_time - estimated_time) as time_overrun,
    ROUND(
        ((actual_time - estimated_time) * 100.0 / estimated_time), 2
    ) as overrun_percentage
FROM test_cases 
WHERE actual_time > estimated_time AND estimated_time > 0
ORDER BY overrun_percentage DESC;

-- =====================================================
-- BUG AND DEFECT TRACKING
-- =====================================================

-- 13. Bug Status Overview
SELECT 
    bug_status,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_cases)), 2) as percentage
FROM test_cases 
GROUP BY bug_status
ORDER BY count DESC;

-- 14. Defect Severity Distribution
SELECT 
    defect_severity,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_cases)), 2) as percentage
FROM test_cases 
GROUP BY defect_severity
ORDER BY 
    CASE defect_severity
        WHEN 'Critical' THEN 1
        WHEN 'Major' THEN 2
        WHEN 'Minor' THEN 3
        WHEN 'Trivial' THEN 4
        ELSE 5
    END;

-- 15. Critical and Major Defects
SELECT 
    test_case,
    description,
    defect_severity,
    defect_priority,
    assigned_dev,
    bug_status
FROM test_cases 
WHERE defect_severity IN ('Critical', 'Major')
ORDER BY 
    CASE defect_severity
        WHEN 'Critical' THEN 1
        WHEN 'Major' THEN 2
    END,
    CASE defect_priority
        WHEN 'P0' THEN 1
        WHEN 'P1' THEN 2
        WHEN 'P2' THEN 3
        WHEN 'P3' THEN 4
    END;

-- =====================================================
-- SEARCH AND FILTER QUERIES
-- =====================================================

-- 16. Search Test Cases by Keywords
-- Replace 'login' with your search term
SELECT 
    tc.test_case,
    tc.description,
    tc.status,
    tc.priority,
    tc.category,
    tc.assigned_tester,
    p.name as project_name,
    ts.name as suite_name
FROM test_cases tc
JOIN projects p ON tc.project_id = p.id
LEFT JOIN test_suites ts ON tc.suite_id = ts.id
WHERE 
    tc.test_case ILIKE '%login%' OR
    tc.description ILIKE '%login%' OR
    tc.expected_result ILIKE '%login%' OR
    tc.steps_to_reproduce ILIKE '%login%'
ORDER BY tc.test_case;

-- 17. Filter Test Cases by Multiple Criteria
SELECT 
    tc.test_case,
    tc.description,
    tc.status,
    tc.priority,
    tc.category,
    tc.environment,
    tc.platform,
    tc.assigned_tester,
    tc.assigned_dev
FROM test_cases tc
WHERE 
    tc.status = 'Not Executed' AND
    tc.priority IN ('P0 (Blocker)', 'P1 (High)') AND
    tc.category = 'UI/UX' AND
    tc.environment = 'Web'
ORDER BY 
    CASE tc.priority
        WHEN 'P0 (Blocker)' THEN 1
        WHEN 'P1 (High)' THEN 2
    END;

-- =====================================================
-- REPORTING QUERIES
-- =====================================================

-- 18. Weekly Test Execution Report
SELECT 
    DATE_TRUNC('week', created_at) as week_start,
    COUNT(*) as new_test_cases,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'Blocked' THEN 1 END) as blocked,
    ROUND(
        (COUNT(CASE WHEN status = 'Pass' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as pass_rate
FROM test_cases 
WHERE created_at >= NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- 19. Test Case Creation Trend
SELECT 
    DATE(created_at) as creation_date,
    COUNT(*) as test_cases_created
FROM test_cases 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY creation_date DESC;

-- 20. Test Execution Trend
SELECT 
    DATE(execution_date) as execution_date,
    COUNT(*) as test_cases_executed,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed
FROM test_cases 
WHERE execution_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE(execution_date)
ORDER BY execution_date DESC;

-- =====================================================
-- PERFORMANCE AND EFFICIENCY QUERIES
-- =====================================================

-- 21. Test Cases by Execution Time Efficiency
SELECT 
    test_case,
    estimated_time,
    actual_time,
    CASE 
        WHEN actual_time <= estimated_time THEN 'On Time'
        WHEN actual_time <= estimated_time * 1.2 THEN 'Slightly Over'
        WHEN actual_time <= estimated_time * 1.5 THEN 'Over Time'
        ELSE 'Significantly Over'
    END as efficiency_category
FROM test_cases 
WHERE estimated_time > 0 AND actual_time > 0
ORDER BY (actual_time / estimated_time) DESC;

-- 22. Most Time-Consuming Test Cases
SELECT 
    test_case,
    description,
    actual_time,
    estimated_time,
    (actual_time - estimated_time) as time_difference
FROM test_cases 
WHERE actual_time > 0
ORDER BY actual_time DESC
LIMIT 10;

-- =====================================================
-- TEAM PERFORMANCE QUERIES
-- =====================================================

-- 23. Tester Performance Metrics
SELECT 
    assigned_tester,
    COUNT(*) as total_assigned,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed,
    ROUND(
        (COUNT(CASE WHEN status = 'Pass' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as success_rate,
    ROUND(AVG(actual_time), 2) as avg_execution_time
FROM test_cases 
WHERE assigned_tester IS NOT NULL
GROUP BY assigned_tester
ORDER BY success_rate DESC;

-- 24. Developer Response Time
SELECT 
    assigned_dev,
    COUNT(*) as total_assigned,
    COUNT(CASE WHEN dev_status = 'Fixed' THEN 1 END) as fixed,
    COUNT(CASE WHEN dev_status = 'Closed' THEN 1 END) as closed,
    ROUND(
        (COUNT(CASE WHEN dev_status IN ('Fixed', 'Closed') THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as resolution_rate
FROM test_cases 
WHERE assigned_dev IS NOT NULL
GROUP BY assigned_dev
ORDER BY resolution_rate DESC;

-- =====================================================
-- DATA QUALITY AND MAINTENANCE QUERIES
-- =====================================================

-- 25. Test Cases Missing Required Information
SELECT 
    test_case,
    CASE 
        WHEN description IS NULL OR description = '' THEN 'Missing Description'
        WHEN expected_result IS NULL OR expected_result = '' THEN 'Missing Expected Result'
        WHEN steps_to_reproduce IS NULL OR steps_to_reproduce = '' THEN 'Missing Steps'
        ELSE 'Other Issues'
    END as missing_info
FROM test_cases 
WHERE 
    description IS NULL OR description = '' OR
    expected_result IS NULL OR expected_result = '' OR
    steps_to_reproduce IS NULL OR steps_to_reproduce = '';

-- 26. Duplicate Test Case Names
SELECT 
    test_case,
    COUNT(*) as duplicate_count
FROM test_cases 
GROUP BY test_case
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 27. Test Cases Without Assignment
SELECT 
    test_case,
    description,
    status,
    priority
FROM test_cases 
WHERE assigned_tester IS NULL OR assigned_tester = ''
ORDER BY 
    CASE priority
        WHEN 'P0 (Blocker)' THEN 1
        WHEN 'P1 (High)' THEN 2
        WHEN 'P2 (Medium)' THEN 3
        WHEN 'P3 (Low)' THEN 4
    END;

-- =====================================================
-- EXPORT QUERIES FOR REPORTING
-- =====================================================

-- 28. Complete Test Case Export
SELECT 
    tc.test_case,
    tc.description,
    tc.expected_result,
    tc.status,
    tc.priority,
    tc.category,
    tc.assigned_tester,
    tc.environment,
    tc.platform,
    tc.prerequisites,
    tc.steps_to_reproduce,
    tc.qa_status,
    tc.dev_status,
    tc.assigned_dev,
    tc.bug_status,
    tc.test_type,
    tc.test_level,
    tc.defect_severity,
    tc.defect_priority,
    tc.estimated_time,
    tc.actual_time,
    tc.test_data,
    tc.tags,
    tc.reviewer,
    tc.review_notes,
    p.name as project_name,
    ts.name as suite_name,
    tc.execution_date,
    tc.created_at,
    tc.updated_at
FROM test_cases tc
JOIN projects p ON tc.project_id = p.id
LEFT JOIN test_suites ts ON tc.suite_id = ts.id
ORDER BY tc.test_case;

-- 29. Test Case Summary for Management
SELECT 
    p.name as project_name,
    ts.name as suite_name,
    tc.test_case,
    tc.status,
    tc.priority,
    tc.category,
    tc.assigned_tester,
    tc.assigned_dev,
    tc.qa_status,
    tc.dev_status,
    tc.bug_status,
    tc.estimated_time,
    tc.actual_time,
    tc.execution_date
FROM test_cases tc
JOIN projects p ON tc.project_id = p.id
LEFT JOIN test_suites ts ON tc.suite_id = ts.id
ORDER BY p.name, ts.name, tc.test_case;

COMMIT;
