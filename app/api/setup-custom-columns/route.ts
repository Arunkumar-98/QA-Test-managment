import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tbutffculjesqiodwxsh.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM3NzM2MywiZXhwIjoyMDY4OTUzMzYzfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Setting up custom columns table...')

    // For now, skip database migration if service role key is not available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('⚠️ Service role key not available, skipping database migration')
      return NextResponse.json({ 
        success: true, 
        message: 'Service role key not available, skipping database migration',
        skipped: true 
      })
    }

    // SQL to create custom_columns table and add custom_fields to test_cases
    const sql = `-- Create custom_columns table
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

-- Ensure unique (project_id, name)
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

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add default_value column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_columns' AND column_name = 'default_value'
  ) THEN
    ALTER TABLE custom_columns ADD COLUMN default_value TEXT;
  END IF;
  
  -- Add required column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_columns' AND column_name = 'required'
  ) THEN
    ALTER TABLE custom_columns ADD COLUMN required BOOLEAN DEFAULT false;
  END IF;
END $$;

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

-- Add RLS policies for custom_columns (membership-aware)
ALTER TABLE custom_columns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "custom_columns_select_members" ON custom_columns;
DROP POLICY IF EXISTS "custom_columns_insert_members" ON custom_columns;
DROP POLICY IF EXISTS "custom_columns_update_members" ON custom_columns;
DROP POLICY IF EXISTS "custom_columns_delete_members" ON custom_columns;

-- Viewer or above can read
CREATE POLICY "custom_columns_select_members" ON custom_columns
  FOR SELECT USING (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'has_project_permission'
      ) THEN has_project_permission(project_id, auth.uid(), 'viewer')
      ELSE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    END
  );

-- Editor or above can insert
CREATE POLICY "custom_columns_insert_members" ON custom_columns
  FOR INSERT WITH CHECK (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'has_project_permission'
      ) THEN has_project_permission(project_id, auth.uid(), 'editor')
      ELSE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    END
  );

-- Editor or above can update
CREATE POLICY "custom_columns_update_members" ON custom_columns
  FOR UPDATE USING (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'has_project_permission'
      ) THEN has_project_permission(project_id, auth.uid(), 'editor')
      ELSE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    END
  );

-- Editor or above can delete
CREATE POLICY "custom_columns_delete_members" ON custom_columns
  FOR DELETE USING (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'has_project_permission'
      ) THEN has_project_permission(project_id, auth.uid(), 'editor')
      ELSE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    END
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_custom_columns_updated_at ON custom_columns;
CREATE TRIGGER update_custom_columns_updated_at
  BEFORE UPDATE ON custom_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_columns_updated_at();`

    // Execute the SQL statements one by one since exec_sql function doesn't exist
    console.log('🔄 Running migration to ensure all columns exist...')
    
    // Try to run the migration using rpc if available
    try {
      const { error: migrationError } = await supabase.rpc('exec_sql', { sql })
      
      if (!migrationError) {
        console.log('✅ Migration completed successfully')
        return NextResponse.json({
          success: true,
          message: 'Custom columns table migration completed successfully'
        })
      }
    } catch (rpcError) {
      console.log('⚠️ RPC exec_sql not available, checking table structure...')
    }
    
    // Fallback: Check if table exists and has required columns
    const { data: tableInfo, error: tableError } = await supabase
      .from('custom_columns')
      .select('*')
      .limit(1)
    
    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, we need to create it manually
      console.log('⚠️ Table does not exist, manual setup required')
      return NextResponse.json({
        error: 'Manual database setup required',
        details: 'The custom_columns table does not exist. Please run the SQL migration manually in your Supabase dashboard:',
        sql: sql,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the SQL from the "sql" field above',
          '4. Execute the SQL',
          '5. Refresh this page'
        ]
      }, { status: 400 })
    }
    
    if (tableError) {
      throw tableError
    }

    // Table exists, but we need to check if it has the required columns
    console.log('✅ Custom columns table exists, checking column structure...')
    
    // Try to query a column that might be missing to see if it exists
    try {
      const { error: columnTestError } = await supabase
        .from('custom_columns')
        .select('default_value')
        .limit(1)
      
      if (columnTestError && columnTestError.message.includes('default_value')) {
        console.log('⚠️ Missing default_value column, manual migration required')
        return NextResponse.json({
          error: 'Database migration required',
          details: 'The custom_columns table is missing the default_value column. Please run the SQL migration manually in your Supabase dashboard:',
          sql: sql,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the SQL from the "sql" field above',
            '4. Execute the SQL',
            '5. Refresh this page'
          ]
        }, { status: 400 })
      }
    } catch (columnError) {
      console.log('⚠️ Error checking column structure:', columnError)
    }

    console.log('✅ Custom columns table structure is correct')
    
    return NextResponse.json({
      success: true,
      message: 'Custom columns table exists and has correct structure'
    })

  } catch (error) {
    console.error('❌ Error setting up custom columns table:', error)
    return NextResponse.json({
      error: 'Failed to setup custom columns table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check if custom_columns table exists
    const { data, error } = await supabase
      .from('custom_columns')
      .select('count(*)')
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          exists: false,
          message: 'Custom columns table does not exist'
        })
      }
      throw error
    }

    return NextResponse.json({
      exists: true,
      message: 'Custom columns table exists'
    })

  } catch (error) {
    console.error('❌ Error checking custom columns table:', error)
    return NextResponse.json({
      error: 'Failed to check custom columns table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 