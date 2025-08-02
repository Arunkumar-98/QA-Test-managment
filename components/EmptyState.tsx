import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  FolderPlus, 
  FileText, 
  Users, 
  Shield, 
  Sparkles, 
  ArrowRight,
  Plus
} from 'lucide-react'

interface EmptyStateProps {
  onCreateProject: () => void
  isLoading?: boolean
}

export function EmptyState({ onCreateProject, isLoading = false }: EmptyStateProps) {
  const features = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Test Case Management',
      description: 'Create and organize test cases'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Team Collaboration',
      description: 'Share with your team'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Secure & Private',
      description: 'Your data is protected'
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'AI-Powered',
      description: 'Generate test cases automatically'
    }
  ]

  const quickActions = [
    'Create test cases',
    'Organize test suites',
    'Track test execution',
    'Share with team',
    'Generate reports'
  ]

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <FolderPlus className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight">
            Welcome to QA Management! 🎉
          </h1>
          <p className="mb-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start managing your test cases, collaborating with your team, and ensuring quality across your projects.
          </p>
          <Button 
            onClick={onCreateProject}
            disabled={isLoading}
            size="lg"
            className="text-lg px-8 py-3"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating Project...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Project
              </>
            )}
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader className="pb-3">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <div className="text-primary">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              What You Can Do Next
            </CardTitle>
            <CardDescription>
              Once you create a project, you'll be able to:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {action}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to get started? Create your first project to begin managing your QA process.
          </p>
          <Button 
            onClick={onCreateProject}
            disabled={isLoading}
            variant="outline"
            size="lg"
          >
            {isLoading ? 'Creating...' : 'Get Started Now'}
          </Button>
        </div>
      </div>
    </div>
  )
} 