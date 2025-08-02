-- Check Database Structure and User Isolation Status
-- Run this in Supabase SQL Editor

-- 1. Check if user_id columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('projects', 'test_cases', 'test_suites', 'documents', 'important_links', 'comments', 'status_history', 'saved_filters')
AND column_name = 'user_id'
ORDER BY table_name;

-- 2. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('projects', 'test_cases', 'test_suites', 'documents', 'important_links', 'comments', 'status_history', 'saved_filters')
ORDER BY tablename;

-- 3. Check existing policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'test_cases', 'test_suites', 'documents', 'important_links', 'comments', 'status_history', 'saved_filters')
ORDER BY tablename, policyname;

-- 4. Check current data distribution
SELECT 
    'projects' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_count,
    COUNT(DISTINCT user_id) as unique_users
FROM projects
UNION ALL
SELECT 
    'test_cases' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_count,
    COUNT(DISTINCT user_id) as unique_users
FROM test_cases
UNION ALL
SELECT 
    'test_suites' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_count,
    COUNT(DISTINCT user_id) as unique_users
FROM test_suites;

-- 5. Show sample data with user_id
SELECT 
    'projects' as table_name,
    id,
    name,
    user_id,
    created_at
FROM projects 
LIMIT 5
UNION ALL
SELECT 
    'test_cases' as table_name,
    id::text,
    test_case,
    user_id,
    created_at
FROM test_cases 
LIMIT 5; 