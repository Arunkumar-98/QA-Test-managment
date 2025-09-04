-- Fully Compatible Database Performance Optimization Script
-- This version works with all Supabase instances and handles missing extensions gracefully
-- Run this in your Supabase SQL Editor to improve query performance

-- ===============
-- TEST CASES TABLE INDEXES
-- ===============

-- Primary indexes for test cases
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON public.test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON public.test_cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON public.test_cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_category ON public.test_cases(category);
CREATE INDEX IF NOT EXISTS idx_test_cases_platform ON public.test_cases(platform);
CREATE INDEX IF NOT EXISTS idx_test_cases_assigned_tester ON public.test_cases(assigned_tester);
CREATE INDEX IF NOT EXISTS idx_test_cases_suite_id ON public.test_cases(suite_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_position ON public.test_cases(position);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_test_cases_project_status ON public.test_cases(project_id, status);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_priority ON public.test_cases(project_id, priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_category ON public.test_cases(project_id, category);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_platform ON public.test_cases(project_id, platform);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_assigned_tester ON public.test_cases(project_id, assigned_tester);

-- Date-based indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_created_at ON public.test_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_test_cases_updated_at ON public.test_cases(updated_at);
CREATE INDEX IF NOT EXISTS idx_test_cases_execution_date ON public.test_cases(execution_date);

-- Text search indexes (only if columns exist)
DO $$
BEGIN
  -- Check if test_case column exists before creating text search index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_cases' AND column_name = 'test_case') THEN
    CREATE INDEX IF NOT EXISTS idx_test_cases_test_case_gin ON public.test_cases USING gin(to_tsvector('english', test_case));
  END IF;
  
  -- Check if description column exists before creating text search index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_cases' AND column_name = 'description') THEN
    CREATE INDEX IF NOT EXISTS idx_test_cases_description_gin ON public.test_cases USING gin(to_tsvector('english', description));
  END IF;
  
  -- Check if steps_to_reproduce column exists before creating text search index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_cases' AND column_name = 'steps_to_reproduce') THEN
    CREATE INDEX IF NOT EXISTS idx_test_cases_steps_to_reproduce_gin ON public.test_cases USING gin(to_tsvector('english', steps_to_reproduce));
  END IF;
END $$;

-- Tags and arrays indexes (only if columns exist)
DO $$
BEGIN
  -- Check if tags column exists before creating GIN index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_cases' AND column_name = 'tags') THEN
    CREATE INDEX IF NOT EXISTS idx_test_cases_tags_gin ON public.test_cases USING gin(tags);
  END IF;
  
  -- Check if attachments column exists before creating GIN index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_cases' AND column_name = 'attachments') THEN
    CREATE INDEX IF NOT EXISTS idx_test_cases_attachments_gin ON public.test_cases USING gin(attachments);
  END IF;
END $$;

-- ===============
-- TEST SUITES TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON public.test_suites(project_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_owner ON public.test_suites(owner);
CREATE INDEX IF NOT EXISTS idx_test_suites_is_active ON public.test_suites(is_active);
CREATE INDEX IF NOT EXISTS idx_test_suites_created_at ON public.test_suites(created_at);
CREATE INDEX IF NOT EXISTS idx_test_suites_updated_at ON public.test_suites(updated_at);
CREATE INDEX IF NOT EXISTS idx_test_suites_last_run ON public.test_suites(last_run);

-- Tags index (only if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_suites' AND column_name = 'tags') THEN
    CREATE INDEX IF NOT EXISTS idx_test_suites_tags_gin ON public.test_suites USING GIN(tags);
  END IF;
END $$;

-- ===============
-- PROJECTS TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON public.projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);

-- Tags index (only if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tags') THEN
    CREATE INDEX IF NOT EXISTS idx_projects_tags_gin ON public.projects USING GIN(tags);
  END IF;
END $$;

-- ===============
-- COMMENTS TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_comments_test_case_id ON public.comments(test_case_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author);
CREATE INDEX IF NOT EXISTS idx_comments_timestamp ON public.comments(timestamp);
CREATE INDEX IF NOT EXISTS idx_comments_is_resolved ON public.comments(is_resolved);

-- ===============
-- STATUS HISTORY TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_status_history_test_case_id ON public.status_history(test_case_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_by ON public.status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON public.status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_status_history_reason ON public.status_history(reason);

-- ===============
-- CUSTOM COLUMNS TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_custom_columns_project_id ON public.custom_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_columns_type ON public.custom_columns(type);
CREATE INDEX IF NOT EXISTS idx_custom_columns_visible ON public.custom_columns(visible);

-- ===============
-- DOCUMENTS TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

-- ===============
-- IMPORTANT LINKS TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_important_links_project_id ON public.important_links(project_id);
CREATE INDEX IF NOT EXISTS idx_important_links_category ON public.important_links(category);
CREATE INDEX IF NOT EXISTS idx_important_links_created_at ON public.important_links(created_at);

-- ===============
-- PROJECT SHARES TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_project_shares_project_id ON public.project_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_created_by ON public.project_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_project_shares_is_active ON public.project_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_project_shares_expires_at ON public.project_shares(expires_at);

-- ===============
-- TEST SUITE SHARES TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_test_suite_shares_test_suite_id ON public.test_suite_shares(test_suite_id);
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_project_id ON public.test_suite_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_created_by ON public.test_suite_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_is_active ON public.test_suite_shares(is_active);

-- ===============
-- SHARED PROJECT REFERENCES TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_shared_project_refs_user_id ON public.shared_project_references(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_project_refs_original_project_id ON public.shared_project_references(original_project_id);
CREATE INDEX IF NOT EXISTS idx_shared_project_refs_is_active ON public.shared_project_references(is_active);

-- ===============
-- PROJECT MEMBERSHIPS TABLE INDEXES
-- ===============

CREATE INDEX IF NOT EXISTS idx_project_memberships_project_id ON public.project_memberships(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memberships_user_id ON public.project_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_project_memberships_role ON public.project_memberships(role);
CREATE INDEX IF NOT EXISTS idx_project_memberships_status ON public.project_memberships(status);

-- ===============
-- PERFORMANCE FUNCTIONS
-- ===============

-- Function to get test case statistics efficiently
CREATE OR REPLACE FUNCTION get_test_case_stats(project_uuid uuid)
RETURNS TABLE(
  total_count bigint,
  pending_count bigint,
  pass_count bigint,
  fail_count bigint,
  in_progress_count bigint,
  blocked_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'Pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'Pass') as pass_count,
    COUNT(*) FILTER (WHERE status = 'Fail') as fail_count,
    COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'Blocked') as blocked_count
  FROM public.test_cases 
  WHERE project_id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get test suite statistics efficiently
CREATE OR REPLACE FUNCTION get_test_suite_stats(suite_uuid uuid)
RETURNS TABLE(
  total_tests bigint,
  passed_tests bigint,
  failed_tests bigint,
  pending_tests bigint,
  blocked_tests bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE status = 'Pass') as passed_tests,
    COUNT(*) FILTER (WHERE status = 'Fail') as failed_tests,
    COUNT(*) FILTER (WHERE status = 'Pending') as pending_tests,
    COUNT(*) FILTER (WHERE status = 'Blocked') as blocked_tests
  FROM public.test_cases 
  WHERE suite_id = suite_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search test cases with full-text search (only if text search columns exist)
CREATE OR REPLACE FUNCTION search_test_cases(
  project_uuid uuid,
  search_query text,
  status_filter text[] DEFAULT NULL,
  priority_filter text[] DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  platform_filter text[] DEFAULT NULL,
  limit_count integer DEFAULT 100
)
RETURNS TABLE(
  id uuid,
  test_case text,
  description text,
  status text,
  priority text,
  category text,
  platform text,
  assigned_tester text,
  execution_date text,
  created_at timestamptz,
  updated_at timestamptz,
  rank float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.test_case,
    tc.description,
    tc.status,
    tc.priority,
    tc.category,
    tc.platform,
    tc.assigned_tester,
    tc.execution_date,
    tc.created_at,
    tc.updated_at,
    CASE 
      WHEN search_query IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'test_cases' 
        AND column_name IN ('test_case', 'description', 'steps_to_reproduce')
      ) THEN
        ts_rank(
          to_tsvector('english', 
            COALESCE(tc.test_case, '') || ' ' || 
            COALESCE(tc.description, '') || ' ' || 
            COALESCE(tc.steps_to_reproduce, '')
          ),
          plainto_tsquery('english', search_query)
        )
      ELSE 0.0
    END as rank
  FROM public.test_cases tc
  WHERE tc.project_id = project_uuid
    AND (
      search_query IS NULL OR 
      (EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'test_cases' 
        AND column_name IN ('test_case', 'description', 'steps_to_reproduce')
      ) AND
      to_tsvector('english', 
        COALESCE(tc.test_case, '') || ' ' || 
        COALESCE(tc.description, '') || ' ' || 
        COALESCE(tc.steps_to_reproduce, '')
      ) @@ plainto_tsquery('english', search_query))
    )
    AND (status_filter IS NULL OR tc.status = ANY(status_filter))
    AND (priority_filter IS NULL OR tc.priority = ANY(priority_filter))
    AND (category_filter IS NULL OR tc.category = ANY(category_filter))
    AND (platform_filter IS NULL OR tc.platform = ANY(platform_filter))
  ORDER BY rank DESC NULLS LAST, tc.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============
-- ANALYZE TABLES
-- ===============

-- Update table statistics for better query planning
ANALYZE public.test_cases;
ANALYZE public.test_suites;
ANALYZE public.projects;
ANALYZE public.comments;
ANALYZE public.status_history;
ANALYZE public.custom_columns;
ANALYZE public.documents;
ANALYZE public.important_links;
ANALYZE public.project_shares;
ANALYZE public.test_suite_shares;
ANALYZE public.shared_project_references;
ANALYZE public.project_memberships;

-- ===============
-- PERFORMANCE MONITORING (Compatible Version)
-- ===============

-- Create a view to monitor index usage (this should work in all Supabase instances)
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Create a view to monitor slow queries (only if pg_stat_statements extension is available)
DO $$
BEGIN
  -- Check if pg_stat_statements extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
  ) THEN
    -- Create a simple slow_queries view that should work with most pg_stat_statements versions
    EXECUTE '
      CREATE OR REPLACE VIEW slow_queries AS
      SELECT 
        query,
        calls,
        rows
      FROM pg_stat_statements 
      ORDER BY calls DESC
      LIMIT 50;
    ';
  ELSE
    -- Create a placeholder view if pg_stat_statements is not available
    EXECUTE '
      CREATE OR REPLACE VIEW slow_queries AS
      SELECT 
        ''pg_stat_statements extension not available'' as query,
        0 as calls,
        0 as rows
      WHERE false;
    ';
  END IF;
END $$;

-- Create a simple table statistics view
CREATE OR REPLACE VIEW table_stats AS
SELECT 
  schemaname,
  relname as tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
