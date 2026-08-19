import { TestCase, TestSuite } from '@/types/qa-types'
import { readCollection, reviveDates } from '@/lib/local-db'

export type DashboardStatusKey = 'pass' | 'fail' | 'inProgress' | 'blocked' | 'pending' | 'other'

export type DashboardStatusSlice = {
  key: DashboardStatusKey
  label: string
  count: number
  percent: number
  color: string
}

export type DashboardPrioritySlice = {
  key: string
  label: string
  count: number
  percent: number
}

export type DashboardTrendPoint = {
  date: string
  label: string
  created: number
  updated: number
  executed: number
}

export type DashboardSuiteProgress = {
  id: string
  name: string
  total: number
  passed: number
  failed: number
  remaining: number
  percent: number
}

export type DashboardActivityItem = {
  id: string
  title: string
  description: string
  timestamp: Date
  kind: 'created' | 'updated' | 'suite'
}

export type DashboardOverview = {
  totalTestCases: number
  passedTestCases: number
  failedTestCases: number
  pendingTestCases: number
  blockedTestCases: number
  inProgressTestCases: number
  executedTestCases: number
  passRate: number
  executionRate: number
  healthScore: number
  healthLabel: 'Healthy' | 'Needs attention' | 'At risk' | 'No data'
  weeklyCreated: number
  weeklyCreatedDelta: number
  passRateDelta: number
  totalTestSuites: number
  activeSuites: number
  statusSlices: DashboardStatusSlice[]
  prioritySlices: DashboardPrioritySlice[]
  trend: DashboardTrendPoint[]
  suites: DashboardSuiteProgress[]
  recentActivity: DashboardActivityItem[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function asRecord(item: TestCase | any): Record<string, any> {
  return item || {}
}

function fieldValue(item: TestCase | any, keys: string[]): string {
  const record = asRecord(item)
  const dynamic = record.dynamicFields || record.customFields || {}

  for (const key of keys) {
    const direct = record[key]
    if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
      return String(direct)
    }
    const nested = dynamic[key]
    if (nested !== undefined && nested !== null && String(nested).trim() !== '') {
      return String(nested)
    }
  }

  return ''
}

export function getTestCaseStatus(item: TestCase | any): string {
  return fieldValue(item, ['status', 'Status', 'testStatus', 'result'])
}

export function getTestCasePriority(item: TestCase | any): string {
  return fieldValue(item, ['priority', 'Priority'])
}

export function getTestCaseTitle(item: TestCase | any): string {
  return fieldValue(item, ['testCase', 'title', 'name', 'Test Case']) || 'Untitled test case'
}

export function normalizeStatus(raw: string): DashboardStatusKey {
  const value = raw.trim().toLowerCase()
  if (['pass', 'passed', 'success', 'ok'].includes(value)) return 'pass'
  if (['fail', 'failed', 'failure'].includes(value)) return 'fail'
  if (['blocked'].includes(value)) return 'blocked'
  if (['in progress', 'in-progress', 'running', 'wip'].includes(value)) return 'inProgress'
  if (['not executed', 'pending', 'new', 'todo', 'not run', ''].includes(value)) return 'pending'
  return 'other'
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value as string)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function inWindow(date: Date | null, start: Date, end: Date) {
  if (!date) return false
  return date >= start && date < end
}

function percent(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

function delta(current: number, previous: number) {
  return current - previous
}

export function buildDashboardOverview(testCases: TestCase[], testSuites: TestSuite[]): DashboardOverview {
  const now = new Date()
  const today = startOfDay(now)
  const weekAgo = new Date(today.getTime() - 7 * DAY_MS)
  const twoWeeksAgo = new Date(today.getTime() - 14 * DAY_MS)
  const monthAgo = new Date(today.getTime() - 30 * DAY_MS)
  const twoMonthsAgo = new Date(today.getTime() - 60 * DAY_MS)

  const counts: Record<DashboardStatusKey, number> = {
    pass: 0,
    fail: 0,
    inProgress: 0,
    blocked: 0,
    pending: 0,
    other: 0,
  }

  const priorityCounts: Record<string, number> = {}
  let weeklyCreated = 0
  let previousWeekCreated = 0
  let currentMonthExecuted = 0
  let previousMonthExecuted = 0
  let currentMonthPassed = 0
  let previousMonthPassed = 0

  for (const testCase of testCases) {
    const status = normalizeStatus(getTestCaseStatus(testCase))
    counts[status] += 1

    const priority = getTestCasePriority(testCase) || 'Unspecified'
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1

    const createdAt = toDate((testCase as any).createdAt)
    const updatedAt = toDate((testCase as any).updatedAt)

    if (inWindow(createdAt, weekAgo, now)) weeklyCreated += 1
    if (inWindow(createdAt, twoWeeksAgo, weekAgo)) previousWeekCreated += 1

    if (status === 'pass' || status === 'fail') {
      const executedAt = updatedAt || createdAt
      if (inWindow(executedAt, monthAgo, now)) {
        currentMonthExecuted += 1
        if (status === 'pass') currentMonthPassed += 1
      }
      if (inWindow(executedAt, twoMonthsAgo, monthAgo)) {
        previousMonthExecuted += 1
        if (status === 'pass') previousMonthPassed += 1
      }
    }
  }

  const total = testCases.length
  const executed = counts.pass + counts.fail
  const passRate = percent(counts.pass, executed || total)
  const currentMonthPassRate = percent(currentMonthPassed, currentMonthExecuted)
  const previousMonthPassRate = percent(previousMonthPassed, previousMonthExecuted)

  let healthScore = 0
  if (total > 0) {
    healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          passRate * 0.6 +
            percent(executed, total) * 0.25 +
            Math.max(0, 20 - counts.fail * 4 - counts.blocked * 2)
        )
      )
    )
  }

  const healthLabel: DashboardOverview['healthLabel'] =
    total === 0 ? 'No data' : healthScore >= 75 ? 'Healthy' : healthScore >= 45 ? 'Needs attention' : 'At risk'

  const statusMeta: Array<{ key: DashboardStatusKey; label: string; color: string }> = [
    { key: 'pass', label: 'Passed', color: '#34d399' },
    { key: 'fail', label: 'Failed', color: '#f87171' },
    { key: 'inProgress', label: 'In progress', color: '#60a5fa' },
    { key: 'pending', label: 'Not executed', color: '#fbbf24' },
    { key: 'blocked', label: 'Blocked', color: '#94a3b8' },
    { key: 'other', label: 'Other', color: '#c084fc' },
  ]

  const statusSlices = statusMeta
    .map((item) => ({
      ...item,
      count: counts[item.key],
      percent: percent(counts[item.key], total),
    }))
    .filter((item) => item.count > 0 || total === 0)

  const prioritySlices = Object.entries(priorityCounts)
    .map(([label, count]) => ({
      key: label,
      label,
      count,
      percent: percent(count, total),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const trend: DashboardTrendPoint[] = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(today.getTime() - (13 - index) * DAY_MS)
    const next = new Date(day.getTime() + DAY_MS)
    let created = 0
    let updated = 0
    let executedCount = 0

    for (const testCase of testCases) {
      const createdAt = toDate((testCase as any).createdAt)
      const updatedAt = toDate((testCase as any).updatedAt)
      const status = normalizeStatus(getTestCaseStatus(testCase))
      if (inWindow(createdAt, day, next)) created += 1
      if (inWindow(updatedAt, day, next) && (!createdAt || updatedAt!.getTime() !== createdAt.getTime())) updated += 1
      if ((status === 'pass' || status === 'fail') && inWindow(updatedAt || createdAt, day, next)) executedCount += 1
    }

    return {
      date: day.toISOString(),
      label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      created,
      updated,
      executed: executedCount,
    }
  })

  const suites: DashboardSuiteProgress[] = testSuites.map((suite) => {
    const suiteCases = testCases.filter((item) => item.suiteId === suite.id)
    const passed = suiteCases.filter((item) => normalizeStatus(getTestCaseStatus(item)) === 'pass').length
    const failed = suiteCases.filter((item) => normalizeStatus(getTestCaseStatus(item)) === 'fail').length
    const suiteTotal = suiteCases.length
    return {
      id: suite.id,
      name: suite.name,
      total: suiteTotal,
      passed,
      failed,
      remaining: Math.max(0, suiteTotal - passed),
      percent: percent(passed, suiteTotal),
    }
  }).sort((a, b) => b.total - a.total)

  const recentActivity: DashboardActivityItem[] = [
    ...testCases.map((item) => {
      const createdAt = toDate((item as any).createdAt) || new Date()
      const updatedAt = toDate((item as any).updatedAt) || createdAt
      const isUpdate = updatedAt.getTime() - createdAt.getTime() > 60 * 1000
      return {
        id: item.id,
        title: getTestCaseTitle(item),
        description: isUpdate
          ? `Status set to ${getTestCaseStatus(item) || 'updated'}`
          : 'Test case created',
        timestamp: isUpdate ? updatedAt : createdAt,
        kind: isUpdate ? 'updated' as const : 'created' as const,
      }
    }),
    ...testSuites.map((suite) => ({
      id: suite.id,
      title: suite.name,
      description: 'Test suite created',
      timestamp: toDate((suite as any).createdAt) || new Date(),
      kind: 'suite' as const,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8)

  return {
    totalTestCases: total,
    passedTestCases: counts.pass,
    failedTestCases: counts.fail,
    pendingTestCases: counts.pending,
    blockedTestCases: counts.blocked,
    inProgressTestCases: counts.inProgress,
    executedTestCases: executed,
    passRate,
    executionRate: percent(executed, total),
    healthScore,
    healthLabel,
    weeklyCreated,
    weeklyCreatedDelta: delta(weeklyCreated, previousWeekCreated),
    passRateDelta: delta(currentMonthPassRate, previousMonthPassRate),
    totalTestSuites: testSuites.length,
    activeSuites: suites.filter((suite) => suite.total > 0).length,
    statusSlices: total === 0 ? statusMeta.map((item) => ({ ...item, count: 0, percent: 0 })) : statusSlices,
    prioritySlices,
    trend,
    suites,
    recentActivity,
  }
}

export const dashboardService = {
  async getProjectOverview(projectId: string): Promise<DashboardOverview> {
    const testCases = readCollection<TestCase>('test_cases')
      .filter((item) => item.projectId === projectId)
      .map((item) => reviveDates(item))

    const testSuites = readCollection<TestSuite>('test_suites')
      .filter((item) => item.projectId === projectId)
      .map((item) => reviveDates(item, ['createdAt', 'updatedAt', 'lastRun']))

    return buildDashboardOverview(testCases, testSuites)
  },
}
