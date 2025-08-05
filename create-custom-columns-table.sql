-- Create custom_columns table
CREATE TABLE IF NOT EXISTS custom_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'select', 'date')),
  visible BOOLEAN DEFAULT true,
  width VARCHAR(50) DEFAULT 'w-32',
  min_width VARCHAR(50) DEFAULT 'min-w-[120px]',
  options TEXT[], -- Array of strings for select type
  default_value TEXT,
  required BOOLEAN DEFAULT false,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add custom_fields column to test_cases table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_cases' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE test_cases ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_columns_project_id ON custom_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_columns_name ON custom_columns(name);
CREATE INDEX IF NOT EXISTS idx_test_cases_custom_fields ON test_cases USING GIN(custom_fields);

-- Add RLS policies for custom_columns
ALTER TABLE custom_columns ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own custom columns
CREATE POLICY "Users can view their own custom columns" ON custom_columns
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Policy for users to insert their own custom columns
CREATE POLICY "Users can insert their own custom columns" ON custom_columns
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Policy for users to update their own custom columns
CREATE POLICY "Users can update their own custom columns" ON custom_columns
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Policy for users to delete their own custom columns
CREATE POLICY "Users can delete their own custom columns" ON custom_columns
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON custom_columns TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_columns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_columns_updated_at
  BEFORE UPDATE ON custom_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_columns_updated_at(); 