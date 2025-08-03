-- Live Sync Schema for Shared Projects
-- This enables real-time synchronization of shared projects

-- Create table to track shared project references
CREATE TABLE IF NOT EXISTS shared_project_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_project_name TEXT NOT NULL,
  share_token TEXT NOT NULL,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, original_project_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_project_refs_user_id ON shared_project_references(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_project_refs_project_id ON shared_project_references(original_project_id);
CREATE INDEX IF NOT EXISTS idx_shared_project_refs_token ON shared_project_references(share_token);

-- Enable Row Level Security
ALTER TABLE shared_project_references ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view their own shared project references" ON shared_project_references
  FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON shared_project_references TO authenticated;

-- Add comment
COMMENT ON TABLE shared_project_references IS 'Tracks shared project references for live sync functionality'; 