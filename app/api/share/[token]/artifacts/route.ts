import { NextRequest, NextResponse } from 'next/server'
import { canAccessShare, requestShareEmail } from '@/lib/share-access'
import { shareArtifactStore } from '@/lib/share-artifact-store'
import { shareStore } from '@/lib/share-store'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Params = { params: Promise<{ token: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params
  const share = await shareStore.getByToken(token)
  if (!share) return NextResponse.json({ error: 'Share not found' }, { status: 404 })

  const form = await request.formData()
  const access = requestShareEmail(request, {
    actorId: String(form.get('actorId') || ''),
    email: String(form.get('email') || ''),
  })
  if (!canAccessShare(share, access)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isOwner = Boolean(access.actorId && access.actorId === share.createdBy)
  if (!isOwner && !share.permissions.canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const file = form.get('file')
  const id = String(form.get('id') || '')
  const name = String(form.get('name') || 'file')
  const kind = String(form.get('kind') || '')
  const mime = String(form.get('mime') || '')
  if (!(file instanceof File) || !id || (kind !== 'image' && kind !== 'video')) {
    return NextResponse.json({ error: 'Missing artifact file' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const meta = await shareArtifactStore.save(token, {
    id,
    name,
    kind,
    mime: mime || file.type || (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
    size: bytes.length,
  }, bytes)

  return NextResponse.json({ ok: true, meta })
}
