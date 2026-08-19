import { CreateColumnInput } from '@/lib/google-sheets-service'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/constants'

export const CASE_TYPE_OPTIONS = [
  'Functional',
  'Regression',
  'Smoke',
  'Bug',
  'Exploratory',
  'Performance',
] as const

export const SEVERITY_OPTIONS = ['Critical', 'Major', 'Minor', 'Trivial'] as const

export const DEFAULT_CASE_COLUMNS: CreateColumnInput[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'text' },
  { name: 'steps', label: 'Steps', type: 'text' },
  { name: 'type', label: 'Type', type: 'select', options: [...CASE_TYPE_OPTIONS], defaultValue: 'Functional' },
  { name: 'status', label: 'Status', type: 'select', options: [...STATUS_OPTIONS], defaultValue: 'Not Executed' },
  { name: 'priority', label: 'Priority', type: 'select', options: [...PRIORITY_OPTIONS], defaultValue: 'P2 (Medium)' },
  { name: 'expected_result', label: 'Expected result', type: 'text' },
  { name: 'actual_result', label: 'Actual result', type: 'text' },
  { name: 'artifacts', label: 'Artifacts', type: 'text' },
  { name: 'assignee', label: 'Assignee', type: 'text' },
]

export const DEFAULT_HIDDEN_COLUMN_NAMES = ['type', 'priority', 'expected_result', 'assignee']

export const DEFAULT_ROW_VALUES: Record<string, string> = {
  title: '',
  description: '',
  steps: '',
  type: 'Functional',
  status: 'Not Executed',
  priority: 'P2 (Medium)',
  expected_result: '',
  actual_result: '',
  artifacts: '',
  assignee: '',
}

export const COLUMN_WIDTHS: Record<string, number> = {
  title: 280,
  description: 320,
  steps: 280,
  type: 140,
  status: 150,
  priority: 150,
  expected_result: 240,
  actual_result: 240,
  artifacts: 240,
  assignee: 150,
}

export const RETIRED_COLUMN_NAMES = ['severity', 'module']

export const STATUS_PILL: Record<string, string> = {
  Pass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  Fail: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  Blocked: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
  'In Progress': 'bg-blue-500/15 text-blue-300 border-blue-400/30',
  'Not Executed': 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  Other: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
}

export const PRIORITY_PILL: Record<string, string> = {
  'P0 (Blocker)': 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  'P1 (High)': 'bg-orange-500/15 text-orange-300 border-orange-400/30',
  'P2 (Medium)': 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  'P3 (Low)': 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  Other: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
}

export const SEVERITY_PILL: Record<string, string> = {
  Critical: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  Major: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
  Minor: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  Trivial: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
}

export function formatCaseKey(index: number) {
  return `C-${String(index + 1).padStart(3, '0')}`
}
