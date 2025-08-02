-- Add tags column to projects table
-- This migration adds support for project tags, including the "Shared Project" tag

-- Add tags column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for better performance when querying by tags
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

-- Update existing projects to have empty tags array if they don't have any
UPDATE projects SET tags = '{}' WHERE tags IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN projects.tags IS 'Array of tags for categorizing projects (e.g., "Shared Project")'; 