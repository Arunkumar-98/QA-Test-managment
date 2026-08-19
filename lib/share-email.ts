export function openTeamShareEmail(options: {
  emails: string[]
  url: string
  title: string
  senderName?: string
  senderEmail?: string
  role: 'view' | 'edit' | 'full'
}) {
  const emails = options.emails.filter(Boolean)
  if (emails.length === 0) return

  const access =
    options.role === 'view' ? 'view' : options.role === 'edit' ? 'view and update' : 'fully work with'
  const who = options.senderName || options.senderEmail || 'Your teammate'
  const subject = `${options.title} shared with you`
  const body = [
    `${who} shared “${options.title}” with you.`,
    '',
    `You can ${access} it here:`,
    options.url,
    '',
    'Open that link in your browser. No extra signup is required unless you want your own account.',
  ].join('\n')

  const to = emails.join(',')
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  const popup = window.open(gmail, '_blank', 'noopener,noreferrer')
  if (!popup) {
    window.location.href = mailto
  }
}
