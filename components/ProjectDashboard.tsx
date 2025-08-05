import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Activity,
  Calendar,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Settings
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
  onOpenSettings
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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('7d')

  // Calculate metrics
  useEffect(() => {
    const passed = testCases.filter(tc => tc.status === 'Pass').length
    const failed = testCases.filter(tc => tc.status === 'Fail').length
    const pending = testCases.filter(tc => tc.status === 'Pending').length
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

  // Generate mock activity data
  useEffect(() => {
    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'test_case_created',
        title: 'New test case added',
        description: 'Login functionality test case created',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        user: 'John Doe',
        icon: <Plus className="w-4 h-4 text-green-500" />
      },
      {
        id: '2',
        type: 'test_case_status_changed',
        title: 'Test case status updated',
        description: 'TC-001 status changed from Pending to Passed',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        user: 'Jane Smith',
        icon: <RefreshCw className="w-4 h-4 text-blue-500" />
      },
      {
        id: '3',
        type: 'test_suite_created',
        title: 'New test suite created',
        description: 'API Testing suite added to project',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        user: 'Mike Johnson',
        icon: <FileText className="w-4 h-4 text-purple-500" />
      },
      {
        id: '4',
        type: 'test_case_updated',
        title: 'Test case modified',
        description: 'TC-015 description and steps updated',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        user: 'Sarah Wilson',
        icon: <Settings className="w-4 h-4 text-orange-500" />
      }
    ]
    setRecentActivity(activities)
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              {project.name} Dashboard
            </h1>
            <p className="text-slate-600 mt-2 text-lg">Project overview and analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={onExportData}
              className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={onOpenSettings}
              className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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

        {/* Main Dashboard Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
          <Tabs defaultValue="overview" className="p-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100/50 p-1 rounded-xl">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                Activity
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900">Status Distribution</CardTitle>
                        <CardDescription>Breakdown of test cases by status</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-slate-700 font-medium">Passed</span>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-900 font-semibold">{metrics.passedTestCases}</div>
                          <div className="text-slate-500 text-sm">
                            {metrics.totalTestCases > 0 ? Math.round((metrics.passedTestCases / metrics.totalTestCases) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-slate-700 font-medium">Failed</span>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-900 font-semibold">{metrics.failedTestCases}</div>
                          <div className="text-slate-500 text-sm">
                            {metrics.totalTestCases > 0 ? Math.round((metrics.failedTestCases / metrics.totalTestCases) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-slate-700 font-medium">Pending</span>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-900 font-semibold">{metrics.pendingTestCases}</div>
                          <div className="text-slate-500 text-sm">
                            {metrics.totalTestCases > 0 ? Math.round((metrics.pendingTestCases / metrics.totalTestCases) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-slate-700 font-medium">Blocked</span>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-900 font-semibold">{metrics.blockedTestCases}</div>
                          <div className="text-slate-500 text-sm">
                            {metrics.totalTestCases > 0 ? Math.round((metrics.blockedTestCases / metrics.totalTestCases) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Suite Progress */}
                <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900">Test Suite Progress</CardTitle>
                        <CardDescription>Completion status of test suites</CardDescription>
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
                            <span className="text-slate-700 font-medium">{suite.name}</span>
                            <span className="text-slate-500 text-sm">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="text-slate-500 text-xs">
                            {completed} of {total} completed • {total - completed} remaining
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-900">Quick Actions</CardTitle>
                      <CardDescription>Common actions for this project</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      onClick={onAddTestCase}
                      className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Test Case
                    </Button>
                    <Button 
                      onClick={onAddTestSuite}
                      variant="outline"
                      className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      Create Suite
                    </Button>
                    <Button 
                      onClick={onExportData}
                      variant="outline"
                      className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Export Data
                    </Button>
                    <Button 
                      onClick={onOpenSettings}
                      variant="outline"
                      className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-8 mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Trends */}
                <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900">Weekly Trends</CardTitle>
                        <CardDescription>Test case activity over the last 7 days</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-slate-700 font-medium">New Test Cases</span>
                        <span className="text-green-600 font-bold">+{metrics.weeklyActivity}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-slate-700 font-medium">Status Changes</span>
                        <span className="text-blue-600 font-bold">+12</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="text-slate-700 font-medium">Test Suites Created</span>
                        <span className="text-purple-600 font-bold">+3</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900">Performance Metrics</CardTitle>
                        <CardDescription>Key performance indicators</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                        <div className="text-2xl font-bold">{metrics.passRate}%</div>
                        <div className="text-blue-100 text-sm">Pass Rate</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white">
                        <div className="text-2xl font-bold">{metrics.totalTestCases}</div>
                        <div className="text-emerald-100 text-sm">Total Tests</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-8 mt-8">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-900">Recent Activity</CardTitle>
                      <CardDescription>Latest updates and changes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4 p-4 bg-white/50 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            {activity.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                            <p className="text-sm text-slate-600">{activity.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatTimeAgo(activity.timestamp)} • {activity.user}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-8 mt-8">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-900">Reports & Analytics</CardTitle>
                      <CardDescription>Generate and view detailed reports</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      variant="outline"
                      className="h-24 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center space-y-2"
                    >
                      <BarChart3 className="w-6 h-6" />
                      <span className="text-sm">Test Execution Report</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-24 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center space-y-2"
                    >
                      <TrendingUp className="w-6 h-6" />
                      <span className="text-sm">Trend Analysis</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-24 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center space-y-2"
                    >
                      <Users className="w-6 h-6" />
                      <span className="text-sm">Team Performance</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-24 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center space-y-2"
                    >
                      <Calendar className="w-6 h-6" />
                      <span className="text-sm">Weekly Summary</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-24 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center space-y-2"
                    >
                      <Target className="w-6 h-6" />
                      <span className="text-sm">Suite Coverage</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-24 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center space-y-2"
                    >
                      <Download className="w-6 h-6" />
                      <span className="text-sm">Export All Data</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 