"use client"

import { useEffect, useRef, useState } from 'react'
import { Film, ImagePlus, Paperclip, Trash2, X } from 'lucide-react'
import {
  ArtifactMeta,
  artifactKindFromFile,
  deleteArtifactFiles,
  getArtifactFile,
  parseArtifacts,
  saveArtifactFile,
  serializeArtifacts,
} from '@/lib/artifact-store'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function ArtifactCell({
  value,
  onChange,
  shareToken = null,
  readOnly = false,
}: {
  value: unknown
  onChange: (next: string) => void
  shareToken?: string | null
  readOnly?: boolean
}) {
  const items = parseArtifacts(value)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<ArtifactMeta | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const created: string[] = []

    ;(async () => {
      const next: Record<string, string> = {}
      for (const item of items) {
        const blob = await getArtifactFile(item.id, shareToken)
        if (!blob || cancelled) continue
        const url = URL.createObjectURL(blob)
        created.push(url)
        next[item.id] = url
      }
      if (!cancelled) setUrls(next)
    })()

    return () => {
      cancelled = true
      created.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [items.map((item) => item.id).join('|'), shareToken])

  const addFiles = async (files: File[]) => {
    if (readOnly) return
    const usable = files.filter((file) => artifactKindFromFile(file))
    if (usable.length === 0) {
      toast({
        title: 'Images or videos only',
        description: 'Screenshots, photos, and recordings can be attached here.',
      })
      return
    }

    setBusy(true)
    const added: ArtifactMeta[] = []
    const failures: string[] = []
    try {
      for (const file of usable) {
        try {
          added.push(await saveArtifactFile(file, shareToken))
        } catch (error) {
          failures.push(error instanceof Error ? error.message : `Could not add ${file.name}`)
        }
      }
      if (added.length > 0) {
        onChange(serializeArtifacts([...items, ...added]))
      }
      if (failures.length > 0) {
        toast({
          title: added.length > 0 ? 'Some files were skipped' : 'Could not add file',
          description: failures[0],
          variant: 'destructive',
        })
      }
    } finally {
      setBusy(false)
    }
  }

  const removeItem = async (item: ArtifactMeta) => {
    if (readOnly) return
    if (preview?.id === item.id) setPreview(null)
    onChange(serializeArtifacts(items.filter((entry) => entry.id !== item.id)))
    await deleteArtifactFiles([item.id], shareToken)
  }

  return (
    <div
      className={cn('min-h-10 px-2 py-1.5', dragging && 'bg-blue-500/10')}
      onDragOver={(event) => {
        if (readOnly) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        if (readOnly) return
        event.preventDefault()
        setDragging(false)
        addFiles(Array.from(event.dataTransfer.files || []))
      }}
      onPaste={(event) => {
        if (readOnly) return
        const files = Array.from(event.clipboardData?.files || [])
        if (files.length === 0) return
        event.preventDefault()
        addFiles(files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []))
          event.target.value = ''
        }}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="group relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setPreview(item)
              }}
              className="block overflow-hidden rounded-md border border-slate-700 bg-slate-900"
              title={item.name}
            >
              {item.kind === 'image' && urls[item.id] ? (
                <img src={urls[item.id]} alt={item.name} className="h-10 w-10 object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center text-slate-400">
                  <Film className="h-4 w-4" />
                </span>
              )}
            </button>
            {!readOnly ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                removeItem(item)
              }}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-rose-300 ring-1 ring-slate-700 group-hover:flex"
              title={`Remove ${item.name}`}
            >
              <X className="h-3 w-3" />
            </button>
            ) : null}
          </div>
        ))}
        {!readOnly ? (
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation()
            inputRef.current?.click()
          }}
          className="inline-flex h-10 items-center gap-1 rounded-md border border-dashed border-slate-700 px-2 text-[11px] text-slate-400 hover:border-blue-400/50 hover:text-slate-200 disabled:opacity-50"
        >
          {items.length === 0 ? <ImagePlus className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
          {busy ? 'Adding…' : items.length === 0 ? 'Add image or video' : 'Add'}
        </button>
        ) : items.length === 0 ? (
          <span className="text-[11px] text-slate-500">No attachments</span>
        ) : null}
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-slate-950/80 p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-full max-w-4xl rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="truncate text-sm text-slate-200">{preview.name}</p>
              <div className="flex items-center gap-1">
                {!readOnly ? (
                <button
                  type="button"
                  onClick={() => removeItem(preview)}
                  className="rounded-md p-1.5 text-rose-300 hover:bg-rose-500/15"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-md p-1.5 text-slate-300 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {preview.kind === 'video' && urls[preview.id] ? (
              <video src={urls[preview.id]} controls className="max-h-[70vh] max-w-full rounded-lg" />
            ) : urls[preview.id] ? (
              <img src={urls[preview.id]} alt={preview.name} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
            ) : (
              <p className="px-6 py-10 text-sm text-slate-400">This file is no longer available.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
