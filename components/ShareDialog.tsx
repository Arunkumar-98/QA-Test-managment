"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Check, Copy, Loader2, Mail, Share2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getCurrentUser } from '@/lib/local-auth'
import { googleSheetsService } from '@/lib/google-sheets-service'
import {
  createShare,
  fetchExistingShare,
  forgetLocalShare,
  rememberLocalShare,
  revokeShare,
  uploadArtifactsForRows,
  type ShareKind,
  type ShareRole,
} from '@/lib/share-client'
import { getLocalArtifactFile } from '@/lib/artifact-store'
import { normalizeEmails } from '@/lib/share-access'
import type { TestSuite } from '@/types/qa-types'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  kind: ShareKind
  projectId: string
  projectName: string
  lists: TestSuite[]
  suite?: TestSuite | null
  onChanged?: () => void
}

const ROLES: Array<{ id: ShareRole; label: string; description: string }> = [
  { id: 'view', label: 'View', description: 'They can read the grid, including images and videos.' },
  { id: 'edit', label: 'Edit', description: 'They can change cells, add cases, and attach files.' },
  { id: 'full', label: 'Full', description: 'They can add, delete, export, and attach files.' },
]

export function ShareDialog({
  isOpen,
  onClose,
  kind,
  projectId,
  projectName,
  lists,
  suite,
  onChanged,
}: ShareDialogProps) {
  const [role, setRole] = useState<ShareRole>('edit')
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteText, setInviteText] = useState('')

  const title = kind === 'project' ? projectName : suite?.name || 'List'
  const subtitle = kind === 'project' ? 'Share every suite and bug list in this project.' : 'Share this list only.'

  useEffect(() => {
    if (!isOpen) return
    setCopied(false)
    const user = getCurrentUser()
    if (!user || !projectId) return
    void fetchExistingShare({
      createdBy: user.id,
      projectId,
      kind,
      suiteId: suite?.id,
    }).then((result) => {
      if (result.share) {
        setToken(result.share.token)
        setRole(result.share.role)
        setUrl(`${window.location.origin}/s/${result.share.token}`)
        setInviteText((result.share.allowedEmails || []).join('\n'))
        rememberLocalShare({
          token: result.share.token,
          kind,
          role: result.share.role,
          projectId,
          suiteId: suite?.id,
        })
        onChanged?.()
      } else {
        setToken('')
        setUrl('')
        setRole('edit')
        setInviteText('')
      }
    }).catch(() => {
      setToken('')
      setUrl('')
    })
  }, [isOpen, kind, projectId, suite?.id])

  const handlePublish = async () => {
    const user = getCurrentUser()
    if (!user) {
      toast({ title: 'Sign in required', variant: 'destructive' })
      return
    }
    if (kind === 'list' && !suite?.id) {
      toast({ title: 'Pick a list first', variant: 'destructive' })
      return
    }

    const invited = normalizeEmails(inviteText)
    if (invited.length === 0) {
      toast({
        title: 'Add teammate emails',
        description: 'Enter at least one email. We will email them a link to open the cases.',
        variant: 'destructive',
      })
      return
    }

    setBusy(true)
    try {
      const columns = await googleSheetsService.ensureDefaultColumns(projectId)
      const targetLists = kind === 'project'
        ? lists
        : lists.filter((item) => item.id === suite?.id)
      const rows = []
      for (const list of targetLists) {
        const listRows = await googleSheetsService.getRows(projectId, list.id)
        rows.push(...listRows.map((row) => ({ ...row, suiteId: list.id })))
      }

      const result = await createShare({
        kind,
        title,
        projectId,
        projectName,
        suiteId: suite?.id,
        role,
        createdBy: user.id,
        allowedEmails: invited,
        columns,
        lists: targetLists.map((list) => ({
          id: list.id,
          name: list.name,
          kind: list.kind === 'bugs' ? 'bugs' : 'suite',
        })),
        rows,
        senderName: user.user_metadata?.name || user.user_metadata?.full_name,
        senderEmail: user.email,
      })

      await uploadArtifactsForRows(result.share.token, rows, getLocalArtifactFile).catch(() => undefined)

      const nextUrl = result.url || `${window.location.origin}/s/${result.share.token}`
      setToken(result.share.token)
      setUrl(nextUrl)
      rememberLocalShare({
        token: result.share.token,
        kind,
        role,
        projectId,
        suiteId: suite?.id,
      })
      onChanged?.()

      const emailed = result.emailed ?? invited.length
      const failed = result.failed ?? 0
      toast({
        title: failed ? 'Share created with some email issues' : 'Invite email sent',
        description: failed
          ? `Sent ${emailed} of ${invited.length}. Teammates who got mail can open the link to view cases.`
          : `Emailed ${emailed} teammate${emailed === 1 ? '' : 's'}. They open the link to view the cases.`,
      })
    } catch (error) {
      toast({
        title: 'Could not share',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast({ title: 'Link copied' })
  }

  const handleRevoke = async () => {
    const user = getCurrentUser()
    if (!user || !token) return
    setBusy(true)
    try {
      await revokeShare(token, user.id)
      forgetLocalShare(token)
      setToken('')
      setUrl('')
      onChanged?.()
      toast({ title: 'Share revoked' })
    } catch (error) {
      toast({
        title: 'Could not revoke',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        variant="dark"
        className="w-[min(92vw,460px)] max-w-[460px] gap-0 border border-slate-200 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-white px-6 pb-5 pt-6 dark:border-slate-800 dark:from-sky-500/15 dark:via-slate-950 dark:to-slate-950">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="relative flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-300 bg-sky-100 text-sky-700 shadow-inner dark:border-sky-400/30 dark:bg-sky-500/20 dark:text-sky-200">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300/80">Share</p>
              <DialogTitle className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Access</Label>
            <div className="grid gap-2">
              {ROLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id)}
                  className={`rounded-lg border px-3 py-2 text-left ${
                    role === item.id
                      ? 'border-sky-400 bg-sky-50 dark:border-sky-400/40 dark:bg-sky-500/10'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Team emails</Label>
            <textarea
              value={inviteText}
              onChange={(event) => setInviteText(event.target.value)}
              placeholder="alex@company.com"
              className="min-h-[84px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-600"
            />
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-500">
              Add each teammate’s email, one per line. We email them a link. They open it and see the cases.
            </p>
          </div>

          {url && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Link</Label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={url}
                  className="h-10 flex-1 truncate rounded-md border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-10 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600/50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          {token ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleRevoke}
              disabled={busy}
              className="h-10 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              Revoke
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600/50 dark:text-slate-300 dark:hover:bg-slate-800/50"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handlePublish}
              disabled={busy}
              className="h-10 bg-sky-600 text-white hover:bg-sky-500"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {token ? 'Update and email team' : 'Email invite link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
