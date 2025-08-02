-- 🧪 TEST PROJECT CREATION WITH USER ISOLATION
-- Run this to verify the fix works

-- STEP 1: Check current user
SELECT 'Current User' as check_type, auth.uid() as user_id, auth.email() as user_email;

-- STEP 2: Check if user is authenticated
SELECT 'Authentication Status' as check_type, 
       CASE 
         WHEN auth.uid() IS NOT NULL THEN '✅ Authenticated'
         ELSE '❌ Not Authenticated'
       END as status;

-- STEP 3: Check current projects for user
SELECT 'Current Projects' as check_type, COUNT(*) as count
FROM projects 
WHERE user_id = auth.uid();

-- STEP 4: Test project creation (this should work now)
-- Note: This will be handled by the application, not this SQL script
-- The application should now properly set user_id when creating projects

-- STEP 5: Verify RLS policies are working
SELECT 'RLS Test - Projects' as check_type, 
       COUNT(*) as visible_projects
FROM projects;

-- STEP 6: Check if any projects exist without user_id (should be 0)
SELECT 'Orphaned Projects' as check_type, 
       COUNT(*) as count
FROM projects 
WHERE user_id IS NULL;

-- STEP 7: Show all projects with their user assignments
SELECT 'All Projects' as check_type, 
       id, 
       name, 
       user_id,
       CASE 
         WHEN user_id IS NULL THEN '❌ NO USER'
         WHEN user_id = auth.uid() THEN '✅ YOURS'
         ELSE '❌ OTHER USER'
       END as ownership
FROM projects 
ORDER BY created_at DESC; 