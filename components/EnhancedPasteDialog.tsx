"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Bug,
  Clipboard,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import { TestSuite, CreateTestSuiteInput } from '@/types/qa-types'
import {
  buildColumnMappings,
  mapImportRows,
  parsePastedText,
  persistImportedCases,
  type ColumnMapping,
  type ImportListKind,
  type MappedImportCase,
  type ParsedImportTable,
} from '@/lib/case-import'
import { toast } from '@/hooks/use-toast'

const selectItemClass =
  'cursor-pointer text-slate-800 focus:bg-blue-50 focus:text-blue-900 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:text-white dark:data-[highlighted]:bg-slate-800'

interface EnhancedPasteDialogProps {
  isOpen: boolean
  onClose: () => void
  onImported: (result: { suiteId: string; imported: number }) => void
  projectId: string
  selectedSuiteId?: string
  testSuites?: TestSuite[]
  onCreateTestSuite?: (suite: CreateTestSuiteInput) => Promise<TestSuite>
}

function resolveDefaultDestination(selectedSuiteId: string | undefined, testSuites: TestSuite[]) {
  if (selectedSuiteId && testSuites.some((suite) => suite.id === selectedSuiteId)) {
    return selectedSuiteId
  }
  if (testSuites.length === 1) return testSuites[0].id
  return '__new__'
}

