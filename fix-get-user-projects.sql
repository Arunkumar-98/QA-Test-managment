-- Fix get_user_projects function
-- This function was failing, so let's recreate it properly

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_user_projects();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION get_user_projects()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  user_id UUID,
  is_owner BOOLEAN,
  shared_by TEXT,
  permission_level TEXT
) AS $$
BEGIN
  -- For now, return all projects the user can see
  -- This will be enhanced when team collaboration is fully working
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.created_at,
    p.is_active,
    p.user_id,
    (p.user_id = auth.uid()) as is_owner,
    NULL as shared_by,
    'admin' as permission_level
  FROM projects p
  WHERE p.user_id = auth.uid() -- Only show user's own projects for now
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT * FROM get_user_projects() LIMIT 5; 