import { NextRequest, NextResponse } from 'next/server'
import { shareStore } from '@/lib/share-store'
import { isMailConfigured, sendShareInviteEmails } from '@/lib/mailer'
import { normalizeEmails } from '@/lib/share-access'

export const dynamic = 'force-dynamic'

function shareUrl(request: NextRequest, token: string) {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const origin = configured && !configured.includes('localhost')
    ? configured
    : request.nextUrl.origin
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

    const allowedEmails = normalizeEmails(body.allowedEmails || [])
    if (allowedEmails.length === 0) {
      return NextResponse.json({ error: 'Add at least one teammate email' }, { status: 400 })
    }
    if (!isMailConfigured()) {
      return NextResponse.json(
        {
          error:
            'Invite email is not configured. Add RESEND_API_KEY so teammates receive the share link by email.',
        },
        { status: 503 }
      )
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
      allowedEmails,
    })

    const url = shareUrl(request, share.token)
    const emailResults = await sendShareInviteEmails(allowedEmails, {
      title: share.title,
      url,
      role: share.role,
      senderName: body.senderName,
      senderEmail: body.senderEmail,
    })

    const failed = emailResults.filter((item) => !item.ok)
    if (failed.length === allowedEmails.length) {
      return NextResponse.json(
        {
          error: failed[0]?.error || 'Could not send invite emails',
          share,
          url,
          emailResults,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      share,
      url,
      emailResults,
      emailed: emailResults.filter((item) => item.ok).length,
      failed: failed.length,
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Could not create share'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
