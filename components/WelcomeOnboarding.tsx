"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Users, 
  FileText, 
  Share2, 
  Zap, 
  ArrowRight,
  Play,
  Settings,
  BarChart3
} from 'lucide-react'

interface WelcomeOnboardingProps {
  onComplete: () => void
  onSkip: () => void
}

export function WelcomeOnboarding({ onComplete, onSkip }: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to QA Management! 🎉",
      description: "You're all set up and ready to start managing your test cases.",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      features: [
        "Your account is verified and secure",
        "You can now create projects and test cases",
        "Start collaborating with your team"
      ]
    },
    {
      title: "Create Your First Project",
      description: "Projects help you organize test cases by feature or release.",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      features: [
        "Click 'Add Project' to create your first project",
        "Give it a descriptive name like 'Login Feature'",
        "Add a description to help your team understand"
      ]
    },
    {
      title: "Add Test Cases",
      description: "Create detailed test cases to ensure quality.",
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      features: [
        "Use the 'Add Test Case' button to create tests",
        "Include steps to reproduce and expected results",
        "Set priority and status to track progress"
      ]
    },
    {
      title: "Share with Your Team",
      description: "Invite team members to collaborate on your projects.",
      icon: Share2,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      features: [
        "Share projects with team members via email",
        "Set different permission levels (View, Edit, Admin)",
        "Track who made changes with activity history"
      ]
    }
  ]

  const currentStepData = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 ${currentStepData.bgColor} rounded-full flex items-center justify-center`}>
              <currentStepData.icon className={`w-8 h-8 ${currentStepData.color}`} />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
            {currentStepData.title}
          </CardTitle>
          <CardDescription className="text-lg text-slate-600">
            {currentStepData.description}
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features list */}
          <div className="space-y-3">
            {currentStepData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          {currentStep === 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-3">Quick Start:</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Team
                </Button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="text-slate-600 hover:text-slate-800"
            >
              Skip tutorial
            </Button>
            
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="text-center pt-4">
            <p className="text-xs text-slate-500">
              You can always access help and settings from the top menu
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 