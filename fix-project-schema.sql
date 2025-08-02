-- Fix Projects Table Schema
-- This script adds missing columns to the projects table for proper functionality

-- Add user_id column to projects if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'user_id') THEN
        ALTER TABLE projects ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to projects table';
    ELSE
        RAISE NOTICE 'user_id column already exists in projects table';
    END IF;
END $$;

-- Add tags column to projects if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'tags') THEN
        ALTER TABLE projects ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added tags column to projects table';
    ELSE
        RAISE NOTICE 'tags column already exists in projects table';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

-- Update existing projects to have empty tags array if they don't have any
UPDATE projects SET tags = '{}' WHERE tags IS NULL;

-- Add comments to document the columns
COMMENT ON COLUMN projects.user_id IS 'UUID of the user who owns this project';
COMMENT ON COLUMN projects.tags IS 'Array of tags for categorizing projects (e.g., "Shared Project")';

-- Enable Row Level Security on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
    FOR ALL USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 