export function EnhancedPasteDialog({
  isOpen,
  onClose,
  onImported,
  projectId,
  selectedSuiteId,
  testSuites = [],
  onCreateTestSuite,
}: EnhancedPasteDialogProps) {
  const [text, setText] = useState('')
  const [table, setTable] = useState<ParsedImportTable | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [cases, setCases] = useState<MappedImportCase[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [destination, setDestination] = useState(() =>
    resolveDefaultDestination(selectedSuiteId, testSuites)
  )
  const [createKind, setCreateKind] = useState<ImportListKind>('suite')
  const [newListName, setNewListName] = useState('')

  const caseSuites = testSuites.filter((suite) => suite.kind !== 'bugs')
  const bugLists = testSuites.filter((suite) => suite.kind === 'bugs')
  const hasLists = testSuites.length > 0
  const selectedList = testSuites.find((suite) => suite.id === destination)
  const currentList = testSuites.find((suite) => suite.id === selectedSuiteId)
  const listKind: ImportListKind =
    selectedList?.kind === 'bugs' || (destination === '__new__' && createKind === 'bugs')
      ? 'bugs'
      : 'suite'

  useEffect(() => {
    if (!isOpen) return
    setText('')
    setTable(null)
    setMappings([])
    setCases([])
    setBusy(false)
    setError('')
    setDestination(resolveDefaultDestination(selectedSuiteId, testSuites))
    const current = testSuites.find((suite) => suite.id === selectedSuiteId)
    setCreateKind(current?.kind === 'bugs' ? 'bugs' : 'suite')
    setNewListName('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedSuiteId])

  const previewRows = useMemo(() => cases.slice(0, 5), [cases])

  const parseText = async (value: string) => {
    setText(value)
    setError('')
    if (!value.trim()) {
      setTable(null)
      setMappings([])
      setCases([])
      return
    }

    try {
      const parsed = parsePastedText(value)
      if (parsed.rows.length === 0) {
        setTable(parsed)
        setCases([])
        setError('Could not find any cases in that paste')
        return
      }
      const nextMappings = buildColumnMappings(parsed.headers, [])
      setTable(parsed)
      setMappings(nextMappings)
      setCases(mapImportRows(parsed.rows, nextMappings, listKind))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse that paste')
    }
  }

  useEffect(() => {
    if (!table) return
    setCases(mapImportRows(table.rows, mappings, listKind))
  }, [listKind, mappings, table])

  const handleClipboard = async () => {
    try {
      const clipboard = await navigator.clipboard.readText()
      await parseText(clipboard)
    } catch {
      toast({
        title: 'Clipboard blocked',
        description: 'Paste into the box instead.',
        variant: 'destructive',
      })
    }
  }

  const handleImport = async () => {
    if (!projectId) {
      toast({ title: 'No project selected', variant: 'destructive' })
      return
    }
    if (cases.length === 0) return

    setBusy(true)
    setError('')
    try {
      let suiteId = destination
      let kind: ImportListKind = listKind

      if (destination === '__new__') {
        const name = newListName.trim()
        if (!name || !onCreateTestSuite) {
          throw new Error('Enter a name for the new list')
        }
        const created = await onCreateTestSuite({
          name,
          description: 'Created while pasting cases',
          projectId,
          testCaseIds: [],
          tags: [],
          owner: '',
          isActive: true,
          kind: createKind,
        })
        suiteId = created.id
        kind = created.kind === 'bugs' ? 'bugs' : 'suite'
      }

      if (!suiteId) {
        throw new Error('Pick a test suite or bug list first')
      }

      const mapped = mapImportRows(table?.rows || [], mappings, kind)
      const result = await persistImportedCases({
        projectId,
        suiteId,
        listKind: kind,
        cases: mapped,
        extraColumns: mappings.filter((mapping) => mapping.isNew),
      })

      toast({
        title: 'Paste complete',
        description: `${result.imported} cases added${result.extraColumns.length ? ` · ${result.extraColumns.length} extra columns` : ''}`,
      })
      onImported({ suiteId, imported: result.imported })
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Paste failed'
      setError(message)
      toast({
        title: 'Paste failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const canImport = Boolean(projectId && cases.length && (destination === '__new__' ? newListName.trim() : destination))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        variant="dark"
        className="w-[min(92vw,640px)] max-w-[640px] max-h-[90vh] gap-0 overflow-hidden border border-slate-200 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-white px-6 pb-5 pt-6 dark:border-slate-800 dark:from-blue-500/15 dark:via-slate-950 dark:to-slate-950">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300 bg-blue-100 text-blue-700 shadow-inner dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-200">
              <Clipboard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300/80">Cases</p>
              <DialogTitle className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">Paste cases</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Paste a table from Excel or Google Sheets. Columns map to the current grid.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="paste-cases" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Spreadsheet or structured text
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClipboard}
              className="h-8 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Clipboard className="mr-1.5 h-3.5 w-3.5" />
              Clipboard
            </Button>
          </div>
          <Textarea
            id="paste-cases"
            value={text}
            onChange={(event) => void parseText(event.target.value)}
            placeholder={'Title\tDescription\tSteps\tStatus\nLogin with valid user\tUser reaches dashboard\tOpen app and sign in\tNot Executed'}
            className="min-h-[180px] border-slate-300 bg-white font-mono text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-600/50 dark:bg-slate-900/70 dark:text-slate-100"
          />

          {table && (
            <p className="text-xs text-slate-400">
              Detected {table.format.toUpperCase()} · {cases.length} cases
            </p>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Import into</Label>

            {!hasLists && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                No test suite or bug list yet. Create a new list below, then import.
              </div>
            )}

            {currentList && destination === currentList.id && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
                Using current list: <span className="font-semibold">{currentList.name}</span>
              </div>
            )}

            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="h-10 border-slate-300 bg-white text-slate-900 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white">
                <SelectValue placeholder={hasLists ? 'Choose a list' : 'Create a new list'} />
              </SelectTrigger>
              <SelectContent className="z-[1000000] border border-slate-200 bg-white text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {caseSuites.map((suite) => (
                  <SelectItem key={suite.id} value={suite.id} className={selectItemClass}>
                    <span className="inline-flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                      {suite.name}
                      {suite.id === selectedSuiteId ? ' (current)' : ''}
                    </span>
                  </SelectItem>
                ))}
                {bugLists.map((suite) => (
                  <SelectItem key={suite.id} value={suite.id} className={selectItemClass}>
                    <span className="inline-flex items-center gap-2">
                      <Bug className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
                      {suite.name}
                      {suite.id === selectedSuiteId ? ' (current)' : ''}
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value="__new__" className={selectItemClass}>
                  Create new list…
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {destination === '__new__' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {hasLists
                  ? 'Create a new list and import cases into it.'
                  : 'Name your first list to continue.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">List type</Label>
                  <Select value={createKind} onValueChange={(value) => setCreateKind(value as ImportListKind)}>
                    <SelectTrigger className="h-10 border-slate-300 bg-white text-slate-900 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[1000000] border border-slate-200 bg-white text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <SelectItem value="suite" className={selectItemClass}>Test suite</SelectItem>
                      <SelectItem value="bugs" className={selectItemClass}>Bug list</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Name</Label>
                  <Input
                    value={newListName}
                    onChange={(event) => setNewListName(event.target.value)}
                    placeholder={createKind === 'bugs' ? 'Login bugs' : 'Regression suite'}
                    className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {cases.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="border-t border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      <td className="max-w-[280px] truncate px-3 py-2">{row.dynamicFields.title || 'Untitled'}</td>
                      <td className="px-3 py-2">{row.dynamicFields.status}</td>
                      <td className="px-3 py-2">{row.dynamicFields.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-transparent">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600/50 dark:text-slate-300 dark:hover:bg-slate-800/50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!canImport || busy}
            className="h-10 bg-blue-600 text-white hover:bg-blue-500"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import {cases.length || ''} cases
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
