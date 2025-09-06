import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
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
  Briefcase
} from 'lucide-react'

interface WelcomeProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (projectName: string) => Promise<void>
  isLoading?: boolean
}

export function WelcomeProjectModal({ 
  isOpen, 
  onClose, 
  onCreateProject, 
  isLoading = false 
}: WelcomeProjectModalProps) {
  const [projectName, setProjectName] = useState('')
  const [step, setStep] = useState(1)

  const handleCreateProject = async () => {
    if (!projectName.trim()) return
    
    try {
      await onCreateProject(projectName.trim())
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const suggestedNames = [
    'My First QA Project',
    'Product Testing',
    'Feature Validation',
    'Regression Testing',
    'User Acceptance Testing'
  ]

  const features = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Test Case Management',
      description: 'Create, organize, and track test cases with ease'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Team Collaboration',
      description: 'Share projects and work together with your team'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Secure & Private',
      description: 'Your data is isolated and secure'
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'AI-Powered',
      description: 'Generate test cases from PRDs automatically'
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[90vw] max-h-[95vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="text-center pb-6 border-b border-slate-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Welcome to QA Management
          </DialogTitle>
          <DialogDescription className="text-slate-600 mt-2">
            Create your first project to get started with test case management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Project Creation */}
          {step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderPlus className="h-5 w-5" />
                    Create Your First Project
                  </CardTitle>
                  <CardDescription>
                    Give your project a meaningful name to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
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
                      autoFocus
                    />
                  </div>

                  {projectName.trim() && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Suggested names:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {suggestedNames.map((name) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
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
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create Project & Continue
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Features Overview */}
          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>What You Can Do</CardTitle>
                  <CardDescription>
                    Explore the powerful features available in your QA management system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCreateProject} className="flex-1">
                  Create Project & Start
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-2 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {step === 1 && (
            <Button 
              variant="ghost" 
              onClick={() => setStep(2)}
              className="w-full"
            >
              Learn More About Features →
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 