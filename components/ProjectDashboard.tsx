import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileText, 
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Settings,
  Folder
} from 'lucide-react'
import { TestCase, TestSuite, Project } from '@/types/qa-types'

interface ProjectDashboardProps {
  project: Project
  testCases: TestCase[]
  testSuites: TestSuite[]
  onAddTestCase: () => void
  onAddTestSuite: () => void
  onExportData: () => void
  onOpenSettings: () => void
  onViewAllTestCases: () => void
}

interface DashboardMetrics {
  totalTestCases: number
  passedTestCases: number
  failedTestCases: number
  pendingTestCases: number
  blockedTestCases: number
  totalTestSuites: number
  completedSuites: number
  passRate: number
  weeklyActivity: number
  monthlyTrend: number
}

interface ActivityItem {
  id: string
  type: 'test_case_created' | 'test_case_updated' | 'test_case_status_changed' | 'test_suite_created' | 'test_suite_updated'
  title: string
  description: string
  timestamp: Date
  user: string
  icon: React.ReactNode
}

export function ProjectDashboard({
  project,
  testCases,
  testSuites,
  onAddTestCase,
  onAddTestSuite,
  onExportData,
  onOpenSettings,
  onViewAllTestCases
}: ProjectDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTestCases: 0,
    passedTestCases: 0,
    failedTestCases: 0,
    pendingTestCases: 0,
    blockedTestCases: 0,
    totalTestSuites: 0,
    completedSuites: 0,
    passRate: 0,
    weeklyActivity: 0,
    monthlyTrend: 0
  })

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])

  // Calculate metrics
  useEffect(() => {
    const passed = testCases.filter(tc => tc.status === 'Pass').length
    const failed = testCases.filter(tc => tc.status === 'Fail').length
    const pending = testCases.filter(tc => tc.status === 'Not Executed').length
    const blocked = testCases.filter(tc => tc.status === 'Blocked').length
    const total = testCases.length
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

    const completedSuites = testSuites.filter(ts => 
      ts.testCaseIds && ts.testCaseIds.length > 0
    ).length

    setMetrics({
      totalTestCases: total,
      passedTestCases: passed,
      failedTestCases: failed,
      pendingTestCases: pending,
      blockedTestCases: blocked,
      totalTestSuites: testSuites.length,
      completedSuites,
      passRate,
      weeklyActivity: Math.floor(Math.random() * 20) + 5, // Mock data
      monthlyTrend: Math.floor(Math.random() * 15) + 10 // Mock data
    })
  }, [testCases, testSuites])

  // Recent activity is optional; keep empty until wired to backend
  useEffect(() => { setRecentActivity([]) }, [])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed': return 'bg-green-500'
      case 'Failed': return 'bg-red-500'
      case 'Pending': return 'bg-yellow-500'
      case 'Blocked': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Passed': return <CheckCircle className="w-4 h-4" />
      case 'Failed': return <XCircle className="w-4 h-4" />
      case 'Pending': return <Clock className="w-4 h-4" />
      case 'Blocked': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100 h-full">
      <div className="space-y-8 p-8 min-h-[calc(100vh-96px)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{project.name} Dashboard</h1>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={onViewAllTestCases}
              className="bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30 hover:border-blue-400/50"
            >
              <Folder className="w-4 h-4 mr-2" />
              View All Test Cases
            </Button>
            <Button 
              variant="outline" 
              onClick={onExportData}
              className="bg-slate-900/50 border-slate-700/60 text-slate-200 hover:bg-slate-800/70"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={onOpenSettings}
              className="bg-slate-900/50 border-slate-700/60 text-slate-200 hover:bg-slate-800/70"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border border-blue-400/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Test Cases</p>
                  <p className="text-3xl font-bold text-white">{metrics.totalTestCases}</p>
                  <p className="text-blue-200 text-xs mt-2 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +{metrics.weeklyActivity} this week
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border border-emerald-400/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Pass Rate</p>
                  <p className="text-3xl font-bold text-white">{metrics.passRate}%</p>
                  <p className="text-emerald-200 text-xs mt-2 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +5% vs last month
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white border border-purple-400/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Test Suites</p>
                  <p className="text-3xl font-bold text-white">{metrics.totalTestSuites}</p>
                  <p className="text-purple-200 text-xs mt-2">
                    {metrics.completedSuites} active suites
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Target className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-600 to-rose-600 text-white border border-red-400/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Failed Tests</p>
                  <p className="text-3xl font-bold text-white">{metrics.failedTestCases}</p>
                  <p className="text-red-200 text-xs mt-2 flex items-center">
                    {metrics.failedTestCases > 0 ? (
                      <>
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        Needs attention
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        All good
                      </>
                    )}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content (no tabs, simplified) */}
        <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 backdrop-blur-md shadow-xl p-6">
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/40 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-300" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Status Distribution</CardTitle>
                        <CardDescription className="text-slate-300">Breakdown of test cases by status</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-400/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                          <span className="text-slate-200 font-medium">Passed</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{metrics.passedTestCases}</div>
                          <div className="text-slate-400 text-sm">
                            {metrics.totalTestCases > 0 ? Math.round((metrics.passedTestCases / metrics.totalTestCases) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-400/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span className="text-slate-200 font-medium">Failed</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{metrics.failedTestCases}</div>
                          <div className="text-slate-400 text-sm">
                            {metrics.totalTestCases > 0 ? Math.round((metrics.failedTestCases / metrics.totalTestCases) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-400/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                          <span className="text-slate-200 font-medium">Pending</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{metrics.pendingTestCases}</div>
                          <div className="text-slate-400 text-sm">
                            {metrics.totalTestCases > 0 ? Math.round((metrics.pendingTestCases / metrics.totalTestCases) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-500/10 border border-slate-400/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-slate-200 font-medium">Blocked</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{metrics.blockedTestCases}</div>
                          <div className="text-slate-400 text-sm">
                            {metrics.totalTestCases > 0 ? Math.round((metrics.blockedTestCases / metrics.totalTestCases) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Suite Progress */}
                <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/40 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-fuchsia-500/20 border border-fuchsia-400/30 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-fuchsia-300" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Test Suite Progress</CardTitle>
                        <CardDescription className="text-slate-300">Completion status of test suites</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {testSuites.map((suite) => {
                      const suiteTestCases = testCases.filter(tc => tc.suiteId === suite.id)
                      const completed = suiteTestCases.filter(tc => tc.status === 'Pass').length
                      const total = suiteTestCases.length
                      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
                      
                      return (
                        <div key={suite.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-200 font-medium">{suite.name}</span>
                            <span className="text-slate-400 text-sm">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="text-slate-400 text-xs">
                            {completed} of {total} completed • {total - completed} remaining
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions removed as requested */}
            </div>
        </div>
      </div>
    </div>
  )
} 