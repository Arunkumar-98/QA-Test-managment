-- =====================================================
-- Sample Test Cases Data Insertion
-- =====================================================
-- This script inserts the comprehensive test cases from the CSV/Excel files
-- All values match the exact dropdown specifications

-- =====================================================
-- INSERT COMPREHENSIVE TEST CASES
-- =====================================================

-- Get the project and suite IDs for insertion
DO $$
DECLARE
    project_id UUID;
    smoke_suite_id UUID;
    functional_suite_id UUID;
    performance_suite_id UUID;
BEGIN
    -- Get project ID
    SELECT id INTO project_id FROM projects WHERE name = 'QA Management System';
    
    -- Get suite IDs
    SELECT id INTO smoke_suite_id FROM test_suites WHERE name = 'Smoke Tests' AND project_id = project_id;
    SELECT id INTO functional_suite_id FROM test_suites WHERE name = 'Functional Tests' AND project_id = project_id;
    SELECT id INTO performance_suite_id FROM test_suites WHERE name = 'Performance Tests' AND project_id = project_id;

    -- Insert comprehensive test cases
    INSERT INTO test_cases (
        test_case,
        description,
        expected_result,
        status,
        priority,
        category,
        assigned_tester,
        environment,
        platform,
        prerequisites,
        steps_to_reproduce,
        qa_status,
        dev_status,
        assigned_dev,
        bug_status,
        test_type,
        test_level,
        defect_severity,
        defect_priority,
        estimated_time,
        actual_time,
        test_data,
        tags,
        reviewer,
        review_notes,
        project_id,
        suite_id,
        position
    ) VALUES 
    -- Test Case 1: User Login Functionality
    (
        'TC001',
        'Verify user login functionality',
        'User should login successfully',
        'Not Executed',
        'P1 (High)',
        'UI/UX',
        'john.doe@example.com',
        'Web',
        'Web',
        'Valid user account',
        '1. Open login page; 2. Enter credentials; 3. Click login',
        'New',
        'Open',
        'dev.smith@example.com',
        'New',
        'Functional',
        'System',
        'Major',
        'P2',
        15,
        0,
        'username: test@example.com; password: test123',
        ARRAY['UI', 'authentication'],
        'reviewer@example.com',
        'Ready for testing',
        project_id,
        smoke_suite_id,
        1
    ),
    
    -- Test Case 2: User Logout Functionality
    (
        'TC002',
        'Verify user logout functionality',
        'User should logout successfully',
        'Pass',
        'P2 (Medium)',
        'UI/UX',
        'jane.smith@example.com',
        'Web',
        'Web',
        'User logged in',
        '1. Click logout button; 2. Verify redirect to login',
        'Approved',
        'Closed',
        'dev.jones@example.com',
        'Closed',
        'Functional',
        'System',
        'Minor',
        'P3',
        10,
        8,
        'N/A',
        ARRAY['UI', 'session'],
        'reviewer@example.com',
        'Test passed successfully',
        project_id,
        functional_suite_id,
        2
    ),
    
    -- Test Case 3: Password Reset Functionality
    (
        'TC003',
        'Verify password reset functionality',
        'Password reset email should be sent',
        'Fail',
        'P2 (Medium)',
        'Notifications',
        'mike.johnson@example.com',
        'Web',
        'Web',
        'Valid email account',
        '1. Click forgot password; 2. Enter email; 3. Submit form',
        'Rejected',
        'In Progress',
        'dev.brown@example.com',
        'In Progress',
        'Functional',
        'Integration',
        'Major',
        'P2',
        20,
        25,
        'email: test@example.com',
        ARRAY['notifications', 'email'],
        'reviewer@example.com',
        'Email not being sent - needs investigation',
        project_id,
        functional_suite_id,
        3
    ),
    
    -- Test Case 4: API Response Time
    (
        'TC004',
        'Verify API response time',
        'API should respond within 2 seconds',
        'Not Executed',
        'P1 (High)',
        'Other',
        'sarah.wilson@example.com',
        'Backend',
        'Web',
        'API endpoint available',
        '1. Send GET request; 2. Measure response time; 3. Verify under 2s',
        'New',
        'Open',
        'dev.garcia@example.com',
        'New',
        'Performance',
        'System',
        'Major',
        'P2',
        30,
        0,
        'endpoint: /api/users',
        ARRAY['API', 'performance'],
        'reviewer@example.com',
        'Performance test ready to run',
        project_id,
        performance_suite_id,
        4
    ),
    
    -- Test Case 5: Mobile Responsive Design
    (
        'TC005',
        'Verify mobile responsive design',
        'Layout should adapt to mobile screen',
        'In Progress',
        'P3 (Low)',
        'UI/UX',
        'alex.brown@example.com',
        'Android',
        'Cross-platform',
        'Mobile device or emulator',
        '1. Open app on mobile; 2. Check layout; 3. Test interactions',
        'Reviewed',
        'Fixed',
        'dev.davis@example.com',
        'Verified',
        'Functional',
        'System',
        'Minor',
        'P3',
        45,
        30,
        'screen sizes: 375x667; 414x896',
        ARRAY['UI', 'mobile'],
        'reviewer@example.com',
        'Testing in progress on multiple devices',
        project_id,
        functional_suite_id,
        5
    );

END $$;

-- =====================================================
-- ADDITIONAL SAMPLE TEST CASES FOR DIFFERENT CATEGORIES
-- =====================================================

DO $$
DECLARE
    project_id UUID;
    functional_suite_id UUID;
    regression_suite_id UUID;
    security_suite_id UUID;
