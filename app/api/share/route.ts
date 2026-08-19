import { NextRequest, NextResponse } from 'next/server'
import { shareStore } from '@/lib/share-store'

export const dynamic = 'force-dynamic'

function shareUrl(request: NextRequest, token: string) {
  const origin = request.nextUrl.origin
  return `${origin}/s/${token}`
}

export async function GET(request: NextRequest) {
  const createdBy = request.nextUrl.searchParams.get('createdBy') || ''
  const projectId = request.nextUrl.searchParams.get('projectId') || ''
  const kind = request.nextUrl.searchParams.get('kind') as 'project' | 'list' | null
  const suiteId = request.nextUrl.searchParams.get('suiteId') || undefined

  if (!createdBy || !projectId || (kind !== 'project' && kind !== 'list')) {
    return NextResponse.json({ error: 'Missing share lookup fields' }, { status: 400 })
  }

  const share = await shareStore.findForResource({ createdBy, projectId, kind, suiteId })
  return NextResponse.json({ share: share ? { ...share, url: shareUrl(request, share.token) } : null })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body?.kind || !body?.projectId || !body?.createdBy || !body?.title) {
      return NextResponse.json({ error: 'Missing share fields' }, { status: 400 })
    }
    if (body.kind === 'list' && !body.suiteId) {
      return NextResponse.json({ error: 'A list share needs a suite or bug list' }, { status: 400 })
    }

    const share = await shareStore.create({
      kind: body.kind,
      title: body.title,
      projectId: body.projectId,
      projectName: body.projectName || body.title,
      suiteId: body.suiteId,
      role: body.role || 'view',
      createdBy: body.createdBy,
      columns: body.columns || [],
      lists: body.lists || [],
      rows: body.rows || [],
      allowedEmails: body.allowedEmails || [],
    })

    return NextResponse.json({
      share,
      url: shareUrl(request, share.token),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not create share' }, { status: 500 })
  }
}
