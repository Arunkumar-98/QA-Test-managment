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
    const sendEmail = Boolean(body.sendEmail) && allowedEmails.length > 0

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

    // Optional: only if Resend is configured AND caller asked to email.
    let emailed = 0
    let failed = 0
    let emailResults: Array<{ email: string; ok: boolean; error?: string }> = []
    if (sendEmail) {
      if (!isMailConfigured()) {
        return NextResponse.json({
          share,
          url,
          emailed: 0,
          failed: allowedEmails.length,
          warning: 'Link created. Email sending is not configured, so copy the link and share it yourself.',
        })
      }
      emailResults = await sendShareInviteEmails(allowedEmails, {
        title: share.title,
        url,
        role: share.role,
        senderName: body.senderName,
        senderEmail: body.senderEmail,
      })
      emailed = emailResults.filter((item) => item.ok).length
      failed = emailResults.filter((item) => !item.ok).length
    }

    return NextResponse.json({
      share,
      url,
      emailResults,
      emailed,
      failed,
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Could not create share'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
