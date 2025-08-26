-- Add option_colors column to custom_columns table
-- This migration adds a JSONB field to store colors for individual dropdown options

DO $$
BEGIN
  -- Add option_colors column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'custom_columns' 
    AND column_name = 'option_colors'
  ) THEN
    ALTER TABLE custom_columns ADD COLUMN option_colors JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added option_colors column to custom_columns table';
  ELSE
    RAISE NOTICE 'option_colors column already exists in custom_columns table';
  END IF;
END $$;

-- Verify the change
SELECT 'custom_columns table structure after adding option_colors:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_columns' 
ORDER BY ordinal_position;
