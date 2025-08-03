import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Missing Supabase configuration' },
      { status: 500 }
    )
  }

  try {
    // Check if notes table exists
    const { error: checkError } = await supabase.from('notes').select('id').limit(1)
    
    if (checkError && checkError.message.includes('relation "notes" does not exist')) {
      console.log('Notes table does not exist, creating it...')
      
      // Create the notes table using SQL
      const createTableSQL = `
        -- Create notes table
        CREATE TABLE IF NOT EXISTS notes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_pinned BOOLEAN DEFAULT false,
          tags TEXT[] DEFAULT '{}',
          color TEXT,
          UNIQUE(user_id, project_id, title)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);
        CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
        CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
        CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);
        CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);

        -- Enable Row Level Security
        ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
        CREATE POLICY "Users can view their own notes" ON notes
          FOR SELECT USING (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
        CREATE POLICY "Users can insert their own notes" ON notes
          FOR INSERT WITH CHECK (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
        CREATE POLICY "Users can update their own notes" ON notes
          FOR UPDATE USING (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
        CREATE POLICY "Users can delete their own notes" ON notes
          FOR DELETE USING (user_id = auth.uid());

        -- Grant permissions to authenticated users
        GRANT ALL ON notes TO authenticated;
      `

      // Try to execute the SQL using rpc if available
      try {
        const { error: execError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
        
        if (execError) {
          console.log('RPC exec_sql failed, providing manual instructions...')
          return NextResponse.json({
            success: false,
            message: 'Notes table creation requires manual setup. Please run the SQL script manually in your Supabase dashboard.',
            sql: createTableSQL
          })
        }
      } catch (rpcError) {
        console.log('RPC not available, providing manual instructions...')
        return NextResponse.json({
          success: false,
          message: 'Notes table creation requires manual setup. Please run the SQL script manually in your Supabase dashboard.',
          sql: createTableSQL
        })
      }
    }

    // Verify the table was created successfully
    const { data: verifyData, error: verifyError } = await supabase
      .from('notes')
      .select('id')
      .limit(1)

    if (verifyError) {
      return NextResponse.json(
        { error: `Failed to verify notes table: ${verifyError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notes table setup completed successfully!',
      tableExists: true
    })

  } catch (error) {
    console.error('Error setting up notes table:', error)
    return NextResponse.json(
      { error: 'Failed to setup notes table' },
      { status: 500 }
    )
  }
} 