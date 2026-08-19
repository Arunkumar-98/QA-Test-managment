"use client"

import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildDashboardOverview } from '@/lib/dashboard-service'
import { TestCase, TestSuite, Project } from '@/types/qa-types'
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  FolderOpen,
  Layers,
  Plus,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react'

interface ProjectDashboardProps {
  project: Project
  testCases: TestCase[]
  testSuites: TestSuite[]
  onAddTestCase: () => void
  onAddTestSuite: () => void
  onExportData: () => void
  onViewAllTestCases: () => void
}

function formatDelta(value: number, suffix = '') {
  if (value === 0) return `No change${suffix}`
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}${suffix}`
}

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function healthStyles(label: ReturnType<typeof buildDashboardOverview>['healthLabel']) {
  switch (label) {
    case 'Healthy':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300'
    case 'Needs attention':
      return 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300'
    case 'At risk':
      return 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300'
    default:
      return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600/50 dark:bg-slate-800/70 dark:text-slate-300'
  }
}

export function ProjectDashboard({
  project,
  testCases,
  testSuites,
  onAddTestCase,
  onAddTestSuite,
  onExportData,
  onViewAllTestCases,
}: ProjectDashboardProps) {
  const overview = useMemo(
    () => buildDashboardOverview(testCases, testSuites),
    [testCases, testSuites]
  )
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'
  const chartAxis = isLight ? '#475569' : '#94a3b8'
  const chartGrid = isLight ? '#cbd5e1' : '#1e293b'
  const chartTooltip = isLight
    ? { background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a' }
    : { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#e2e8f0' }

  const chartData = overview.statusSlices.filter((slice) => slice.count > 0)
  const hasData = overview.totalTestCases > 0
  const cardClass = 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none'
  const outlineBtn =
    'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'

  return (
    <div className="h-full overflow-auto bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-[1440px] space-y-6 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">Project overview</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{project.name}</h1>
              <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${healthStyles(overview.healthLabel)}`}>
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {overview.healthLabel}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Live quality snapshot for this project, based on current test cases, execution status, and suite coverage.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={onAddTestCase}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              New test case
            </Button>
            <Button
              variant="outline"
              onClick={onViewAllTestCases}
              className={outlineBtn}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              View cases
            </Button>
            <Button
              variant="outline"
              onClick={onExportData}
              className={outlineBtn}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total test cases"
            value={String(overview.totalTestCases)}
            hint={formatDelta(overview.weeklyCreatedDelta, ' vs last week')}
            icon={FileText}
            accent="blue"
            positive={overview.weeklyCreatedDelta >= 0}
          />
          <KpiCard
            label="Pass rate"
            value={`${overview.passRate}%`}
            hint={`${overview.executedTestCases} executed · ${formatDelta(overview.passRateDelta, ' pts')}`}
            icon={CheckCircle2}
            accent="emerald"
            positive={overview.passRateDelta >= 0}
          />
          <KpiCard
            label="Test suites"
            value={String(overview.totalTestSuites)}
            hint={`${overview.activeSuites} with assigned cases`}
            icon={Layers}
            accent="violet"
          />
          <KpiCard
            label="Failed tests"
            value={String(overview.failedTestCases)}
            hint={overview.failedTestCases > 0 ? 'Needs investigation' : 'No failing cases'}
            icon={XCircle}
            accent="rose"
            positive={overview.failedTestCases === 0}
          />
        </div>

        {!hasData ? (
          <Card className={cardClass}>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <ClipboardList className="h-7 w-7 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No test data yet</h2>
                <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
                  Add your first test case or suite to start tracking pass rate, coverage, and execution trends for {project.name}.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={onAddTestCase} className="bg-blue-600 text-white hover:bg-blue-500">
                  <Plus className="mr-2 h-4 w-4" />
                  Add test case
                </Button>
                <Button
                  variant="outline"
                  onClick={onAddTestSuite}
                  className={outlineBtn}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Create suite
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <Card className={`${cardClass} xl:col-span-2`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900 dark:text-white">Status distribution</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Current mix of execution results</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={2}
                          stroke="transparent"
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {overview.statusSlices.filter((slice) => slice.count > 0).map((slice) => (
                      <div key={slice.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-transparent dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{slice.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{slice.count}</span>
                          <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">{slice.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={`${cardClass} xl:col-span-3`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900 dark:text-white">Activity · last 14 days</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Created, updated, and executed cases</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview.trend}>
                      <defs>
                        <linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={isLight ? 0.22 : 0.35} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="executedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={isLight ? 0.2 : 0.3} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={chartGrid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip contentStyle={chartTooltip} />
                      <Area type="monotone" dataKey="created" stroke="#2563eb" fill="url(#createdFill)" strokeWidth={2} />
                      <Area type="monotone" dataKey="executed" stroke="#059669" fill="url(#executedFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className={`${cardClass} xl:col-span-2`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-base text-slate-900 dark:text-white">Test suite coverage</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">Pass completion by suite</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAddTestSuite}
                    className={outlineBtn}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Suite
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overview.suites.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                      No suites yet. Group related cases into a suite to track coverage.
                    </div>
                  ) : (
                    overview.suites.slice(0, 6).map((suite) => (
                      <div key={suite.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{suite.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {suite.passed} passed · {suite.failed} failed · {suite.remaining} remaining
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{suite.percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                            style={{ width: `${suite.percent}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className={cardClass}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-900 dark:text-white">Quality health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-4xl font-semibold text-slate-900 dark:text-white">{overview.healthScore}</p>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Score / 100</p>
                      </div>
                      <Badge className={healthStyles(overview.healthLabel)}>{overview.healthLabel}</Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${overview.healthScore}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-transparent dark:bg-slate-800/60">
                        <p className="text-slate-600 dark:text-slate-400">Execution</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">{overview.executionRate}%</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-transparent dark:bg-slate-800/60">
                        <p className="text-slate-600 dark:text-slate-400">Blocked</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">{overview.blockedTestCases}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cardClass}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-900 dark:text-white">Recent activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {overview.recentActivity.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">No recent changes.</p>
                    ) : (
                      overview.recentActivity.slice(0, 5).map((item) => (
                        <div key={`${item.kind}-${item.id}`} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-transparent dark:bg-slate-800">
                            {item.kind === 'suite' ? (
                              <Layers className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                            ) : item.kind === 'created' ? (
                              <Plus className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                            ) : (
                              <Activity className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {item.description} · {timeAgo(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  positive,
}: {
  label: string
  value: string
  hint: string
  icon: typeof FileText
  accent: 'blue' | 'emerald' | 'violet' | 'rose'
  positive?: boolean
}) {
  const accentMap = {
    blue: 'bg-blue-50 text-blue-800 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-transparent dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-800 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-transparent dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-800 dark:bg-gradient-to-br dark:from-violet-500/20 dark:to-transparent dark:text-violet-300',
    rose: 'bg-rose-50 text-rose-800 dark:bg-gradient-to-br dark:from-rose-500/20 dark:to-transparent dark:text-rose-300',
  }
  const valueMap = {
    blue: 'text-blue-950 dark:text-white',
    emerald: 'text-emerald-950 dark:text-white',
    violet: 'text-violet-950 dark:text-white',
    rose: 'text-rose-950 dark:text-white',
  }
  const hintMap = {
    blue: 'text-blue-800 dark:text-slate-400',
    emerald: 'text-emerald-800 dark:text-slate-400',
    violet: 'text-violet-800 dark:text-slate-400',
    rose: 'text-rose-800 dark:text-slate-400',
  }
  const iconMap = {
    blue: 'border-blue-200 bg-white text-blue-700 dark:border-white/10 dark:bg-slate-950/40',
    emerald: 'border-emerald-200 bg-white text-emerald-700 dark:border-white/10 dark:bg-slate-950/40',
    violet: 'border-violet-200 bg-white text-violet-700 dark:border-white/10 dark:bg-slate-950/40',
    rose: 'border-rose-200 bg-white text-rose-700 dark:border-white/10 dark:bg-slate-950/40',
  }

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none">
      <CardContent className={`p-5 ${accentMap[accent]}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className={`mt-2 text-3xl font-semibold tracking-tight ${valueMap[accent]}`}>{value}</p>
            <p className={`mt-2 flex items-center text-xs font-medium ${hintMap[accent]}`}>
              {positive === undefined ? null : positive ? (
                <TrendingUp className="mr-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="mr-1 h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              )}
              {hint}
            </p>
          </div>
          <div className={`rounded-xl border p-2.5 ${iconMap[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
