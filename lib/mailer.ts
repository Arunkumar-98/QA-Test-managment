type ShareInviteMail = {
  to: string
  title: string
  url: string
  role: 'view' | 'edit' | 'full'
  senderName?: string
  senderEmail?: string
}

function accessLabel(role: ShareInviteMail['role']) {
  if (role === 'view') return 'view'
  if (role === 'edit') return 'view and update'
  return 'fully work with'
}

function buildInviteHtml(options: ShareInviteMail) {
  const who = options.senderName || options.senderEmail || 'A teammate'
  const access = accessLabel(options.role)
  return `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; line-height: 1.5; color: #0f172a;">
      <p style="margin: 0 0 12px;">${who} shared <strong>${options.title}</strong> with you.</p>
      <p style="margin: 0 0 16px;">You can ${access} the test cases from this link:</p>
      <p style="margin: 0 0 20px;">
        <a href="${options.url}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">
          Open shared cases
        </a>
      </p>
      <p style="margin: 0; color:#64748b; font-size: 13px;">Or paste this URL into your browser:<br/>${options.url}</p>
    </div>
  `.trim()
}

function buildInviteText(options: ShareInviteMail) {
  const who = options.senderName || options.senderEmail || 'A teammate'
  const access = accessLabel(options.role)
  return [
    `${who} shared “${options.title}” with you.`,
    '',
    `You can ${access} the test cases here:`,
    options.url,
    '',
    'Open that link in your browser to view the cases.',
  ].join('\n')
}

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendShareInviteEmail(options: ShareInviteMail) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      'Invite email is not configured. Add RESEND_API_KEY in Vercel (or .env) so the app can email teammates the share link.'
    )
  }

  const from =
    process.env.RESEND_FROM_EMAIL ||
    'QA Management <onboarding@resend.dev>'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: `${options.title} shared with you`,
      html: buildInviteHtml(options),
      text: buildInviteText(options),
      reply_to: options.senderEmail || undefined,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      (payload as { message?: string }).message ||
      `Could not send invite email to ${options.to}`
    throw new Error(message)
  }
}

export async function sendShareInviteEmails(
  emails: string[],
  options: Omit<ShareInviteMail, 'to'>
) {
  const results: Array<{ email: string; ok: boolean; error?: string }> = []
  for (const email of emails) {
    try {
      // Personalize link with email so the recipient skips the invite form.
      const separator = options.url.includes('?') ? '&' : '?'
      const url = `${options.url}${separator}email=${encodeURIComponent(email)}`
      await sendShareInviteEmail({ ...options, to: email, url })
      results.push({ email, ok: true })
    } catch (error) {
      results.push({
        email,
        ok: false,
        error: error instanceof Error ? error.message : 'Send failed',
      })
    }
  }
  return results
}
