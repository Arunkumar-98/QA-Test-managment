import { NextRequest, NextResponse } from 'next/server'
import { canAccessShare, requestShareEmail } from '@/lib/share-access'
import { shareArtifactStore } from '@/lib/share-artifact-store'
import { shareStore } from '@/lib/share-store'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Params = { params: Promise<{ token: string; id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { token, id } = await params
  const share = await shareStore.getByToken(token)
  if (!share) return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  if (!canAccessShare(share, requestShareEmail(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const stored = await shareArtifactStore.get(token, id)
  if (!stored) return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })

  return new NextResponse(new Uint8Array(stored.bytes), {
    headers: {
      'Content-Type': stored.meta.mime || 'application/octet-stream',
      'Cache-Control': 'private, max-age=60',
      'Content-Disposition': `inline; filename="${encodeURIComponent(stored.meta.name || id)}"`,
    },
  })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { token, id } = await params
  const share = await shareStore.getByToken(token)
  if (!share) return NextResponse.json({ error: 'Share not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const access = requestShareEmail(request, body)
  if (!canAccessShare(share, access)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const isOwner = Boolean(access.actorId && access.actorId === share.createdBy)
  if (!isOwner && !share.permissions.canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await shareArtifactStore.remove(token, id)
  return NextResponse.json({ ok: true })
}
