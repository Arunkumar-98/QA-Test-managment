"use client"

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Bug, FileSpreadsheet, Loader2, Share2 } from 'lucide-react'
import { GoogleSheetsTable } from '@/components/GoogleSheetsTable'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { fetchShare, setShareEmail, ShareAccessError, type PublicShare } from '@/lib/share-client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

export default function SharedLinkPage() {
  const params = useParams()
  const token = String(params.token || '')
  const [share, setShare] = useState<PublicShare | null>(null)
  const [error, setError] = useState('')
  const [needsEmail, setNeedsEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null)

  const loadShare = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchShare(token)
      setShare(result.share)
      setNeedsEmail(false)
      const firstList = result.share.lists[0]
      setSelectedSuiteId(result.share.kind === 'list' ? result.share.suiteId || firstList?.id || null : firstList?.id || null)
    } catch (err) {
      setShare(null)
      if (err instanceof ShareAccessError && err.requiresEmail) {
        setNeedsEmail(true)
        setError('')
      } else {
        setNeedsEmail(false)
        setError(err instanceof Error ? err.message : 'Share not found')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    const params = new URLSearchParams(window.location.search)
    const emailFromLink = (params.get('email') || '').trim()
    if (emailFromLink) {
      setShareEmail(token, emailFromLink)
      setEmail(emailFromLink)
    }
    void loadShare()
  }, [token])

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setShareEmail(token, email)
    await loadShare()
  }

  const selectedList = useMemo(
    () => share?.lists.find((list) => list.id === selectedSuiteId) || share?.lists[0],
    [selectedSuiteId, share]
  )
  const caseSuites = share?.lists.filter((list) => list.kind !== 'bugs') || []
  const bugLists = share?.lists.filter((list) => list.kind === 'bugs') || []
  const permissions = share?.permissions
  const readOnly = !permissions?.canEdit

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Opening shared cases…
      </div>
    )
  }

  if (needsEmail) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
        <form onSubmit={handleEmailSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Share2 className="mb-3 h-6 w-6 text-sky-600 dark:text-sky-300" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">This share is for invited people</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter the email you were invited with to view and update this list, including images and videos.</p>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="mt-4 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          <Button type="submit" className="mt-4 h-10 w-full bg-sky-600 text-white hover:bg-sky-500">
            Open share
          </Button>
        </form>
      </div>
    )
  }

  if (error || !share) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
        <div>
          <Share2 className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">This share is unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error || 'The link may have been revoked.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Shared {share.kind}</p>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white">{share.title}</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">{share.projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] text-slate-700 dark:border-slate-700 dark:text-slate-300">
            {share.role === 'view' ? 'View only' : share.role === 'edit' ? 'Can edit' : 'Full access'}
          </span>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        {share.kind === 'project' && (
          <aside className="w-[240px] shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/90">
            <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300/80">Test suites</p>
            {caseSuites.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => setSelectedSuiteId(list.id)}
                className={cn(
                  'mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
                  selectedSuiteId === list.id ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                )}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="truncate">{list.name}</span>
              </button>
            ))}
            <p className="mt-3 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-rose-700 dark:text-rose-300/80">Bug lists</p>
            {bugLists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => setSelectedSuiteId(list.id)}
                className={cn(
                  'mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
                  selectedSuiteId === list.id ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                )}
              >
                <Bug className="h-3.5 w-3.5" />
                <span className="truncate">{list.name}</span>
              </button>
            ))}
          </aside>
        )}
        <main className="min-w-0 flex-1">
          <GoogleSheetsTable
            projectId={share.projectId}
            shareToken={share.token}
            shareMode="guest"
            readOnly={readOnly}
            canCreate={Boolean(permissions?.canCreate)}
            canDelete={Boolean(permissions?.canDelete)}
            canExport={Boolean(permissions?.canExport)}
            suiteId={selectedList?.id || null}
            listKind={selectedList?.kind === 'bugs' ? 'bugs' : 'suite'}
            listName={selectedList?.name || share.title}
          />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
