-- Project Sharing Schema
-- This creates the necessary tables and functions for sharing projects

-- Create project_shares table
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_project_shares_access_token ON project_shares(access_token);
CREATE INDEX IF NOT EXISTS idx_project_shares_project_id ON project_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_created_by ON project_shares(created_by);

-- Enable RLS on project_shares table
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_shares
CREATE POLICY "Users can view their own shares" ON project_shares
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own shares" ON project_shares
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own shares" ON project_shares
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own shares" ON project_shares
    FOR DELETE USING (auth.uid() = created_by);

-- Allow public access to active shares (for shared links)
CREATE POLICY "Public can view active shares" ON project_shares
    FOR SELECT USING (is_active = true);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_views = OLD.current_views + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment view count
CREATE TRIGGER increment_project_share_views
    BEFORE UPDATE ON project_shares
    FOR EACH ROW
    WHEN (OLD.current_views IS DISTINCT FROM NEW.current_views)
    EXECUTE FUNCTION increment_view_count();

-- Create function to validate share access
CREATE OR REPLACE FUNCTION validate_share_access(share_token TEXT, user_email TEXT DEFAULT NULL)
RETURNS TABLE(
    is_valid BOOLEAN,
    project_id UUID,
    permissions JSONB,
    error_message TEXT
) AS $$
DECLARE
    share_record RECORD;
BEGIN
    -- Get share details
    SELECT * INTO share_record
    FROM project_shares
    WHERE access_token = share_token AND is_active = true;
    
    -- Check if share exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, 'Share link is invalid or has expired.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if share is expired
    IF share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, 'Share link has expired.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if max views exceeded
    IF share_record.max_views IS NOT NULL AND share_record.current_views >= share_record.max_views THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, 'Share link has reached its maximum number of views.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if email is restricted
    IF share_record.allowed_emails IS NOT NULL AND array_length(share_record.allowed_emails, 1) > 0 THEN
        IF user_email IS NULL OR NOT (user_email = ANY(share_record.allowed_emails)) THEN
            RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB, 'Access denied. Your email is not authorized to view this project.'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Increment view count
    UPDATE project_shares 
    SET current_views = current_views + 1
    WHERE id = share_record.id;
    
    -- Return valid access
    RETURN QUERY SELECT true, share_record.project_id, share_record.permissions, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get project shares with statistics
CREATE OR REPLACE FUNCTION get_project_shares_with_stats(project_uuid UUID)
RETURNS TABLE(
    id UUID,
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
        ps.id,
        ps.project_id,
        ps.project_name,
        ps.access_token,
        ps.permissions,
        ps.created_by,
        ps.created_at,
        ps.expires_at,
        ps.is_active,
        ps.allowed_emails,
        ps.max_views,
        ps.current_views,
        CASE 
            WHEN ps.expires_at IS NULL THEN NULL
            ELSE GREATEST(0, EXTRACT(DAY FROM (ps.expires_at - NOW())))
        END::INTEGER as days_remaining,
        CASE 
            WHEN ps.expires_at IS NULL THEN false
            ELSE ps.expires_at < NOW()
        END as is_expired,
        CASE 
            WHEN ps.max_views IS NULL THEN false
            ELSE ps.current_views >= ps.max_views
        END as is_view_limit_reached
    FROM project_shares ps
    WHERE ps.project_id = project_uuid
    ORDER BY ps.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON project_shares TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_share_access(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_project_shares_with_stats(UUID) TO anon, authenticated;

-- Insert some sample data for testing (optional)
-- INSERT INTO project_shares (project_id, project_name, access_token, permissions, created_by)
-- VALUES (
--     (SELECT id FROM projects LIMIT 1),
--     'Sample Project',
--     'test-share-token-123',
--     '{"canView": true, "canComment": true, "canEdit": false, "canCreate": false, "canDelete": false, "canExport": false}',
--     (SELECT id FROM auth.users LIMIT 1)
-- ); 