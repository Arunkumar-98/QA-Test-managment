import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { sql } = await req.json()
    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing sql' }, { status: 400 })
    }

    // Use PostgREST RPC if available, else run via simple insert into a helper function
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, data })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e?.message || 'RPC exec_sql not available' }, { status: 500 })
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Invalid request' }, { status: 400 })
  }
}

