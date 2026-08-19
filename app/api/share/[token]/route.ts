import { NextRequest, NextResponse } from 'next/server'
import { canAccessShare, requestShareEmail, shareRequiresEmail } from '@/lib/share-access'
import { shareStore } from '@/lib/share-store'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ token: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params
  const share = await shareStore.getByToken(token)
  if (!share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }

  const access = requestShareEmail(request)
  if (!canAccessShare(share, access)) {
    return NextResponse.json(
      {
        error: shareRequiresEmail(share)
          ? 'Enter an invited email to open this share'
          : 'Forbidden',
        requiresEmail: shareRequiresEmail(share),
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  return NextResponse.json(
    { share },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { token } = await params
  const body = await request.json().catch(() => ({}))
  const createdBy = body?.createdBy
  if (!createdBy) {
    return NextResponse.json({ error: 'Missing creator' }, { status: 400 })
  }
  const ok = await shareStore.revoke(token, createdBy)
  if (!ok) {
    return NextResponse.json({ error: 'Could not revoke share' }, { status: 403 })
  }
  return NextResponse.json({ ok: true })
}
