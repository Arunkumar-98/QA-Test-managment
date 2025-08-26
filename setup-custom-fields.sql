-- Setup Custom Fields and Custom Columns
-- Run this in your Supabase SQL Editor

-- 1. Add custom_fields column to test_cases table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_cases' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE test_cases ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added custom_fields column to test_cases table';
  ELSE
    RAISE NOTICE 'custom_fields column already exists in test_cases table';
  END IF;
END $$;

-- 2. Create custom_columns table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'select', 'date')),
  visible BOOLEAN DEFAULT true,
  width VARCHAR(50) DEFAULT 'w-32',
  min_width VARCHAR(50) DEFAULT 'min-w-[120px]',
  options TEXT[],
  default_value TEXT,
  required BOOLEAN DEFAULT false,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure unique constraint on (project_id, name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'custom_columns' AND c.conname = 'custom_columns_project_id_name_key'
  ) THEN
    ALTER TABLE custom_columns ADD CONSTRAINT custom_columns_project_id_name_key UNIQUE (project_id, name);
  END IF;
END $$;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_columns_project_id ON custom_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_columns_name ON custom_columns(name);
CREATE INDEX IF NOT EXISTS idx_test_cases_custom_fields ON test_cases USING GIN(custom_fields);

-- 5. Enable RLS on custom_columns
ALTER TABLE custom_columns ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for custom_columns
DROP POLICY IF EXISTS "custom_columns_select_members" ON custom_columns;
DROP POLICY IF EXISTS "custom_columns_insert_members" ON custom_columns;
DROP POLICY IF EXISTS "custom_columns_update_members" ON custom_columns;
DROP POLICY IF EXISTS "custom_columns_delete_members" ON custom_columns;

-- Viewer or above can read
CREATE POLICY "custom_columns_select_members" ON custom_columns
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Editor or above can insert
CREATE POLICY "custom_columns_insert_members" ON custom_columns
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Editor or above can update
CREATE POLICY "custom_columns_update_members" ON custom_columns
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Editor or above can delete
CREATE POLICY "custom_columns_delete_members" ON custom_columns
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- 7. Grant permissions
GRANT ALL ON custom_columns TO authenticated;

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_columns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_custom_columns_updated_at ON custom_columns;
CREATE TRIGGER update_custom_columns_updated_at
  BEFORE UPDATE ON custom_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_columns_updated_at();

-- 9. Verify the setup
SELECT 'test_cases table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'test_cases' AND column_name = 'custom_fields';

SELECT 'custom_columns table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_columns' 
ORDER BY ordinal_position;
