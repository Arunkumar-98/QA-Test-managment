-- Add color column to custom_columns table
-- This migration adds a color field to store hex color codes for custom columns

DO $$
BEGIN
  -- Add color column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'custom_columns' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE custom_columns ADD COLUMN color VARCHAR(7) DEFAULT '#3b82f6';
    RAISE NOTICE 'Added color column to custom_columns table';
  ELSE
    RAISE NOTICE 'color column already exists in custom_columns table';
  END IF;
END $$;

-- Verify the change
SELECT 'custom_columns table structure after adding color:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_columns' 
ORDER BY ordinal_position;
