"use client"

import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"
import { TestSuite, TestCase } from "@/types/qa-types"
import { Bug, FileSpreadsheet, User } from "lucide-react"

interface TestSuiteDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (
    suite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt' | 'totalTests' | 'passedTests' | 'failedTests' | 'pendingTests'>
  ) => void | Promise<void>
  testSuites: TestSuite[]
  testCases: TestCase[]
  onAddTestCaseToSuite: (testCaseId: string, suiteId: string) => void
  onRemoveTestCaseFromSuite: (testCaseId: string, suiteId: string) => void
  testSuite?: TestSuite
  listKind?: 'suite' | 'bugs'
}

export function TestSuiteDialog({
  isOpen,
  onClose,
  onSubmit,
  testSuite,
  listKind = 'suite',
}: TestSuiteDialogProps) {
  const isBugs = listKind === 'bugs'
  const [busy, setBusy] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    owner: ""
  })

  useEffect(() => {
    if (!isOpen) return
    setBusy(false)
    setFormData({
      name: testSuite?.name || "",
      description: testSuite?.description || "",
      tags: testSuite?.tags || [],
      owner: testSuite?.owner || "",
    })
  }, [isOpen, testSuite])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = formData.name.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      await onSubmit({
        ...formData,
        name,
        description: formData.description.trim(),
        owner: formData.owner.trim(),
        projectId: "",
        kind: listKind,
        testCaseIds: [],
        isActive: true
      })
      setFormData({ name: "", description: "", tags: [], owner: "" })
      onClose()
    } catch {
      // Parent shows the error toast; keep dialog open for retry.
    } finally {
      setBusy(false)
    }
  }

  const title = testSuite
    ? isBugs ? 'Edit bug list' : 'Edit test suite'
    : isBugs ? 'Create bug list' : 'Create test suite'

  const submitLabel = testSuite
    ? isBugs ? 'Save bug list' : 'Save suite'
    : isBugs ? 'Create bug list' : 'Create suite'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        variant="dark"
        className="w-[min(92vw,440px)] max-w-[440px] gap-0 border border-slate-200 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className={`relative overflow-hidden border-b border-slate-200 px-6 pb-5 pt-6 dark:border-slate-800 ${
          isBugs
            ? 'bg-gradient-to-br from-rose-50 via-white to-white dark:from-rose-500/15 dark:via-slate-950 dark:to-slate-950'
            : 'bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-500/15 dark:via-slate-950 dark:to-slate-950'
        }`}>
          <div className={`pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl ${
            isBugs ? 'bg-rose-500/20' : 'bg-emerald-500/20'
          }`} />
          <div className="relative flex items-start gap-3 pr-8">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-inner ${
              isBugs
                ? 'border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-200'
                : 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200'
            }`}>
              {isBugs ? <Bug className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${
                isBugs ? 'text-rose-700 dark:text-rose-300/80' : 'text-emerald-700 dark:text-emerald-300/80'
              }`}>
                {isBugs ? 'Bugs' : 'QA'}
              </p>
              <DialogTitle className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {isBugs
                  ? 'Cases added here stay together as a bug list, not loose on the project.'
                  : 'Cases added here stay together as a test suite, not loose on the project.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form id="test-suite-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="suite-name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {isBugs ? 'List name' : 'Suite name'}
            </Label>
            <Input
              id="suite-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={isBugs ? 'Sprint 12 bugs' : 'Login and signup'}
              required
              autoFocus
              className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suite-description" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Description <span className="font-normal text-slate-500">optional</span>
            </Label>
            <Textarea
              id="suite-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={isBugs ? 'What this bug list covers' : 'What this suite covers'}
              rows={3}
              className="min-h-[84px] resize-none border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suite-owner" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Owner <span className="font-normal text-slate-500">optional</span>
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                id="suite-owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="Who owns this list"
                className="h-10 border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="test-suite-form"
            disabled={busy || !formData.name.trim()}
            className={`h-9 text-white shadow-sm ${
              isBugs
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {busy ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
