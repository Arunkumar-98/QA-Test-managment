-- Fix custom_columns table by adding missing columns
-- Run this in your Supabase SQL Editor

-- Add default_value column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_columns' AND column_name = 'default_value'
  ) THEN
    ALTER TABLE custom_columns ADD COLUMN default_value TEXT;
    RAISE NOTICE 'Added default_value column to custom_columns table';
  ELSE
    RAISE NOTICE 'default_value column already exists in custom_columns table';
  END IF;
END $$;

-- Add required column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_columns' AND column_name = 'required'
  ) THEN
    ALTER TABLE custom_columns ADD COLUMN required BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added required column to custom_columns table';
  ELSE
    RAISE NOTICE 'required column already exists in custom_columns table';
  END IF;
END $$;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_columns' 
ORDER BY ordinal_position; 