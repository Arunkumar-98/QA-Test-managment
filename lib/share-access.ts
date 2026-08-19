import { NextRequest } from 'next/server'
import type { ShareRecord } from '@/lib/share-types'

export function normalizeEmails(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.join(',')
    : typeof value === 'string'
      ? value
      : ''
  const unique = new Set(
    raw
      .split(/[\s,;]+/)
      .map((item) => item.trim().toLowerCase())
      .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))
  )
  return [...unique]
}

export function requestShareEmail(request: NextRequest, body?: { email?: string; actorId?: string }) {
  return {
    actorId: body?.actorId || request.headers.get('x-share-actor') || '',
    email: (
      body?.email ||
      request.headers.get('x-share-email') ||
      request.nextUrl.searchParams.get('email') ||
      ''
    )
      .trim()
      .toLowerCase(),
  }
}

export function canAccessShare(
  share: ShareRecord,
  access: { actorId?: string; email?: string }
) {
  if (access.actorId && access.actorId === share.createdBy) return true
  const allowed = share.allowedEmails || []
  if (allowed.length === 0) return true
  return Boolean(access.email && allowed.includes(access.email))
}

export function shareRequiresEmail(share: ShareRecord) {
  return (share.allowedEmails || []).length > 0
}
