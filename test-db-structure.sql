-- Test Database Structure
-- Run this in your Supabase SQL Editor to check if everything is set up

-- Check if test_cases table has custom_fields column
SELECT 
  'test_cases custom_fields column:' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'test_cases' AND column_name = 'custom_fields'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if custom_columns table exists
SELECT 
  'custom_columns table:' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'custom_columns'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check custom_columns table structure
SELECT 
  'custom_columns structure:' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_columns' 
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT 
  'Indexes:' as check_type,
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename IN ('custom_columns', 'test_cases')
  AND indexname LIKE '%custom%'
ORDER BY tablename, indexname;

