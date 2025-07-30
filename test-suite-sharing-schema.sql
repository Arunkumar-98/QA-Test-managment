-- Test Suite Sharing Schema
-- This creates the necessary tables and functions for sharing test suites

-- Create test_suite_shares table
CREATE TABLE IF NOT EXISTS test_suite_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_suite_id UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
  test_suite_name TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{"canView": true, "canComment": false, "canEdit": false, "canCreate": false, "canDelete": false, "canExport": false}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  allowed_emails TEXT[],
  max_views INTEGER,
  current_views INTEGER DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_access_token ON test_suite_shares(access_token);
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_test_suite_id ON test_suite_shares(test_suite_id);
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_project_id ON test_suite_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_created_by ON test_suite_shares(created_by);

-- Enable RLS on test_suite_shares table
ALTER TABLE test_suite_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for test_suite_shares
CREATE POLICY "Users can view their own test suite shares" ON test_suite_shares
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own test suite shares" ON test_suite_shares
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own test suite shares" ON test_suite_shares
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own test suite shares" ON test_suite_shares
    FOR DELETE USING (auth.uid() = created_by);

-- Allow public access to active shares (for shared links)
CREATE POLICY "Public can view active test suite shares" ON test_suite_shares
    FOR SELECT USING (is_active = true);

-- Create function to increment view count for test suite shares
CREATE OR REPLACE FUNCTION increment_test_suite_view_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_views = OLD.current_views + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment view count for test suite shares
CREATE TRIGGER increment_test_suite_share_views
    BEFORE UPDATE ON test_suite_shares
    FOR EACH ROW
    WHEN (OLD.current_views IS DISTINCT FROM NEW.current_views)
    EXECUTE FUNCTION increment_test_suite_view_count();

-- Create function to validate test suite share access
CREATE OR REPLACE FUNCTION validate_test_suite_share_access(share_token TEXT, user_email TEXT DEFAULT NULL)
RETURNS TABLE(
    is_valid BOOLEAN,
    test_suite_id UUID,
    project_id UUID,
    permissions JSONB,
    error_message TEXT
) AS $$
DECLARE
    share_record RECORD;
BEGIN
    -- Get share details
    SELECT * INTO share_record
    FROM test_suite_shares
    WHERE access_token = share_token AND is_active = true;
    
    -- Check if share exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, 'Test suite share link is invalid or has expired.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if share is expired
    IF share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, 'Test suite share link has expired.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if max views exceeded
    IF share_record.max_views IS NOT NULL AND share_record.current_views >= share_record.max_views THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, 'Test suite share link has reached its maximum number of views.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if email is restricted
    IF share_record.allowed_emails IS NOT NULL AND array_length(share_record.allowed_emails, 1) > 0 THEN
        IF user_email IS NULL OR NOT (user_email = ANY(share_record.allowed_emails)) THEN
            RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB, 'Access denied. Your email is not authorized to view this test suite.'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Increment view count
    UPDATE test_suite_shares 
    SET current_views = current_views + 1
    WHERE id = share_record.id;
    
    -- Return valid access
    RETURN QUERY SELECT true, share_record.test_suite_id, share_record.project_id, share_record.permissions, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get test suite shares with statistics
CREATE OR REPLACE FUNCTION get_test_suite_shares_with_stats(test_suite_uuid UUID)
RETURNS TABLE(
    id UUID,
    test_suite_id UUID,
    test_suite_name TEXT,
    project_id UUID,
    project_name TEXT,
    access_token TEXT,
    permissions JSONB,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    allowed_emails TEXT[],
    max_views INTEGER,
    current_views INTEGER,
    days_remaining INTEGER,
    is_expired BOOLEAN,
    is_view_limit_reached BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tss.id,
        tss.test_suite_id,
        tss.test_suite_name,
        tss.project_id,
        tss.project_name,
        tss.access_token,
        tss.permissions,
        tss.created_by,
        tss.created_at,
        tss.expires_at,
        tss.is_active,
        tss.allowed_emails,
        tss.max_views,
        tss.current_views,
        CASE 
            WHEN tss.expires_at IS NULL THEN NULL
            ELSE GREATEST(0, EXTRACT(DAY FROM (tss.expires_at - NOW())))
        END::INTEGER as days_remaining,
        CASE 
            WHEN tss.expires_at IS NULL THEN false
            ELSE tss.expires_at < NOW()
        END as is_expired,
        CASE 
            WHEN tss.max_views IS NULL THEN false
            ELSE tss.current_views >= tss.max_views
        END as is_view_limit_reached
    FROM test_suite_shares tss
    WHERE tss.test_suite_id = test_suite_uuid
    ORDER BY tss.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON test_suite_shares TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_test_suite_share_access(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_test_suite_shares_with_stats(UUID) TO anon, authenticated;

-- Create RLS policy to allow access to test cases within shared test suites
CREATE POLICY "Allow access to test cases in shared test suites" ON test_cases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM test_suite_shares tss
            WHERE tss.test_suite_id = test_cases.suite_id
            AND tss.is_active = true
            AND (tss.expires_at IS NULL OR tss.expires_at > NOW())
            AND (tss.max_views IS NULL OR tss.current_views < tss.max_views)
        )
    );

-- Create RLS policy to allow comments on test cases in shared test suites
CREATE POLICY "Allow comments on test cases in shared test suites" ON comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM test_suite_shares tss
            JOIN test_cases tc ON tc.suite_id = tss.test_suite_id
            WHERE tc.id = comments.test_case_id
            AND tss.is_active = true
            AND (tss.expires_at IS NULL OR tss.expires_at > NOW())
            AND (tss.max_views IS NULL OR tss.current_views < tss.max_views)
            AND tss.permissions->>'canComment' = 'true'
        )
    );

-- Create RLS policy to allow editing test cases in shared test suites
CREATE POLICY "Allow editing test cases in shared test suites" ON test_cases
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM test_suite_shares tss
            WHERE tss.test_suite_id = test_cases.suite_id
            AND tss.is_active = true
            AND (tss.expires_at IS NULL OR tss.expires_at > NOW())
            AND (tss.max_views IS NULL OR tss.current_views < tss.max_views)
            AND tss.permissions->>'canEdit' = 'true'
        )
    );

-- Create RLS policy to allow creating test cases in shared test suites
CREATE POLICY "Allow creating test cases in shared test suites" ON test_cases
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM test_suite_shares tss
            WHERE tss.test_suite_id = test_cases.suite_id
            AND tss.is_active = true
            AND (tss.expires_at IS NULL OR tss.expires_at > NOW())
            AND (tss.max_views IS NULL OR tss.current_views < tss.max_views)
            AND tss.permissions->>'canCreate' = 'true'
        )
    ); 