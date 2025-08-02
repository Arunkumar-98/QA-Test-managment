-- 🔍 VERIFY AND FIX USER DATA ASSIGNMENT
-- Run this to check current data and fix user assignments

-- STEP 1: Check current user
SELECT 'Current User' as check_type, auth.uid() as user_id, auth.email() as user_email;

-- STEP 2: Check all projects and their user assignments
SELECT 'All Projects' as check_type, 
       id, 
       name, 
       user_id,
       created_at,
       CASE 
         WHEN user_id IS NULL THEN '❌ NO USER ASSIGNED'
         WHEN user_id = auth.uid() THEN '✅ YOUR PROJECT'
         ELSE '❌ OTHER USER PROJECT'
       END as status
FROM projects 
ORDER BY created_at DESC;

-- STEP 3: Check projects without user_id
SELECT 'Projects Without User' as check_type, COUNT(*) as count
FROM projects 
WHERE user_id IS NULL;

-- STEP 4: Check projects for current user
SELECT 'Your Projects' as check_type, COUNT(*) as count
FROM projects 
WHERE user_id = auth.uid();

-- STEP 5: Fix projects without user_id (assign to current user)
-- Uncomment the following lines if you want to assign orphaned projects to current user
/*
UPDATE projects 
SET user_id = auth.uid() 
WHERE user_id IS NULL 
AND auth.uid() IS NOT NULL;

SELECT 'Fixed Projects' as check_type, COUNT(*) as count
FROM projects 
WHERE user_id = auth.uid();
*/

-- STEP 6: Verify RLS is working
SELECT 'RLS Test' as check_type, 
       COUNT(*) as visible_projects,
       'Should only see your own projects' as note
FROM projects 
WHERE user_id = auth.uid();

-- STEP 7: Check other tables for user isolation
SELECT 'Test Cases' as table_name, COUNT(*) as total_count
FROM test_cases tc
JOIN projects p ON tc.project_id = p.id
WHERE p.user_id = auth.uid()
UNION ALL
SELECT 'Test Suites' as table_name, COUNT(*) as total_count
FROM test_suites ts
JOIN projects p ON ts.project_id = p.id
WHERE p.user_id = auth.uid()
UNION ALL
SELECT 'Documents' as table_name, COUNT(*) as total_count
FROM documents d
JOIN projects p ON d.project_id = p.id
WHERE p.user_id = auth.uid(); 