import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceKey)

export async function POST(req: NextRequest) {
  try {
    const { projectId, email, role } = await req.json()
    if (!projectId || !email || !role) {
      return NextResponse.json({ success: false, error: 'Missing projectId, email, or role' }, { status: 400 })
    }

    // Find user by email (admin scope)
    const { data: userResp, error: userErr } = await supabase.auth.admin.getUserByEmail(email)
    if (userErr) return NextResponse.json({ success: false, error: userErr.message }, { status: 400 })
    const user = userResp?.user
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    // Prevent duplicate membership
    const { data: existing } = await supabase
      .from('project_memberships')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: false, error: 'User already a member' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('project_memberships')
      .insert([{
        project_id: projectId,
        user_id: user.id,
        role,
        status: 'pending',
        invited_by: null
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, membership: data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Invite failed' }, { status: 500 })
  }
}

