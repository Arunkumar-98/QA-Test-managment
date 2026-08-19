"use client"

import { useEffect, useState } from 'react'
import { BookOpen, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CreateDocumentInput, CreateImportantLinkInput } from '@/types/qa-types'

const fieldClass =
  'h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500'
const labelClass = 'text-xs font-medium text-slate-700 dark:text-slate-300'
const helpClass = 'text-[11px] leading-relaxed text-slate-600 dark:text-slate-500'
const cancelClass =
  'h-9 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'

function normalizeUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

interface AddLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (link: Omit<CreateImportantLinkInput, 'projectId'>) => Promise<void> | void
}

export function AddLinkDialog({ isOpen, onClose, onSubmit }: AddLinkDialogProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setTitle('')
    setUrl('')
    setDescription('')
    setBusy(false)
  }, [isOpen])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextTitle = title.trim()
    const nextUrl = normalizeUrl(url)
    if (!nextTitle || !nextUrl) return
    setBusy(true)
    try {
      await onSubmit({
        title: nextTitle,
        url: nextUrl,
        description: description.trim(),
        category: 'general',
      })
      onClose()
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
        <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white px-6 pb-5 pt-6 dark:border-slate-800 dark:from-indigo-500/15 dark:via-slate-950 dark:to-slate-950">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-100 text-indigo-700 shadow-inner dark:border-indigo-400/30 dark:bg-indigo-500/20 dark:text-indigo-200">
              <LinkIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300/80">Resources</p>
              <DialogTitle className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">
                Add new link
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Save an important URL with this project so the team can open it later.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form id="add-link-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="resource-link-title" className={labelClass}>Link title</Label>
            <Input
              id="resource-link-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Design spec"
              required
              autoFocus
              className={fieldClass}
            />
            <p className={helpClass}>Give the link a name people will recognize.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resource-link-url" className={labelClass}>URL</Label>
            <Input
              id="resource-link-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              required
              className={fieldClass}
            />
            <p className={helpClass}>Full address. https:// is added if you leave it off.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resource-link-description" className={labelClass}>
              Description <span className="font-normal text-slate-500">optional</span>
            </Label>
            <Textarea
              id="resource-link-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Why this link matters"
              rows={3}
              className="min-h-[84px] resize-none border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <Button type="button" variant="outline" onClick={onClose} className={cancelClass}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-link-form"
            disabled={busy || !title.trim() || !url.trim()}
            className="h-9 bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Add link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface AddDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (document: Omit<CreateDocumentInput, 'projectId'>) => Promise<void> | void
}

export function AddDocumentDialog({ isOpen, onClose, onSubmit }: AddDocumentDialogProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<CreateDocumentInput['type']>('requirement')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setTitle('')
    setUrl('')
    setType('requirement')
    setDescription('')
    setBusy(false)
  }, [isOpen])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextTitle = title.trim()
    const nextUrl = normalizeUrl(url)
    if (!nextTitle || !nextUrl) return
    setBusy(true)
    try {
      await onSubmit({
        title: nextTitle,
        url: nextUrl,
        type,
        description: description.trim(),
      })
      onClose()
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
        <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-orange-50 via-white to-white px-6 pb-5 pt-6 dark:border-slate-800 dark:from-orange-500/15 dark:via-slate-950 dark:to-slate-950">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-300 bg-orange-100 text-orange-700 shadow-inner dark:border-orange-400/30 dark:bg-orange-500/20 dark:text-orange-200">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-orange-700 dark:text-orange-300/80">Resources</p>
              <DialogTitle className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">
                Add new document
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Keep specs, plans, and reports next to this project’s cases.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form id="add-document-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="resource-doc-title" className={labelClass}>Document title</Label>
            <Input
              id="resource-doc-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Sprint 1 test plan"
              required
              autoFocus
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resource-doc-url" className={labelClass}>Document URL</Label>
            <Input
              id="resource-doc-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/document.pdf"
              required
              className={fieldClass}
            />
            <p className={helpClass}>Link to where the file is hosted. https:// is added if you leave it off.</p>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Document type</Label>
            <Select value={type} onValueChange={(value) => setType(value as CreateDocumentInput['type'])}>
              <SelectTrigger className={`${fieldClass} text-left`}>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <SelectItem value="requirement">Requirement</SelectItem>
                <SelectItem value="specification">Specification</SelectItem>
                <SelectItem value="test-plan">Test plan</SelectItem>
                <SelectItem value="report">Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resource-doc-description" className={labelClass}>
              Description <span className="font-normal text-slate-500">optional</span>
            </Label>
            <Textarea
              id="resource-doc-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this document covers"
              rows={3}
              className="min-h-[84px] resize-none border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <Button type="button" variant="outline" onClick={onClose} className={cancelClass}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-document-form"
            disabled={busy || !title.trim() || !url.trim()}
            className="h-9 bg-orange-600 text-white hover:bg-orange-500"
          >
            Add document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
