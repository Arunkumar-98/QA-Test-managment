import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  AlertTriangle, 
  FolderPlus, 
  Plus,
  ArrowRight,
  FileText,
  Upload,
  Users
} from 'lucide-react'

interface ActionGuardProps {
  action: 'add-test-case' | 'import-test-cases' | 'create-test-suite' | 'share-project' | 'export-data'
  onCreateProject: () => void
  isLoading?: boolean
}

export function ActionGuard({ action, onCreateProject, isLoading = false }: ActionGuardProps) {
  const actionConfigs = {
    'add-test-case': {
      title: 'No Project Selected',
      description: 'You need to create or select a project before adding test cases.',
      icon: <FileText className="h-5 w-5" />,
      actionText: 'Add Test Case',
      suggestion: 'Create a project to start organizing your test cases'
    },
    'import-test-cases': {
      title: 'Import Requires Project',
      description: 'Please select a project before importing test cases.',
      icon: <Upload className="h-5 w-5" />,
      actionText: 'Import Test Cases',
      suggestion: 'Choose a project to import your test cases into'
    },
    'create-test-suite': {
      title: 'No Project Available',
      description: 'Test suites must belong to a project. Create a project first.',
      icon: <FolderPlus className="h-5 w-5" />,
      actionText: 'Create Test Suite',
      suggestion: 'Set up a project to organize your test suites'
    },
    'share-project': {
      title: 'No Project to Share',
      description: 'You need to have a project before you can share it with others.',
      icon: <Users className="h-5 w-5" />,
      actionText: 'Share Project',
      suggestion: 'Create a project to enable team collaboration'
    },
    'export-data': {
      title: 'No Data to Export',
      description: 'You need a project with test cases before you can export data.',
      icon: <ArrowRight className="h-5 w-5" />,
      actionText: 'Export Data',
      suggestion: 'Create a project and add test cases to export'
    }
  }

  const config = actionConfigs[action]

  const quickActions = [
    'Create your first project',
    'Add test cases',
    'Organize into test suites',
    'Share with your team',
    'Export reports'
  ]

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              {config.icon}
              {config.title}
            </CardTitle>
            <CardDescription className="text-base">
              {config.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Action Button */}
            <div className="text-center">
              <Button 
                onClick={onCreateProject}
                disabled={isLoading}
                size="lg"
                className="w-full max-w-xs"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            </div>

            {/* Suggestion */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                💡 {config.suggestion}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-center">What you can do next:</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {quickActions.map((action, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-muted-foreground">
              <p>
                Projects help you organize test cases, collaborate with your team, and track testing progress.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 