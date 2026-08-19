import { NextRequest, NextResponse } from 'next/server'
import { requestShareEmail } from '@/lib/share-access'
import { shareStore } from '@/lib/share-store'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ token: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { token } = await params
  try {
    const body = await request.json()
    if (!body?.action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }
    const access = requestShareEmail(request, body)
    const { actorId, email, ...patch } = body
    const share = await shareStore.patchRows(token, patch, access.actorId || actorId, access.email || email)
    return NextResponse.json({ share })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update share'
    const status = message === 'Share not found' ? 404 : message === 'Forbidden' ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
