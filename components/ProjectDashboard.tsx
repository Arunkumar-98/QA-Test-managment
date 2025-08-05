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
    const passed = testCases.filter(tc => tc.status === 'Passed').length
    const failed = testCases.filter(tc => tc.status === 'Failed').length
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name} Dashboard</h1>
          <p className="text-gray-600 mt-1">Project overview and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Test Cases</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalTestCases}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +{metrics.weeklyActivity} this week
                  </span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.passRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +5% vs last month
                  </span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Test Suites</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalTestSuites}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.completedSuites} active suites
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Tests</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.failedTestCases}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-red-600 flex items-center">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    {metrics.failedTestCases > 0 ? 'Needs attention' : 'All good'}
                  </span>
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Status Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of test cases by status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { status: 'Passed', count: metrics.passedTestCases, color: 'bg-green-500' },
                    { status: 'Failed', count: metrics.failedTestCases, color: 'bg-red-500' },
                    { status: 'Pending', count: metrics.pendingTestCases, color: 'bg-yellow-500' },
                    { status: 'Blocked', count: metrics.blockedTestCases, color: 'bg-gray-500' }
                  ].map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm font-medium">{item.status}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">{item.count}</span>
                        <span className="text-xs text-gray-500">
                          ({metrics.totalTestCases > 0 ? Math.round((item.count / metrics.totalTestCases) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Test Suite Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Test Suite Progress
                </CardTitle>
                <CardDescription>
                  Completion status of test suites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testSuites.slice(0, 5).map((suite) => {
                  const suiteTestCases = testCases.filter(tc => tc.suiteId === suite.id)
                  const completed = suiteTestCases.filter(tc => tc.status === 'Passed').length
                  const total = suiteTestCases.length
                  const progress = total > 0 ? (completed / total) * 100 : 0

                  return (
                    <div key={suite.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{suite.name}</span>
                        <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{completed} of {total} completed</span>
                        <span>{total - completed} remaining</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common actions for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={onAddTestCase} className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">Add Test Case</span>
                </Button>
                <Button onClick={onAddTestSuite} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Target className="w-6 h-6" />
                  <span className="text-sm">Create Suite</span>
                </Button>
                <Button onClick={onExportData} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Download className="w-6 h-6" />
                  <span className="text-sm">Export Data</span>
                </Button>
                <Button onClick={onOpenSettings} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Settings className="w-6 h-6" />
                  <span className="text-sm">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Weekly Trends
                </CardTitle>
                <CardDescription>
                  Test case activity over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Test Cases</span>
                    <span className="text-sm font-bold text-green-600">+{metrics.weeklyActivity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status Changes</span>
                    <span className="text-sm font-bold text-blue-600">+12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Test Suites Created</span>
                    <span className="text-sm font-bold text-purple-600">+3</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics.passRate}%</div>
                    <div className="text-sm text-blue-600">Pass Rate</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{metrics.totalTestCases}</div>
                    <div className="text-sm text-green-600">Total Tests</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates and changes in the project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">by {activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>
                Generate and view detailed reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-2">
                  <BarChart3 className="w-8 h-8" />
                  <span>Test Execution Report</span>
                </Button>
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-2">
                  <TrendingUp className="w-8 h-8" />
                  <span>Trend Analysis</span>
                </Button>
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-2">
                  <Users className="w-8 h-8" />
                  <span>Team Performance</span>
                </Button>
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-2">
                  <Calendar className="w-8 h-8" />
                  <span>Weekly Summary</span>
                </Button>
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-2">
                  <Target className="w-8 h-8" />
                  <span>Suite Coverage</span>
                </Button>
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-2">
                  <Download className="w-8 h-8" />
                  <span>Export All Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 