BEGIN
    -- Get project and suite IDs
    SELECT id INTO project_id FROM projects WHERE name = 'QA Management System';
    SELECT id INTO functional_suite_id FROM test_suites WHERE name = 'Functional Tests' AND project_id = project_id;
    SELECT id INTO regression_suite_id FROM test_suites WHERE name = 'Regression Tests' AND project_id = project_id;
    SELECT id INTO security_suite_id FROM test_suites WHERE name = 'Security Tests' AND project_id = project_id;

    -- Recording Category Test Cases
    INSERT INTO test_cases (
        test_case, description, expected_result, status, priority, category,
        assigned_tester, environment, platform, prerequisites, steps_to_reproduce,
        qa_status, dev_status, assigned_dev, bug_status, test_type, test_level,
        defect_severity, defect_priority, estimated_time, actual_time, test_data,
        tags, reviewer, review_notes, project_id, suite_id, position
    ) VALUES 
    (
        'TC006',
        'Verify audio recording functionality',
        'Audio should be recorded and saved successfully',
        'Not Executed',
        'P1 (High)',
        'Recording',
        'john.doe@example.com',
        'Android',
        'Android',
        'Microphone permissions granted',
        '1. Open recording app; 2. Tap record button; 3. Speak for 10 seconds; 4. Stop recording',
        'New',
        'Open',
        'dev.smith@example.com',
        'New',
        'Functional',
        'System',
        'Major',
        'P1',
        25,
        0,
        'audio format: MP3; duration: 10 seconds',
        ARRAY['recording', 'audio'],
        'reviewer@example.com',
        'Core functionality test',
        project_id,
        functional_suite_id,
        6
    ),
    
    -- Transcription Category Test Cases
    (
        'TC007',
        'Verify speech-to-text transcription',
        'Audio should be converted to text accurately',
        'Not Executed',
        'P2 (Medium)',
        'Transcription',
        'jane.smith@example.com',
        'Web',
        'Web',
        'Audio file available',
        '1. Upload audio file; 2. Select transcription option; 3. Wait for processing; 4. Verify text output',
        'New',
        'Open',
        'dev.jones@example.com',
        'New',
        'Functional',
        'Integration',
        'Major',
        'P2',
        40,
        0,
        'audio file: sample_audio.mp3; expected accuracy: 95%',
        ARRAY['transcription', 'AI'],
        'reviewer@example.com',
        'AI-powered feature test',
        project_id,
        functional_suite_id,
        7
    ),
    
    -- Calling Category Test Cases
    (
        'TC008',
        'Verify voice call functionality',
        'Voice call should connect and maintain quality',
        'Not Executed',
        'P0 (Blocker)',
        'Calling',
        'mike.johnson@example.com',
        'iOS',
        'iOS',
        'Phone permissions granted; network available',
        '1. Open calling app; 2. Dial test number; 3. Verify connection; 4. Test audio quality',
        'New',
        'Open',
        'dev.brown@example.com',
        'New',
        'Functional',
        'System',
        'Critical',
        'P0',
        35,
        0,
        'test number: +1234567890; expected quality: HD',
        ARRAY['calling', 'voice'],
        'reviewer@example.com',
        'Critical functionality test',
        project_id,
        functional_suite_id,
        8
    ),
    
    -- Security Test Cases
    (
        'TC009',
        'Verify SQL injection prevention',
        'SQL injection attempts should be blocked',
        'Not Executed',
        'P1 (High)',
        'Other',
        'sarah.wilson@example.com',
        'Backend',
        'Web',
        'Database access available',
        '1. Attempt SQL injection in login form; 2. Try various injection patterns; 3. Verify all are blocked',
        'New',
        'Open',
        'dev.garcia@example.com',
        'New',
        'Security',
        'System',
        'Critical',
        'P0',
        50,
        0,
        'injection patterns: OR 1=1; DROP TABLE; UNION SELECT',
        ARRAY['security', 'SQL'],
        'reviewer@example.com',
        'Security vulnerability test',
        project_id,
        security_suite_id,
        9
    ),
    
    -- Regression Test Cases
    (
        'TC010',
        'Verify user profile update regression',
        'Profile updates should work after recent changes',
        'Not Executed',
        'P2 (Medium)',
        'UI/UX',
        'alex.brown@example.com',
        'Web',
        'Web',
        'User logged in with existing profile',
        '1. Navigate to profile settings; 2. Update name and email; 3. Save changes; 4. Verify updates persist',
        'New',
        'Open',
        'dev.davis@example.com',
        'New',
        'Regression',
        'System',
        'Major',
        'P2',
        20,
        0,
        'profile data: name=John Doe; email=john.doe@example.com',
        ARRAY['regression', 'profile'],
        'reviewer@example.com',
        'Regression test after recent changes',
        project_id,
        regression_suite_id,
        10
    );

END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all test cases were inserted
SELECT 
    COUNT(*) as total_test_cases,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'Not Executed' THEN 1 END) as not_executed,
    COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress
FROM test_cases;

-- Show test cases by category
SELECT 
    category,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed
FROM test_cases 
GROUP BY category 
ORDER BY count DESC;

-- Show test cases by priority
SELECT 
    priority,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'Not Executed' THEN 1 END) as not_executed
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

-- Show test cases by environment
SELECT 
    environment,
    COUNT(*) as count
FROM test_cases 
GROUP BY environment 
ORDER BY count DESC;

-- Show test cases by test type
SELECT 
    test_type,
    COUNT(*) as count
FROM test_cases 
GROUP BY test_type 
ORDER BY count DESC;

COMMIT;
