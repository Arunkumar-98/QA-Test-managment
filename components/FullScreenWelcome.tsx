import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  FolderPlus, 
  Rocket, 
  CheckCircle, 
  FileText, 
  Users, 
  Shield,
  Sparkles,
  Plus,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Globe,
  Lock,
  Star,
  LogOut,
  User
} from 'lucide-react'

interface FullScreenWelcomeProps {
  onCreateProject: (projectName: string) => Promise<void>
  isLoading?: boolean
  onSignOut?: () => void
  user?: any
}

export function FullScreenWelcome({ onCreateProject, isLoading = false, onSignOut, user }: FullScreenWelcomeProps) {
  const [projectName, setProjectName] = useState('')
  const [step, setStep] = useState(1)

  const handleCreateProject = async () => {
    if (!projectName.trim()) return
    
    try {
      await onCreateProject(projectName.trim())
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const suggestedNames = [
    'My First QA Project',
    'Product Testing',
    'Feature Validation',
    'Regression Testing',
    'User Acceptance Testing',
    'Mobile App Testing',
    'API Testing Suite',
    'E-commerce QA'
  ]

  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Test Case Management',
      description: 'Create, organize, and track test cases with ease',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Team Collaboration',
      description: 'Share projects and work together with your team',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure & Private',
      description: 'Your data is isolated and secure',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'AI-Powered',
      description: 'Generate test cases from PRDs automatically',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const quickActions = [
    'Create test cases',
    'Organize test suites',
    'Track test execution',
    'Share with team',
    'Generate reports',
    'Automate testing',
    'Monitor quality metrics',
    'Export data'
  ]

  const stats = [
    { label: 'Test Cases', value: 'Unlimited', icon: <FileText className="h-4 w-4" /> },
    { label: 'Projects', value: 'Unlimited', icon: <FolderPlus className="h-4 w-4" /> },
    { label: 'Team Members', value: 'Unlimited', icon: <Users className="h-4 w-4" /> },
    { label: 'Security', value: 'Enterprise', icon: <Shield className="h-4 w-4" /> }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">
                {user?.user_metadata?.name || user?.email || 'User'}
              </p>
              <p className="text-xs text-blue-100">Logged in</p>
            </div>
          </div>
        )}
        
        {/* Logout Button */}
        {onSignOut && (
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        )}
      </div>

      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="max-w-6xl w-full">
          {/* Step 1: Hero Section */}
          {step === 1 && (
            <div className="text-center space-y-8">
              {/* Logo and Title */}
              <div className="space-y-6">
                <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Rocket className="h-12 w-12 text-white" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                    Welcome to QA Management
                  </h1>
                  <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                    Professional test case management platform for modern development teams
                  </p>
                </div>
              </div>

              {/* Project Creation Card */}
              <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <FolderPlus className="h-6 w-6" />
                    Create Your First Project
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-lg">
                    Give your project a meaningful name to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="project-name" className="text-white text-lg font-medium">
                      Project Name
                    </Label>
                    <Input
                      id="project-name"
                      placeholder="Enter project name..."
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && projectName.trim()) {
                          handleCreateProject()
                        }
                      }}
                      className="h-14 text-lg bg-white/20 border-white/30 text-white placeholder:text-blue-200 focus:bg-white/30 focus:border-white/50"
                      autoFocus
                    />
                  </div>

                  {projectName.trim() && (
                    <div className="space-y-3">
                      <Label className="text-blue-100 text-sm font-medium">
                        Suggested names:
                      </Label>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {suggestedNames.map((name) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="cursor-pointer hover:bg-white/20 hover:text-white border-white/30 text-blue-100 text-sm px-3 py-1"
                            onClick={() => setProjectName(name)}
                          >
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleCreateProject}
                    disabled={!projectName.trim() || isLoading}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-3 h-5 w-5" />
                        Create Project & Continue
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 text-blue-100">
                      {stat.icon}
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <div className="text-white font-bold text-lg mt-1">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Next Step Button */}
              <Button 
                variant="ghost" 
                onClick={() => setStep(2)}
                className="text-blue-100 hover:text-white hover:bg-white/10 text-lg"
              >
                Learn More About Features →
              </Button>
            </div>
          )}

          {/* Step 2: Features Overview */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold text-white">
                  Powerful Features for Modern QA Teams
                </h2>
                <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                  Everything you need to manage test cases, collaborate with your team, and ensure quality across your projects.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {features.map((feature, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300">
                    <CardHeader>
                      <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                        <div className="text-white">
                          {feature.icon}
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold text-white">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-blue-100 text-lg leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <Card className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <ArrowRight className="h-6 w-6" />
                    What You Can Do Next
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-lg">
                    Once you create a project, you'll be able to:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickActions.map((action, index) => (
                      <Badge key={index} variant="outline" className="text-blue-100 border-white/30 text-sm px-3 py-2 justify-center">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">
                    Ready to Transform Your QA Process?
                  </h3>
                  <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                    Join thousands of QA professionals who trust our platform for their testing needs.
                  </p>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="text-blue-100 border-white/30 hover:bg-white/10 hover:text-white text-lg px-8 py-3"
                  >
                    ← Back
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={!projectName.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 text-lg px-8 py-3 shadow-xl"
                  >
                    {isLoading ? 'Creating...' : 'Create Project & Start'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-3 mt-8">
            <div className={`h-3 w-3 rounded-full transition-all duration-300 ${step === 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-3 w-3 rounded-full transition-all duration-300 ${step === 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>
      </div>
    </div>
  )
} 